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
const convos = await client.conversations.list();
console.log("Found conversations:", convos.length);
convos.forEach((c, i) => console.log(`[${i}] id=${c.id}`));

if (convos.length === 0) {
  console.error("No conversations found. Create the group first!");
  process.exit(1);
}

const group = convos[0]; // pick the first group
console.log("Using group:", group.id);

await (group as any).addMembers([
  "9986a552223edd79c4c35f399fb9618722f448bebff0c6802895507b07afa12a",
  "69ecf472e4425b89ac2ac86270ff66b3c5b8a6f25374d30af78b807363312269",
  "b924443b0e85276a3f388a7f78dbd96b22ed8d7a8116d1d2f122c85641b6f2b4",
  "21e050fd05c63dcbdaa4c111f939cfb9fff0db120f731f7ebb65fc84d53a073d",
  "591f3574814339f8f12c6e4f280b56632ae1328d2c1ac0790a94743e62e14b1d",
]);

console.log("✅ All 5 agents added to the group!");
