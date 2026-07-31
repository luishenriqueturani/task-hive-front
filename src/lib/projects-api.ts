import { readApiErrorMessage } from "@/lib/api-error";
import type {
  ProjectParticipant,
  ProjectSummary,
  UserPublic,
} from "@/lib/api-types";

/** Chave de cache da listagem de projetos (compartilhada com o dashboard). */
export const PROJECTS_QUERY_KEY = ["/projects"] as const;

export function participantsQueryKey(projectId: string) {
  return ["/projects", projectId, "participants"] as const;
}

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

export async function fetchParticipants(
  projectId: string,
): Promise<ProjectParticipant[]> {
  const res = await fetch(`/api/bff/projects/${projectId}/participants`, {
    credentials: "include",
  });
  return parseOrThrow(res, "Não foi possível carregar os participantes.");
}

export async function addParticipant(
  projectId: string,
  userId: string,
): Promise<ProjectParticipant[]> {
  const res = await fetch(`/api/bff/projects/${projectId}/participants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  return parseOrThrow(res, "Não foi possível adicionar o participante.");
}

export async function removeParticipant(
  projectId: string,
  userId: string,
): Promise<ProjectParticipant[]> {
  const res = await fetch(
    `/api/bff/projects/${projectId}/participants/${userId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  return parseOrThrow(res, "Não foi possível remover o participante.");
}

/** Lista utilizadores para o seletor de participantes (`GET /users`). */
export async function fetchUsers(): Promise<UserPublic[]> {
  const res = await fetch("/api/bff/users", { credentials: "include" });
  return parseOrThrow(res, "Não foi possível carregar os utilizadores.");
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
