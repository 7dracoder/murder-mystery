import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { config } from "dotenv";

config({ path: ".env.orchestrator" });

const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const walletClient = createWalletClient({ account, chain: mainnet, transport: http() });

const signer = {
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: 0 }),
  signMessage: async (message: string) => toBytes(await walletClient.signMessage({ account, message })),
};

const client = await Client.create(signer, {
  env: "dev" as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
});

await client.conversations.sync();
const group = await (client.conversations as any).getConversationById("420cdadab4c6faa24eaaec7145eed2d5");
if (!group) { console.error("Group not found!"); process.exit(1); }

await (group as any).addMembersByIdentifiers([
  { identifier: "0xf4990289516aef91221afce930e399a961e7a92e", identifierKind: 0 }
]);
console.log("Player added to group!");
