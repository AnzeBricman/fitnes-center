import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";

function hasValidDatabaseUrl(value?: string) {
  return Boolean(value && /^(postgresql|postgres):\/\//.test(value));
}

function loadEnvIfMissing() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const shouldPreferLocalDatabaseUrl = !hasValidDatabaseUrl(process.env.DATABASE_URL);
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2];
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key === "DATABASE_URL" && shouldPreferLocalDatabaseUrl && hasValidDatabaseUrl(value)) {
      process.env[key] = value;
      continue;
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvIfMissing();

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}
