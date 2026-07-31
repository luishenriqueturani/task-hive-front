import { NextResponse } from "next/server";
import { backendBase } from "@/lib/backend";

export const dynamic = "force-dynamic";

/**
 * Configuração segura para o cliente: a URL do WebSocket é a mesma base do
 * backend (Socket.IO no processo Nest), sem expor o token.
 */
export async function GET() {
  return NextResponse.json({ wsUrl: backendBase() });
}
