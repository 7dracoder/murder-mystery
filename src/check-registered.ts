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

const addresses = [
  "0xf4990289516aef91221afce930e399a961e7a92e",
  "0x7ea6c8074ba7e7b6458e58f18e10dd9b1e154799",
  "0xb4a1c4b7421ff87ab70f34f1ab22d1e91bc66645",
  "0x76a6386b493057bd0ad8b266f6d32fe14debfca8",
  "0x5f3a71ff04f7b96ec9211ec532f8a8c6384f0326",
  "0x6a43809cd1ddd262305e9dd8dba162cb714f71b5",
];

const identifiers = addresses.map(a => ({ identifier: a, identifierKind: IdentifierKind.Ethereum }));
const results = await client.canMessage(identifiers);
results.forEach((canMsg, id) => console.log(id, "->", canMsg));
