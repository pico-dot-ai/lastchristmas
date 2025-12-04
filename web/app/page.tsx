"use client";

import { useMemo } from "react";

import { UserCard } from "@/components/auth/UserCard";
import { useAuth } from "@/components/auth/useAuth";

export default function HomePage() {
  const {
    stage,
    supabaseUser,
    profile,
    isLoading,
    error,
    sendMagicLink,
    updateProfile,
    startEditingProfile,
    finishEditingProfile,
    signOut,
  } = useAuth();

  const cardMode = useMemo(() => {
    if (stage === "profileComplete") return "profileView" as const;
    if (stage === "profileIncomplete" || stage === "editingProfile") return "profileEdit" as const;
    return "enterEmail" as const;
  }, [stage]);

  const helperMessage = useMemo(() => {
    if (stage === "magicLinkSent") {
      return "Magic link sent! Check your email to continue.";
    }
    if (stage === "sendingMagicLink") {
      return "Sending magic link...";
    }
    return null;
  }, [stage]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        fontFamily: "sans-serif",
        padding: "32px 24px",
        background: "#0f172a",
        color: "#e5e7eb",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "720px", width: "100%", display: "grid", gap: "6px" }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", fontSize: "12px" }}>
          Little Whamaggeddon Challenge
        </p>
        <h1 style={{ marginTop: "6px", fontSize: "30px", fontWeight: 800 }}>Last Christmas</h1>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#cbd5e1", fontSize: "12px" }}>
          Mobile-first, adaptive web experience
        </p>
        <p style={{ marginTop: "6px", color: "#cbd5e1" }}>Let&apos;s build the seasonal knockout companion here.</p>
      </div>

      <div style={{ width: "100%", maxWidth: "520px", display: "grid", gap: "12px", marginTop: "12px" }}>
        {helperMessage && (
          <div
            style={{
              padding: "12px",
              borderRadius: "12px",
              background: "#111827",
              border: "1px solid #1f2937",
              color: "#9ca3af",
              textAlign: "center",
              fontSize: "14px",
            }}
          >
            {helperMessage}
          </div>
        )}

        <UserCard
          mode={cardMode}
          profile={profile}
          onSubmitEmail={cardMode === "enterEmail" ? sendMagicLink : undefined}
          onStartEditProfile={cardMode === "profileView" ? startEditingProfile : undefined}
          onSaveProfile={cardMode === "profileEdit" ? updateProfile : undefined}
          onCancelEditProfile={cardMode === "profileEdit" ? finishEditingProfile : undefined}
          onSignOut={supabaseUser ? signOut : undefined}
          isLoading={isLoading || stage === "sendingMagicLink"}
          error={error}
        />
      </div>
    </main>
  );
}
