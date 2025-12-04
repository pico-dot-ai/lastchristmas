import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type LogMeta = Record<string, unknown>;

let cachedClient: SupabaseClient | null | undefined;

function getClient() {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    cachedClient = null;
    return null;
  }

  cachedClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return cachedClient;
}

export async function appendLog(scope: string, message: string, meta?: LogMeta) {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("debug_logs").insert({
    scope,
    message,
    meta: meta ?? {},
  });

  if (error) {
    // Fail soft; logging is best-effort.
    console.warn("appendLog failed", error.message);
  }
}
