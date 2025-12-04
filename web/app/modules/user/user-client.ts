'use client';

import { type User } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '../../lib/supabase/client';

const supabase = getSupabaseBrowserClient();

export type UserProfile = {
  id: string;
  email: string;
  emailConfirmed: boolean;
};

export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  const { data, error } = await supabase.auth.getUser();

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
