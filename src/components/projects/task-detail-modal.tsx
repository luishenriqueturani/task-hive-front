"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  FaCheck,
  FaClockRotateLeft,
  FaPenToSquare,
  FaTrashCan,
  FaXmark,
} from "react-icons/fa6";
import { Modal } from "@/components/ui/modal";
import type { TaskSummary } from "@/lib/api-types";
import type { SessionUser } from "@/lib/session";
import {
  canMoveOrRemoveTask,
  clearTaskCompleted,
  completeTask,
  deleteTask,
  fetchTaskCompletions,
  taskCompletionsQueryKey,
  tasksByStageQueryKey,
} from "@/lib/tasks-api";
import { TaskFormModal } from "./task-form-modal";
import { TaskSubtasks } from "./task-subtasks";
import { TaskTimetrack } from "./task-timetrack";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const activityFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type FeedItem = {
  id: string;
  type: "completion";
  at: string;
  label: string;
};

/**
 * Modal grande de detalhe da tarefa (estilo Trello): informações à esquerda,
 * histórico/atividade à direita.
 */
export function TaskDetailModal({
  task,
  projectId,
  sessionUser,
  canManageProject = false,
  onClose,
  onTaskUpdated,
}: {
  task: TaskSummary;
  projectId: string;
  sessionUser: SessionUser | undefined;
  canManageProject?: boolean;
  onClose: () => void;
  onTaskUpdated?: (task: TaskSummary) => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [localTask, setLocalTask] = useState(task);

  useEffect(() => {
    setLocalTask(task);
  }, [task]);

  const manageable = canMoveOrRemoveTask(localTask, sessionUser);
  const completed = Boolean(localTask.completedAt);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing && !confirmingDelete) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editing, confirmingDelete]);

  const completions = useQuery({
    queryKey: taskCompletionsQueryKey(localTask.id),
    queryFn: () => fetchTaskCompletions(localTask.id),
  });

  const feed: FeedItem[] = useMemo(() => {
    return (completions.data ?? []).map((c) => ({
      id: c.id,
      type: "completion" as const,
      at: c.completedAt,
      label: `Concluída em ${c.stage?.name ?? "coluna"}`,
    }));
  }, [completions.data]);

  const invalidateTaskCaches = useCallback(async () => {
    if (localTask.stage?.id) {
      await queryClient.invalidateQueries({
        queryKey: tasksByStageQueryKey(localTask.stage.id),
      });
    }
    await queryClient.invalidateQueries({
      queryKey: taskCompletionsQueryKey(localTask.id),
    });
  }, [queryClient, localTask.id, localTask.stage?.id]);

  const toggleComplete = useMutation({
    mutationFn: async () => {
      if (localTask.completedAt) {
        return clearTaskCompleted(localTask.id);
      }
      return completeTask(localTask.id);
    },
    onSuccess: async (updated) => {
      setLocalTask(updated);
      onTaskUpdated?.(updated);
      await invalidateTaskCaches();
    },
  });

  const remove = useMutation({
    mutationFn: () => deleteTask(localTask.id),
    onSuccess: async () => {
      await invalidateTaskCaches();
      onClose();
    },
  });

  const closeIfIdle = useCallback(() => {
    if (!remove.isPending) onClose();
  }, [onClose, remove.isPending]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhe da tarefa"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeIfIdle}
        aria-hidden
      />

      <div className="relative flex max-h-[min(90dvh,52rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-app-border/70 bg-app-surface shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-app-border/60 px-4 py-3 sm:px-6">
          <span className="rounded-lg bg-app-surface-elevated/80 px-2.5 py-1 text-xs font-medium text-app-muted">
            {localTask.stage?.name ?? "Sem coluna"}
          </span>
          <button
            type="button"
            onClick={closeIfIdle}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
            aria-label="Fechar"
          >
            <FaXmark className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_minmax(16rem,1fr)]">
          <div className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              {manageable ? (
                <button
                  type="button"
                  onClick={() => toggleComplete.mutate()}
                  disabled={toggleComplete.isPending}
                  aria-pressed={completed}
                  aria-label={
                    completed
                      ? `Desmarcar ${localTask.name}`
                      : `Concluir ${localTask.name}`
                  }
                  className={`mt-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border transition disabled:opacity-40 ${
                    completed
                      ? "border-app-accent bg-app-accent text-white"
                      : "border-app-border text-transparent hover:border-app-accent"
                  }`}
                >
                  <FaCheck className="h-3.5 w-3.5" aria-hidden />
                </button>
              ) : null}
              <h2
                className={`min-w-0 flex-1 text-xl font-semibold tracking-tight ${
                  completed
                    ? "text-app-muted line-through"
                    : "text-app-text"
                }`}
              >
                {localTask.name}
              </h2>
            </div>

            <dl className="mt-5 space-y-4">
              <div>
                <dt className="text-xs uppercase tracking-wide text-app-muted">
                  Descrição
                </dt>
                <dd className="mt-0.5 whitespace-pre-wrap text-sm text-app-text">
                  {localTask.description?.trim() || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-app-muted">
                  Data limite
                </dt>
                <dd className="mt-0.5 text-sm text-app-text">
                  {localTask.finishDate
                    ? dateFormatter.format(new Date(localTask.finishDate))
                    : "—"}
                </dd>
              </div>
              {localTask.user ? (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-app-muted">
                    Responsável
                  </dt>
                  <dd className="mt-0.5 text-sm text-app-text">
                    {localTask.user.name || localTask.user.email || "—"}
                  </dd>
                </div>
              ) : null}
            </dl>

            {manageable ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90"
                >
                  <FaPenToSquare className="h-3.5 w-3.5" aria-hidden />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-500/20 dark:text-red-300"
                >
                  <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                  Excluir
                </button>
              </div>
            ) : null}

            <TaskSubtasks taskId={localTask.id} sessionUser={sessionUser} />
            <TaskTimetrack
              taskId={localTask.id}
              sessionUser={sessionUser}
              canManageProject={canManageProject}
            />
          </div>

          <aside className="flex min-h-0 flex-col border-t border-app-border/60 md:border-l md:border-t-0">
            <div className="flex shrink-0 items-center gap-2 border-b border-app-border/60 px-4 py-3">
              <FaClockRotateLeft
                className="h-3.5 w-3.5 text-app-muted"
                aria-hidden
              />
              <h3 className="text-sm font-semibold text-app-text">Histórico</h3>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              {completions.isPending ? (
                <div
                  className="h-16 animate-pulse rounded-xl bg-app-surface-elevated/70"
                  aria-hidden
                />
              ) : completions.isError ? (
                <p className="text-xs text-red-700 dark:text-red-300">
                  Não foi possível carregar o histórico.
                </p>
              ) : feed.length === 0 ? (
                <p className="text-sm text-app-muted">
                  Ainda sem atividade.
                </p>
              ) : (
                <ul className="space-y-4">
                  {feed.map((item) => (
                    <li key={item.id} className="text-sm">
                      <p className="text-app-text">{item.label}</p>
                      <p className="mt-0.5 text-xs text-app-muted">
                        {activityFormatter.format(new Date(item.at))}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </div>

      {editing && localTask.stage?.id ? (
        <TaskFormModal
          projectId={projectId}
          stageId={localTask.stage.id}
          task={localTask}
          onClose={() => setEditing(false)}
        />
      ) : null}

      {confirmingDelete ? (
        <Modal
          title="Excluir tarefa"
          onClose={() => {
            if (!remove.isPending) setConfirmingDelete(false);
          }}
        >
          <p className="text-sm text-app-muted">
            Excluir{" "}
            <span className="font-medium text-app-text">{localTask.name}</span>
            ?
          </p>
          {remove.isError ? (
            <p
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
              role="alert"
            >
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível excluir a tarefa."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {remove.isPending ? "Excluindo…" : "Excluir tarefa"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>,
    document.body,
  );
}
