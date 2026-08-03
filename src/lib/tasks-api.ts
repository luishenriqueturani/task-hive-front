import { readApiErrorMessage } from "@/lib/api-error";
import type { TaskCompletionSummary, TaskSummary } from "@/lib/api-types";

export function tasksByStageQueryKey(stageId: string) {
  return ["/tasks/stage", stageId] as const;
}

export function taskCompletionsQueryKey(taskId: string) {
  return ["/tasks", taskId, "completions"] as const;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return res.json() as Promise<T>;
}

export async function fetchTasksByStage(
  stageId: string,
): Promise<TaskSummary[]> {
  const res = await fetch(`/api/bff/tasks/stage/${stageId}`, {
    credentials: "include",
  });
  return parseOrThrow(res, "Não foi possível carregar as tarefas.");
}

export async function createTask(data: {
  name: string;
  stageId: string;
}): Promise<TaskSummary> {
  const res = await fetch("/api/bff/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível criar a tarefa.");
}

export async function updateTask(
  id: string,
  data: {
    name?: string;
    description?: string;
    finishDate?: string;
    stageId?: string;
    order?: number;
    /** Apenas `null` para limpar o estado de concluída. */
    completedAt?: null;
  },
): Promise<TaskSummary> {
  const res = await fetch(`/api/bff/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível atualizar a tarefa.");
}

/**
 * Cria a tarefa e, se houver descrição/data, completa com PATCH
 * (o POST só aceita name + stageId).
 */
export async function createTaskWithDetails(data: {
  name: string;
  stageId: string;
  description?: string;
  finishDate?: string;
}): Promise<TaskSummary> {
  const created = await createTask({
    name: data.name,
    stageId: data.stageId,
  });
  if (!data.description && !data.finishDate) return created;
  return updateTask(created.id, {
    description: data.description,
    finishDate: data.finishDate,
  });
}

export async function deleteTask(id: string): Promise<void> {
  const res = await fetch(`/api/bff/tasks/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível excluir a tarefa."),
    );
  }
}

/** Move para outra coluna (`PATCH` com stageId — dono da tarefa ou admin). */
export async function moveTaskToStage(
  taskId: string,
  stageId: string,
  order?: number,
): Promise<TaskSummary> {
  return updateTask(taskId, {
    stageId,
    ...(order !== undefined ? { order } : {}),
  });
}

/** Conclui a tarefa (histórico + completedAt). */
export async function completeTask(taskId: string): Promise<TaskSummary> {
  const res = await fetch(`/api/bff/tasks/${taskId}/completions`, {
    method: "POST",
    credentials: "include",
  });
  return parseOrThrow(res, "Não foi possível concluir a tarefa.");
}

/** Limpa o estado actual de concluída (histórico permanece). */
export async function clearTaskCompleted(
  taskId: string,
): Promise<TaskSummary> {
  return updateTask(taskId, { completedAt: null });
}

export async function fetchTaskCompletions(
  taskId: string,
): Promise<TaskCompletionSummary[]> {
  const res = await fetch(`/api/bff/tasks/${taskId}/completions`, {
    credentials: "include",
  });
  return parseOrThrow(res, "Não foi possível carregar o histórico.");
}

/** Alinhado a `canMoveOrRemoveTask` do backend. */
export function canMoveOrRemoveTask(
  task: TaskSummary,
  user: { id: string; role: string | null } | undefined,
): boolean {
  if (!user) return false;
  if (user.role === "ADMIN_GOD" || user.role === "ADMIN_COLLABORATOR") {
    return true;
  }
  return task.user?.id === user.id;
}
