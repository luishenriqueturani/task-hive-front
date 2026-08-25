import { NextRequest, NextResponse } from "next/server";
import { loginRedirectUrl } from "@/lib/login-redirect-path";
import { clearSessionCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Limpa cookies de sessão inválidos (Route Handler — único sítio permitido no Next.js). */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const response = NextResponse.redirect(loginRedirectUrl(request, next));
  clearSessionCookies(response);
  return response;
}
