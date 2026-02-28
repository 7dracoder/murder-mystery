import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.orchestrator", override: true });
const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
  signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
};
const client = await Client.create(signer, {
  env: "production" as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
  dbPath: ".xmtp-prod-orchestrator.db",
});
await client.conversations.sync();
const group = await client.conversations.getConversationById(process.env.XMTP_GROUP_ID!);
if (!group) { console.error("Group not found!"); process.exit(1); }
await (group as any).sync();  // sync the group itself too
const members = await (group as any).members();
console.log("Members:", members.length);
members.forEach((m: any) => console.log("-", m.inboxId, m.addresses));
