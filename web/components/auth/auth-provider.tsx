"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getSupabaseClient } from "@/lib/supabase-client";
import type { AuthContextValue, AuthState, Profile } from "@/lib/auth/types";
import { isProfileComplete } from "@/lib/auth/types";

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL_STATE: AuthState = {
  stage: "initializing",
  user: null,
  profile: null,
  isLoading: true,
  error: null,
};

async function fetchProfile(userId: string): Promise<Profile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  const [isEditing, setIsEditing] = useState(false);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [awaitingLink, setAwaitingLink] = useState(false);

  const deriveStage = useCallback(
    (base: AuthState, next: Partial<AuthState> = {}): AuthState => {
      const merged = { ...base, ...next } as AuthState;

      if (merged.isLoading) {
        return { ...merged, stage: merged.stage === "initializing" ? "initializing" : merged.stage };
      }

      if (!merged.user) {
        return { ...merged, stage: awaitingLink ? "waitingForLink" : "enterEmail" };
      }

      if (isEditing) {
        return { ...merged, stage: "editingProfile" };
      }

      if (!isProfileComplete(merged.profile)) {
        return { ...merged, stage: "profileIncomplete" };
      }

      return { ...merged, stage: "profileReady" };
    },
    [awaitingLink, isEditing],
  );

  const loadProfile = useCallback(
    async (userId: string) => {
      const profile = await fetchProfile(userId);
      setState((current) => deriveStage(current, { profile, user: current.user }));
    },
    [deriveStage],
  );

  const initialize = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const user = session?.user ?? null;

      if (!user) {
        setState((current) => deriveStage(current, { user: null, profile: null, isLoading: false, error: null, stage: "enterEmail" }));
        return;
      }

      await loadProfile(user.id);
      setState((current) => deriveStage(current, { user, isLoading: false, error: null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load session";
      setState((current) => ({ ...current, isLoading: false, error: message, stage: "enterEmail" }));
    }
  }, [deriveStage, loadProfile]);

  useEffect(() => {
    initialize();

    let supabase: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabase = getSupabaseClient();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Supabase client unavailable";
      setState((current) => ({ ...current, isLoading: false, error: message, stage: "enterEmail" }));
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setIsEditing(false);
        setAwaitingLink(false);
        setState((current) => deriveStage(current, { user: null, profile: null, isLoading: false, error: null }));
        return;
      }

      const user = session?.user;
      if (user) {
        try {
          await loadProfile(user.id);
          setState((current) => deriveStage(current, { user, isLoading: false, error: null }));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load profile";
          setState((current) => ({ ...current, user, isLoading: false, error: message }));
        }
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [deriveStage, initialize, loadProfile]);

  const sendMagicLink = useCallback(
    async (email: string) => {
      setIsSendingLink(true);
      setState((current) => ({ ...current, error: null, stage: "sendingLink" }));

      try {
        const supabase = getSupabaseClient();
        const redirectTo = typeof window === "undefined" ? undefined : `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: redirectTo,
          },
        });

        if (error) {
          throw new Error(error.message);
        }

        setAwaitingLink(true);
        setState((current) => ({ ...current, isLoading: false, error: null, stage: "waitingForLink" }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to send magic link";
        setState((current) => ({ ...current, error: message, stage: "enterEmail" }));
      } finally {
        setIsSendingLink(false);
      }
    },
    [],
  );

  const reloadProfile = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;

      if (!user) {
        setState((current) => deriveStage(current, { user: null, profile: null, isLoading: false }));
        return;
      }

      await loadProfile(user.id);
      setState((current) => deriveStage(current, { user, isLoading: false }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reload profile";
      setState((current) => ({ ...current, isLoading: false, error: message }));
    }
  }, [deriveStage, loadProfile]);

  const updateProfile = useCallback(
    async (profile: Partial<Profile>) => {
      if (!state.user) {
        setState((current) => ({ ...current, error: "No authenticated user" }));
        return;
      }

      setState((current) => ({ ...current, isLoading: true, error: null }));

      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from("profiles")
          .upsert({ id: state.user.id, ...profile }, { onConflict: "id" });

        if (error) {
          throw new Error(error.message);
        }

        await reloadProfile();
        setIsEditing(false);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to update profile";
        setState((current) => ({ ...current, isLoading: false, error: message }));
      }
    },
    [reloadProfile, state.user],
  );

  const signOut = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }
      setAwaitingLink(false);
      setIsEditing(false);
      setState((current) => deriveStage(current, { user: null, profile: null, isLoading: false, error: null }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign out";
      setState((current) => ({ ...current, isLoading: false, error: message }));
    }
  }, [deriveStage]);

  const startEditingProfile = useCallback(() => setIsEditing(true), []);
  const stopEditingProfile = useCallback(() => setIsEditing(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      stage: deriveStage(state).stage,
      sendMagicLink,
      updateProfile,
      reloadProfile,
      startEditingProfile,
      stopEditingProfile,
      signOut,
      isLoading: state.isLoading || isSendingLink,
    }),
    [deriveStage, isSendingLink, reloadProfile, sendMagicLink, signOut, state, startEditingProfile, stopEditingProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
