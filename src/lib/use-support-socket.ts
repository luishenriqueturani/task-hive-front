"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  supportMessagesQueryKey,
  supportTicketQueryKey,
  SUPPORT_TICKETS_QUERY_KEY,
} from "@/lib/support-api";

/**
 * Liga ao namespace `/support`, entra na room do ticket e invalida
 * mensagens/lista quando chega `support:message`. Sem WS o HTTP continua.
 */
export function useSupportSocket(ticketId: string, enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || !ticketId) return;

    let cancelled = false;
    let socket: { disconnect: () => void; off: (e: string) => void } | null =
      null;

    const invalidate = () => {
      void queryClient.invalidateQueries({
        queryKey: supportMessagesQueryKey(ticketId),
      });
      void queryClient.invalidateQueries({
        queryKey: supportTicketQueryKey(ticketId),
      });
      void queryClient.invalidateQueries({
        queryKey: SUPPORT_TICKETS_QUERY_KEY,
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

        const s = io(`${body.wsUrl}/support`, {
          transports: ["websocket"],
          autoConnect: true,
          withCredentials: true,
        });
        socket = s;
        s.emit("joinTicket", { ticketId });
        s.on("support:message", invalidate);
      } catch {
        // Sem WS o HTTP (e o polling curto) continua a funcionar.
      }
    })();

    return () => {
      cancelled = true;
      if (socket) {
        socket.off("support:message");
        socket.disconnect();
      }
    };
  }, [ticketId, enabled, queryClient]);
}
