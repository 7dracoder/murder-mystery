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

const convos = client.conversations as any;
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(convos))
  .filter(m => m !== "constructor");
console.log("Conversations methods:", methods);
