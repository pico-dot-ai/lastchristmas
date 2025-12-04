"use client";

import { useMemo } from "react";

import { UserCard } from "@/components/auth/UserCard";
import { useAuth } from "@/components/auth/useAuth";

export default function LoginPage() {
  const { stage, sendMagicLink, isLoading, error } = useAuth();

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
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "#0f172a",
      }}
    >
      <div style={{ maxWidth: "480px", width: "100%", display: "grid", gap: "16px" }}>
        <h1 style={{ margin: 0, textAlign: "center" }}>Welcome back</h1>
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
          mode="enterEmail"
          onSubmitEmail={sendMagicLink}
          isLoading={stage === "sendingMagicLink" || isLoading}
          error={error}
        />
      </div>
    </main>
  );
}
