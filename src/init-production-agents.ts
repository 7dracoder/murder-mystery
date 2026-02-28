import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config } from "dotenv";
import { join } from "path";

const characters = ["orchestrator", "butler", "widow", "scientist", "banker", "detective"];
const inboxIds: Record<string, string> = {};

for (const char of characters) {
  config({ path: `.env.${char}`, override: true });
  const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
  const signer = {
    type: "EOA" as const,
    getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
    signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
  };
  const client = await Client.create(signer, {
    env: "production" as XmtpEnv,
    dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
    dbPath: join(process.cwd(), `.xmtp-prod-${char}.db`),
  });
  inboxIds[char] = client.inboxId;
  console.log(`${char}: ${client.inboxId}`);
}

console.log("\nAll production inbox IDs:", JSON.stringify(inboxIds, null, 2));
