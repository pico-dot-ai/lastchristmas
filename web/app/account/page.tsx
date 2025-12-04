"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { UserCard } from "@/components/auth/UserCard";
import { useAuth } from "@/components/auth/useAuth";

export default function AccountPage() {
  const router = useRouter();
  const {
    stage,
    supabaseUser,
    profile,
    isLoading,
    error,
    updateProfile,
    startEditingProfile,
    finishEditingProfile,
    signOut,
  } = useAuth();

  useEffect(() => {
    if (!supabaseUser && (stage === "enterEmail" || stage === "magicLinkSent")) {
      router.replace("/login");
    }
  }, [router, stage, supabaseUser]);

  const cardMode = useMemo(() => {
    if (stage === "profileComplete") return "profileView" as const;
    return "profileEdit" as const;
  }, [stage]);

  const showProfileView = cardMode === "profileView";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#0f172a",
      }}
    >
      <div style={{ maxWidth: "640px", width: "100%", display: "grid", gap: "16px" }}>
        <h1 style={{ margin: 0, textAlign: "center" }}>Account</h1>
        {supabaseUser ? (
          <UserCard
            mode={cardMode}
            profile={profile}
            onStartEditProfile={startEditingProfile}
            onSaveProfile={updateProfile}
            onCancelEditProfile={finishEditingProfile}
            onSignOut={signOut}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <p style={{ textAlign: "center", color: "#9ca3af" }}>Redirecting to login...</p>
        )}
        {showProfileView && (
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px" }}>
            Keep your profile updated to personalize your experience.
          </p>
        )}
      </div>
    </main>
  );
}
