import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';

export const getSupabaseEnv = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL/key missing for server client.');
  }

  return { supabaseUrl, supabaseKey };
};

const getCookieAdapter = async () => {
  const store = await cookies();
  return {
    get(name: string) {
      const raw = (store as unknown as { get?: (key: string) => any }).get?.(name);
      if (!raw) return undefined;
      if (typeof raw === 'string') return raw;
      if (typeof raw === 'object' && 'value' in raw) return (raw as { value?: string }).value;
      return undefined;
    },
    set(name: string, value: string, options: any) {
      try {
        const setter = (store as unknown as { set?: CallableFunction }).set;
        if (setter) setter({ name, value, ...options });
      } catch {
        /* no-op */
      }
    },
    remove(name: string, options: any) {
      try {
        const setter = (store as unknown as { set?: CallableFunction }).set;
        if (setter) setter({ name, value: '', ...options, maxAge: 0 });
      } catch {
        /* no-op */
      }
    },
  };
};

export const getServerComponentSupabaseClient = async () => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: await getCookieAdapter(),
  });
};

export const getRouteHandlerSupabaseClient = (request: NextRequest) => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set() {
        /* read-only for API routes */
      },
      remove() {
        /* read-only for API routes */
      },
    },
  });
};

export const getRouteHandlerSupabaseClientWithResponse = (
  request: NextRequest,
  response: NextResponse,
) => {
  const { supabaseUrl, supabaseKey } = getSupabaseEnv();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: any) {
        response.cookies.set({ name, value: '', ...options, maxAge: 0 });
      },
    },
  });
};
