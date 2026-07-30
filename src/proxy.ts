import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

/**
 * Guard de rotas (convenção `proxy` do Next.js 16, ex-middleware):
 * - autenticado em /login → redireciona à raiz;
 * - sem sessão em rota privada → redireciona a /login com `next=`.
 * Apenas presença do cookie é verificada aqui; a validade do token é
 * garantida pelo backend em cada chamada via BFF.
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

  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/projects/:path*",
    "/to-do/:path*",
    "/companies/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
  ],
};
