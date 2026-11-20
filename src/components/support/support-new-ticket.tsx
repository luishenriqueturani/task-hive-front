"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import {
  createSupportTicket,
  SUPPORT_TICKETS_QUERY_KEY,
} from "@/lib/support-api";

/**
 * Formulário de nova conversa de suporte (assunto + primeira mensagem).
 */
export function SupportNewTicket({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: (dto: { subject: string; body: string }) =>
      createSupportTicket(dto),
    onSuccess: (ticket) => {
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: SUPPORT_TICKETS_QUERY_KEY,
      });
      onClose();
      router.push(`/support/${ticket.id}`);
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Não foi possível abrir o ticket.",
      );
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = String(form.get("subject") ?? "").trim();
    const body = String(form.get("body") ?? "").trim();
    if (!subject || !body) {
      setError("Preencha o assunto e a mensagem.");
      return;
    }
    create.mutate({ subject, body });
  }

  if (!open) return null;

  return (
    <Modal title="Nova conversa" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block text-sm">
          <span className="text-app-muted">Assunto</span>
          <input
            name="subject"
            required
            minLength={3}
            maxLength={120}
            placeholder="Em que podemos ajudar?"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Mensagem</span>
          <textarea
            name="body"
            required
            minLength={1}
            maxLength={4000}
            rows={5}
            placeholder="Descreva o problema"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </label>
        {error ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm text-app-muted transition hover:bg-app-surface-elevated/90"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {create.isPending ? "A abrir…" : "Abrir ticket"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
