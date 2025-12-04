import { fetchRecentLogs } from "@/lib/diagnostics";

function formatDate(value?: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default async function DebugPage() {
  const { logs, error } = await fetchRecentLogs(50);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        background: "#0f172a",
      }}
    >
      <div style={{ width: "100%", maxWidth: "900px", color: "#e5e7eb" }}>
        <p style={{ letterSpacing: "0.14em", textTransform: "uppercase", color: "#a5b4fc", fontSize: "12px" }}>Diagnostics</p>
        <h1 style={{ marginTop: "6px", fontSize: "28px", fontWeight: 800, color: "#f8fafc" }}>Debug Logs</h1>
        <p style={{ marginTop: "6px", color: "#cbd5e1" }}>Recent entries from <code style={{ color: "#c7d2fe" }}>api.debug_logs</code>.</p>

        {error && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(248, 113, 113, 0.08)",
              border: "1px solid rgba(248, 113, 113, 0.25)",
              color: "#fecdd3",
            }}
          >
            Unable to fetch logs. Check Supabase publishable keys or RLS permissions. {error}
          </div>
        )}

        {!error && logs.length === 0 && (
          <div
            style={{
              marginTop: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(148, 163, 184, 0.15)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              color: "#e2e8f0",
              textAlign: "center",
            }}
          >
            No logs yet. Trigger actions in the app to generate diagnostics.
          </div>
        )}

        {!error && logs.length > 0 && (
          <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
            {logs.map((log) => (
              <article
                key={`${log.id}-${log.created_at}`}
                style={{
                  width: "100%",
                  padding: "14px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  boxSizing: "border-box",
                  wordBreak: "break-word",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        color: "#c7d2fe",
                        fontSize: "12px",
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {log.scope || "general"}
                    </span>
                    <span style={{ color: "#cbd5e1", fontSize: "13px" }}>{formatDate(log.created_at)}</span>
                  </div>
                  {log.user_id && <span style={{ color: "#94a3b8", fontSize: "12px" }}>user: {log.user_id}</span>}
                </div>
                <p style={{ marginTop: "8px", color: "#e2e8f0", fontWeight: 600, wordBreak: "break-word" }}>{log.message}</p>
                {log.meta && Object.keys(log.meta).length > 0 && (
                  <pre
                    style={{
                      marginTop: "10px",
                      padding: "10px",
                      borderRadius: "10px",
                      background: "rgba(15, 23, 42, 0.7)",
                      border: "1px solid rgba(148, 163, 184, 0.35)",
                      color: "#cbd5e1",
                      fontSize: "13px",
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      maxWidth: "100%",
                    }}
                  >
                    {JSON.stringify(log.meta, null, 2)}
                  </pre>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
