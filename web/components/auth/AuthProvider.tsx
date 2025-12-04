"use client";

import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { AuthContextValue, AuthStage, UserProfile } from "./useAuth";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return Boolean(profile.full_name?.trim());
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [stage, setStage] = useState<AuthStage>("enterEmail");
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadProfile = useCallback(
    async (userId: string, userEmail?: string | null) => {
      setIsLoading(true);
      try {
        if (!supabase) {
          setError("Supabase client is not configured");
          setStage("enterEmail");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, avatar_url, updated_at")
          .eq("id", userId)
          .maybeSingle();

        if (profileError) {
          setError(profileError.message);
          setProfile(null);
          setStage("profileIncomplete");
          return;
        }

        if (!data) {
          setProfile({ id: userId, email: userEmail ?? supabaseUser?.email ?? "" });
          setStage("profileIncomplete");
          return;
        }

        setProfile(data);
        setStage(isProfileComplete(data) ? "profileComplete" : "profileIncomplete");
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : String(loadError));
        setStage("profileIncomplete");
      } finally {
        setIsLoading(false);
      }
      },
    [supabase, supabaseUser],
  );

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      setIsLoading(true);
      if (!supabase) {
        setError("Supabase client is not configured");
        setStage("enterEmail");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          setError(sessionError.message);
          setStage("enterEmail");
          return;
        }

        const user = data.session?.user ?? null;
        if (mounted) {
          setSupabaseUser(user);
          if (user) {
            setStage("authenticatedProfileCheck");
            await loadProfile(user.id, user.email);
          } else {
            setStage("enterEmail");
          }
        }
      } catch (initError) {
        setError(initError instanceof Error ? initError.message : String(initError));
        setStage("enterEmail");
      } finally {
        setIsLoading(false);
      }
    };

    initialize();

    const { data: subscription } = supabase?.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null;
        setSupabaseUser(user);
        if (!user) {
          setProfile(null);
          setStage("enterEmail");
          return;
        }

        if (event === "SIGNED_IN") {
          setStage("authenticatedProfileCheck");
          await loadProfile(user.id, user.email);
          router.refresh();
        }

        if (event === "SIGNED_OUT") {
          setProfile(null);
          setStage("enterEmail");
        }
      },
    ) ?? { subscription: { unsubscribe: () => {} } };

    return () => {
      mounted = false;
      subscription?.subscription.unsubscribe();
    };
  }, [loadProfile, router, supabase]);

  const sendMagicLink = useCallback(async (email: string) => {
    setError(null);
    setIsLoading(true);
    setStage("sendingMagicLink");
    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured");
      }

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          shouldCreateUser: true,
        },
      });

      if (signInError) {
        setError(signInError.message);
        setStage("enterEmail");
        return;
      }

      setStage("magicLinkSent");
    } catch (signInException) {
      setError(
        signInException instanceof Error
          ? signInException.message
          : String(signInException),
      );
      setStage("enterEmail");
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const reloadProfile = useCallback(async () => {
    if (!supabaseUser) return;
    if (!supabase) {
      setError("Supabase client is not configured");
      return;
    }
    await loadProfile(supabaseUser.id, supabaseUser.email);
  }, [loadProfile, supabase, supabaseUser]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!supabaseUser) return;
      setIsLoading(true);
      setError(null);
      try {
        if (!supabase) {
          throw new Error("Supabase client is not configured");
        }

        const payload = {
          id: supabaseUser.id,
          email: supabaseUser.email ?? "",
          ...updates,
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabase
          .from("profiles")
          .upsert(payload)
          .select("id, email, full_name, avatar_url, updated_at")
          .single();

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setProfile(data);
        setStage("profileComplete");
      } catch (updateException) {
        setError(
          updateException instanceof Error
            ? updateException.message
            : String(updateException),
        );
      } finally {
        setIsLoading(false);
      }
      },
    [supabase, supabaseUser],
  );

  const startEditingProfile = useCallback(() => {
    setStage("editingProfile");
  }, []);

  const finishEditingProfile = useCallback(() => {
    setStage(isProfileComplete(profile) ? "profileComplete" : "profileIncomplete");
  }, [profile]);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!supabase) {
        throw new Error("Supabase client is not configured");
      }

      await supabase.auth.signOut();
      setSupabaseUser(null);
      setProfile(null);
      setStage("enterEmail");
      router.replace("/login");
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : String(signOutError));
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      stage,
      supabaseUser,
      profile,
      error,
      isLoading,
      sendMagicLink,
      reloadProfile,
      updateProfile,
      startEditingProfile,
      finishEditingProfile,
      signOut,
    }),
    [
      stage,
      supabaseUser,
      profile,
      error,
      isLoading,
      sendMagicLink,
      reloadProfile,
      updateProfile,
      startEditingProfile,
      finishEditingProfile,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
