-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "layouts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(80) NOT NULL,
    "author_name" VARCHAR(60),
    "page" JSONB NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "background" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "layouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "layouts_recent_idx" ON "layouts"("deleted_at", "updated_at" DESC);


-- Row Level Security (added by hand; Prisma's schema can't express it).
-- The app has no logins: only the server talks to the database, as the
-- `postgres` role via DATABASE_URL, which bypasses RLS. Enabling RLS with no
-- policies blocks Supabase's public API (anon key) from reading or writing.
ALTER TABLE "layouts" ENABLE ROW LEVEL SECURITY;
