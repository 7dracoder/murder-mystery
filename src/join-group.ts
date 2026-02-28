import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import { createWalletClient, http, toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { mainnet } from "viem/chains";
import { config } from "dotenv";

const characters = [
  { env: ".env.orchestrator" },
  { env: ".env.butler" },
  { env: ".env.widow" },
  { env: ".env.scientist" },
  { env: ".env.banker" },
  { env: ".env.detective" },
];

const INVITE_URL = "https://popup.convos.org/v2?i=Cm8KPwGU61GSmHGiYpJVILh8zkl2Uu1xsFgWF25m9UvF7rNK4z7AMSiDT66P_gA8zM0CpER3TPM4qLJroA7qUP_2ZxIgEKADcDU_dhN1jrNKIUtq6yDvInEK5OyXZ-Dy9ok2BVEaCmtqd0EzMHNJTlUSQZIm9Ybwki2LzJ5hXxaj5hEy-Ge5marMIwSH9ZwEU5tbYz7P4id_aKdDGB4ziWMpZtrY9vUrTaCGi86-zNueU8wB";

for (const char of characters) {
  config({ path: char.env, override: true });

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

  try {
    const group = await (client.conversations as any).joinGroupByInviteUrl(INVITE_URL);
    console.log(`[${char.env}] Joined group! ID: ${group.id}`);
  } catch (e: any) {
    console.log(`[${char.env}] Error: ${e.message}`);
  }
}
