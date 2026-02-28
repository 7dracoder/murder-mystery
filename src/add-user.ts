import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config } from "dotenv";

config({ path: ".env.orchestrator" });

const addresses = process.argv.slice(2);
if (addresses.length === 0) {
  console.error("Usage: npx tsx src/add-user.ts 0xADDRESS1 0xADDRESS2 ...");
  process.exit(1);
}

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

const identifiers = addresses.map(addr => ({
  identifier: addr.toLowerCase(),
  identifierKind: IdentifierKind.Ethereum,
}));

await (group as any).addMembersByIdentifiers(identifiers);
console.log(`✅ Added ${addresses.length} member(s):`, addresses.join(", "));
