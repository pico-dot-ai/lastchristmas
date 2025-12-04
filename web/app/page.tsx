"use client";

import { UserCard } from "@/components/auth/user-card";
import { useAuth } from "@/components/auth/auth-provider";

export default function HomePage() {
  const {
    stage,
    profile,
    user,
    isLoading,
    error,
    sendMagicLink,
    updateProfile,
    startEditingProfile,
    stopEditingProfile,
    signOut,
  } = useAuth();

  const mode =
    stage === "waitingForLink"
      ? "waiting"
      : stage === "profileReady"
        ? "view"
        : stage === "profileIncomplete" || stage === "editingProfile"
          ? "edit"
          : "enterEmail";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
        padding: "24px",
        gap: "24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "640px", width: "100%" }}>
        <p style={{ letterSpacing: "0.12em", textTransform: "uppercase", color: "#9ca3af", fontSize: "12px" }}>
          Little Whamaggeddon Challenge
        </p>
        <h1 style={{ marginTop: "6px", fontSize: "30px", fontWeight: 800 }}>Last Christmas</h1>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#6b7280", fontSize: "12px" }}>
          Mobile-first, adaptive web experience
        </p>
        <p style={{ marginTop: "6px", color: "#4b5563" }}>Let&apos;s build the seasonal knockout companion here.</p>
      </div>

      <div style={{ width: "100%", maxWidth: "640px" }}>
        <UserCard
          mode={mode}
          profile={profile}
          email={user?.email ?? undefined}
          loading={isLoading}
          error={error}
          onSubmitEmail={sendMagicLink}
          onStartEdit={startEditingProfile}
          onCancelEdit={stopEditingProfile}
          onSaveProfile={updateProfile}
          onSignOut={signOut}
        />
      </div>
    </main>
  );
}
