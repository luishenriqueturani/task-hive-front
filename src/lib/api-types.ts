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

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  userOwner: UserRef | null;
  participants: UserRef[];
  createdAt: string;
  updatedAt: string | null;
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
