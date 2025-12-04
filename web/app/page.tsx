export default function HomePage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "sans-serif", padding: "24px" }}>
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
    </main>
  );
}
