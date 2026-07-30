import { readApiErrorMessage } from "@/lib/api-error";
import type { ProjectSummary } from "@/lib/api-types";

/** Chave de cache da listagem de projetos (compartilhada com o dashboard). */
export const PROJECTS_QUERY_KEY = ["/projects"] as const;

export interface ProjectInput {
  name: string;
  description?: string;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return res.json() as Promise<T>;
}

export async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/bff/projects", { credentials: "include" });
  return parseOrThrow(res, "Não foi possível carregar os projetos.");
}

export async function createProject(
  data: ProjectInput,
): Promise<ProjectSummary> {
  const res = await fetch("/api/bff/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível criar o projeto.");
}

export async function updateProject(
  id: string,
  data: ProjectInput,
): Promise<ProjectSummary> {
  const res = await fetch(`/api/bff/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível atualizar o projeto.");
}

export async function deleteProject(id: string): Promise<void> {
  const res = await fetch(`/api/bff/projects/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível excluir o projeto."),
    );
  }
}

/** Dono ou admin podem gerir o projeto (alinhado ao canManageProject do backend). */
export function canManageProject(
  project: ProjectSummary,
  user: { id: string; role: string | null } | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN_GOD" || user.role === "ADMIN_COLLABORATOR") {
    return true;
  }
  return project.userOwner?.id === user.id;
}
