'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not set.');
  }

  return { supabaseUrl, supabaseKey };
};

export const getSupabaseBrowserClient = (): SupabaseClient => {
  if (browserClient) return browserClient;

  const { supabaseKey, supabaseUrl } = getSupabaseEnv();
  browserClient = createClient(supabaseUrl, supabaseKey);
  return browserClient;
};
