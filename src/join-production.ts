import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { privateKeyToAccount } from "viem/accounts";
import { toBytes } from "viem";
import { config } from "dotenv";
import { join } from "path";

const CHARACTER = process.env.CHARACTER || "orchestrator";
config({ path: `.env.${CHARACTER}` });

const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
  signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
};

const client = await Client.create(signer, {
  env: "production" as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
  dbPath: join(process.cwd(), `.xmtp-prod-${CHARACTER}.db`),
});

console.log(`[${CHARACTER}] InboxId: ${client.inboxId}`);

const convos = client.conversations as any;
const group = await convos.fromInvite("https://popup.convos.org/v2?i=Cm8KPwFVkB3vr7v_ISF-L6btksjatB4JKGdq6Tm4a9xzt6bQhDEEZo6OxV5JHPrWQQ0-AKTgFUPNTwLKhhUzx1MoZhIgUykCOh5c707fj3dKN_6tjBUixXM-j3ArKtKbOKywiVkaCldITkRIVzR2Z1ESQcEd3uaLCQdb_0a3PKLJpRclcNr0Tbpci68A5Ip3nA96S4z_zoL-klvhghukxfM3J2BpuSChBculzTFxnMC9eSAB");
console.log(`[${CHARACTER}] Joined group: ${group.id}`);
