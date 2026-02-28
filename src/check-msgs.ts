import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config } from "dotenv";

config({ path: ".env.orchestrator" });

const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
  signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
};
const client = await Client.create(signer, {
  env: "production" as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
  dbPath: ".xmtp-prod-orchestrator.db",  // use existing DB
});
await client.conversations.sync();
const group = await client.conversations.getConversationById(process.env.XMTP_GROUP_ID!);
if (!group) { console.log("Group not found"); process.exit(1); }
await (group as any).sync();
const messages = await (group as any).messages({ limit: 15 });
console.log(`Last ${messages.length} messages in group:`);
for (const msg of messages) {
  console.log(`- sender: ${msg.senderInboxId?.substring(0,12)}... | type: ${JSON.stringify(msg.contentType)} | content: ${JSON.stringify(msg.content)}`);
}
