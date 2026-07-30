import { NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";
import { getSessionToken, SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Logout BFF: invalida a sessão no backend e limpa o cookie httpOnly.
 * O cookie é sempre removido, mesmo se o backend falhar (sessão já expirada).
 */
export async function POST() {
  const token = await getSessionToken();
  const base = backendBase();

  if (token && base) {
    try {
      await fetch(`${base}/auth/logout`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
        cache: "no-store",
      });
    } catch {
      // Falha upstream não impede o encerramento local da sessão.
    }
  }

  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
