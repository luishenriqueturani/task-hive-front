import { readApiErrorMessage } from "@/lib/api-error";
import type { ToDoStatus, ToDoSummary, ToDoType } from "@/lib/api-types";

export const TODOS_QUERY_KEY = ["/to-do"] as const;

export type RecurringType = "DAILY" | "WEEKLY" | "MONTHLY";

export interface ToDoInput {
  title: string;
  description: string;
  isRecurring?: boolean;
  recurringType?: RecurringType;
  recurringTimes?: number;
  recurringDeadline?: string;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function fetchTodos(): Promise<ToDoSummary[]> {
  const res = await fetch("/api/bff/to-do", { credentials: "include" });
  return parseOrThrow(res, "Não foi possível carregar as tarefas.");
}

export async function createTodo(data: ToDoInput): Promise<ToDoSummary> {
  const res = await fetch("/api/bff/to-do", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  return parseOrThrow(res, "Não foi possível criar a tarefa.");
}

export async function updateTodo(
  id: string,
  data: ToDoInput,
): Promise<void> {
  const res = await fetch(`/api/bff/to-do/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível atualizar a tarefa."),
    );
  }
}

/** Soft delete — o backend usa PATCH /to-do/:id (não DELETE). */
export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/bff/to-do/${id}`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível excluir a tarefa."),
    );
  }
}

export async function endTodo(id: string): Promise<void> {
  const res = await fetch(`/api/bff/to-do/end/${id}`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível concluir a tarefa."),
    );
  }
}

export async function changeTodoStatus(
  id: string,
  status: ToDoStatus,
): Promise<void> {
  const res = await fetch(`/api/bff/to-do/status/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível alterar o status."),
    );
  }
}

export async function advanceRecurringTodo(id: string): Promise<void> {
  const res = await fetch(`/api/bff/to-do/nextDateRecurring/${id}`, {
    method: "PATCH",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(
        res,
        "Não foi possível avançar a recorrência.",
      ),
    );
  }
}

export const TODO_STATUS_LABELS: Record<ToDoStatus, string> = {
  CREATED: "Criada",
  TODO: "A fazer",
  DONE: "Concluída",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

export const TODO_TYPE_LABELS: Record<ToDoType, string> = {
  PUNCTUAL: "Pontual",
  RECURRING: "Recorrente",
};

export const RECURRING_TYPE_LABELS: Record<RecurringType, string> = {
  DAILY: "Diária",
  WEEKLY: "Semanal",
  MONTHLY: "Mensal",
};

export function isTodoOpen(todo: ToDoSummary): boolean {
  return todo.status !== "DONE" && todo.status !== "CANCELLED";
}
