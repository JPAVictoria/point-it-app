import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { requireEnv } from "@/lib/server-config";

/**
 * Prisma client for the app. Connects through Supabase's transaction pooler
 * (DATABASE_URL), which suits Vercel's short-lived functions. Created lazily
 * so a missing env var surfaces as a readable error instead of a crash at
 * import time, and cached on globalThis so dev hot-reloads don't open a new
 * pool each time.
 */
const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const adapter = new PrismaPg({
    connectionString: requireEnv("DATABASE_URL"),
    // Each serverless instance keeps its own pool; keep it small so many
    // instances don't exhaust the pooler's client limit on the free tier.
    max: 3,
  });
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.prisma = prisma;
  return prisma;
}
