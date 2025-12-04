"use client";

import { useMemo, useState } from "react";
import type { Profile } from "@/lib/auth/types";

export type UserCardMode = "enterEmail" | "waiting" | "view" | "edit";

type Props = {
  mode: UserCardMode;
  email?: string;
  profile?: Profile | null;
  loading?: boolean;
  error?: string | null;
  onSubmitEmail?: (email: string) => Promise<void> | void;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveProfile?: (profile: Partial<Profile>) => Promise<void> | void;
  onSignOut?: () => Promise<void> | void;
};

export function UserCard({
  mode,
  email,
  profile,
  loading,
  error,
  onSubmitEmail,
  onStartEdit,
  onCancelEdit,
  onSaveProfile,
  onSignOut,
}: Props) {
  const [emailInput, setEmailInput] = useState(email ?? "");
  const [draftProfile, setDraftProfile] = useState<Partial<Profile>>(profile ?? {});

  const title = useMemo(() => {
    switch (mode) {
      case "edit":
        return "Update your profile";
      case "view":
        return "Your profile";
      case "waiting":
        return "Check your email";
      default:
        return "Sign in";
    }
  }, [mode]);

  const handleSubmitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (onSubmitEmail) await onSubmitEmail(emailInput);
  };

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (onSaveProfile) await onSaveProfile(draftProfile);
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "420px",
        margin: "0 auto",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.05)",
        background: "#fff",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: "#9ca3af", fontSize: "12px" }}>
            Auth
          </p>
          <h2 style={{ margin: "4px 0 0", fontSize: "22px", fontWeight: 700 }}>{title}</h2>
        </div>
        {loading ? (
          <span style={{ color: "#6b7280", fontSize: "12px" }}>Loading…</span>
        ) : null}
      </div>

      {error ? (
        <div
          style={{
            marginTop: "12px",
            padding: "10px 12px",
            borderRadius: "10px",
            background: "#fef2f2",
            color: "#b91c1c",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      ) : null}

      {mode === "enterEmail" && (
        <form onSubmit={handleSubmitEmail} style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "14px", color: "#374151" }}>
            Email address
            <input
              type="email"
              required
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="you@example.com"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            Send magic link
          </button>
        </form>
      )}

      {mode === "waiting" && (
        <div style={{ marginTop: "20px", color: "#374151", fontSize: "15px", lineHeight: 1.6 }}>
          <p>We just sent a magic link to {emailInput || email || "your inbox"}.</p>
          <p>Open it on this device to finish signing in.</p>
        </div>
      )}

      {mode === "view" && profile && (
        <div style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
          <div>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "4px" }}>Name</p>
            <p style={{ fontSize: "16px", fontWeight: 600 }}>{profile.full_name ?? "Not set"}</p>
          </div>
          <div>
            <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "4px" }}>Avatar URL</p>
            <p style={{ fontSize: "16px", wordBreak: "break-all" }}>{profile.avatar_url ?? "Not set"}</p>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={onStartEdit}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: "1px solid #fca5a5",
                background: "#fef2f2",
                color: "#b91c1c",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {mode === "edit" && (
        <form onSubmit={handleSaveProfile} style={{ marginTop: "20px", display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px", fontSize: "14px", color: "#374151" }}>
            Full name
            <input
              type="text"
              value={draftProfile.full_name ?? ""}
              onChange={(event) => setDraftProfile({ ...draftProfile, full_name: event.target.value })}
              placeholder="Jane Doe"
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "6px", fontSize: "14px", color: "#374151" }}>
            Avatar URL
            <input
              type="url"
              value={draftProfile.avatar_url ?? ""}
              onChange={(event) => setDraftProfile({ ...draftProfile, avatar_url: event.target.value })}
              placeholder="https://..."
              style={{
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                padding: "12px",
                fontSize: "14px",
              }}
            />
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "none",
                background: "#111827",
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
                opacity: loading ? 0.6 : 1,
              }}
            >
              Save profile
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              style={{
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #d1d5db",
                background: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
