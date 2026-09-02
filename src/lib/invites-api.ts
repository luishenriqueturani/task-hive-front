import { readApiErrorMessage } from "@/lib/api-error";

export interface InvitePreview {
  email: string;
  projectName?: string;
}

export interface InviteAcceptResult {
  projectId: string;
  projectName?: string;
}

export function invitePagePath(token: string) {
  return `/invite/${encodeURIComponent(token)}`;
}

/** Links de login/cadastro com `next=` (e `invite=` no cadastro). */
export function inviteAuthHrefs(token: string) {
  const next = invitePagePath(token);
  return {
    login: `/login?${new URLSearchParams({ next }).toString()}`,
    register: `/register?${new URLSearchParams({
      invite: token,
      next,
    }).toString()}`,
  };
}

/** Cadastro a partir de `/login?next=` — preserva convite se o next for `/invite/:token`. */
export function registerHrefFromNext(nextPath?: string | null) {
  if (!nextPath) return "/register";
  const pathname = nextPath.trim().split("?")[0] ?? "";
  const inviteMatch = /^\/invite\/([^/]+)$/.exec(pathname);
  if (inviteMatch) {
    return inviteAuthHrefs(decodeURIComponent(inviteMatch[1])).register;
  }
  return `/register?${new URLSearchParams({ next: nextPath }).toString()}`;
}

/**
 * Metadados públicos de um convite (e-mail a pré-preencher no cadastro).
 */
export async function fetchInvitePreview(
  token: string,
): Promise<InvitePreview> {
  const res = await fetch(`/api/bff/invites/${encodeURIComponent(token)}`, {
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error("Convite inválido ou expirado.");
  }
  const data = (await res.json()) as {
    email?: unknown;
    projectName?: unknown;
  };
  if (typeof data.email !== "string" || !data.email.includes("@")) {
    throw new Error("Convite inválido ou expirado.");
  }
  return {
    email: data.email.trim(),
    projectName:
      typeof data.projectName === "string" ? data.projectName : undefined,
  };
}

export async function acceptInvite(
  token: string,
): Promise<InviteAcceptResult> {
  const res = await fetch(
    `/api/bff/invites/${encodeURIComponent(token)}/accept`,
    { method: "POST", credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível aceitar o convite."),
    );
  }
  const data = (await res.json()) as {
    projectId?: unknown;
    projectName?: unknown;
  };
  if (typeof data.projectId !== "string" || !data.projectId) {
    throw new Error("Não foi possível aceitar o convite.");
  }
  return {
    projectId: data.projectId,
    projectName:
      typeof data.projectName === "string" ? data.projectName : undefined,
  };
}
