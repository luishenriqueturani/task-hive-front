"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  fetchSupportMessages,
  fetchSupportTicket,
  patchSupportTicket,
  postSupportMessage,
  supportMessagesQueryKey,
  supportTicketQueryKey,
  SUPPORT_TICKETS_QUERY_KEY,
} from "@/lib/support-api";
import { SUPPORT_STATUS_LABELS } from "@/lib/support-status";
import { useSupportSocket } from "@/lib/use-support-socket";

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatWhen(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : dateTime.format(date);
}

/**
 * Thread partilhada: mensagens HTTP + polling curto + Socket.IO.
 * No admin mostra assumir; o autor (ou o admin) pode encerrar.
 */
export function SupportThread({
  ticketId,
  mode,
  currentUserId,
}: {
  ticketId: string;
  mode: "client" | "admin";
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const backHref = mode === "admin" ? "/admin/support" : "/support";

  const ticket = useQuery({
    queryKey: supportTicketQueryKey(ticketId),
    queryFn: () => fetchSupportTicket(ticketId),
    refetchInterval: (query) =>
      query.state.data?.status === "CLOSED" ? false : 8000,
  });
  const messages = useQuery({
    queryKey: supportMessagesQueryKey(ticketId),
    queryFn: () => fetchSupportMessages(ticketId),
    refetchInterval: ticket.data?.status === "CLOSED" ? false : 8000,
  });

  useSupportSocket(ticketId, ticket.data?.status !== "CLOSED");

  function invalidateAll() {
    void queryClient.invalidateQueries({
      queryKey: supportTicketQueryKey(ticketId),
    });
    void queryClient.invalidateQueries({
      queryKey: supportMessagesQueryKey(ticketId),
    });
    void queryClient.invalidateQueries({
      queryKey: SUPPORT_TICKETS_QUERY_KEY,
    });
  }

  const send = useMutation({
    mutationFn: (body: string) => postSupportMessage(ticketId, body),
    onSuccess: () => {
      setError(null);
      invalidateAll();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Não foi possível enviar.",
      );
    },
  });

  const patch = useMutation({
    mutationFn: (dto: { status?: "OPEN" | "CLOSED"; assignToMe?: boolean }) =>
      patchSupportTicket(ticketId, dto),
    onSuccess: () => {
      setError(null);
      invalidateAll();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível actualizar o ticket.",
      );
    },
  });

  function onSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) {
      setError("Escreva uma mensagem.");
      return;
    }
    send.mutate(body, {
      onSuccess: () => form.reset(),
    });
  }

  if (ticket.isPending) {
    return (
      <div
        className="h-64 animate-pulse rounded-2xl bg-app-surface-elevated/70"
        aria-hidden
      />
    );
  }

  if (ticket.isError || !ticket.data) {
    return (
      <p className="text-sm text-red-700 dark:text-red-300" role="alert">
        {ticket.error instanceof Error
          ? ticket.error.message
          : "Ticket não encontrado."}
      </p>
    );
  }

  const data = ticket.data;
  const closed = data.status === "CLOSED";
  const isAuthor = data.createdBy?.id === currentUserId;
  const assignedToMe = data.assignedTo?.id === currentUserId;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Link
        href={backHref}
        className="text-sm text-app-muted transition hover:text-app-text"
      >
        ← Voltar
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text">
            {data.subject}
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            {SUPPORT_STATUS_LABELS[data.status]}
            {data.assignedTo
              ? ` · ${data.assignedTo.name || data.assignedTo.email}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mode === "admin" && !assignedToMe && !closed ? (
            <button
              type="button"
              onClick={() => patch.mutate({ assignToMe: true })}
              disabled={patch.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Assumir ticket
            </button>
          ) : null}
          {!closed && (mode === "admin" || isAuthor) ? (
            <button
              type="button"
              onClick={() => patch.mutate({ status: "CLOSED" })}
              disabled={patch.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Encerrar
            </button>
          ) : null}
          {closed && isAuthor ? (
            <button
              type="button"
              onClick={() => patch.mutate({ status: "OPEN" })}
              disabled={patch.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Reabrir
            </button>
          ) : null}
        </div>
      </div>

      <ol className="mt-6 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-app-border/70 bg-app-surface/70 p-4">
        {messages.isPending ? (
          <li className="h-20 animate-pulse rounded-xl bg-app-surface-elevated/70" />
        ) : messages.isError ? (
          <li className="text-sm text-red-700 dark:text-red-300" role="alert">
            Não foi possível carregar as mensagens.
          </li>
        ) : (messages.data ?? []).length === 0 ? (
          <li className="text-sm text-app-muted">Ainda não há mensagens.</li>
        ) : (
          (messages.data ?? []).map((message) => {
            const mine = message.author?.id === currentUserId;
            return (
              <li
                key={message.id}
                className={`max-w-xl rounded-xl px-3 py-2 text-sm ${
                  mine
                    ? "ml-auto bg-app-accent/15 text-app-text"
                    : "bg-app-surface-elevated/80 text-app-text"
                }`}
              >
                <p className="text-xs text-app-muted">
                  {message.author?.name || message.author?.email || "—"} ·{" "}
                  <time dateTime={message.createdAt}>
                    {formatWhen(message.createdAt)}
                  </time>
                </p>
                <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
              </li>
            );
          })
        )}
      </ol>

      {closed ? (
        <p className="mt-4 text-sm text-app-muted">Esta conversa está encerrada.</p>
      ) : (
        <form onSubmit={onSend} className="mt-4 space-y-3">
          <label className="block text-sm">
            <span className="sr-only">Mensagem</span>
            <textarea
              name="body"
              required
              maxLength={4000}
              rows={3}
              placeholder="Escreva a resposta"
              className="w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
            />
          </label>
          <button
            type="submit"
            disabled={send.isPending}
            className="cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {send.isPending ? "A enviar…" : "Enviar"}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
