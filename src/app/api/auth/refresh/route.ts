import { NextRequest, NextResponse } from "next/server";
import type { UserPublicResponseDto } from "@/api/model";
import { backendBase } from "@/lib/backend";
import { clearSessionCookies, getRefreshToken, setSessionCookies } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Renova access + refresh usando o cookie httpOnly `th_refresh`. */
export async function POST(_request: NextRequest) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { message: "BACKEND_API_BASE_URL não está configurada." },
      { status: 503 },
    );
  }

  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  }

  const upstream = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const response = NextResponse.json(
      { message: "Não foi possível renovar a sessão." },
      { status: upstream.status },
    );
    clearSessionCookies(response);
    return response;
  }

  const session = (await upstream.json()) as {
    token?: string;
    refreshToken?: string;
    user?: UserPublicResponseDto;
  };

  if (!session.token || !session.refreshToken || !session.user) {
    return NextResponse.json(
      { message: "Resposta inesperada do servidor." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: session.user });
  setSessionCookies(response, {
    token: session.token,
    refreshToken: session.refreshToken,
  });
  return response;
}
