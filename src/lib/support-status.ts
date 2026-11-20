import type { SupportTicketStatus } from "@/lib/support-api";

export const SUPPORT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  OPEN: "Aberto",
  PENDING_USER: "À espera do cliente",
  PENDING_ADMIN: "À espera do suporte",
  CLOSED: "Encerrado",
};

export const SUPPORT_STATUS_OPTIONS: SupportTicketStatus[] = [
  "OPEN",
  "PENDING_USER",
  "PENDING_ADMIN",
  "CLOSED",
];

export function isOpenSupportStatus(status: SupportTicketStatus) {
  return status !== "CLOSED";
}
