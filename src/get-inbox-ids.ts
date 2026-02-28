import { Client, type XmtpEnv, getInboxIdForIdentifier } from "@xmtp/node-sdk";
import { config } from "dotenv";

const envFiles = [
  ".env.orchestrator",
  ".env.butler",
  ".env.widow",
  ".env.scientist",
  ".env.banker",
  ".env.detective",
];

for (const envFile of envFiles) {
  config({ path: envFile, override: true });
  const address = process.env.XMTP_WALLET_KEY;
  const { privateKeyToAccount } = await import("viem/accounts");
  const account = privateKeyToAccount(address as `0x${string}`);
  const inboxId = await getInboxIdForIdentifier(
    { identifier: account.address.toLowerCase(), identifierKind: 0 },
    "dev" as XmtpEnv
  );
  console.log(`${envFile}: ${account.address} → inboxId: ${inboxId}`);
}
