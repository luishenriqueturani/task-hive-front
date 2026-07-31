"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FaPlay, FaStop, FaTrashCan } from "react-icons/fa6";
import { Modal } from "@/components/ui/modal";
import type { TimetrackEntry } from "@/lib/api-types";
import type { SessionUser } from "@/lib/session";
import {
  ACTIVE_TIMER_QUERY_KEY,
  setActiveTimer,
  type ActiveTimer,
} from "@/lib/active-timer";
import {
  canManageTimetrack,
  deleteTimetrack,
  fetchTimetrack,
  formatDuration,
  isTimetrackActive,
  startTimetrack,
  stopTimetrack,
  timetrackQueryKey,
} from "@/lib/timetrack-api";
import { useTaskTimetrackSocket } from "@/lib/use-task-timetrack-socket";

const timeFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Timetrack no detalhe da tarefa: listar, iniciar, parar, eliminar;
 * actualiza via Socket.IO quando disponível.
 */
export function TaskTimetrack({
  taskId,
  sessionUser,
  canManageProject,
}: {
  taskId: string;
  sessionUser: SessionUser | undefined;
  canManageProject: boolean;
}) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<TimetrackEntry | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useTaskTimetrackSocket(taskId);

  const list = useQuery({
    queryKey: timetrackQueryKey(taskId),
    queryFn: () => fetchTimetrack(taskId),
  });

  const entries = list.data ?? [];
  const hasActive = entries.some(isTimetrackActive);
  const myActive = entries.find(
    (e) => isTimetrackActive(e) && e.userId === sessionUser?.id,
  );

  useEffect(() => {
    if (!list.isSuccess || !sessionUser) return;
    if (myActive) {
      setActiveTimer(queryClient, {
        taskId,
        id: myActive.id,
        start: myActive.start,
      });
    } else {
      // Só limpa se o timer global for desta tarefa (outro ecrã pode ter o activo).
      const current = queryClient.getQueryData<ActiveTimer | null>(
        ACTIVE_TIMER_QUERY_KEY,
      );
      if (current?.taskId === taskId) {
        setActiveTimer(queryClient, null);
      }
    }
  }, [list.isSuccess, myActive, sessionUser, taskId, queryClient]);

  useEffect(() => {
    if (!hasActive) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [hasActive]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: timetrackQueryKey(taskId) });

  const start = useMutation({
    mutationFn: () => startTimetrack(taskId),
    onSuccess: async (created) => {
      setActionError(null);
      setActiveTimer(queryClient, {
        taskId,
        id: created.id,
        start: created.start,
      });
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível iniciar.",
      );
    },
  });

  const stop = useMutation({
    mutationFn: (id: string) => stopTimetrack(taskId, id),
    onSuccess: async (_data, id) => {
      setActionError(null);
      const current = queryClient.getQueryData<ActiveTimer | null>(
        ACTIVE_TIMER_QUERY_KEY,
      );
      if (!current || current.id === id) {
        setActiveTimer(queryClient, null);
      }
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível parar.",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTimetrack(taskId, id),
    onSuccess: async () => {
      setDeleting(null);
      setActionError(null);
      await invalidate();
    },
    onError: (err: unknown) => {
      setActionError(
        err instanceof Error ? err.message : "Não foi possível remover.",
      );
    },
  });

  const busy = start.isPending || stop.isPending || remove.isPending;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-app-text">Timetrack</h3>
        {myActive ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setActionError(null);
              stop.mutate(myActive.id);
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300"
          >
            <FaStop className="h-3 w-3" aria-hidden />
            Parar
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !sessionUser}
            onClick={() => {
              setActionError(null);
              start.mutate();
            }}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-app-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FaPlay className="h-3 w-3" aria-hidden />
            Iniciar
          </button>
        )}
      </div>

      {myActive ? (
        <p
          className="mt-2 flex items-center gap-2 text-sm font-medium text-app-accent"
          role="status"
        >
          <span
            className="inline-block h-2 w-2 animate-pulse rounded-full bg-app-accent"
            aria-hidden
          />
          Em curso ·{" "}
          {formatDuration(now - new Date(myActive.start).getTime())}
        </p>
      ) : null}

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
        <p className="mt-3 text-xs text-red-700 dark:text-red-300" role="alert">
          {list.error instanceof Error
            ? list.error.message
            : "Não foi possível carregar o timetrack."}
        </p>
      ) : entries.length === 0 ? (
        <p className="mt-3 text-xs text-app-muted">
          Ainda não há registos de tempo nesta tarefa.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {entries.map((entry) => {
            const active = isTimetrackActive(entry);
            const endMs = active ? now : new Date(entry.end!).getTime();
            const duration = formatDuration(
              endMs - new Date(entry.start).getTime(),
            );
            const manageable = canManageTimetrack(
              entry,
              sessionUser,
              canManageProject,
            );
            return (
              <li
                key={entry.id}
                className="flex items-center gap-2 rounded-lg border border-app-border/60 bg-app-surface/60 px-2.5 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-app-text">
                    {entry.userName || "—"}
                    {active ? (
                      <span className="ml-1.5 text-xs font-medium text-app-accent">
                        ativo
                      </span>
                    ) : null}
                  </p>
                  <p className="text-[11px] text-app-muted">
                    {timeFmt.format(new Date(entry.start))}
                    {entry.end
                      ? ` → ${timeFmt.format(new Date(entry.end))}`
                      : " → …"}
                    {" · "}
                    <span className="font-medium text-app-text">{duration}</span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  {active && manageable ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setActionError(null);
                        stop.mutate(entry.id);
                      }}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-app-muted transition hover:bg-red-500/15 hover:text-red-700 disabled:opacity-40 dark:hover:text-red-300"
                      aria-label={`Parar timer de ${entry.userName}`}
                    >
                      <FaStop className="h-3 w-3" aria-hidden />
                    </button>
                  ) : null}
                  {manageable && !active ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleting(entry)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-app-muted transition hover:bg-red-500/15 hover:text-red-700 disabled:opacity-40 dark:hover:text-red-300"
                      aria-label={`Excluir registo de ${entry.userName}`}
                    >
                      <FaTrashCan className="h-3 w-3" aria-hidden />
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {deleting ? (
        <Modal
          title="Excluir registo"
          onClose={() => {
            if (!remove.isPending) setDeleting(null);
          }}
        >
          <p className="text-sm text-app-muted">
            Remover o registo de tempo de{" "}
            <span className="font-medium text-app-text">
              {deleting.userName}
            </span>
            ?
          </p>
          {remove.isError ? (
            <p
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
              role="alert"
            >
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível remover."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(deleting.id)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {remove.isPending ? "Removendo…" : "Excluir"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
