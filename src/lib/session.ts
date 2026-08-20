import { cookies } from "next/headers";

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

export interface SessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string | null;
}

export async function getSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE)?.value ?? null;
}

/**
 * Decodifica o payload do JWT sem verificar assinatura: o cookie é httpOnly e
 * só é gravado pelo BFF a partir da resposta do backend, que continua a
 * validar o token em toda chamada autenticada.
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
      exp?: number;
    };

    if (payload.exp && payload.exp * 1000 <= Date.now()) return null;
    if (!payload.id || !payload.email) return null;

    return {
      id: payload.id,
      name: payload.name ?? null,
      email: payload.email,
      role: payload.role ?? null,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  return decodeSessionUser(token);
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
