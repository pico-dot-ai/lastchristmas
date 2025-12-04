import type { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

export type AuthStage =
  | "initializing"
  | "enterEmail"
  | "sendingLink"
  | "waitingForLink"
  | "profileIncomplete"
  | "editingProfile"
  | "profileReady";

export type AuthState = {
  stage: AuthStage;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
};

export type AuthContextValue = AuthState & {
  sendMagicLink: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
  reloadProfile: () => Promise<void>;
  startEditingProfile: () => void;
  stopEditingProfile: () => void;
  signOut: () => Promise<void>;
};

export function isProfileComplete(profile: Profile | null): profile is Profile {
  if (!profile) return false;
  return Boolean(profile.full_name);
}
