"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#374151" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", fontSize: "12px" }}>Error</p>
        <h1 style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ marginTop: "8px", color: "#6b7280" }}>
          An unexpected error occurred. You can try again or head back to the homepage.
        </p>
        <div style={{ marginTop: "16px", display: "flex", gap: "12px", justifyContent: "center" }}>
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "10px 16px",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "8px",
              fontWeight: 600,
              border: "none",
            }}
          >
            Try again
          </button>
          <a href="/" style={{ color: "#2563eb", textDecoration: "underline", alignSelf: "center" }}>
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
