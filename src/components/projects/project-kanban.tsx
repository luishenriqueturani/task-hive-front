"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaPenToSquare,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";
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
  canMoveOrRemoveTask,
  fetchTasksByStage,
  moveTaskToStage,
  tasksByStageQueryKey,
} from "@/lib/tasks-api";
import { useSessionUser } from "@/lib/use-session-user";
import { TaskDetailDrawer } from "./task-detail-drawer";
import { TaskFormModal } from "./task-form-modal";

const shortDate = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function TaskCard({
  task,
  canMoveLeft,
  canMoveRight,
  canManage,
  onOpen,
  onMove,
  moving,
}: {
  task: TaskSummary;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canManage: boolean;
  onOpen: () => void;
  onMove: (direction: "prev" | "next") => void;
  moving: boolean;
}) {
  return (
    <li className="rounded-xl border border-app-border/70 bg-app-surface p-3 shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        className="w-full cursor-pointer text-left"
      >
        <p className="text-sm font-semibold text-app-text">{task.name}</p>
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

function StageColumn({
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

  const tasks = useQuery({
    queryKey: tasksByStageQueryKey(stage.id),
    queryFn: () => fetchTasksByStage(stage.id),
  });

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

  return (
    <section className="flex max-h-[min(70vh,52rem)] w-72 shrink-0 flex-col rounded-2xl border border-app-border/70 bg-app-surface/40">
      <header className="flex items-start justify-between gap-1 border-b border-app-border/60 px-2 py-2.5">
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

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {tasks.isPending ? (
          <div
            className="h-20 animate-pulse rounded-xl bg-app-surface-elevated/70"
            aria-hidden
          />
        ) : tasks.isError ? (
          <p className="px-1 py-2 text-xs text-red-700 dark:text-red-300">
            Falha ao carregar tarefas.
          </p>
        ) : (tasks.data ?? []).length === 0 ? (
          <p className="px-1 py-3 text-center text-xs text-app-muted">
            Nenhuma tarefa
          </p>
        ) : (
          <ul className="space-y-2">
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
                  onOpen={() => onOpenTask(task)}
                  onMove={(direction) => move.mutate({ task, direction })}
                />
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

/**
 * Quadro kanban unificado: colunas + tarefas + composer para nova coluna
 * (fluxo tipo Trello). Gestão de colunas quando `canManage`.
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
  const [editingStage, setEditingStage] = useState<ProjectStage | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingStage, setDeletingStage] = useState<ProjectStage | null>(null);

  const invalidateStages = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: stagesQueryKey(projectId),
    });
  }, [queryClient, projectId]);

  const rename = useMutation({
    mutationFn: async () => {
      if (!editingStage) return;
      const trimmed = editName.trim();
      if (!trimmed) throw new Error("Informe o nome da coluna.");
      return updateStage(editingStage.id, { name: trimmed });
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

  if (stages.isPending) {
    return (
      <section className="mt-6" aria-label="Quadro">
        <div
          className="h-64 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      </section>
    );
  }

  if (stages.isError) {
    return (
      <section className="mt-6" aria-label="Quadro">
        <SectionNotice>
          Não foi possível carregar o quadro.
        </SectionNotice>
      </section>
    );
  }

  const list = stages.data ?? [];
  const nextOrder =
    list.length > 0 ? Math.max(...list.map((s) => s.order)) + 1 : 0;
  const busyStages = rename.isPending || remove.isPending || reorder.isPending;

  return (
    <section className="mt-6" aria-label="Quadro">
      <div className="flex items-stretch gap-3 overflow-x-auto pb-3">
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
              setEditingStage(stage);
              setEditName(stage.name);
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

      {createStageId ? (
        <TaskFormModal
          projectId={projectId}
          stageId={createStageId}
          onClose={() => setCreateStageId(null)}
        />
      ) : null}

      {selectedTask ? (
        <TaskDetailDrawer
          task={selectedTask}
          projectId={projectId}
          sessionUser={session.data}
          canManageProject={canManage}
          onClose={() => setSelectedTask(null)}
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
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
