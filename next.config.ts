import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root. Without this, an unrelated lockfile in a parent directory can
  // make Next infer the wrong root and trace the build output to the wrong place.
  outputFileTracingRoot: path.resolve(__dirname),
  /*
   * Security headers.
   *
   * Next.js ships no Content-Security-Policy by default, so this is the app's only
   * defence in depth against injected script.
   *
   * A NOTE ON THE HONEST TRADE-OFF: the stricter nonce + 'strict-dynamic' policy was
   * built and then removed, because it blocked Next's own framework chunks and left the
   * page as inert HTML with no interactivity. A CSP that breaks the application is worse
   * than a simpler one that holds, so this policy keeps the directives that genuinely
   * matter — no external script origins, no plugins, no framing, locked form targets —
   * and accepts 'unsafe-inline' for the framework's hydration payload.
   *
   * The residual inline-script risk is small here by construction: there is no
   * dangerouslySetInnerHTML anywhere in the codebase, React escapes all rendered content,
   * and no user input is ever evaluated.
   */
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data:",
      "font-src 'self' data:",
      // The browser only ever talks to this origin; model providers are called server-side.
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
