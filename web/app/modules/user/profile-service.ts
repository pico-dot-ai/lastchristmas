import { type SupabaseClient, type User } from '@supabase/supabase-js';
import { type UserProfile } from './user-types';

const AVATAR_BUCKET = 'avatars';

const PROFILE_SELECT = 'id, display_name, avatar_url, created_at, accent_color';

type ProfileRow = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  accent_color: string | null;
};

const mapProfile = (
  row: ProfileRow,
  email: string | null | undefined,
  signedAvatarUrl?: string | null,
): UserProfile => ({
  id: row.id,
  email: email ?? 'Unknown user',
  displayName: row.display_name ?? email ?? 'Player',
  avatarUrl: signedAvatarUrl ?? row.avatar_url,
  createdAt: row.created_at,
  gradientColor: row.accent_color,
});

export const fetchOrCreateProfile = async (
  supabase: SupabaseClient,
  user: User,
): Promise<UserProfile> => {
  const { data, error } = await supabase
    .schema('app')
    .from('users')
    .select(PROFILE_SELECT)
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data) {
    const signedAvatarUrl = await generateSignedAvatarUrl(supabase, (data as ProfileRow).avatar_url);
    return mapProfile(data as ProfileRow, user.email ?? null, signedAvatarUrl);
  }

  const insertPayload = {
    id: user.id,
    display_name: user.user_metadata?.full_name ?? user.email ?? 'Player',
  };

  const { data: inserted, error: insertError } = await supabase
    .schema('app')
    .from('users')
    .insert(insertPayload)
    .select(PROFILE_SELECT)
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message ?? 'Unable to create user profile.');
  }

  return mapProfile(inserted as ProfileRow, user.email ?? null, null);
};

export type ProfileUpdateInput = {
  displayName?: string;
  avatarUrl?: string | null;
  gradientColor?: string | null;
};

export const upsertProfileForUser = async (
  supabase: SupabaseClient,
  user: User,
  payload: ProfileUpdateInput,
): Promise<UserProfile> => {
  const updateBody = {
    id: user.id,
    display_name: payload.displayName,
    avatar_url: payload.avatarUrl,
    accent_color: payload.gradientColor ?? null,
  };

  const { data, error } = await supabase
    .schema('app')
    .from('users')
    .upsert(updateBody)
    .select(PROFILE_SELECT)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to update profile.');
  }

  const signedAvatarUrl = await generateSignedAvatarUrl(supabase, (data as ProfileRow).avatar_url);
  return mapProfile(data as ProfileRow, user.email ?? null, signedAvatarUrl);
};

const generateSignedAvatarUrl = async (supabase: SupabaseClient, path: string | null) => {
  if (!path) return null;

  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) {
    return null;
  }
  return data.signedUrl;
};
