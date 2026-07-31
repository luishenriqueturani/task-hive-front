"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  FormError,
  FormField,
  SubmitButton,
} from "@/components/auth/form-field";
import { Modal } from "@/components/ui/modal";
import type { ToDoSummary } from "@/lib/api-types";
import {
  createTodo,
  RECURRING_TYPE_LABELS,
  TODOS_QUERY_KEY,
  type RecurringType,
  type ToDoInput,
  updateTodo,
} from "@/lib/todos-api";

function deadlineToInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function inputToDeadlineIso(date: string): string | undefined {
  if (!date.trim()) return undefined;
  // Fim do dia UTC da data escolhida
  return `${date.trim()}T23:59:59.000Z`;
}

/**
 * Modal criar/editar tarefa avulsa. Com `todo`, edita (PUT); senão cria (POST).
 */
export function TodoFormModal({
  todo,
  onClose,
}: {
  todo?: ToDoSummary;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!todo;

  const [title, setTitle] = useState(todo?.title ?? "");
  const [description, setDescription] = useState(todo?.description ?? "");
  const [recurring, setRecurring] = useState({
    enabled: todo?.type === "RECURRING",
    type: (todo?.recurringType ?? "WEEKLY") as RecurringType,
    deadline: deadlineToInput(todo?.recurringDeadline),
  });
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async (data: ToDoInput) => {
      if (isEdit) await updateTodo(todo.id, data);
      else await createTodo(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível salvar a tarefa.",
      );
    },
  });

  return (
    <Modal
      title={isEdit ? "Editar tarefa" : "Nova tarefa avulsa"}
      onClose={onClose}
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);
          const t = title.trim();
          const d = description.trim();
          if (t.length < 3) {
            setFormError("O título precisa ter pelo menos 3 caracteres.");
            return;
          }
          if (d.length < 3) {
            setFormError("A descrição precisa ter pelo menos 3 caracteres.");
            return;
          }
          const payload: ToDoInput = {
            title: t,
            description: d,
            isRecurring: recurring.enabled,
          };
          if (recurring.enabled) {
            payload.recurringType = recurring.type;
            payload.recurringDeadline = inputToDeadlineIso(recurring.deadline);
          }
          save.mutate(payload);
        }}
        noValidate
      >
        <FormError message={formError} />

        <FormField
          id="todo-title"
          label="Título"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex.: Pagar contas"
          maxLength={255}
          disabled={save.isPending}
          autoFocus
        />

        <div>
          <label
            htmlFor="todo-description"
            className="mb-1.5 block text-sm font-medium text-app-text"
          >
            Descrição
          </label>
          <textarea
            id="todo-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhes da tarefa…"
            maxLength={5000}
            rows={3}
            disabled={save.isPending}
            className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 disabled:opacity-60"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-app-text">
          <input
            type="checkbox"
            checked={recurring.enabled}
            onChange={(e) =>
              setRecurring((r) => ({ ...r, enabled: e.target.checked }))
            }
            disabled={save.isPending}
            className="h-4 w-4 rounded border-app-border text-app-accent focus:ring-app-accent"
          />
          Tarefa recorrente
        </label>

        {recurring.enabled ? (
          <>
            <div>
              <label
                htmlFor="todo-recurring-type"
                className="mb-1.5 block text-sm font-medium text-app-text"
              >
                Frequência
              </label>
              <select
                id="todo-recurring-type"
                value={recurring.type}
                onChange={(e) =>
                  setRecurring((r) => ({
                    ...r,
                    type: e.target.value as RecurringType,
                  }))
                }
                disabled={save.isPending}
                className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none focus:border-app-accent focus:ring-2 focus:ring-app-accent/25"
              >
                {(Object.keys(RECURRING_TYPE_LABELS) as RecurringType[]).map(
                  (key) => (
                    <option key={key} value={key}>
                      {RECURRING_TYPE_LABELS[key]}
                    </option>
                  ),
                )}
              </select>
            </div>
            <FormField
              id="todo-recurring-deadline"
              label="Data final (opcional)"
              name="recurringDeadline"
              type="date"
              value={recurring.deadline}
              onChange={(e) =>
                setRecurring((r) => ({ ...r, deadline: e.target.value }))
              }
              disabled={save.isPending}
            />
            <p className="text-xs text-app-muted">
              Se definida, a recorrência encerra após esta data.
            </p>
          </>
        ) : null}

        <SubmitButton
          pending={save.isPending}
          pendingLabel={isEdit ? "Salvando…" : "Criando…"}
        >
          {isEdit ? "Salvar alterações" : "Criar tarefa"}
        </SubmitButton>
      </form>
    </Modal>
  );
}
