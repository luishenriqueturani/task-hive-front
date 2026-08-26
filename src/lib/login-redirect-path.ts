import type { NextRequest } from "next/server";
import { logAuthNavigation } from "@/lib/auth-navigation-log";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  isBadPublicHostname,
  publicOriginFromRequest,
  readPublicOriginFromHeaders,
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
 * URL absoluta ou relativa para redirect server-side.
 * Preferir sempre absoluta atrás do proxy (evita `0.0.0.0:3000`).
 */
export function loginRedirectTarget(
  origin: string | null,
  next?: string | null,
): string {
  const path = loginRedirectPath(next);
  if (!origin) return path;
  return `${origin.replace(/\/$/, "")}${path}`;
}

type OriginResolution = { origin: string | null; source: string };

function resolveLoginRedirectOrigin(request?: NextRequest): OriginResolution {
  if (request) {
    const fromForwarded = publicOriginFromRequest(request);
    const fromHeaders = resolvePublicOrigin(fromForwarded);
    if (fromHeaders) {
      return { origin: fromHeaders, source: "request-headers" };
    }

    const safe = safeRequestOrigin(request);
    if (safe) {
      return { origin: safe, source: "request-url" };
    }

    const { hostname, host, protocol } = request.nextUrl;
    if (!isBadPublicHostname(hostname)) {
      return {
        origin: `${protocol}//${host}`,
        source: "next-url",
      };
    }
  }

  const fromEnv = resolvePublicOrigin(null);
  if (fromEnv) {
    return { origin: fromEnv, source: "env" };
  }

  return { origin: null, source: "none" };
}

/** Resolve origem segura a partir de cabeçalhos RSC (`headers()`). */
export async function resolveLoginRedirectOriginFromServer(): Promise<OriginResolution> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const fromHeaders = resolvePublicOrigin(
    readPublicOriginFromHeaders((name) => h.get(name)),
  );
  if (fromHeaders) {
    return { origin: fromHeaders, source: "server-headers" };
  }

  const fromEnv = resolvePublicOrigin(null);
  if (fromEnv) {
    return { origin: fromEnv, source: "env" };
  }

  return { origin: null, source: "none" };
}

/** URL absoluta para redirect server-side (`NextResponse.redirect` exige URL absoluta). */
export function loginRedirectUrl(
  request: NextRequest,
  next?: string | null,
  extraSearchParams?: Record<string, string>,
): URL {
  const path = loginRedirectPath(next);
  const { origin, source } = resolveLoginRedirectOrigin(request);

  let url: URL;
  if (origin) {
    url = new URL(path, origin);
  } else {
    // NextResponse.redirect exige URL absoluta; sem origem pública cairia em 0.0.0.0:3000.
    url = new URL(path, "http://127.0.0.1:8080");
  }

  if (extraSearchParams) {
    for (const [key, value] of Object.entries(extraSearchParams)) {
      url.searchParams.set(key, value);
    }
  }

  logAuthNavigation({
    context: "login-redirect-url",
    from: request.url,
    to: url.toString(),
    method: request.method,
    originSource: source,
    extra: {
      next: next ?? null,
      ...(origin
        ? {}
        : {
            warning: "no-public-origin-used-localhost-fallback",
            host: request.headers.get("host"),
            forwardedHost: request.headers.get("x-forwarded-host"),
          }),
    },
  });

  return url;
}

/** Target absoluto para `redirect()` em Server Components. */
export async function loginRedirectTargetFromServer(
  next?: string | null,
): Promise<{ target: string; source: string; from: string }> {
  const { origin, source } = await resolveLoginRedirectOriginFromServer();
  const absoluteOrigin =
    origin ?? resolvePublicOrigin(null) ?? "http://127.0.0.1:8080";
  const target = loginRedirectTarget(absoluteOrigin, next);

  const { headers } = await import("next/headers");
  const headerStore = await headers();
  const from =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "server-component";

  return {
    target,
    source: origin ? source : source === "none" ? "localhost-fallback" : source,
    from,
  };
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
