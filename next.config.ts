import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Pin the workspace root. Without this, an unrelated lockfile in a parent directory can
  // make Next infer the wrong root and trace the build output to the wrong place.
  outputFileTracingRoot: path.resolve(__dirname),
  // Security headers. CSP is deliberately omitted here rather than set loosely:
  // a permissive CSP is worse than none because it implies protection it doesn't give.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
