"use client";

/**
 * Root error boundary.
 *
 * Replaces the root layout entirely when it fires, so it must supply its own <html> and
 * <body>. Styling is inline because the stylesheet may be exactly what failed to load.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, -apple-system, sans-serif",
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14171f",
          color: "#eceef2",
          padding: "1.5rem",
        }}
      >
        <main style={{ maxWidth: "34rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>
            Circuit Breaker could not start
          </h1>
          <p style={{ lineHeight: 1.6, color: "#969fb3" }}>
            Something failed before the application could load. Your data is stored in this browser
            and has not been affected.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", color: "#647089", marginTop: "0.75rem" }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={reset}
              style={{
                background: "#5eb0a4",
                color: "#10131a",
                border: "none",
                borderRadius: "8px",
                padding: "0.7rem 1.1rem",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Reload the app
            </button>
            <a
              href="/help"
              style={{
                border: "1px solid #2c3242",
                borderRadius: "8px",
                padding: "0.7rem 1.1rem",
                fontSize: "0.875rem",
                color: "#eceef2",
                textDecoration: "none",
              }}
            >
              Crisis resources
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
