import { readApiErrorMessage } from "@/lib/api-error";
import type { SubtaskSummary } from "@/lib/api-types";

export function subtasksQueryKey(taskId: string) {
  return ["/subtasks/task", taskId] as const;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return res.json() as Promise<T>;
}

export async function fetchSubtasks(taskId: string): Promise<SubtaskSummary[]> {
  const res = await fetch(`/api/bff/subtasks/task/${taskId}`, {
    credentials: "include",
  });
  return parseOrThrow(res, "Não foi possível carregar as subtarefas.");
}

export async function createSubtask(data: {
  name: string;
  taskId: string;
}): Promise<SubtaskSummary> {
  const res = await fetch("/api/bff/subtasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível criar a subtarefa.");
}

export async function updateSubtask(
  id: string,
  data: { name?: string; description?: string; isCompleted?: boolean },
): Promise<void> {
  const res = await fetch(`/api/bff/subtasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível atualizar a subtarefa."),
    );
  }
}

export async function deleteSubtask(id: string): Promise<void> {
  const res = await fetch(`/api/bff/subtasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível excluir a subtarefa."),
    );
  }
}

/** Só o responsável (criador) pode editar/concluir/remover — alinhado ao backend. */
export function canManageSubtask(
  subtask: SubtaskSummary,
  user: { id: string } | undefined,
): boolean {
  if (!user) return false;
  return subtask.responsible?.id === user.id;
}
