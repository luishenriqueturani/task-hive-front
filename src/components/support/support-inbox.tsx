"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { SupportNewTicket } from "@/components/support/support-new-ticket";
import { SupportTicketList } from "@/components/support/support-ticket-list";
import {
  fetchSupportTickets,
  supportTicketsQueryKey,
  type SupportTicketStatus,
  type SupportTicketsQuery,
} from "@/lib/support-api";
import {
  SUPPORT_STATUS_LABELS,
  SUPPORT_STATUS_OPTIONS,
} from "@/lib/support-status";

function readQuery(params: URLSearchParams): SupportTicketsQuery {
  const status = params.get("status") as SupportTicketStatus | null;
  return {
    q: params.get("q")?.trim() || undefined,
    status: status && status in SUPPORT_STATUS_LABELS ? status : undefined,
  };
}

/**
 * Caixa de entrada: lista do cliente ou fila global do admin.
 */
export function SupportInbox({
  mode,
}: {
  mode: "client" | "admin";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = readQuery(searchParams);
  const [newOpen, setNewOpen] = useState(false);
  const basePath = mode === "admin" ? "/admin/support" : "/support";

  const list = useQuery({
    queryKey: supportTicketsQueryKey(query),
    queryFn: () => fetchSupportTickets(query),
  });

  function hrefFor(next: SupportTicketsQuery) {
    const params = new URLSearchParams();
    if (next.q) params.set("q", next.q);
    if (next.status) params.set("status", next.status);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    router.push(
      hrefFor({
        q: String(form.get("q") ?? "").trim() || undefined,
        status: (String(form.get("status") ?? "") ||
          undefined) as SupportTicketStatus | undefined,
      }),
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text">
            Suporte
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            {mode === "admin"
              ? "Fila global de tickets. Assuma uma conversa para responder."
              : "Fale connosco. As mensagens ficam guardadas neste ticket."}
          </p>
        </div>
        {mode === "client" ? (
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Nova conversa
          </button>
        ) : null}
      </div>

      <form
        onSubmit={onFilter}
        className="mt-6 grid gap-3 rounded-2xl border border-app-border/70 bg-app-surface/70 p-4 sm:grid-cols-3"
      >
        <label className="block text-sm sm:col-span-2">
          <span className="text-app-muted">Busca</span>
          <input
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder="Assunto"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Estado</span>
          <select
            name="status"
            defaultValue={query.status ?? ""}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          >
            <option value="">Todos</option>
            {SUPPORT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {SUPPORT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-3">
          <button
            type="submit"
            className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-elevated/90"
          >
            Filtrar
          </button>
        </div>
      </form>

      <div className="mt-6">
        {list.isPending ? (
          <div
            className="h-40 animate-pulse rounded-2xl bg-app-surface-elevated/70"
            aria-hidden
          />
        ) : list.isError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {list.error instanceof Error
              ? list.error.message
              : "Não foi possível carregar os tickets."}
          </p>
        ) : (
          <SupportTicketList
            tickets={list.data ?? []}
            basePath={basePath}
            showAuthor={mode === "admin"}
          />
        )}
      </div>

      {mode === "client" ? (
        <SupportNewTicket open={newOpen} onClose={() => setNewOpen(false)} />
      ) : null}
    </div>
  );
}
