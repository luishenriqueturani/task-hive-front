"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useQuery } from "@tanstack/react-query";
import { FaCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa6";
import type { TaskSummary } from "@/lib/api-types";
import { fetchSubtasks, subtasksQueryKey } from "@/lib/subtasks-api";

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function stopDragPropagation(e: React.SyntheticEvent) {
  e.stopPropagation();
}

export function TaskCard({
  task,
  canMoveLeft,
  canMoveRight,
  canManage,
  onOpen,
  onMove,
  onToggleComplete,
  moving,
  completing,
}: {
  task: TaskSummary;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canManage: boolean;
  onOpen: () => void;
  onMove: (direction: "prev" | "next") => void;
  onToggleComplete: () => void;
  moving: boolean;
  completing: boolean;
}) {
  const completed = Boolean(task.completedAt);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canManage,
    data: { type: "task", task, stageId: task.stage?.id },
  });

  const subtasks = useQuery({
    queryKey: subtasksQueryKey(task.id),
    queryFn: () => fetchSubtasks(task.id),
    staleTime: 60_000,
  });

  const doneCount = (subtasks.data ?? []).filter((s) => s.isCompleted).length;
  const totalCount = subtasks.data?.length ?? 0;
  const showSubtaskCount = totalCount > 0;
  const showFooter = canManage || showSubtaskCount;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl border border-app-border/70 bg-app-surface p-3 shadow-sm ${
        canManage ? "touch-none" : ""
      } ${isDragging ? "z-20 opacity-90 shadow-lg" : ""} ${
        completed ? "opacity-80" : ""
      }`}
      {...(canManage ? { ...attributes, ...listeners } : {})}
    >
      {canManage ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete();
          }}
          onPointerDown={stopDragPropagation}
          disabled={completing || moving}
          aria-pressed={completed}
          aria-label={
            completed ? `Desmarcar ${task.name}` : `Concluir ${task.name}`
          }
          className={`absolute left-2 top-3 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${
            completed
              ? "border-app-accent bg-app-accent text-white opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
              : "border-app-border bg-app-surface text-transparent opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:border-app-accent"
          }`}
        >
          <FaCheck className="h-3 w-3" aria-hidden />
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (!isDragging) onOpen();
        }}
        className="w-full cursor-pointer text-left"
      >
        <p
          className={`text-sm font-semibold ${
            completed ? "text-app-muted line-through" : "text-app-text"
          }`}
        >
          {task.name}
        </p>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-app-muted">
            {task.description}
          </p>
        ) : null}
        {task.finishDate ? (
          <p className="mt-2 text-[11px] text-app-muted">
            Até {shortDate.format(new Date(task.finishDate))}
          </p>
        ) : null}
      </button>

      {showFooter ? (
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-app-border/50 pt-2">
          <p className="min-w-0 text-[11px] text-app-muted">
            {showSubtaskCount ? (
              <span
                aria-label={`${doneCount} de ${totalCount} subtarefas concluídas`}
              >
                {doneCount}/{totalCount}
              </span>
            ) : null}
          </p>
          {canManage ? (
            <div className="flex shrink-0 gap-1">
              <button
                type="button"
                disabled={moving || !canMoveLeft}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove("prev");
                }}
                onPointerDown={stopDragPropagation}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Mover ${task.name} para a coluna anterior`}
              >
                <FaChevronLeft className="h-3 w-3" aria-hidden />
              </button>
              <button
                type="button"
                disabled={moving || !canMoveRight}
                onClick={(e) => {
                  e.stopPropagation();
                  onMove("next");
                }}
                onPointerDown={stopDragPropagation}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
                aria-label={`Mover ${task.name} para a próxima coluna`}
              >
                <FaChevronRight className="h-3 w-3" aria-hidden />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
