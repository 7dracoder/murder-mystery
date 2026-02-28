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
  dbPath: ".xmtp-prod-orchestrator.db",
});
await client.conversations.sync();
const group = await client.conversations.getConversationById(process.env.XMTP_GROUP_ID!);
if (!group) { console.error("Group not found!"); process.exit(1); }

await (group as any).addMembersByIdentifiers([
  { identifier: "0x7eA6c8074bA7E7b6458E58F18E10dD9b1e154799", identifierKind: IdentifierKind.Ethereum }, // butler
  { identifier: "0xb4a1c4B7421FF87aB70F34F1Ab22d1E91Bc66645", identifierKind: IdentifierKind.Ethereum }, // widow
  { identifier: "0x76a6386B493057bd0ad8B266f6D32fE14dEbfcA8", identifierKind: IdentifierKind.Ethereum }, // scientist
  { identifier: "0x5f3A71Ff04F7B96ec9211ec532f8a8c6384f0326", identifierKind: IdentifierKind.Ethereum }, // banker
  { identifier: "0x6a43809cd1DDd262305e9Dd8dbA162cb714f71b5", identifierKind: IdentifierKind.Ethereum }, // detective
  { identifier: "0x5e4b6be085b0bf81c5bdf569b014282a76e79fe5", identifierKind: IdentifierKind.Ethereum }, // you
]);
console.log("✅ All agents + you re-added to group:", process.env.XMTP_GROUP_ID);
