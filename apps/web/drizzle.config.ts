import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { defineConfig } from "drizzle-kit";

// Load .env.local for Drizzle Kit CLI (Next.js loads it automatically,
// but Drizzle Kit does not). Uses only Node built-ins, no dotenv needed.
function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();

    // Don't override existing env vars (e.g. from Railway/CI)
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
