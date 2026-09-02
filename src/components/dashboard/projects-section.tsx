"use client";

import { useQueries } from "@tanstack/react-query";
import Link from "next/link";
import type { ReactNode } from "react";
import { FaFolderOpen, FaUserGroup } from "react-icons/fa6";
import {
  ItemCard,
  SectionNotice,
  SectionSkeleton,
} from "./dashboard-section";
import type { ProjectSummary } from "@/lib/api-types";
import { fetchProjects, projectsQueryKey } from "@/lib/projects-api";

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
        <p className="mt-3 flex items-center gap-1.5 text-xs text-app-muted">
          <FaUserGroup className="h-3 w-3" aria-hidden />
          {people} {people === 1 ? "participante" : "participantes"}
        </p>
      </Link>
    </ItemCard>
  );
}

function ProjectsBlock({
  heading,
  headingId,
  pending,
  isError,
  projects,
  empty,
  invited,
}: {
  heading: string;
  headingId: string;
  pending: boolean;
  isError: boolean;
  projects: ProjectSummary[] | undefined;
  empty: ReactNode;
  invited?: boolean;
}) {
  return (
    <section aria-labelledby={headingId}>
      <h2
        id={headingId}
        className="flex items-center gap-2 text-lg font-semibold text-app-text"
      >
        <FaFolderOpen className="h-4 w-4 text-app-accent" aria-hidden />
        {heading}
      </h2>
      <div className="mt-4">
        {pending ? (
          <SectionSkeleton blocks={4} />
        ) : isError ? (
          <SectionNotice>
            Não foi possível carregar seus projetos.
          </SectionNotice>
        ) : !projects || projects.length === 0 ? (
          <SectionNotice>{empty}</SectionNotice>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                invited={invited}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/** Projectos do painel: próprios em cima, convidados em baixo. */
export function ProjectsSection() {
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
    <div className="flex min-w-0 flex-col gap-8">
      <ProjectsBlock
        heading="Meus projetos"
        headingId="dash-owned-projects"
        pending={owned.isPending}
        isError={owned.isError}
        projects={owned.data}
        empty={
          <>
            Você ainda não tem projetos.{" "}
            <Link
              href="/projects"
              className="font-medium text-app-accent hover:underline"
            >
              Crie o primeiro
            </Link>
            .
          </>
        }
      />
      <ProjectsBlock
        heading="Projetos em que fui convidado"
        headingId="dash-invited-projects"
        pending={invited.isPending}
        isError={invited.isError}
        projects={invited.data}
        invited
        empty="Ainda não foi convidado para nenhum projeto."
      />
    </div>
  );
}
