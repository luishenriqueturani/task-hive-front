import { cookies } from "next/headers";
import { backendBase } from "@/lib/backend";
import {
  normalizeSessionUser,
  type SessionUser,
} from "@/lib/session-user";

export type {
  SessionCompany,
  SessionPlan,
  SessionPlanLimits,
  SessionPlanUsage,
  SessionUser,
} from "@/lib/session-user";

/**
 * Sessão do Task Hive: access JWT + refresh opaco em cookies httpOnly
 * definidos apenas por Route Handlers (BFF).
 */

export const SESSION_COOKIE = "th_session";
export const REFRESH_COOKIE = "th_refresh";

const ACCESS_MAX_AGE_SECONDS = Number(
  process.env.SESSION_ACCESS_MAX_AGE_SECONDS ?? 60 * 60,
);

const REFRESH_MAX_AGE_SECONDS = Number(
  process.env.SESSION_REFRESH_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 30,
);

/** Em HTTP doméstico o Compose define SESSION_COOKIE_SECURE=false. */
export function sessionCookieSecure(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  return process.env.NODE_ENV === "production";
}

const baseCookie = {
  httpOnly: true,
  get secure() {
    return sessionCookieSecure();
  },
  sameSite: "lax" as const,
  path: "/",
};

export const sessionCookieOptions = {
  ...baseCookie,
  maxAge: ACCESS_MAX_AGE_SECONDS,
};

export const refreshCookieOptions = {
  ...baseCookie,
  maxAge: REFRESH_MAX_AGE_SECONDS,
};

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * Decodifica o payload do JWT sem verificar assinatura (apenas formato/exp).
 * Não usar sozinho para autorização — preferir `getSessionUser()`.
 */
export function decodeSessionUser(token: string): SessionUser | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as {
      id?: string;
      name?: string | null;
      email?: string;
      role?: string | null;
      accountKind?: unknown;
      company?: unknown;
      ownedCompany?: unknown;
      plan?: unknown;
      exp?: number;
    };

    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    if (!payload.id || !payload.email) return null;

    return normalizeSessionUser({
      id: payload.id,
      name: payload.name ?? null,
      email: payload.email,
      role: payload.role ?? null,
      accountKind: payload.accountKind,
      company: payload.company,
      ownedCompany: payload.ownedCompany,
      plan: payload.plan,
    });
  } catch {
    return null;
  }
}

/** Confirma JWT junto ao backend (AuthGuard valida assinatura e sessão). */
async function fetchValidatedSessionUser(
  token: string,
  userId: string,
): Promise<SessionUser | null> {
  const base = backendBase();
  if (!base) return null;

  try {
    const res = await fetch(`${base}/users/${encodeURIComponent(userId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      id?: string;
      name?: string | null;
      email?: string;
      role?: string | null;
      accountKind?: unknown;
      company?: unknown;
      ownedCompany?: unknown;
      plan?: unknown;
    };
    if (!data.id || !data.email) return null;

    return normalizeSessionUser({
      id: data.id,
      name: data.name ?? null,
      email: data.email,
      role: data.role ?? null,
      accountKind: data.accountKind,
      company: data.company,
      ownedCompany: data.ownedCompany,
      plan: data.plan,
    });
  } catch {
    return null;
  }
}

/** Utilizador da sessão validado pelo backend (não confia só no decode local). */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  const decoded = decodeSessionUser(token);
  if (!decoded) return null;

  return fetchValidatedSessionUser(token, decoded.id);
}

export function clearSessionCookies(response: {
  cookies: {
    set: (name: string, value: string, options: { maxAge: number; path: string }) => void;
  };
}) {
  response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions, maxAge: 0 });
  response.cookies.set(REFRESH_COOKIE, "", { ...refreshCookieOptions, maxAge: 0 });
}

export function setSessionCookies(
  response: {
    cookies: { set: (name: string, value: string, options: typeof sessionCookieOptions) => void };
  },
  tokens: { token: string; refreshToken: string },
) {
  response.cookies.set(SESSION_COOKIE, tokens.token, sessionCookieOptions);
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
}
