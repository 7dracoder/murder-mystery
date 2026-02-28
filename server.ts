import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

// Load .env.orchestrator if present (local dev); on Railway, vars come from environment directly
config({ path: ".env.orchestrator" });

const PORT = Number(process.env.PORT ?? 3001);
const GROUP_ID = process.env.XMTP_GROUP_ID!;

console.log(`[Config] PORT=${PORT} GROUP_ID=${GROUP_ID} ENV=${process.env.XMTP_ENV}`);

interface Message {
  id: string;
  senderInboxId: string;
  content: string;
  sentAt: number;
}

const messageHistory: Message[] = [];
const clients = new Set<WebSocket>();

// --- Express setup ---
const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

// --- WebSocket handling ---
wss.on("connection", (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected. Total: ${clients.size}`);

  ws.send(JSON.stringify({ type: "history", data: messageHistory.slice(-100) }));

  ws.on("close", () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected. Total: ${clients.size}`);
  });
});

function broadcast(msg: object) {
  const payload = JSON.stringify(msg);
  for (const ws of clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  }
}

// --- XMTP setup ---
const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({
    identifier: account.address.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  }),
  signMessage: async (message: string) =>
    toBytes(await account.signMessage({ message })),
};

let xmtpClient: Client;
let group: any;

async function findGroup(): Promise<any> {
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`[XMTP] Syncing all conversations (attempt ${attempt}/5)...`);
    // syncAll() fetches new conversations from network (sync() only updates existing)
    await xmtpClient.conversations.syncAll();

    const found = await xmtpClient.conversations.getConversationById(GROUP_ID);
    if (found) {
      console.log(`[XMTP] Group found on attempt ${attempt}`);
      return found;
    }

    // Log all known conversation IDs to help debug
    const all = await xmtpClient.conversations.list();
    console.log(`[XMTP] Known conversations (${all.length}): ${all.map((c: any) => c.id).join(", ") || "none"}`);

    if (attempt < 5) {
      console.log(`[XMTP] Group not found yet, waiting 4s...`);
      await new Promise(r => setTimeout(r, 4000));
    }
  }
  return null;
}

async function initXMTP() {
  console.log("[XMTP] Connecting to production...");
  xmtpClient = await Client.create(signer, {
    env: (process.env.XMTP_ENV || "production") as XmtpEnv,
    dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
    dbPath: ".xmtp-prod-orchestrator.db",
  });

  console.log(`[XMTP] Client ready. InboxId: ${xmtpClient.inboxId}`);
  console.log(`[XMTP] Looking for group: ${GROUP_ID}`);

  group = await findGroup();

  if (!group) {
    console.error(`[XMTP] Could not find group ${GROUP_ID} after 10 attempts.`);
    console.error("[XMTP] Make sure the orchestrator wallet is a member of this group.");
    // Don't crash — keep HTTP server alive so Railway doesn't restart loop
    // Retry in 30s
    setTimeout(initXMTP, 30000);
    return;
  }

  console.log(`[XMTP] Connected! Group: ${group.id}`);

  // Load existing messages
  try {
    const existing = await group.messages({ limit: 100 });
    for (const msg of existing) {
      const content = typeof msg.content === "string" ? msg.content : "";
      if (!content.trim()) continue;
      messageHistory.push({
        id: msg.id,
        senderInboxId: msg.senderInboxId,
        content,
        sentAt: Number(msg.sentAt ?? Date.now()),
      });
    }
    console.log(`[XMTP] Loaded ${messageHistory.length} existing messages`);
  } catch (err) {
    console.warn("[XMTP] Could not load message history:", err);
  }

  streamMessages();
}

async function streamMessages() {
  try {
    const stream = await group.stream();
    for await (const msg of stream) {
      const content = typeof msg.content === "string" ? msg.content : "";
      if (!content.trim()) continue;

      const m: Message = {
        id: msg.id,
        senderInboxId: msg.senderInboxId,
        content,
        sentAt: Number(msg.sentAt ?? Date.now()),
      };

      messageHistory.push(m);
      if (messageHistory.length > 500) messageHistory.shift();

      broadcast({ type: "message", data: m });
      console.log(`[XMTP] Message from ${msg.senderInboxId.slice(0, 8)}: "${content.slice(0, 60)}"`);
    }
  } catch (err) {
    console.error("[XMTP] Stream error:", err);
    setTimeout(streamMessages, 5000);
  }
}

// --- REST API ---
app.get("/api/messages", (_req, res) => {
  res.json(messageHistory.slice(-100));
});

app.get("/api/members", async (_req, res) => {
  if (!group) return res.status(503).json({ error: "XMTP not connected yet" });
  try {
    await group.sync();
    const members = await group.members();
    res.json(members.map((m: any) => ({
      inboxId: m.inboxId,
      addresses: m.accountIdentifiers?.map((id: any) => id.identifier) ?? [],
    })));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/send", async (req, res) => {
  if (!group) return res.status(503).json({ error: "XMTP not connected yet" });
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: "content required" });
  try {
    await (group as any).send(content);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/members/add", async (req, res) => {
  if (!group) return res.status(503).json({ error: "XMTP not connected yet" });
  const { address, inboxId } = req.body;
  if (!address && !inboxId) return res.status(400).json({ error: "address or inboxId required" });
  try {
    if (inboxId) {
      await group.addMembersByInboxId([inboxId]);
    } else {
      await group.addMembers([address]);
    }
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.post("/api/members/remove", async (req, res) => {
  if (!group) return res.status(503).json({ error: "XMTP not connected yet" });
  const { inboxId } = req.body;
  if (!inboxId) return res.status(400).json({ error: "inboxId required" });
  try {
    await group.removeMembersByInboxId([inboxId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

app.get("/", (_req, res) => {
  res.json({ service: "Blackwood Manor API", groupConnected: !!group, messages: messageHistory.length });
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, groupConnected: !!group, messages: messageHistory.length });
});

// --- Start ---
httpServer.listen(PORT, () => {
  console.log(`[Server] HTTP + WebSocket server running on port ${PORT}`);
  initXMTP().catch((err) => {
    console.error("[XMTP] Fatal error:", err);
  });
});
