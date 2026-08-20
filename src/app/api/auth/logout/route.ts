import { NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";
import { clearSessionCookies, getSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * Logout BFF: invalida a sessão no backend e limpa cookies httpOnly.
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
  clearSessionCookies(response);
  return response;
}
