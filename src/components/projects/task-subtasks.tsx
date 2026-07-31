"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCheck, FaPenToSquare, FaPlus, FaTrashCan } from "react-icons/fa6";
import type { SubtaskSummary } from "@/lib/api-types";
import type { SessionUser } from "@/lib/session";
import {
  canManageSubtask,
  createSubtask,
  deleteSubtask,
  fetchSubtasks,
  subtasksQueryKey,
  updateSubtask,
} from "@/lib/subtasks-api";

/**
 * CRUD inline de subtarefas no detalhe da tarefa.
 * Concluir/editar/excluir só para o responsável (criador).
 */
export function TaskSubtasks({
  taskId,
  sessionUser,
}: {
  taskId: string;
  sessionUser: SessionUser | undefined;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: subtasksQueryKey(taskId),
    queryFn: () => fetchSubtasks(taskId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: subtasksQueryKey(taskId) });

  const create = useMutation({
    mutationFn: (name: string) => createSubtask({ name, taskId }),
    onSuccess: async () => {
      setDraft("");
      setActionError(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível criar.",
      );
    },
  });

  const update = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { name?: string; isCompleted?: boolean };
    }) => updateSubtask(id, data),
    onSuccess: async () => {
      setEditingId(null);
      setActionError(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível atualizar.",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSubtask(id),
    onSuccess: async () => {
      setActionError(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível excluir.",
      );
    },
  });

  const busy = create.isPending || update.isPending || remove.isPending;
  const items = list.data ?? [];
  const doneCount = items.filter((s) => s.isCompleted).length;

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-app-text">Subtarefas</h3>
        {items.length > 0 ? (
          <span className="text-xs text-app-muted">
            {doneCount}/{items.length} concluídas
          </span>
        ) : null}
      </div>

      {actionError ? (
        <p className="mt-2 text-xs text-red-700 dark:text-red-300" role="alert">
          {actionError}
        </p>
      ) : null}

      {list.isPending ? (
        <div
          className="mt-3 h-16 animate-pulse rounded-lg bg-app-surface-elevated/70"
          aria-hidden
        />
      ) : list.isError ? (
        <p className="mt-3 text-xs text-red-700 dark:text-red-300">
          Não foi possível carregar as subtarefas.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {items.map((sub) => (
            <SubtaskRow
              key={sub.id}
              subtask={sub}
              canManage={canManageSubtask(sub, sessionUser)}
              busy={busy}
              editing={editingId === sub.id}
              editName={editName}
              onEditNameChange={setEditName}
              onStartEdit={() => {
                setEditingId(sub.id);
                setEditName(sub.name);
                setActionError(null);
              }}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => {
                const name = editName.trim();
                if (!name) return;
                update.mutate({ id: sub.id, data: { name } });
              }}
              onToggle={() =>
                update.mutate({
                  id: sub.id,
                  data: { isCompleted: !sub.isCompleted },
                })
              }
              onDelete={() => remove.mutate(sub.id)}
            />
          ))}
        </ul>
      )}

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = draft.trim();
          if (!name) return;
          setActionError(null);
          create.mutate(name);
        }}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Nova subtarefa…"
          maxLength={255}
          disabled={busy}
          aria-label="Nome da nova subtarefa"
          className="min-w-0 flex-1 rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25"
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-app-accent text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Adicionar subtarefa"
        >
          <FaPlus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </form>
    </section>
  );
}

function SubtaskRow({
  subtask,
  canManage,
  busy,
  editing,
  editName,
  onEditNameChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggle,
  onDelete,
}: {
  subtask: SubtaskSummary;
  canManage: boolean;
  busy: boolean;
  editing: boolean;
  editName: string;
  onEditNameChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  if (editing) {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-app-border/70 bg-app-surface/80 px-2 py-1.5">
        <input
          type="text"
          value={editName}
          onChange={(e) => onEditNameChange(e.target.value)}
          disabled={busy}
          aria-label="Editar nome da subtarefa"
          className="min-w-0 flex-1 rounded border border-app-border bg-app-surface px-2 py-1 text-sm text-app-text outline-none focus:border-app-accent"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSaveEdit();
            }
            if (e.key === "Escape") onCancelEdit();
          }}
        />
        <button
          type="button"
          onClick={onSaveEdit}
          disabled={busy || !editName.trim()}
          className="cursor-pointer rounded px-2 py-1 text-xs font-medium text-app-accent hover:underline disabled:opacity-50"
        >
          Salvar
        </button>
        <button
          type="button"
          onClick={onCancelEdit}
          disabled={busy}
          className="cursor-pointer rounded px-2 py-1 text-xs text-app-muted hover:text-app-text"
        >
          Cancelar
        </button>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-app-border/60 bg-app-surface/60 px-2 py-1.5">
      <button
        type="button"
        onClick={onToggle}
        disabled={busy || !canManage}
        aria-pressed={subtask.isCompleted}
        aria-label={
          subtask.isCompleted
            ? `Desmarcar ${subtask.name}`
            : `Concluir ${subtask.name}`
        }
        className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${
          subtask.isCompleted
            ? "border-app-accent bg-app-accent text-white"
            : "border-app-border text-transparent hover:border-app-accent"
        }`}
      >
        <FaCheck className="h-3 w-3" aria-hidden />
      </button>

      <span
        className={`min-w-0 flex-1 truncate text-sm ${
          subtask.isCompleted
            ? "text-app-muted line-through"
            : "text-app-text"
        }`}
      >
        {subtask.name}
      </span>

      {canManage ? (
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={onStartEdit}
            disabled={busy}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:opacity-40"
            aria-label={`Editar ${subtask.name}`}
          >
            <FaPenToSquare className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-app-muted transition hover:bg-red-500/15 hover:text-red-700 disabled:opacity-40 dark:hover:text-red-300"
            aria-label={`Excluir ${subtask.name}`}
          >
            <FaTrashCan className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : null}
    </li>
  );
}
