"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (supabase !== undefined) return supabase;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    supabase = null;
    return null;
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey);
  return supabase;
}

export type { SupabaseClient };
