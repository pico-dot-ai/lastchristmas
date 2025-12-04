"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/auth/user-card";
import { useAuth } from "@/components/auth/auth-provider";

export default function AccountPage() {
  const router = useRouter();
  const { stage, profile, isLoading, error, updateProfile, startEditingProfile, stopEditingProfile, signOut } = useAuth();

  useEffect(() => {
    if (stage === "enterEmail" || stage === "waitingForLink") {
      router.replace("/login");
    }
  }, [router, stage]);

  if (stage === "initializing") {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#374151" }}>
        Checking your session...
      </main>
    );
  }

  const mode = stage === "profileReady" ? "view" : "edit";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <UserCard
        mode={mode}
        profile={profile}
        loading={isLoading}
        error={error}
        onStartEdit={startEditingProfile}
        onCancelEdit={stopEditingProfile}
        onSaveProfile={updateProfile}
        onSignOut={signOut}
      />
    </main>
  );
}
