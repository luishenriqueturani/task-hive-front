import { NextRequest, NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";

export const dynamic = "force-dynamic";

/**
 * URL pública do Socket.IO para o browser.
 * Preferência: PUBLIC_WS_URL → Host/X-Forwarded-* → BACKEND_API_BASE_URL (dev).
 */
function publicWsUrl(request: NextRequest): string | null {
  const explicit = process.env.PUBLIC_WS_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  const host =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    request.headers.get("host")?.trim();
  if (host) {
    const proto =
      request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
      "http";
    return `${proto}://${host}`;
  }

  return backendBase();
}

/**
 * Configuração segura para o cliente: URL do WebSocket (Socket.IO no Nest),
 * sem expor o token. Em Docker, o BFF usa api:3001 internamente; o browser
 * liga ao mesmo host da UI (Nginx faz proxy de /socket.io).
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({ wsUrl: publicWsUrl(request) });
}
