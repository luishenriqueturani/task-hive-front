import { cookies } from "next/headers";

/**
 * Sessão do Task Hive: o JWT emitido pelo backend fica num cookie httpOnly
 * definido apenas por Route Handlers (BFF). O navegador nunca lê o token.
 */

export const SESSION_COOKIE = "th_session";

/** Alinhado ao expiresIn padrão do JWT no backend (90 dias). */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

/** Em HTTP doméstico o Compose define SESSION_COOKIE_SECURE=false. */
export function sessionCookieSecure(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE?.trim().toLowerCase();
  if (explicit === "true" || explicit === "1") return true;
  if (explicit === "false" || explicit === "0") return false;
  return process.env.NODE_ENV === "production";
}

export const sessionCookieOptions = {
  httpOnly: true,
  get secure() {
    return sessionCookieSecure();
  },
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
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
