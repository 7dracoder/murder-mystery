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

await (group as any).addMembers(["a27ee0c66a0b44acfb243801ad64227d37253418cfe4e29db58ac38acbad1b62"]);
console.log("✅ Added to group!");

await group.addSuperAdmin("a27ee0c66a0b44acfb243801ad64227d37253418cfe4e29db58ac38acbad1b62");
console.log("✅ Super admin granted!");
console.log("Super admins:", group.listSuperAdmins());
