import { NextRequest, NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";
import { SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";
import type { UserPublicResponseDto } from "@/api/model";

export const dynamic = "force-dynamic";

/**
 * Login BFF: autentica no backend e guarda o JWT em cookie httpOnly.
 * O token nunca chega ao JavaScript do navegador — a resposta traz só o user.
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

  const upstream = await fetch(`${base}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!upstream.ok) {
    // Repassa o erro do backend (ex.: credenciais inválidas) com o mesmo status.
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
      { message: "Resposta de login inesperada do servidor." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: session.user });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions);
  return response;
}
