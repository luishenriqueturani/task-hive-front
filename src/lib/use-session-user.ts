"use client";

import { useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@/lib/session";

async function fetchSessionUser(): Promise<SessionUser> {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) throw new Error("Não autenticado");
  const body = (await res.json()) as { user: SessionUser };
  return body.user;
}

/** Usuário da sessão atual no cliente (via BFF `/api/auth/me`). */
export function useSessionUser() {
  return useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: fetchSessionUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
