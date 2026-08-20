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
  return false;
}

function contentSecurityPolicy(): string {
  const connectSrc = ["'self'", "ws:", "wss:"];
  const wsUrl = process.env.PUBLIC_WS_URL?.trim();
  if (wsUrl) {
    try {
      connectSrc.push(new URL(wsUrl).origin);
    } catch {
      /* ignora URL inválida */
    }
  }
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connectSrc.join(" ")}`,
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    const securityHeaders = [
      ...baseSecurityHeaders,
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy(),
      },
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
