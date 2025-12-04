'use client';

import { type AuthChangeEvent, type Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

const supabase = getSupabaseBrowserClient();

export type AuthSubscription = {
  unsubscribe: () => void;
};

export const requestMagicLink = async (email: string) =>
  supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}`,
    },
  });

export const signOut = () => supabase.auth.signOut();

export const getSession = () => supabase.auth.getSession();

export const onAuthStateChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void,
): AuthSubscription => {
  const { data } = supabase.auth.onAuthStateChange(callback);
  return {
    unsubscribe: data.subscription.unsubscribe,
  };
};
