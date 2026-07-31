"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FaArrowLeft } from "react-icons/fa6";
import { SectionNotice } from "@/components/dashboard/dashboard-section";
import { Modal } from "@/components/ui/modal";
import {
  canManageProject,
  deleteProject,
  fetchProjects,
  PROJECTS_QUERY_KEY,
} from "@/lib/projects-api";
import { useSessionUser } from "@/lib/use-session-user";
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectFormModal } from "./project-form-modal";
import { ProjectKanban } from "./project-kanban";
import { ProjectParticipants } from "./project-participants";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

function DetailSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="h-8 w-1/3 animate-pulse rounded-lg bg-app-surface-elevated/70" />
      <div className="h-24 animate-pulse rounded-2xl bg-app-surface-elevated/70" />
      <div className="h-64 animate-pulse rounded-2xl bg-app-surface-elevated/70" />
    </div>
  );
}

/**
 * Detalhe do projeto a partir da listagem (`GET /projects` já vem com
 * userOwner e participants e filtrada por acesso — `GET /projects/:id`
 * não carrega relações nem valida permissão).
 */
export function ProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const projects = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
  });

  const remove = useMutation({
    mutationFn: () => deleteProject(projectId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      router.push("/projects");
      router.refresh();
    },
  });

  if (projects.isPending) return <DetailSkeleton />;

  const project = projects.data?.find((p) => p.id === projectId);

  if (projects.isError || !project) {
    return (
      <div>
        <SectionNotice>
          Projeto não encontrado ou você não tem acesso a ele.
        </SectionNotice>
        <Link
          href="/projects"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-app-accent hover:underline"
        >
          <FaArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Voltar aos projetos
        </Link>
      </div>
    );
  }

  const manageable = canManageProject(project, session.data);

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-6 lg:px-10 xl:px-14">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-medium text-app-accent hover:underline"
      >
        <FaArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Projetos
      </Link>

      <div className="mt-4 flex items-start gap-6">
        <div className="min-w-0 flex-[1.2]">
          <div className="flex min-w-0 items-center gap-1">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-app-text">
              {project.name}
            </h1>
            {manageable ? (
              <ProjectActionsMenu
                onEdit={() => setEditing(true)}
                onDelete={() => setConfirmingDelete(true)}
              />
            ) : null}
          </div>
          <p className="mt-1 text-sm text-app-muted">
            Criado em {dateFormatter.format(new Date(project.createdAt))}
            {project.userOwner
              ? ` · Dono: ${project.userOwner.name || project.userOwner.email}`
              : ""}
          </p>

          {project.description ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-app-muted">
              {project.description}
            </p>
          ) : null}
        </div>

        <ProjectParticipants project={project} canManage={manageable} />
      </div>

      <ProjectKanban projectId={project.id} canManage={manageable} />

      {editing ? (
        <ProjectFormModal project={project} onClose={() => setEditing(false)} />
      ) : null}

      {confirmingDelete ? (
        <Modal title="Excluir projeto" onClose={() => setConfirmingDelete(false)}>
          <p className="text-sm text-app-muted">
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-app-text">{project.name}</span>?
            O projeto sairá da sua lista.
          </p>
          {remove.isError ? (
            <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200" role="alert">
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível excluir o projeto."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remove.isPending ? "Excluindo…" : "Excluir projeto"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
