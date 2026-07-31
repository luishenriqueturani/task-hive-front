/**
 * Tipos das respostas do backend usados pelo frontend. O OpenAPI documenta
 * estas respostas apenas como exemplos (sem schema), então o Orval gera
 * `data: unknown` — tipamos aqui o que a UI consome.
 */

export interface UserRef {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
}

/** Participante devolvido por GET/POST/DELETE .../participants (sem password). */
export interface ProjectParticipant {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
  role?: string | null;
}

/** Utilizador público (GET /users) para busca ao adicionar participante. */
export interface UserPublic {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  userOwner: UserRef | null;
  participants: UserRef[];
  createdAt: string;
  updatedAt: string | null;
}

/** Coluna (stage) do quadro — listagem por projeto ordenada por `order`. */
export interface ProjectStage {
  id: string;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

/** Subtarefa (`GET /subtasks/task/:taskId`). */
export interface SubtaskSummary {
  id: string;
  name: string;
  description?: string | null;
  isCompleted: boolean;
  responsible?: { id: string; name?: string | null; email?: string } | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

/** Registo de timetrack (`GET /tasks/:taskId/timetrack`). */
export interface TimetrackEntry {
  id: string;
  start: string;
  end: string | null;
  userId: string;
  userName: string;
}

/** Tarefa do kanban (`GET /tasks/stage/:id`, create/update). */
export interface TaskSummary {
  id: string;
  name: string;
  description?: string | null;
  finishDate?: string | null;
  stage?: { id: string; name: string; order?: number } | null;
  user?: { id: string; name?: string | null; email?: string } | null;
  createdAt?: string;
  updatedAt?: string | null;
  deletedAt?: string | null;
}

export type ToDoStatus = "TODO" | "DONE" | "CANCELLED" | "PAUSED" | "CREATED";
export type ToDoType = "PUNCTUAL" | "RECURRING";

export interface ToDoSummary {
  id: string;
  title: string;
  description: string | null;
  status: ToDoStatus;
  type: ToDoType;
  recurringType: "DAILY" | "WEEKLY" | "MONTHLY" | null;
  recurringNextDate: string | null;
  recurringDeadline: string | null;
  createdAt: string;
}
