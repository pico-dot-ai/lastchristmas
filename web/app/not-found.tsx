import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#374151" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", fontSize: "12px" }}>404</p>
        <h1 style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>Page not found</h1>
        <p style={{ marginTop: "8px", color: "#6b7280" }}>
          Sorry, we couldn&apos;t find the page you were looking for.
        </p>
        <div style={{ marginTop: "16px" }}>
          <Link href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>
            Go back home
          </Link>
        </div>
      </div>
    </main>
  );
}
