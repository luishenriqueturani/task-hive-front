"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPenToSquare,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";
import type { ProjectStage, TaskSummary } from "@/lib/api-types";
import {
  canMoveOrRemoveTask,
  fetchTasksByStage,
  moveTaskToStage,
  tasksByStageQueryKey,
} from "@/lib/tasks-api";
import { useSessionUser } from "@/lib/use-session-user";
import { useTaskComplete } from "@/lib/use-task-complete";
import { TaskCard } from "./task-card";

export function StageColumn({
  stage,
  stageIndex,
  stages,
  canManageStages,
  onCreateTask,
  onOpenTask,
  onRename,
  onDelete,
  onReorder,
  busyStages,
}: {
  stage: ProjectStage;
  stageIndex: number;
  stages: ProjectStage[];
  canManageStages: boolean;
  onCreateTask: () => void;
  onOpenTask: (task: TaskSummary) => void;
  onRename: () => void;
  onDelete: () => void;
  onReorder: (direction: "prev" | "next") => void;
  busyStages: boolean;
}) {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const { setNodeRef, isOver } = useDroppable({
    // Prefixo evita colisão com ids de tasks e facilita o hit em coluna vazia.
    id: `column-${stage.id}`,
    data: { type: "column", stageId: stage.id },
  });

  const tasks = useQuery({
    queryKey: tasksByStageQueryKey(stage.id),
    queryFn: () => fetchTasksByStage(stage.id),
  });

  const { completeTask, uncompleteTask, busy: completing } = useTaskComplete();

  const move = useMutation({
    mutationFn: ({
      task,
      direction,
    }: {
      task: TaskSummary;
      direction: "prev" | "next";
    }) => {
      const target =
        direction === "prev"
          ? stages[stageIndex - 1]
          : stages[stageIndex + 1];
      if (!target) throw new Error("Não há coluna nesta direção.");
      return moveTaskToStage(task.id, target.id);
    },
    onSuccess: async (_data, vars) => {
      const target =
        vars.direction === "prev"
          ? stages[stageIndex - 1]
          : stages[stageIndex + 1];
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: tasksByStageQueryKey(stage.id),
        }),
        target
          ? queryClient.invalidateQueries({
              queryKey: tasksByStageQueryKey(target.id),
            })
          : Promise.resolve(),
      ]);
    },
  });

  const items = (tasks.data ?? []).map((t) => t.id);

  return (
    <section
      className={`flex h-full min-h-0 w-72 shrink-0 flex-col rounded-2xl border border-app-border/70 bg-app-surface/40 ${
        isOver ? "ring-2 ring-app-accent/40" : ""
      }`}
    >
      <header className="flex shrink-0 items-start justify-between gap-1 border-b border-app-border/60 px-2 py-2.5">
        <div className="min-w-0 flex-1 px-1">
          <h3 className="truncate text-sm font-semibold text-app-text">
            {stage.name}
          </h3>
          <p className="text-xs text-app-muted">
            {tasks.data?.length ?? 0}{" "}
            {(tasks.data?.length ?? 0) === 1 ? "tarefa" : "tarefas"}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          {canManageStages ? (
            <>
              <button
                type="button"
                disabled={busyStages || stageIndex === 0}
                onClick={() => onReorder("prev")}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Mover coluna ${stage.name} para a esquerda`}
              >
                <FaChevronLeft className="h-3 w-3" aria-hidden />
              </button>
              <button
                type="button"
                disabled={busyStages || stageIndex === stages.length - 1}
                onClick={() => onReorder("next")}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Mover coluna ${stage.name} para a direita`}
              >
                <FaChevronRight className="h-3 w-3" aria-hidden />
              </button>
              <button
                type="button"
                disabled={busyStages}
                onClick={onRename}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:opacity-40"
                aria-label={`Renomear ${stage.name}`}
              >
                <FaPenToSquare className="h-3.5 w-3.5" aria-hidden />
              </button>
              <button
                type="button"
                disabled={busyStages}
                onClick={onDelete}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-red-500/15 hover:text-red-700 disabled:opacity-40 dark:hover:text-red-300"
                aria-label={`Excluir ${stage.name}`}
              >
                <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
              </button>
            </>
          ) : null}
          <button
            type="button"
            onClick={onCreateTask}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
            aria-label={`Nova tarefa em ${stage.name}`}
          >
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </header>

      <div
        ref={setNodeRef}
        className={`flex min-h-0 flex-1 flex-col overflow-y-auto p-2 ${
          isOver ? "bg-app-accent/5" : ""
        }`}
      >
        {tasks.isPending ? (
          <div
            className="h-20 animate-pulse rounded-xl bg-app-surface-elevated/70"
            aria-hidden
          />
        ) : tasks.isError ? (
          <p className="px-1 py-2 text-xs text-red-700 dark:text-red-300">
            Falha ao carregar tarefas.
          </p>
        ) : (
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {(tasks.data ?? []).length === 0 ? (
              <div className="flex min-h-[12rem] flex-1 items-center justify-center rounded-xl border border-dashed border-transparent px-1 py-3">
                <p className="text-center text-xs text-app-muted">
                  Nenhuma tarefa
                </p>
              </div>
            ) : (
              <ul className="min-h-[12rem] flex-1 space-y-2">
                {(tasks.data ?? []).map((task) => {
                  const canManage = canMoveOrRemoveTask(task, session.data);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task}
                      canManage={canManage}
                      canMoveLeft={stageIndex > 0}
                      canMoveRight={stageIndex < stages.length - 1}
                      moving={move.isPending}
                      completing={completing}
                      onOpen={() => onOpenTask(task)}
                      onMove={(direction) => move.mutate({ task, direction })}
                      onToggleComplete={() => {
                        if (task.completedAt) {
                          uncompleteTask(task.id, stage.id);
                        } else {
                          completeTask(task.id, stage.id);
                        }
                      }}
                    />
                  );
                })}
              </ul>
            )}
          </SortableContext>
        )}
      </div>
    </section>
  );
}
