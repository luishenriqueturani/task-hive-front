import type { NextRequest } from "next/server";
import { headers } from "next/headers";

const BAD_HOSTNAMES = new Set(["0.0.0.0", "::", "[::]"]);

function hostnameFromHostHeader(host: string): string {
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end > 0 ? host.slice(1, end).toLowerCase() : host.toLowerCase();
  }
  return (host.split(":")[0] ?? host).toLowerCase();
}

export function isBadPublicHostname(hostname: string): boolean {
  return BAD_HOSTNAMES.has(hostname.toLowerCase());
}

/** Origem pública a partir de cabeçalhos do proxy (Nginx → Next). */
export function readPublicOriginFromHeaders(
  getHeader: (name: string) => string | null,
): string | null {
  const forwardedHost = getHeader("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || getHeader("host")?.split(",")[0]?.trim();
  if (!host) return null;

  if (isBadPublicHostname(hostnameFromHostHeader(host))) return null;

  const proto =
    getHeader("x-forwarded-proto")?.split(",")[0]?.trim() || "http";
  return `${proto}://${host}`;
}

export function publicOriginFromRequest(request: NextRequest): string | null {
  return readPublicOriginFromHeaders((name) => request.headers.get(name));
}

export async function publicOriginFromServer(): Promise<string | null> {
  const h = await headers();
  return readPublicOriginFromHeaders((name) => h.get(name));
}

/** Cabeçalhos → `PUBLIC_APP_URL` → primeira origem CSRF (LAN). */
export function resolvePublicOrigin(fromHeaders: string | null): string | null {
  if (fromHeaders) return fromHeaders.replace(/\/$/, "");

  const explicit = process.env.PUBLIC_APP_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const csrfOrigins = process.env.CSRF_ALLOWED_ORIGINS?.split(",") ?? [];
  for (const raw of csrfOrigins) {
    const candidate = raw.trim();
    if (!candidate) continue;
    try {
      const { origin, hostname } = new URL(candidate);
      if (!isBadPublicHostname(hostname)) return origin;
    } catch {
      /* ignora origem inválida */
    }
  }

  return null;
}
