'use client';

import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

const getSupabaseClientOrThrow = () => {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.',
    );
  }

  return supabase;
};

export type AuthSubscription = {
  unsubscribe: () => void;
};

export const requestMagicLink = async (email: string) =>
  getSupabaseClientOrThrow().auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}`,
    },
  });

export const signOut = () => getSupabaseClientOrThrow().auth.signOut();

export const getSession = () => getSupabaseClientOrThrow().auth.getSession();

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): AuthSubscription => {
  try {
    const { data } = getSupabaseClientOrThrow().auth.onAuthStateChange(callback);
    return {
      unsubscribe: data.subscription.unsubscribe,
    };
  } catch (error) {
    console.warn(error instanceof Error ? error.message : 'Auth subscription could not be created.');
    return {
      unsubscribe: () => undefined,
    };
  }
};
