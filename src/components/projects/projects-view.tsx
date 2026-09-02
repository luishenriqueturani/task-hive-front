"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FaPlus, FaUserGroup } from "react-icons/fa6";
import {
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "@/components/dashboard/dashboard-section";
import { PlanLimitHint } from "@/components/plan/plan-limit-hint";
import type { ProjectSummary } from "@/lib/api-types";
import {
  isProjectsLimitReached,
  PLAN_LIMIT_TOOLTIP,
} from "@/lib/plan-quota";
import {
  fetchProjects,
  projectsQueryKey,
} from "@/lib/projects-api";
import { useSessionUser } from "@/lib/use-session-user";
import { ProjectFormModal } from "./project-form-modal";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function ProjectCard({
  project,
  invited,
}: {
  project: ProjectSummary;
  invited?: boolean;
}) {
  const people = project.participants.length + 1;
  return (
    <ItemCard>
      <Link href={`/projects/${project.id}`} className="group block">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-app-text group-hover:text-app-accent">
            {project.name}
          </p>
          {invited ? (
            <span className="shrink-0 rounded-full bg-app-accent/15 px-2 py-0.5 text-xs font-medium text-app-accent">
              Convidado
            </span>
          ) : null}
        </div>
        {project.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-app-muted">
            {project.description}
          </p>
        ) : null}
        <p className="mt-3 flex items-center justify-between text-xs text-app-muted">
          <span className="flex items-center gap-1.5">
            <FaUserGroup className="h-3 w-3" aria-hidden />
            {people} {people === 1 ? "participante" : "participantes"}
          </span>
          <span>{dateFormatter.format(new Date(project.createdAt))}</span>
        </p>
      </Link>
    </ItemCard>
  );
}

function ProjectsGrid({
  pending,
  isError,
  projects,
  empty,
  invited,
}: {
  pending: boolean;
  isError: boolean;
  projects: ProjectSummary[] | undefined;
  empty: string;
  invited?: boolean;
}) {
  if (pending) return <SectionSkeleton blocks={6} />;
  if (isError) {
    return (
      <SectionNotice>
        Não foi possível carregar os projetos. Recarregue a página para tentar
        novamente.
      </SectionNotice>
    );
  }
  if (!projects || projects.length === 0) {
    return <SectionNotice>{empty}</SectionNotice>;
  }
  return (
    <SectionGrid>
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} invited={invited} />
      ))}
    </SectionGrid>
  );
}

/** Listagem em duas secções: próprios (com criar) e convidados. */
export function ProjectsView() {
  const [creating, setCreating] = useState(false);
  const session = useSessionUser();
  const atProjectLimit = isProjectsLimitReached(session.data?.plan);

  const [owned, invited] = useQueries({
    queries: [
      {
        queryKey: projectsQueryKey("owned"),
        queryFn: () => fetchProjects("owned"),
      },
      {
        queryKey: projectsQueryKey("invited"),
        queryFn: () => fetchProjects("invited"),
      },
    ],
  });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-app-text">
          Projetos
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          Os seus projetos e aqueles em que foi convidado.
        </p>
      </div>

      <section className="mt-8" aria-labelledby="owned-projects-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="owned-projects-heading"
            className="text-lg font-semibold text-app-text"
          >
            Meus projetos
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            {atProjectLimit ? <PlanLimitHint /> : null}
            <button
              type="button"
              onClick={() => setCreating(true)}
              disabled={atProjectLimit}
              title={atProjectLimit ? PLAN_LIMIT_TOOLTIP : undefined}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              <FaPlus className="h-3.5 w-3.5" aria-hidden />
              Novo projeto
            </button>
          </div>
        </div>
        <div className="mt-4">
          <ProjectsGrid
            pending={owned.isPending}
            isError={owned.isError}
            projects={owned.data}
            empty='Você ainda não tem projetos. Clique em "Novo projeto" para criar o primeiro.'
          />
        </div>
      </section>

      <section className="mt-10" aria-labelledby="invited-projects-heading">
        <h2
          id="invited-projects-heading"
          className="text-lg font-semibold text-app-text"
        >
          Projetos em que fui convidado
        </h2>
        <div className="mt-4">
          <ProjectsGrid
            pending={invited.isPending}
            isError={invited.isError}
            projects={invited.data}
            empty="Ainda não foi convidado para nenhum projeto."
            invited
          />
        </div>
      </section>

      {creating ? (
        <ProjectFormModal onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}
