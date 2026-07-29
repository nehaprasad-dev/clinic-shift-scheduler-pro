import { copyFileSync, existsSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

/**
 * Vercel’s filesystem is read-only except /tmp.
 * Build creates prisma/deploy.db; runtime copies it to /tmp once per instance.
 */
function configureDatabaseUrl() {
  const onVercel = process.env.VERCEL === "1";
  if (!onVercel) return;

  const tmpDb = "/tmp/clinic.db";
  const bundledDb = path.join(process.cwd(), "prisma", "deploy.db");

  if (!existsSync(tmpDb) && existsSync(bundledDb)) {
    copyFileSync(bundledDb, tmpDb);
  }

  // Prisma SQLite URLs must start with file:
  process.env.DATABASE_URL = `file:${tmpDb}`;
}

configureDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
