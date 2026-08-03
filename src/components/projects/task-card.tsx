"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaCheck,
  FaChevronLeft,
  FaChevronRight,
  FaGripVertical,
} from "react-icons/fa6";
import type { TaskSummary } from "@/lib/api-types";

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-app-border/70 bg-app-surface p-3 shadow-sm ${
        isDragging ? "z-20 opacity-90 shadow-lg" : ""
      } ${completed ? "opacity-80" : ""}`}
    >
      <div className="flex items-start gap-2">
        {canManage ? (
          <button
            type="button"
            className="mt-0.5 flex h-6 w-6 shrink-0 cursor-grab items-center justify-center rounded text-app-muted active:cursor-grabbing"
            aria-label={`Arrastar ${task.name}`}
            {...attributes}
            {...listeners}
          >
            <FaGripVertical className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}

        {canManage ? (
          <button
            type="button"
            onClick={onToggleComplete}
            disabled={completing || moving}
            aria-pressed={completed}
            aria-label={
              completed ? `Desmarcar ${task.name}` : `Concluir ${task.name}`
            }
            className={`mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border transition disabled:cursor-not-allowed disabled:opacity-40 ${
              completed
                ? "border-app-accent bg-app-accent text-white"
                : "border-app-border text-transparent hover:border-app-accent"
            }`}
          >
            <FaCheck className="h-3 w-3" aria-hidden />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 cursor-pointer text-left"
        >
          <p
            className={`text-sm font-semibold ${
              completed
                ? "text-app-muted line-through"
                : "text-app-text"
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
      </div>

      {canManage ? (
        <div className="mt-2 flex justify-end gap-1 border-t border-app-border/50 pt-2">
          <button
            type="button"
            disabled={moving || !canMoveLeft}
            onClick={() => onMove("prev")}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={`Mover ${task.name} para a coluna anterior`}
          >
            <FaChevronLeft className="h-3 w-3" aria-hidden />
          </button>
          <button
            type="button"
            disabled={moving || !canMoveRight}
            onClick={() => onMove("next")}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text disabled:cursor-not-allowed disabled:opacity-35"
            aria-label={`Mover ${task.name} para a próxima coluna`}
          >
            <FaChevronRight className="h-3 w-3" aria-hidden />
          </button>
        </div>
      ) : null}
    </li>
  );
}
