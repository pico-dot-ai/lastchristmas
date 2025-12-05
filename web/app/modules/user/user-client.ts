'use client';

import { getSupabaseBrowserClient } from '../../lib/supabase/client';
import { type UserProfile } from './user-types';

const getSupabaseClientOrThrow = () => {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error(
      'Supabase client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to continue.',
    );
  }

  return supabase;
};

const handleJson = async (response: Response) => {
  if (!response.ok) {
    const message = (await response.json().catch(() => ({}))).error ?? response.statusText;
    throw new Error(message);
  }
  return response.json();
};

export const fetchProfile = async (): Promise<UserProfile | null> => {
  const response = await fetch('/api/profile', { credentials: 'include', cache: 'no-store' });

  if (response.status === 401) {
    return null;
  }

  const { profile } = await handleJson(response);
  return profile ?? null;
};

export type UpdateProfileInput = {
  displayName?: string;
  firstName?: string;
  lastName?: string;
  dob?: string | null;
};

export const updateProfile = async (input: UpdateProfileInput): Promise<UserProfile> => {
  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(input),
  });

  const { profile } = await handleJson(response);
  return profile;
};

export const uploadAvatar = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/profile/avatar', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const { profile } = await handleJson(response);
  return profile;
};

export const getCurrentUser = async () => {
  const { data } = await getSupabaseClientOrThrow().auth.getUser();
  return data.user;
};
