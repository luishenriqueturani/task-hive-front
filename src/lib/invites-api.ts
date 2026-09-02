export interface InvitePreview {
  email: string;
  projectName?: string;
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
