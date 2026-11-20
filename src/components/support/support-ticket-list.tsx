import Link from "next/link";
import type { SupportTicket } from "@/lib/support-api";
import { SUPPORT_STATUS_LABELS } from "@/lib/support-status";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatWhen(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
}

/**
 * Lista de tickets (cliente ou fila admin) com estado e última mensagem.
 */
export function SupportTicketList({
  tickets,
  basePath,
  showAuthor = false,
}: {
  tickets: SupportTicket[];
  basePath: string;
  showAuthor?: boolean;
}) {
  if (tickets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-app-border/70 px-4 py-10 text-center text-sm text-app-muted">
        Ainda não há conversas.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-app-border/60 overflow-hidden rounded-2xl border border-app-border/70 bg-app-surface/70">
      {tickets.map((ticket) => (
        <li key={ticket.id}>
          <Link
            href={`${basePath}/${ticket.id}`}
            className="flex flex-col gap-1 px-4 py-3 transition hover:bg-app-surface-elevated/80 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-app-text">{ticket.subject}</p>
              {showAuthor ? (
                <p className="truncate text-xs text-app-muted">
                  {ticket.createdBy?.name || ticket.createdBy?.email || "—"}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-app-muted">
              <span>{SUPPORT_STATUS_LABELS[ticket.status]}</span>
              <time dateTime={ticket.lastMessageAt}>
                {formatWhen(ticket.lastMessageAt)}
              </time>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
