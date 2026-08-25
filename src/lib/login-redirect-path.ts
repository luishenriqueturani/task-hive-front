import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  isBadPublicHostname,
  publicOriginFromRequest,
  resolvePublicOrigin,
} from "@/lib/request-public-origin";

/**
 * Path relativo para `/login` (com `?next=` opcional).
 */
export function loginRedirectPath(next?: string | null): string {
  if (!next) return "/login";

  const params = new URLSearchParams({
    next: safeNextPath(next, "/dashboard"),
  });
  return `/login?${params.toString()}`;
}

/**
 * URL absoluta para redirect server-side (`NextResponse.redirect` exige URL absoluta).
 */
export function loginRedirectTarget(
  origin: string | null,
  next?: string | null,
): string {
  const path = loginRedirectPath(next);
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}

/** Resolve origem segura a partir do pedido (proxy / route handlers). */
export function loginRedirectUrl(
  request: NextRequest,
  next?: string | null,
): URL {
  const path = loginRedirectPath(next);
  const origin =
    resolvePublicOrigin(publicOriginFromRequest(request)) ??
    safeRequestOrigin(request);

  if (origin) return new URL(path, origin);

  const url = request.nextUrl.clone();
  const parsed = new URL(path, "http://placeholder.local");
  url.pathname = parsed.pathname;
  url.search = parsed.search;
  return url;
}

function safeRequestOrigin(request: NextRequest): string | null {
  try {
    const { hostname, origin } = new URL(request.url);
    if (isBadPublicHostname(hostname)) return null;
    return origin;
  } catch {
    return null;
  }
}
