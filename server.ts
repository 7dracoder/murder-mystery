import express from "express";
import cors from "cors";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { config } from "dotenv";

config({ path: ".env.orchestrator" });

const PORT = 3001;
const GROUP_ID = process.env.XMTP_GROUP_ID!;

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

  // Send history on connect
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

async function initXMTP() {
  console.log("[XMTP] Connecting to production...");
  xmtpClient = await Client.create(signer, {
    env: (process.env.XMTP_ENV || "production") as XmtpEnv,
    dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
    dbPath: ".xmtp-web.db",
  });

  await xmtpClient.conversations.sync();
  group = await xmtpClient.conversations.getConversationById(GROUP_ID);

  if (!group) {
    console.error("[XMTP] Group not found! Check XMTP_GROUP_ID");
    process.exit(1);
  }

  console.log(`[XMTP] Connected! Listening on group: ${GROUP_ID}`);

  // Load existing messages into history
  try {
    const existing = await group.messages({ limit: 100 });
    for (const msg of existing) {
      const content = typeof msg.content === "string" ? msg.content : "";
      if (!content.trim()) continue;
      const m: Message = {
        id: msg.id,
        senderInboxId: msg.senderInboxId,
        content,
        sentAt: Number(msg.sentAt ?? Date.now()),
      };
      messageHistory.push(m);
    }
    console.log(`[XMTP] Loaded ${messageHistory.length} existing messages`);
  } catch (err) {
    console.warn("[XMTP] Could not load message history:", err);
  }

  // Stream new messages
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
      console.log(`[XMTP] New message from ${msg.senderInboxId.slice(0, 8)}: "${content.slice(0, 60)}"`);
    }
  } catch (err) {
    console.error("[XMTP] Stream error:", err);
    // Reconnect after delay
    setTimeout(streamMessages, 5000);
  }
}

// --- REST API ---
app.get("/api/messages", (_req, res) => {
  res.json(messageHistory.slice(-100));
});

app.get("/api/members", async (_req, res) => {
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
  const { inboxId } = req.body;
  if (!inboxId) return res.status(400).json({ error: "inboxId required" });
  try {
    await group.removeMembersByInboxId([inboxId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// --- Start ---
httpServer.listen(PORT, () => {
  console.log(`[Server] HTTP + WebSocket server running on port ${PORT}`);
  initXMTP().catch((err) => {
    console.error("[XMTP] Fatal error:", err);
    process.exit(1);
  });
});
