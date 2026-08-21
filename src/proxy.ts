import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { safeNextPath } from "@/lib/safe-next-path";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Guard de rotas (convenção `proxy` do Next.js 16, ex-middleware):
 * - sem sessão (cookie) em rota privada → redireciona a /login com `next=`.
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
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", safeNextPath(pathname, pathname));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/projects/:path*",
    "/to-do/:path*",
    "/companies/:path*",
    "/settings/:path*",
    "/dashboard",
    "/dashboard/:path*",
  ],
};
