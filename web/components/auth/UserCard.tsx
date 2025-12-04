"use client";

import { useMemo, useState } from "react";
import type { UserProfile } from "./useAuth";

type UserCardMode = "enterEmail" | "profileView" | "profileEdit";

type UserCardProps = {
  mode: UserCardMode;
  email?: string;
  profile?: UserProfile | null;
  onSubmitEmail?: (email: string) => void | Promise<void>;
  onStartEditProfile?: () => void;
  onSaveProfile?: (updates: Partial<UserProfile>) => void | Promise<void>;
  onCancelEditProfile?: () => void;
  onSignOut?: () => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
};

export function UserCard({
  mode,
  email = "",
  profile,
  onSubmitEmail,
  onStartEditProfile,
  onSaveProfile,
  onCancelEditProfile,
  onSignOut,
  isLoading = false,
  error,
}: UserCardProps) {
  const [emailInput, setEmailInput] = useState(email);
  const [fullNameInput, setFullNameInput] = useState(profile?.full_name ?? "");
  const [avatarUrlInput, setAvatarUrlInput] = useState(profile?.avatar_url ?? "");

  const cardTitle = useMemo(() => {
    if (mode === "enterEmail") return "Sign in with Magic Link";
    if (mode === "profileEdit") return "Edit your profile";
    return "Your profile";
  }, [mode]);

  const handleEmailSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSubmitEmail) return;
    await onSubmitEmail(emailInput.trim());
  };

  const handleProfileSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!onSaveProfile) return;
    await onSaveProfile({
      full_name: fullNameInput.trim(),
      avatar_url: avatarUrlInput.trim() || null,
    });
  };

  return (
    <div
      style={{
        background: "#111827",
        color: "#e5e7eb",
        padding: "24px",
        borderRadius: "16px",
        maxWidth: "420px",
        width: "100%",
        boxShadow: "0 15px 45px rgba(0,0,0,0.35)",
        border: "1px solid #1f2937",
      }}
    >
      <h2 style={{ margin: "0 0 8px", fontSize: "22px" }}>{cardTitle}</h2>
      {mode === "enterEmail" && (
        <p style={{ marginTop: 0, color: "#9ca3af" }}>
          Enter your email to receive a secure, passwordless login link.
        </p>
      )}
      {error && (
        <div
          style={{
            margin: "12px 0",
            padding: "12px",
            background: "#7f1d1d",
            color: "#fecaca",
            borderRadius: "8px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {mode === "enterEmail" && (
        <form onSubmit={handleEmailSubmit} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Email address</span>
            <input
              type="email"
              value={emailInput}
              required
              onChange={(event) => setEmailInput(event.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#e5e7eb",
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isLoading}
            style={{
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              background: isLoading ? "#1f2937" : "#2563eb",
              color: "white",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {isLoading ? "Sending..." : "Send magic link"}
          </button>
        </form>
      )}

      {mode === "profileView" && (
        <div style={{ display: "grid", gap: "12px" }}>
          <div>
            <p style={{ margin: "4px 0", fontSize: "14px", color: "#9ca3af" }}>Email</p>
            <p style={{ margin: 0, fontWeight: 700 }}>{profile?.email}</p>
          </div>
          {profile?.full_name && (
            <div>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#9ca3af" }}>Full name</p>
              <p style={{ margin: 0, fontWeight: 700 }}>{profile.full_name}</p>
            </div>
          )}
          {profile?.avatar_url && (
            <div>
              <p style={{ margin: "4px 0", fontSize: "14px", color: "#9ca3af" }}>Avatar URL</p>
              <p style={{ margin: 0, wordBreak: "break-all" }}>{profile.avatar_url}</p>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={onStartEditProfile}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#e5e7eb",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={onSignOut}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#ef4444",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      )}

      {mode === "profileEdit" && (
        <form onSubmit={handleProfileSubmit} style={{ display: "grid", gap: "12px" }}>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Email</span>
            <input
              type="email"
              value={profile?.email ?? email}
              disabled
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#64748b",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Full name</span>
            <input
              type="text"
              value={fullNameInput}
              onChange={(event) => setFullNameInput(event.target.value)}
              placeholder="Your name"
              required
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#e5e7eb",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={{ fontSize: "14px", color: "#cbd5e1" }}>Avatar URL</span>
            <input
              type="url"
              value={avatarUrlInput}
              onChange={(event) => setAvatarUrlInput(event.target.value)}
              placeholder="https://..."
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#e5e7eb",
              }}
            />
          </label>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: isLoading ? "#1f2937" : "#16a34a",
                color: "white",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {isLoading ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={onCancelEditProfile}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #334155",
                background: "#0b1221",
                color: "#e5e7eb",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Cancel
            </button>
          </div>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: "#ef4444",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Sign out
            </button>
          )}
        </form>
      )}
    </div>
  );
}

export type { UserCardMode, UserCardProps };
