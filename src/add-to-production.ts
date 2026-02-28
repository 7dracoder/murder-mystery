import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config } from "dotenv";
import { join } from "path";

config({ path: ".env.orchestrator" });

const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);

const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({
    identifier: account.address.toLowerCase(),
    identifierKind: IdentifierKind.Ethereum,
  }),
  signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
};

console.log("Address:", account.address);

const client = await Client.create(signer, {
  env: "production" as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
  dbPath: join(process.cwd(), ".xmtp-prod-orchestrator.db"),
});

console.log("InboxId:", client.inboxId);
await client.conversations.sync();

const convos = client.conversations as any;
const group = await convos.getConversationById("ced7b6f78c485f8bf5500af52b5cee94");
if (!group) { console.error("Group not found!"); process.exit(1); }

await (group as any).addMembers([
  "9986a552223edd79c4c35f399fb9618722f448bebff0c6802895507b07afa12a",
  "69ecf472e4425b89ac2ac86270ff66b3c5b8a6f25374d30af78b807363312269",
  "b924443b0e85276a3f388a7f78dbd96b22ed8d7a8116d1d2f122c85641b6f2b4",
  "21e050fd05c63dcbdaa4c111f939cfb9fff0db120f731f7ebb65fc84d53a073d",
  "591f3574814339f8f12c6e4f280b56632ae1328d2c1ac0790a94743e62e14b1d",
]);

console.log("All agents added to production group!");
