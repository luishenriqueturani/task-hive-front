"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { FormError, FormField, SubmitButton } from "@/components/auth/form-field";
import { Modal } from "@/components/ui/modal";
import type { ProjectSummary } from "@/lib/api-types";
import {
  createProject,
  PROJECTS_QUERY_KEY,
  updateProject,
  type ProjectInput,
} from "@/lib/projects-api";

/**
 * Modal de criação/edição de projeto. Com `project` definido, edita
 * (PATCH); sem ele, cria (POST). Invalida a listagem ao concluir.
 */
export function ProjectFormModal({
  project,
  onClose,
}: {
  project?: ProjectSummary;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isEdit = !!project;

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (data: ProjectInput) =>
      isEdit ? updateProject(project.id, data) : createProject(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      onClose();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível salvar o projeto.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      if (!name.trim()) {
        setFormError("Informe o nome do projeto.");
        return;
      }
      save.mutate({
        name: name.trim(),
        description: description.trim() || undefined,
      });
    },
    [name, description, save],
  );

  const pending = save.isPending;

  return (
    <Modal
      title={isEdit ? "Editar projeto" : "Novo projeto"}
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={onSubmit} noValidate>
        <FormError message={formError} />

        <FormField
          id="project-name"
          label="Nome"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex.: Backlog 2026"
          maxLength={255}
          disabled={pending}
          aria-invalid={!!formError}
        />

        <div>
          <label
            htmlFor="project-description"
            className="block text-sm font-medium text-app-text"
          >
            Descrição{" "}
            <span className="font-normal text-app-muted">(opcional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Sobre o que é este projeto?"
            rows={3}
            disabled={pending}
            className="mt-1 w-full resize-y rounded-lg border border-app-border bg-app-surface px-2 py-2 text-app-text shadow-sm outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 sm:mt-1.5 sm:px-3 sm:py-2.5"
          />
        </div>

        <SubmitButton
          pending={pending}
          pendingLabel={isEdit ? "Salvando…" : "Criando…"}
        >
          {isEdit ? "Salvar alterações" : "Criar projeto"}
        </SubmitButton>
      </form>
    </Modal>
  );
}
