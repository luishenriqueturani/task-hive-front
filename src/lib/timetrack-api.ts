import { readApiErrorMessage } from "@/lib/api-error";
import type { TimetrackEntry } from "@/lib/api-types";

export function timetrackQueryKey(taskId: string) {
  return ["/tasks", taskId, "timetrack"] as const;
}

async function parseOrThrow<T>(res: Response, fallback: string): Promise<T> {
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res, fallback));
  }
  return res.json() as Promise<T>;
}

function normalizeEntry(raw: {
  id: string;
  start: string | Date;
  end?: string | Date | null;
  userId?: string;
  userName?: string;
  user?: { id?: string; name?: string | null };
}): TimetrackEntry {
  return {
    id: String(raw.id),
    start:
      typeof raw.start === "string" ? raw.start : new Date(raw.start).toISOString(),
    end: raw.end
      ? typeof raw.end === "string"
        ? raw.end
        : new Date(raw.end).toISOString()
      : null,
    userId: raw.userId ?? raw.user?.id ?? "",
    userName: raw.userName ?? raw.user?.name ?? "—",
  };
}

export async function fetchTimetrack(taskId: string): Promise<TimetrackEntry[]> {
  const res = await fetch(`/api/bff/tasks/${taskId}/timetrack`, {
    credentials: "include",
  });
  const data = await parseOrThrow<unknown[]>(
    res,
    "Não foi possível carregar o timetrack.",
  );
  return (data as Parameters<typeof normalizeEntry>[0][]).map(normalizeEntry);
}

export async function startTimetrack(taskId: string): Promise<TimetrackEntry> {
  const res = await fetch(`/api/bff/tasks/${taskId}/timetrack/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({}),
  });
  const data = await parseOrThrow<Parameters<typeof normalizeEntry>[0]>(
    res,
    "Não foi possível iniciar o timer.",
  );
  return normalizeEntry(data);
}

export async function stopTimetrack(
  taskId: string,
  id: string,
): Promise<TimetrackEntry> {
  const res = await fetch(`/api/bff/tasks/${taskId}/timetrack/${id}/stop`, {
    method: "PATCH",
    credentials: "include",
  });
  const data = await parseOrThrow<Parameters<typeof normalizeEntry>[0]>(
    res,
    "Não foi possível parar o timer.",
  );
  return normalizeEntry(data);
}

export async function deleteTimetrack(
  taskId: string,
  id: string,
): Promise<void> {
  const res = await fetch(`/api/bff/tasks/${taskId}/timetrack/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível remover o registo."),
    );
  }
}

/** Dono do registo ou gestor do projeto (dono/admin). */
export function canManageTimetrack(
  entry: TimetrackEntry,
  user: { id: string } | undefined,
  canManageProject: boolean,
): boolean {
  if (!user) return false;
  if (canManageProject) return true;
  return entry.userId === user.id;
}

export function isTimetrackActive(entry: TimetrackEntry): boolean {
  return entry.end == null;
}

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}
