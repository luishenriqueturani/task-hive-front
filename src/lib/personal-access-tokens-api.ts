import { readApiErrorMessage } from "@/lib/api-error";

export interface PersonalAccessTokenSummary {
  id: string;
  name: string;
  tokenPrefix: string;
  expiresAt: string;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface PersonalAccessTokenCreated extends PersonalAccessTokenSummary {
  token: string;
}

export async function fetchPersonalAccessTokens(): Promise<PersonalAccessTokenSummary[]> {
  const res = await fetch("/api/bff/personal-access-tokens", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Não foi possível carregar os tokens.");
  return (await res.json()) as PersonalAccessTokenSummary[];
}

export async function createPersonalAccessToken(data: {
  name: string;
  expiresInDays?: number;
}): Promise<PersonalAccessTokenCreated> {
  const res = await fetch("/api/bff/personal-access-tokens", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível criar o token."),
    );
  }
  return (await res.json()) as PersonalAccessTokenCreated;
}

export async function revokePersonalAccessToken(id: string): Promise<void> {
  const res = await fetch(`/api/bff/personal-access-tokens/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Não foi possível revogar o token.");
}

export const PAT_QUERY_KEY = ["personal-access-tokens"] as const;
