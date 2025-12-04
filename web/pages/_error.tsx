import type { NextPageContext } from "next";

function ErrorPage({ statusCode }: { statusCode?: number }) {
  const code = statusCode ?? 500;
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px", color: "#374151" }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <p style={{ letterSpacing: "0.08em", textTransform: "uppercase", color: "#9ca3af", fontSize: "12px" }}>
          {code}
        </p>
        <h1 style={{ marginTop: "8px", fontSize: "28px", fontWeight: 800 }}>Something went wrong</h1>
        <p style={{ marginTop: "8px", color: "#6b7280" }}>
          An unexpected error occurred. Please try again or return home.
        </p>
        <div style={{ marginTop: "16px" }}>
          <a href="/" style={{ color: "#2563eb", textDecoration: "underline" }}>
            Go back home
          </a>
        </div>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 404;
  return { statusCode };
};

export default ErrorPage;
