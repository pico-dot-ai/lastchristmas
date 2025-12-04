import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type LogMeta = Record<string, unknown>;

export type DebugLog = {
  id?: number;
  scope?: string;
  message?: string;
  meta?: Record<string, unknown>;
  created_at?: string;
  user_id?: string | null;
};

export type FeatureFlag = {
  id?: number;
  key: string;
  enabled?: boolean;
  value?: Record<string, unknown> | null;
  logging?: boolean;
};

const LOGS_TABLE = "debug_logs";
const FLAGS_TABLE = "feature_flags";

let cachedPublicClient: SupabaseClient | null | undefined;
let cachedAdminClient: SupabaseClient | null | undefined;

function getPublicClient() {
  if (cachedPublicClient !== undefined) return cachedPublicClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publicKey) {
    cachedPublicClient = null;
    return null;
  }

  cachedPublicClient = createClient(url, publicKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  });

  return cachedPublicClient;
}

// Server-only: destructive operations (e.g., delete) must use the secret key.
function getAdminClient() {
  if (cachedAdminClient !== undefined) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    cachedAdminClient = null;
    return null;
  }

  cachedAdminClient = createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: "public" },
  });

  return cachedAdminClient;
}

export async function appendLog(scope: string, message: string, meta?: LogMeta) {
  const client = getPublicClient();
  if (!client) return;

  const { error } = await client.from(LOGS_TABLE).insert({
    scope,
    message,
    meta: meta ?? {},
  });

  if (error) {
    console.warn("appendLog failed", error.message);
  }
}

export async function fetchRecentLogs(limit = 50): Promise<{ logs: DebugLog[]; error?: string }> {
  const client = getPublicClient();
  if (!client) return { logs: [], error: "Missing Supabase URL or publishable key" };

  const { data, error } = await client.from(LOGS_TABLE).select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) {
    console.warn("fetchRecentLogs failed", error.message);
    return { logs: [], error: error.message };
  }

  return { logs: data ?? [] };
}

export async function deleteLog(id: number) {
  const client = getAdminClient();
  if (!client) return;

  const { error } = await client.from(LOGS_TABLE).delete().eq("id", id);
  if (error) {
    console.warn("deleteLog failed", error.message);
  }
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[] | null> {
  const client = getPublicClient();
  if (!client) return null;

  const { data, error } = await client.from(FLAGS_TABLE).select("*").order("key", { ascending: true });
  if (error) {
    console.warn("fetchFeatureFlags failed", error.message);
    return null;
  }

  return data ?? [];
}

export async function upsertFeatureFlag(flag: FeatureFlag) {
  const client = getPublicClient();
  if (!client) return;

  const { error } = await client.from(FLAGS_TABLE).upsert(flag, { onConflict: "key" });
  if (error) {
    console.warn("upsertFeatureFlag failed", error.message);
  }
}
