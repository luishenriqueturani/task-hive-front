import { NextRequest, NextResponse } from "next/server";
import { withAuthRedirectHeaders } from "@/lib/auth-redirect-response";
import { logAuthNavigation } from "@/lib/auth-navigation-log";
import { loginRedirectUrl } from "@/lib/login-redirect-path";
import { clearSessionCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Limpa cookies de sessão inválidos (Route Handler — único sítio permitido no Next.js). */
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next");
  const from = request.url;
  const target = loginRedirectUrl(request, next, { cleared: "1" });

  logAuthNavigation({
    context: "clear-session",
    from,
    to: target.toString(),
    method: request.method,
    extra: { next },
  });

  const response = withAuthRedirectHeaders(NextResponse.redirect(target));
  clearSessionCookies(response);
  return response;
}
