"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/auth/user-card";
import { useAuth } from "@/components/auth/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { stage, sendMagicLink, error, isLoading } = useAuth();

  useEffect(() => {
    if (stage === "profileReady" || stage === "profileIncomplete" || stage === "editingProfile") {
      router.replace("/account");
    }
  }, [router, stage]);

  const mode = stage === "waitingForLink" ? "waiting" : "enterEmail";

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <UserCard mode={mode} loading={isLoading} error={error} onSubmitEmail={sendMagicLink} />
    </main>
  );
}
