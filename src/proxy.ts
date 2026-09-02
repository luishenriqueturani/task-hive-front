import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  canUseStandaloneTodos,
  isStandaloneTodosAppPath,
} from "@/lib/account-kind";
import { withAuthRedirectHeaders } from "@/lib/auth-redirect-response";
import { logAuthNavigation } from "@/lib/auth-navigation-log";
import { loginRedirectUrl } from "@/lib/login-redirect-path";
import { safeNextPath } from "@/lib/safe-next-path";
import { decodeSessionUser, SESSION_COOKIE } from "@/lib/session";

/**
 * Guard de rotas (convenção `proxy` do Next.js 16, ex-middleware):
 * - sem sessão (cookie) em rota privada → redireciona a /login com `next=`.
 * - `/invite` está no matcher mas é público (não entra em PROTECTED_PREFIXES).
 *
 * Não redireciona /login → /dashboard só pelo cookie: cookies inválidos
 * (JWT expirado, sessão revogada) causavam loop com `(app)/layout.tsx`.
 * Quem já está autenticado é redireccionado em `login/page.tsx` via backend.
 */

const PROTECTED_PREFIXES = [
  "/projects",
  "/to-do",
  "/companies",
  "/settings",
  "/dashboard",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has(SESSION_COOKIE);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const target = loginRedirectUrl(
      request,
      safeNextPath(pathname, pathname),
    );

    logAuthNavigation({
      context: "proxy",
      from: request.url,
      to: target.toString(),
      method: request.method,
      extra: { pathname, hasSession },
    });

    return withAuthRedirectHeaders(NextResponse.redirect(target));
  }

  if (hasSession && isStandaloneTodosAppPath(pathname)) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = token ? decodeSessionUser(token) : null;
    if (session && !canUseStandaloneTodos(session.accountKind)) {
      const dashboard = request.nextUrl.clone();
      dashboard.pathname = "/dashboard";
      dashboard.search = "";

      logAuthNavigation({
        context: "proxy",
        from: request.url,
        to: dashboard.toString(),
        method: request.method,
        extra: { pathname, reason: "company-no-todo" },
      });

      return withAuthRedirectHeaders(NextResponse.redirect(dashboard));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/invite",
    "/invite/:path*",
    "/projects/:path*",
    "/to-do",
    "/to-do/:path*",
    "/companies/:path*",
    "/settings/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
