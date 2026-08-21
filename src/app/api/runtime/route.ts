import { NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";

export const dynamic = "force-dynamic";

/**
 * URL pública do Socket.IO para o browser.
 * Em produção exige PUBLIC_WS_URL fixo (evita Host/X-Forwarded-* controlável).
 */
function publicWsUrl(): string | null {
  const explicit = process.env.PUBLIC_WS_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  if (process.env.NODE_ENV !== "production") {
    return backendBase();
  }

  return null;
}

/**
 * Configuração segura para o cliente: URL do WebSocket (Socket.IO no Nest),
 * sem expor o token. O browser liga ao host público (Nginx faz proxy de /socket.io).
 */
export async function GET() {
  const wsUrl = publicWsUrl();
  if (!wsUrl) {
    return NextResponse.json(
      { message: "PUBLIC_WS_URL não configurado." },
      { status: 503 },
    );
  }

  return NextResponse.json({ wsUrl });
}
