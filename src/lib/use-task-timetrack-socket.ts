"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { timetrackQueryKey } from "@/lib/timetrack-api";

const EVENTS = [
  "timetrack:started",
  "timetrack:stopped",
  "timetrack:updated",
  "timetrack:deleted",
] as const;

/**
 * Liga ao Socket.IO do backend, entra na room da tarefa e invalida o cache
 * de timetrack quando há eventos em tempo real.
 */
export function useTaskTimetrackSocket(taskId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !taskId) return;

    let cancelled = false;
    let socket: { disconnect: () => void; off: (e: string) => void } | null =
      null;

    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: timetrackQueryKey(taskId),
      });
    };

    (async () => {
      try {
        const res = await fetch("/api/runtime", { credentials: "include" });
        if (!res.ok || cancelled) return;
        const body = (await res.json()) as { wsUrl?: string | null };
        if (!body.wsUrl || cancelled) return;

        const { io } = await import("socket.io-client");
        if (cancelled) return;

        const s = io(body.wsUrl, {
          transports: ["websocket"],
          autoConnect: true,
        });
        socket = s;
        s.emit("joinTask", { taskId });
        for (const event of EVENTS) {
          s.on(event, invalidate);
        }
      } catch {
        // Sem WS o HTTP continua a funcionar; falha silenciosa.
      }
    })();

    return () => {
      cancelled = true;
      if (socket) {
        for (const event of EVENTS) {
          socket.off(event);
        }
        socket.disconnect();
      }
    };
  }, [taskId, enabled, queryClient]);
}
