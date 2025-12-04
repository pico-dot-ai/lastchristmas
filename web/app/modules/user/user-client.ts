'use client';

import { type User } from '@supabase/supabase-js';
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

export type UserProfile = {
  id: string;
  email: string;
  emailConfirmed: boolean;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data, error } = await getSupabaseClientOrThrow().auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return mapUserToProfile(data.user);
};

export const mapUserToProfile = (user: User): UserProfile => ({
  id: user.id,
  email: user.email ?? 'Unknown user',
  emailConfirmed: Boolean(user.email_confirmed_at),
});
