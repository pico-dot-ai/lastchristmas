"use client";

import { useContext } from "react";
import type { User } from "@supabase/supabase-js";

import { AuthContext } from "./AuthProvider";

type AuthStage =
  | "enterEmail"
  | "sendingMagicLink"
  | "magicLinkSent"
  | "authenticatedProfileCheck"
  | "profileIncomplete"
  | "profileComplete"
  | "editingProfile";

export type UserProfile = {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

export type AuthState = {
  stage: AuthStage;
  supabaseUser: User | null;
  profile: UserProfile | null;
  error: string | null;
  isLoading: boolean;
};

export type AuthContextValue = AuthState & {
  sendMagicLink: (email: string) => Promise<void>;
  reloadProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  startEditingProfile: () => void;
  finishEditingProfile: () => void;
  signOut: () => Promise<void>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { AuthStage };
