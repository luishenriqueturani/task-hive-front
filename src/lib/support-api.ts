import { readApiErrorMessage } from "@/lib/api-error";

export type SupportTicketStatus =
  | "OPEN"
  | "PENDING_USER"
  | "PENDING_ADMIN"
  | "CLOSED";

export type SupportPublicUser = {
  id: string;
  name: string | null;
  email: string;
};

export type SupportTicket = {
  id: string;
  subject: string;
  status: SupportTicketStatus;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: SupportPublicUser | null;
  assignedTo: SupportPublicUser | null;
};

export type SupportMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: SupportPublicUser | null;
};

export type SupportTicketsQuery = {
  status?: SupportTicketStatus;
  q?: string;
};

export const SUPPORT_TICKETS_QUERY_KEY = ["support-tickets"] as const;

export function supportTicketsQueryKey(query: SupportTicketsQuery = {}) {
  return ["support-tickets", query] as const;
}

export function supportTicketQueryKey(id: string) {
  return ["support-ticket", id] as const;
}

export function supportMessagesQueryKey(id: string) {
  return ["support-messages", id] as const;
}

async function parseJson<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return (await res.json()) as T;
}

export async function fetchSupportTickets(
  query: SupportTicketsQuery = {},
): Promise<SupportTicket[]> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.q) params.set("q", query.q);
  const qs = params.toString();
  const res = await fetch(`/api/bff/support/tickets${qs ? `?${qs}` : ""}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar os tickets.");
}

export async function fetchSupportTicket(id: string): Promise<SupportTicket> {
  const res = await fetch(`/api/bff/support/tickets/${id}`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar o ticket.");
}

export async function createSupportTicket(dto: {
  subject: string;
  body?: string;
}): Promise<SupportTicket> {
  const res = await fetch("/api/bff/support/tickets", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseJson(res, "Não foi possível abrir o ticket.");
}

export async function patchSupportTicket(
  id: string,
  dto: { status?: SupportTicketStatus; assignToMe?: boolean },
): Promise<SupportTicket> {
  const res = await fetch(`/api/bff/support/tickets/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dto),
  });
  return parseJson(res, "Não foi possível actualizar o ticket.");
}

export async function fetchSupportMessages(
  id: string,
): Promise<SupportMessage[]> {
  const res = await fetch(`/api/bff/support/tickets/${id}/messages`, {
    credentials: "include",
  });
  return parseJson(res, "Não foi possível carregar as mensagens.");
}

export async function postSupportMessage(
  id: string,
  body: string,
): Promise<SupportMessage> {
  const res = await fetch(`/api/bff/support/tickets/${id}/messages`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });
  return parseJson(res, "Não foi possível enviar a mensagem.");
}
