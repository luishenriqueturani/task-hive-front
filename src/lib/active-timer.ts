import type { QueryClient } from "@tanstack/react-query";
import {
  fetchTimetrack,
  isTimetrackActive,
} from "@/lib/timetrack-api";

export const ACTIVE_TIMER_QUERY_KEY = ["active-timer"] as const;

export type ActiveTimer = {
  taskId: string;
  id: string;
  start: string;
};

const STORAGE_KEY = "th_active_timer";

export function readStoredActiveTimer(): ActiveTimer | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveTimer;
    if (!parsed?.taskId || !parsed?.id || !parsed?.start) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredActiveTimer(timer: ActiveTimer | null): void {
  if (typeof window === "undefined") return;
  if (!timer) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(timer));
}

export function setActiveTimer(
  queryClient: QueryClient,
  timer: ActiveTimer | null,
): void {
  writeStoredActiveTimer(timer);
  queryClient.setQueryData(ACTIVE_TIMER_QUERY_KEY, timer);
}

/** Confirma no servidor se o timer guardado ainda está activo. */
export async function resolveActiveTimer(): Promise<ActiveTimer | null> {
  const stored = readStoredActiveTimer();
  if (!stored) return null;
  try {
    const list = await fetchTimetrack(stored.taskId);
    const still = list.find(
      (e) => e.id === stored.id && isTimetrackActive(e),
    );
    if (!still) {
      writeStoredActiveTimer(null);
      return null;
    }
    const next: ActiveTimer = {
      taskId: stored.taskId,
      id: still.id,
      start: still.start,
    };
    writeStoredActiveTimer(next);
    return next;
  } catch {
    // Mantém o local se a API falhar (ex.: sem rede).
    return stored;
  }
}
