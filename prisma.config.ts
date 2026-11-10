import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local; load it for the Prisma CLI too (then .env as a fallback).
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // The CLI (migrations) uses the DIRECT connection: Supabase's transaction
    // pooler can't run migrations. The app itself connects through the pooler
    // via DATABASE_URL in lib/db.ts. process.env (not env()) so `prisma generate`
    // still works where DIRECT_URL isn't set, e.g. during Vercel's install step.
    url: process.env.DIRECT_URL,
  },
});
