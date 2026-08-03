"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  clearTaskCompleted,
  completeTask,
  tasksByStageQueryKey,
} from "@/lib/tasks-api";

/** Concluir / reabrir tarefa no card — sem avanço automático de coluna. */
export function useTaskComplete() {
  const queryClient = useQueryClient();

  const invalidateStage = useCallback(
    async (stageId: string) => {
      await queryClient.invalidateQueries({
        queryKey: tasksByStageQueryKey(stageId),
      });
    },
    [queryClient],
  );

  const complete = useMutation({
    mutationFn: (vars: { taskId: string; stageId: string }) =>
      completeTask(vars.taskId),
    onSuccess: async (_data, vars) => {
      await invalidateStage(vars.stageId);
    },
  });

  const uncomplete = useMutation({
    mutationFn: (vars: { taskId: string; stageId: string }) =>
      clearTaskCompleted(vars.taskId),
    onSuccess: async (_data, vars) => {
      await invalidateStage(vars.stageId);
    },
  });

  return {
    completeTask: (taskId: string, stageId: string) =>
      complete.mutate({ taskId, stageId }),
    uncompleteTask: (taskId: string, stageId: string) =>
      uncomplete.mutate({ taskId, stageId }),
    busy: complete.isPending || uncomplete.isPending,
  };
}
