"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import {
  FormError,
  FormField,
  SubmitButton,
} from "@/components/auth/form-field";
import { SectionNotice } from "@/components/dashboard/dashboard-section";
import { Modal } from "@/components/ui/modal";
import type { ProjectStage, TaskSummary } from "@/lib/api-types";
import {
  createStage,
  deleteStage,
  fetchStages,
  stagesQueryKey,
  swapStageOrder,
  updateStage,
} from "@/lib/stages-api";
import {
  moveTaskToStage,
  tasksByStageQueryKey,
  updateTask,
} from "@/lib/tasks-api";
import { useSessionUser } from "@/lib/use-session-user";
import { StageColumn } from "./stage-column";
import { TaskDetailModal } from "./task-detail-modal";
import { TaskFormModal } from "./task-form-modal";

/** Composer estilo Trello: placeholder de coluna que abre o formulário inline. */
function AddColumnComposer({
  projectId,
  nextOrder,
}: {
  projectId: string;
  nextOrder: number;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const create = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Informe o nome da coluna.");
      return createStage({ name: trimmed, projectId, order: nextOrder });
    },
    onSuccess: async () => {
      setName("");
      setError(null);
      setOpen(false);
      await queryClient.invalidateQueries({
        queryKey: stagesQueryKey(projectId),
      });
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível criar a coluna.",
      );
    },
  });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="flex h-fit w-72 shrink-0 cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-app-border/80 bg-app-surface-elevated/35 px-4 py-3 text-sm font-medium text-app-muted transition hover:border-app-accent/50 hover:bg-app-surface-elevated/55 hover:text-app-text"
      >
        <FaPlus className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Adicionar coluna
      </button>
    );
  }

  return (
    <form
      className="flex w-72 shrink-0 flex-col gap-2 rounded-2xl border border-app-border/70 bg-app-surface/80 p-3 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        create.mutate();
      }}
      noValidate
    >
      <FormError message={error} />
      <input
        ref={inputRef}
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome da coluna…"
        maxLength={255}
        disabled={create.isPending}
        aria-label="Nome da coluna"
        className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-sm text-app-text outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25"
        onKeyDown={(e) => {
          if (e.key === "Escape" && !create.isPending) {
            setOpen(false);
            setName("");
            setError(null);
          }
        }}
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={create.isPending || !name.trim()}
          className="cursor-pointer rounded-lg bg-app-accent px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {create.isPending ? "Criando…" : "Criar coluna"}
        </button>
        <button
          type="button"
          disabled={create.isPending}
          onClick={() => {
            setOpen(false);
            setName("");
            setError(null);
          }}
          className="cursor-pointer rounded-lg px-2 py-1.5 text-sm text-app-muted transition hover:text-app-text"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function findTaskInCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  stageIds: string[],
  taskId: UniqueIdentifier,
): { stageId: string; task: TaskSummary; index: number } | null {
  for (const stageId of stageIds) {
    const list =
      queryClient.getQueryData<TaskSummary[]>(tasksByStageQueryKey(stageId)) ??
      [];
    const index = list.findIndex((t) => t.id === String(taskId));
    if (index >= 0) {
      return { stageId, task: list[index], index };
    }
  }
  return null;
}

/** Prefere o ponteiro / intersecção — `closestCorners` falha em colunas vazias. */
const kanbanCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  const rectHits = rectIntersection(args);
  if (rectHits.length > 0) return rectHits;
  return closestCorners(args);
};

function resolveDropTarget(
  overId: string,
  overData: unknown,
  stageIds: string[],
  queryClient: ReturnType<typeof useQueryClient>,
): { stageId: string; index: number } | null {
  const data = overData as { type?: string; stageId?: string } | undefined;
  if (data?.type === "column" && data.stageId) {
    const dest =
      queryClient.getQueryData<TaskSummary[]>(
        tasksByStageQueryKey(data.stageId),
      ) ?? [];
    return { stageId: data.stageId, index: dest.length };
  }

  if (overId.startsWith("column-")) {
    const stageId = overId.slice("column-".length);
    if (!stageIds.includes(stageId)) return null;
    const dest =
      queryClient.getQueryData<TaskSummary[]>(
        tasksByStageQueryKey(stageId),
      ) ?? [];
    return { stageId, index: dest.length };
  }

  if (stageIds.includes(overId)) {
    const dest =
      queryClient.getQueryData<TaskSummary[]>(
        tasksByStageQueryKey(overId),
      ) ?? [];
    return { stageId: overId, index: dest.length };
  }

  const overLoc = findTaskInCaches(queryClient, stageIds, overId);
  if (!overLoc) return null;
  return { stageId: overLoc.stageId, index: overLoc.index };
}

/**
 * Quadro kanban: colunas + DnD + composer. Gestão de colunas quando `canManage`.
 */
export function ProjectKanban({
  projectId,
  canManage = false,
}: {
  projectId: string;
  canManage?: boolean;
}) {
  const queryClient = useQueryClient();
  const session = useSessionUser();

  const stages = useQuery({
    queryKey: stagesQueryKey(projectId),
    queryFn: () => fetchStages(projectId),
  });

  const [createStageId, setCreateStageId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskSummary | null>(null);
  const [editingStage, setEditingStage] = useState<{
    stage: ProjectStage;
    name: string;
  } | null>(null);
  const [deletingStage, setDeletingStage] = useState<ProjectStage | null>(null);
  const [activeTask, setActiveTask] = useState<TaskSummary | null>(null);
  // Origem fixa no início do drag — `active.data.stageId` muda no onDragOver
  // (cache optimista) e não pode ser usado no onDragEnd para chamar a API.
  const dragOriginRef = useRef<{
    stageId: string;
    index: number;
  } | null>(null);

  // Long-press (~delay) no card inteiro — equivalente web ao longPress do RN.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 220, tolerance: 8 },
    }),
  );

  const invalidateStages = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: stagesQueryKey(projectId),
    });
  }, [queryClient, projectId]);

  const rename = useMutation({
    mutationFn: async () => {
      if (!editingStage) return;
      const trimmed = editingStage.name.trim();
      if (!trimmed) throw new Error("Informe o nome da coluna.");
      return updateStage(editingStage.stage.id, { name: trimmed });
    },
    onSuccess: async () => {
      setEditingStage(null);
      await invalidateStages();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteStage(id),
    onSuccess: async () => {
      setDeletingStage(null);
      await invalidateStages();
    },
  });

  const reorder = useMutation({
    mutationFn: ({
      stage,
      direction,
    }: {
      stage: ProjectStage;
      direction: "prev" | "next";
    }) => {
      const list = stages.data ?? [];
      const index = list.findIndex((s) => s.id === stage.id);
      const swapWith =
        direction === "prev" ? list[index - 1] : list[index + 1];
      if (!swapWith) throw new Error("Não é possível reordenar.");
      return swapStageOrder(stage, swapWith);
    },
    onSuccess: () => invalidateStages(),
  });

  const list = stages.data ?? [];
  const stageIds = list.map((s) => s.id);

  const onDragStart = (event: DragStartEvent) => {
    const found = findTaskInCaches(queryClient, stageIds, event.active.id);
    setActiveTask(found?.task ?? null);
    dragOriginRef.current = found
      ? { stageId: found.stageId, index: found.index }
      : null;
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const activeLoc = findTaskInCaches(queryClient, stageIds, activeId);
    if (!activeLoc) return;

    const target = resolveDropTarget(
      String(over.id),
      over.data.current,
      stageIds,
      queryClient,
    );
    if (!target || target.stageId === activeLoc.stageId) return;

    // Em coluna vazia (ou drop no contentor), vai para o fim; sobre um card, usa o índice dele.
    const overIsColumn =
      (over.data.current as { type?: string } | undefined)?.type === "column" ||
      String(over.id).startsWith("column-");
    const overIndex = overIsColumn ? target.index : target.index;

    const sourceKey = tasksByStageQueryKey(activeLoc.stageId);
    const destKey = tasksByStageQueryKey(target.stageId);
    const source =
      queryClient.getQueryData<TaskSummary[]>(sourceKey)?.slice() ?? [];
    const dest = queryClient.getQueryData<TaskSummary[]>(destKey)?.slice() ?? [];

    const [moved] = source.splice(activeLoc.index, 1);
    if (!moved) return;
    const updated = {
      ...moved,
      stage: {
        id: target.stageId,
        name: list.find((s) => s.id === target.stageId)?.name ?? "",
      },
    };
    dest.splice(Math.min(overIndex, dest.length), 0, updated);
    queryClient.setQueryData(sourceKey, source);
    queryClient.setQueryData(destKey, dest);
  };

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    const origin = dragOriginRef.current;
    dragOriginRef.current = null;
    const { active, over } = event;

    const invalidateTouched = async (...ids: string[]) => {
      await Promise.all(
        [...new Set(ids.filter(Boolean))].map((id) =>
          queryClient.invalidateQueries({
            queryKey: tasksByStageQueryKey(id),
          }),
        ),
      );
    };

    if (!over || !origin) {
      await Promise.all(
        stageIds.map((id) =>
          queryClient.invalidateQueries({
            queryKey: tasksByStageQueryKey(id),
          }),
        ),
      );
      return;
    }

    const activeId = String(active.id);
    const fromStage = origin.stageId;

    const target = resolveDropTarget(
      String(over.id),
      over.data.current,
      stageIds,
      queryClient,
    );
    const targetStageId = target?.stageId ?? fromStage;

    // Cross-column: onDragOver já reordenou o cache — usa a posição actual.
    // Same-column: o cache costuma estar intacto; usa o índice do alvo do drop.
    const destList =
      queryClient.getQueryData<TaskSummary[]>(
        tasksByStageQueryKey(targetStageId),
      ) ?? [];
    const optimisticIndex = destList.findIndex((t) => t.id === activeId);
    const finalIndex =
      targetStageId !== fromStage
        ? optimisticIndex >= 0
          ? optimisticIndex
          : (target?.index ?? 0)
        : (target?.index ?? origin.index);

    try {
      if (targetStageId !== fromStage) {
        await moveTaskToStage(activeId, targetStageId, finalIndex);
      } else if (finalIndex !== origin.index) {
        await updateTask(activeId, { order: finalIndex });
      }
    } finally {
      await invalidateTouched(fromStage, targetStageId);
    }
  };

  if (stages.isPending) {
    return (
      <section className="mt-6 flex min-h-0 flex-1 flex-col" aria-label="Quadro">
        <div
          className="h-64 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      </section>
    );
  }

  if (stages.isError) {
    return (
      <section className="mt-6 flex min-h-0 flex-1 flex-col" aria-label="Quadro">
        <SectionNotice>Não foi possível carregar o quadro.</SectionNotice>
      </section>
    );
  }

  const nextOrder =
    list.length > 0 ? Math.max(...list.map((s) => s.order)) + 1 : 0;
  const busyStages = rename.isPending || remove.isPending || reorder.isPending;

  return (
    <section
      className="mt-6 flex min-h-0 flex-1 flex-col"
      aria-label="Quadro"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={kanbanCollisionDetection}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
      >
        <div className="flex min-h-0 flex-1 items-stretch gap-3 overflow-x-auto pb-3">
          {list.map((stage, index) => (
            <StageColumn
              key={stage.id}
              stage={stage}
              stageIndex={index}
              stages={list}
              canManageStages={canManage}
              onCreateTask={() => setCreateStageId(stage.id)}
              onOpenTask={setSelectedTask}
              onRename={() => {
                setEditingStage({ stage, name: stage.name });
              }}
              onDelete={() => setDeletingStage(stage)}
              onReorder={(direction) => reorder.mutate({ stage, direction })}
              busyStages={busyStages}
            />
          ))}
          {canManage ? (
            <AddColumnComposer projectId={projectId} nextOrder={nextOrder} />
          ) : list.length === 0 ? (
            <SectionNotice>
              Este projeto ainda não tem colunas.
            </SectionNotice>
          ) : null}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="w-72 rounded-xl border border-app-border/70 bg-app-surface p-3 shadow-xl">
              <p className="text-sm font-semibold text-app-text">
                {activeTask.name}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {createStageId ? (
        <TaskFormModal
          projectId={projectId}
          stageId={createStageId}
          onClose={() => setCreateStageId(null)}
        />
      ) : null}

      {selectedTask ? (
        <TaskDetailModal
          task={selectedTask}
          projectId={projectId}
          sessionUser={session.data}
          canManageProject={canManage}
          onClose={() => setSelectedTask(null)}
          onTaskUpdated={setSelectedTask}
        />
      ) : null}

      {editingStage ? (
        <Modal
          title="Renomear coluna"
          onClose={() => {
            if (!rename.isPending) setEditingStage(null);
          }}
        >
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              rename.mutate();
            }}
            noValidate
          >
            <FormError
              message={
                rename.isError
                  ? rename.error instanceof Error
                    ? rename.error.message
                    : "Não foi possível renomear."
                  : null
              }
            />
            <FormField
              id="stage-name"
              label="Nome"
              name="name"
              type="text"
              value={editingStage.name}
              onChange={(e) =>
                setEditingStage({
                  stage: editingStage.stage,
                  name: e.target.value,
                })
              }
              placeholder="Ex.: Em progresso"
              maxLength={255}
              disabled={rename.isPending}
              autoFocus
            />
            <SubmitButton pending={rename.isPending} pendingLabel="Salvando…">
              Salvar
            </SubmitButton>
          </form>
        </Modal>
      ) : null}

      {deletingStage ? (
        <Modal
          title="Excluir coluna"
          onClose={() => {
            if (!remove.isPending) setDeletingStage(null);
          }}
        >
          <p className="text-sm text-app-muted">
            Excluir a coluna{" "}
            <span className="font-medium text-app-text">
              {deletingStage.name}
            </span>
            ? As tarefas associadas podem ficar inacessíveis no quadro.
          </p>
          {remove.isError ? (
            <p
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
              role="alert"
            >
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível excluir a coluna."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeletingStage(null)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(deletingStage.id)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remove.isPending ? "Excluindo…" : "Excluir coluna"}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
