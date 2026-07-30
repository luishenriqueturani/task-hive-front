import { NextRequest, NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import type { UserPublicResponseDto } from "@/api/model";

export const dynamic = "force-dynamic";

/**
 * Redefinição de senha via BFF: o backend devolve nova sessão (token + user),
 * igual ao login — o token vai para o cookie httpOnly e só o user à resposta.
 */
export async function POST(request: NextRequest) {
  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { message: "BACKEND_API_BASE_URL não está configurada." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  const upstream = await fetch(`${base}/auth/reset-password`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return new NextResponse(text || null, {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ?? "application/json",
      },
    });
  }

  const session = (await upstream.json()) as {
    token?: string;
    user?: UserPublicResponseDto;
  };

  if (!session.token || !session.user) {
    return NextResponse.json(
      { message: "Resposta inesperada do servidor." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: session.user });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions);
  return response;
}
