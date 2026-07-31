"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { FaStop } from "react-icons/fa6";
import {
  ACTIVE_TIMER_QUERY_KEY,
  readStoredActiveTimer,
  resolveActiveTimer,
  setActiveTimer,
} from "@/lib/active-timer";
import {
  formatDuration,
  stopTimetrack,
  timetrackQueryKey,
} from "@/lib/timetrack-api";

/**
 * Indicador do timer activo no header (ao lado do perfil), com duração
 * em directo e atalho para parar.
 */
export function HeaderActiveTimer() {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());

  const active = useQuery({
    queryKey: ACTIVE_TIMER_QUERY_KEY,
    queryFn: resolveActiveTimer,
    initialData: () => readStoredActiveTimer(),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const timer = active.data ?? null;

  useEffect(() => {
    if (!timer) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer]);

  const stop = useMutation({
    mutationFn: () => {
      if (!timer) throw new Error("Nenhum timer activo.");
      return stopTimetrack(timer.taskId, timer.id);
    },
    onSuccess: async () => {
      setActiveTimer(queryClient, null);
      if (timer) {
        await queryClient.invalidateQueries({
          queryKey: timetrackQueryKey(timer.taskId),
        });
      }
    },
  });

  if (!timer) return null;

  const elapsed = formatDuration(now - new Date(timer.start).getTime());

  return (
    <div
      className="flex items-center gap-1.5 rounded-full border border-app-accent/35 bg-app-accent/10 py-1 pl-2.5 pr-1"
      role="status"
      aria-label={`Timer em curso: ${elapsed}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-app-accent"
        aria-hidden
      />
      <span className="font-mono text-xs font-semibold tabular-nums text-app-accent">
        {elapsed}
      </span>
      <button
        type="button"
        onClick={() => stop.mutate()}
        disabled={stop.isPending}
        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-app-accent transition hover:bg-app-accent/20 disabled:opacity-50"
        aria-label="Parar timer"
      >
        <FaStop className="h-3 w-3" aria-hidden />
      </button>
    </div>
  );
}
