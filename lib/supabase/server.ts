import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/server-config";

export const BACKGROUND_BUCKET = "layout-backgrounds";

let client: SupabaseClient | null = null;

/**
 * Server-only Supabase client, used for Storage (reference images) only —
 * the layouts table is accessed through Prisma (lib/db.ts). Uses the service
 * role key, which never reaches the browser.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
