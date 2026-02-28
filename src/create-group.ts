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

const group = await (client.conversations as any).createGroupWithIdentifiers(
  [
    { identifier: "0x7ea6c8074ba7e7b6458e58f18e10dd9b1e154799", identifierKind: 0 },
    { identifier: "0xb4a1c4b7421ff87ab70f34f1ab22d1e91bc66645", identifierKind: 0 },
    { identifier: "0x76a6386b493057bd0ad8b266f6d32fe14debfca8", identifierKind: 0 },
    { identifier: "0x5f3a71ff04f7b96ec9211ec532f8a8c6384f0326", identifierKind: 0 },
    { identifier: "0x6a43809cd1ddd262305e9dd8dba162cb714f71b5", identifierKind: 0 },
  ],
  { groupName: "Blackwood Manor" }
);

console.log("Group created! ID:", group.id);
console.log("Invite link:", `https://converse.xyz/group/${group.id}`);
