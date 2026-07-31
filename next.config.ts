import type { NextConfig } from "next";

const baseSecurityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
] as const;

function hstsEnabled(): boolean {
  const explicit = process.env.ENABLE_HSTS?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  // Em production com HTTP doméstico o Compose define ENABLE_HSTS=false.
  return false;
}

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    const securityHeaders = [
      ...baseSecurityHeaders,
      ...(hstsEnabled()
        ? ([
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ] as const)
        : []),
    ];
    return [
      {
        source: "/:path*",
        headers: [...securityHeaders],
      },
    ];
  },
};

export default nextConfig;
