"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import {
  FormError,
  FormField,
  SubmitButton,
} from "@/components/auth/form-field";
import { Modal } from "@/components/ui/modal";
import type { TaskSummary } from "@/lib/api-types";
import {
  createTaskWithDetails,
  tasksByStageQueryKey,
  updateTask,
} from "@/lib/tasks-api";

function toDateInput(value?: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

/**
 * Modal criar/editar tarefa. Create: POST + PATCH opcional para
 * description/finishDate. Edit: PATCH.
 */
export function TaskFormModal({
  projectId: _projectId,
  stageId,
  task,
  onClose,
}: {
  projectId: string;
  stageId: string;
  task?: TaskSummary;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!task;

  const [name, setName] = useState(task?.name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [finishDate, setFinishDate] = useState(
    toDateInput(task?.finishDate),
  );
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Informe o título da tarefa.");
      const details = {
        description: description.trim() || undefined,
        finishDate: finishDate
          ? new Date(`${finishDate}T12:00:00.000Z`).toISOString()
          : undefined,
      };
      if (isEdit) {
        return updateTask(task.id, { name: trimmed, ...details });
      }
      return createTaskWithDetails({
        name: trimmed,
        stageId,
        ...details,
      });
    },
    onSuccess: async (saved) => {
      const stageKeys = new Set<string>([stageId]);
      if (saved.stage?.id) stageKeys.add(saved.stage.id);
      if (task?.stage?.id) stageKeys.add(task.stage.id);
      await Promise.all(
        [...stageKeys].map((id) =>
          queryClient.invalidateQueries({
            queryKey: tasksByStageQueryKey(id),
          }),
        ),
      );
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível salvar a tarefa.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      save.mutate();
    },
    [save],
  );

  return (
    <Modal
      title={isEdit ? "Editar tarefa" : "Nova tarefa"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormError message={formError} />
        <FormField
          id="task-name"
          label="Título"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="O que precisa ser feito?"
          maxLength={255}
          disabled={save.isPending}
          autoFocus
        />
        <div>
          <label
            htmlFor="task-description"
            className="block text-sm font-medium text-app-text"
          >
            Descrição{" "}
            <span className="font-normal text-app-muted">(opcional)</span>
          </label>
          <textarea
            id="task-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            disabled={save.isPending}
            className="mt-1 w-full resize-y rounded-lg border border-app-border bg-app-surface px-2 py-2 text-app-text shadow-sm outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 sm:mt-1.5 sm:px-3 sm:py-2.5"
          />
        </div>
        <FormField
          id="task-finish"
          label="Data limite (opcional)"
          name="finishDate"
          type="date"
          value={finishDate}
          onChange={(e) => setFinishDate(e.target.value)}
          disabled={save.isPending}
        />
        <SubmitButton
          pending={save.isPending}
          pendingLabel={isEdit ? "Salvando…" : "Criando…"}
        >
          {isEdit ? "Salvar alterações" : "Criar tarefa"}
        </SubmitButton>
      </form>
    </Modal>
  );
}
