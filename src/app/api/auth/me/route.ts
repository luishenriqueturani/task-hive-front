import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Retorna o utilizador da sessão actual (payload do JWT) ou 401. */
export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Não autenticado." }, { status: 401 });
  }

  return NextResponse.json({ user });
}
