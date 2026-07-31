"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaPenToSquare, FaTrashCan, FaXmark } from "react-icons/fa6";
import { Modal } from "@/components/ui/modal";
import type { TaskSummary } from "@/lib/api-types";
import {
  canMoveOrRemoveTask,
  deleteTask,
  tasksByStageQueryKey,
} from "@/lib/tasks-api";
import type { SessionUser } from "@/lib/session";
import { TaskFormModal } from "./task-form-modal";
import { TaskSubtasks } from "./task-subtasks";
import { TaskTimetrack } from "./task-timetrack";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

/**
 * Drawer de detalhe da tarefa (portal no body). Metadados + editar/excluir;
 * subtarefas e timetrack inline.
 */
export function TaskDetailDrawer({
  task,
  projectId,
  sessionUser,
  canManageProject = false,
  onClose,
}: {
  task: TaskSummary;
  projectId: string;
  sessionUser: SessionUser | undefined;
  canManageProject?: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const manageable = canMoveOrRemoveTask(task, sessionUser);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !editing && !confirmingDelete) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, editing, confirmingDelete]);

  const remove = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: async () => {
      if (task.stage?.id) {
        await queryClient.invalidateQueries({
          queryKey: tasksByStageQueryKey(task.stage.id),
        });
      }
      onClose();
    },
  });

  const closeIfIdle = useCallback(() => {
    if (!remove.isPending) onClose();
  }, [onClose, remove.isPending]);

  return createPortal(
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Detalhe da tarefa"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={closeIfIdle}
        aria-hidden
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-app-border/70 bg-app-surface p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-app-text">{task.name}</h2>
          <button
            type="button"
            onClick={closeIfIdle}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
            aria-label="Fechar"
          >
            <FaXmark className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-app-muted">
              Coluna
            </dt>
            <dd className="mt-0.5 text-sm text-app-text">
              {task.stage?.name ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-app-muted">
              Descrição
            </dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-sm text-app-text">
              {task.description?.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-app-muted">
              Data limite
            </dt>
            <dd className="mt-0.5 text-sm text-app-text">
              {task.finishDate
                ? dateFormatter.format(new Date(task.finishDate))
                : "—"}
            </dd>
          </div>
        </dl>

        {manageable ? (
          <div className="mt-6 flex flex-wrap gap-2">
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

        <div className="min-h-0 flex-1 overflow-y-auto">
          <TaskSubtasks taskId={task.id} sessionUser={sessionUser} />
          <TaskTimetrack
            taskId={task.id}
            sessionUser={sessionUser}
            canManageProject={canManageProject}
          />
        </div>
      </aside>

      {editing && task.stage?.id ? (
        <TaskFormModal
          projectId={projectId}
          stageId={task.stage.id}
          task={task}
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
            <span className="font-medium text-app-text">{task.name}</span>?
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
