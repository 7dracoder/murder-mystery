import { readFileSync, writeFileSync } from "fs";
let code = readFileSync("src/agent.ts", "utf8");
code = code.replace(
  `dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),`,
  `dbEncryptionKey: Buffer.from(process.env.XMTP_DB_ENCRYPTION_KEY!, "hex"),\n  dbPath: \`.xmtp-prod-\${process.env.CHARACTER || "orchestrator"}.db\`,`
);
writeFileSync("src/agent.ts", code);
console.log("Done!");
