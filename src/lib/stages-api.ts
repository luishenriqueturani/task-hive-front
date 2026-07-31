import { readApiErrorMessage } from "@/lib/api-error";
import type { ProjectStage } from "@/lib/api-types";

export function stagesQueryKey(projectId: string) {
  return ["/project-stages/project", projectId] as const;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return res.json() as Promise<T>;
}

export async function fetchStages(projectId: string): Promise<ProjectStage[]> {
  const res = await fetch(`/api/bff/project-stages/project/${projectId}`, {
    credentials: "include",
  });
  const data = await parseOrThrow<ProjectStage[]>(
    res,
    "Não foi possível carregar as colunas.",
  );
  return [...data].sort((a, b) => a.order - b.order);
}

export async function createStage(data: {
  name: string;
  projectId: string;
  order: number;
}): Promise<ProjectStage> {
  const res = await fetch("/api/bff/project-stages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível criar a coluna.");
}

export async function updateStage(
  id: string,
  data: { name?: string; order?: number },
): Promise<ProjectStage> {
  const res = await fetch(`/api/bff/project-stages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível atualizar a coluna.");
}

export async function deleteStage(id: string): Promise<void> {
  const res = await fetch(`/api/bff/project-stages/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível excluir a coluna."),
    );
  }
}

/** Troca a ordem de duas colunas adjacentes (dois PATCH sequenciais). */
export async function swapStageOrder(
  a: ProjectStage,
  b: ProjectStage,
): Promise<void> {
  await updateStage(a.id, { order: b.order });
  await updateStage(b.id, { order: a.order });
}
