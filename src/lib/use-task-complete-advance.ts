"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import type { ProjectStage } from "@/lib/api-types";
import {
  clearTaskCompleted,
  completeTask,
  tasksByStageQueryKey,
  updateTask,
} from "@/lib/tasks-api";

const ADVANCE_MS = 1500;

/**
 * Concluir no card → após 1,5s avança para a próxima coluna e limpa
 * `completedAt` (histórico permanece no backend).
 */
export function useTaskCompleteAdvance({
  stages,
  stageIndex,
}: {
  stages: ProjectStage[];
  stageIndex: number;
}) {
  const queryClient = useQueryClient();
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const invalidateStages = useCallback(
    async (...stageIds: (string | undefined)[]) => {
      await Promise.all(
        [...new Set(stageIds.filter(Boolean))].map((id) =>
          queryClient.invalidateQueries({
            queryKey: tasksByStageQueryKey(id!),
          }),
        ),
      );
    },
    [queryClient],
  );

  const clearTimer = useCallback((taskId: string) => {
    const t = timers.current.get(taskId);
    if (t) {
      clearTimeout(t);
      timers.current.delete(taskId);
    }
  }, []);

  useEffect(() => {
    return () => {
      for (const t of timers.current.values()) clearTimeout(t);
      timers.current.clear();
    };
  }, []);

  const complete = useMutation({
    mutationFn: (vars: { taskId: string; stageId: string }) =>
      completeTask(vars.taskId),
    onSuccess: async (_data, vars) => {
      await invalidateStages(vars.stageId);
      clearTimer(vars.taskId);
      const next = stages[stageIndex + 1];
      if (!next) return;
      const handle = setTimeout(async () => {
        timers.current.delete(vars.taskId);
        try {
          await updateTask(vars.taskId, {
            stageId: next.id,
            completedAt: null,
          });
          await invalidateStages(vars.stageId, next.id);
        } catch {
          /* invalidação parcial; UI reflecte erro no próximo fetch */
        }
      }, ADVANCE_MS);
      timers.current.set(vars.taskId, handle);
    },
  });

  const uncomplete = useMutation({
    mutationFn: (vars: { taskId: string; stageId: string }) => {
      clearTimer(vars.taskId);
      return clearTaskCompleted(vars.taskId);
    },
    onSuccess: async (_data, vars) => {
      await invalidateStages(vars.stageId);
    },
  });

  return {
    completeTask: (taskId: string, stageId: string) =>
      complete.mutate({ taskId, stageId }),
    uncompleteTask: (taskId: string, stageId: string) =>
      uncomplete.mutate({ taskId, stageId }),
    busy: complete.isPending || uncomplete.isPending,
    advancingTaskIds: timers,
  };
}
