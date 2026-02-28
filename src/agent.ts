import { Client, type XmtpEnv, IdentifierKind } from "@xmtp/node-sdk";
import { toBytes } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import OpenAI from "openai";
import { config } from "dotenv";

config({ path: `.env.${process.env.CHARACTER || "orchestrator"}` });

const CHARACTERS: Record<string, { name: string; triggers: string[]; soul: string; isOrchestrator?: boolean }> = {
  orchestrator: {
    name: "Game Master",
    isOrchestrator: true,
    triggers: [],
    soul: `You are the Game Master of a Murder Mystery in Blackwood Manor, 1923.
Lord Blackwood was found dead, poisoned by arsenic in his evening tea.
CHARACTERS: Edmund the Butler, Lady Victoria the Widow (THE MURDERER), Dr. Helena the Scientist, Mr. Sterling the Banker, Inspector Grey the Detective.
THE TRUTH: Lady Victoria stole arsenic from Dr. Helena's lab and poisoned the tea after discovering Lord Blackwood was cutting her from his will.
RULES:
- When someone says /start: set the dramatic scene (3 sentences max)
- When someone says /hint: give ONE subtle clue without naming the killer
- When someone says /accuse lady victoria or /accuse victoria: THEY WIN — reveal the full dramatic truth
- When someone accuses anyone else: say they are wrong and give a small hint
- Keep all responses under 3 sentences. Stay atmospheric and tense.`
  },
  butler: {
    name: "Edmund (The Butler)",
    triggers: ["edmund", "butler", "@butler"],
    soul: `You are Edmund Graves, the butler of Blackwood Manor, 1923. Lord Blackwood was just murdered.
YOUR SECRET: You saw Lady Victoria sneaking through the kitchen passage toward the study at 9pm. Too afraid to say it directly.
YOUR ALIBI (lie): "I was cataloguing wine inventory in the cellar from 8 to 10pm."
BEHAVIOR: Nervous, overly formal, fidgety. Drop hints like "The kitchen passage gets drafty on cold nights..." Never directly accuse Lady Victoria. Max 2 sentences. Stay in character.`
  },
  widow: {
    name: "Lady Victoria (The Widow)",
    triggers: ["victoria", "widow", "lady", "@widow"],
    soul: `You are Lady Victoria Blackwood. YOU ARE THE MURDERER. You poisoned Lord Blackwood's tea with arsenic from Dr. Helena's lab because he was removing you from his will.
YOUR ALIBI (lie): "I retired to my bedroom at 8:30 with a headache. My maid confirmed it."
BEHAVIOR: Icily composed, aristocratic, almost too calm. Redirect suspicion to Mr. Sterling. Never crack. Max 2 sentences. Stay in character.`
  },
  scientist: {
    name: "Dr. Helena (The Scientist)",
    triggers: ["helena", "scientist", "doctor", "dr", "@scientist"],
    soul: `You are Dr. Helena Cross, a chemist who ran Lord Blackwood's private laboratory, 1923. NOT the murderer but hiding something.
YOUR SECRET: Arsenic disappeared from your lab 8 days ago. Only you and Lady Victoria had access.
YOUR ALIBI (true): "I was in my east wing lab all evening. Equipment logs verify this."
BEHAVIOR: Precise, intellectual. If pressed on lab access: "Only myself and... one other person had keys." Max 2 sentences. Stay in character.`
  },
  banker: {
    name: "Mr. Sterling (The Banker)",
    triggers: ["sterling", "banker", "@banker"],
    soul: `You are Mr. Sterling, a banker and dinner guest at Blackwood Manor, 1923. NOT the murderer but had strong motive.
YOUR SECRET: Lord Blackwood discovered you embezzling. You snuck back at 9:15pm to confront him but left without harming him.
YOUR ALIBI (partial lie): "I left at 8pm due to sudden illness. My driver confirms it."
BEHAVIOR: Defensive, sweaty, overexplains. Constantly mention you LEFT EARLY. Max 2 sentences. Stay in character.`
  },
  detective: {
    name: "Inspector Grey (Detective)",
    triggers: ["grey", "inspector", "detective", "@detective", "/clue"],
    soul: `You are Inspector Grey, Scotland Yard, investigating Lord Blackwood's murder, 1923.
YOU KNOW THE TRUTH: Lady Victoria poisoned the tea using arsenic from Dr. Helena's lab. Edmund saw her. Motive was the will.
BEHAVIOR: Methodical, Sherlock-like. Give clues but NEVER name the murderer directly. If asked who did it: "That, my dear investigator, is precisely what YOU must determine." Max 3 sentences. Stay in character.`
  }
};

const CHARACTER = process.env.CHARACTER || "orchestrator";
const char = CHARACTERS[CHARACTER];
if (!char) { console.error(`Unknown character: ${CHARACTER}`); process.exit(1); }

const account = privateKeyToAccount(process.env.XMTP_WALLET_KEY as `0x${string}`);
const signer = {
  type: "EOA" as const,
  getIdentifier: () => ({ identifier: account.address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
  signMessage: async (message: string) => toBytes(await account.signMessage({ message })),
};

const client = await Client.create(signer, {
  env: (process.env.XMTP_ENV || "production") as XmtpEnv,
  dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),
  dbPath: `.xmtp-prod-${process.env.CHARACTER || "orchestrator"}.db`,
});

const openai = new OpenAI({ baseURL: "http://localhost:11434/v1", apiKey: "ollama" });

console.log(`[${char.name}] Online! Address: ${account.address}`);

await client.conversations.sync();
const group = await client.conversations.getConversationById(process.env.XMTP_GROUP_ID!);
if (!group) { console.error("Group not found! Check XMTP_GROUP_ID"); process.exit(1); }
console.log(`[${char.name}] Listening on group: ${process.env.XMTP_GROUP_ID}`);

const stream = await group.stream();

for await (const message of stream) {
  if (message.senderInboxId === client.inboxId) continue;
  const content = typeof message.content === "string" ? message.content : "";
  if (!content.trim()) continue;

  const shouldRespond = char.isOrchestrator ||
    char.triggers.some(t => content.toLowerCase().includes(t.toLowerCase()));
  if (!shouldRespond) continue;

  if (!char.isOrchestrator) await new Promise(r => setTimeout(r, Math.random() * 800 + 400));

  console.log(`[${char.name}] Responding to: "${content.substring(0, 60)}"`);

  try {
    const res = await openai.chat.completions.create({
      model: "qwen3:8b",
      messages: [
        { role: "system", content: char.soul },
        { role: "user", content: `Group chat message: "${content}"` },
      ],
      max_tokens: 120,
      temperature: 0.85,
    });

    const reply = res.choices[0]?.message?.content?.trim() || "*remains silent*";
    await (group as any).send(`${char.name}: ${reply}`);
    console.log(`[${char.name}] Sent: "${reply.substring(0, 60)}"`);
  } catch (err) {
    console.error(`[${char.name}] Error:`, err);
  }
}
