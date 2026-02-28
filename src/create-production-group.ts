import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config as loadEnv } from "dotenv";
import { join } from "path";

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
  dbPath: join(process.cwd(), ".xmtp-prod-orchestrator.db"),
});

const memberIdentifiers = [
  { identifier: "0x7ea6c8074ba7e7b6458e58f18e10dd9b1e154799", identifierKind: IdentifierKind.Ethereum },
  { identifier: "0xb4a1c4b7421ff87ab70f34f1ab22d1e91bc66645", identifierKind: IdentifierKind.Ethereum },
  { identifier: "0x76a6386b493057bd0ad8b266f6d32fe14debfca8", identifierKind: IdentifierKind.Ethereum },
  { identifier: "0x5f3a71ff04f7b96ec9211ec532f8a8c6384f0326", identifierKind: IdentifierKind.Ethereum },
  { identifier: "0x6a43809cd1ddd262305e9dd8dba162cb714f71b5", identifierKind: IdentifierKind.Ethereum },
];

const group = await client.conversations.createGroupWithIdentifiers(
  memberIdentifiers,
  { name: "Blackwood Manor Murder Mystery" }
);

console.log("Group created! ID:", group.id);
