import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookies } from "@/lib/session";
import { safeNextPath } from "@/lib/safe-next-path";

export const dynamic = "force-dynamic";

/** Limpa cookies de sessão inválidos (Route Handler — único sítio permitido no Next.js). */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const loginUrl = new URL("/login", request.url);
  if (next) {
    loginUrl.searchParams.set("next", safeNextPath(next, "/dashboard"));
  }

  const response = NextResponse.redirect(loginUrl);
  clearSessionCookies(response);
  return response;
}
