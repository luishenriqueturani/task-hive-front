"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FaPlus, FaUserGroup } from "react-icons/fa6";
import {
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "@/components/dashboard/dashboard-section";
import { fetchProjects, PROJECTS_QUERY_KEY } from "@/lib/projects-api";
import { ProjectFormModal } from "./project-form-modal";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Listagem de projetos com criação via modal. */
export function ProjectsView() {
  const [creating, setCreating] = useState(false);

  const projects = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
    queryFn: fetchProjects,
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text">
            Projetos
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            Projetos em que você é dono ou participante.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg sm:px-4"
        >
          <FaPlus className="h-3.5 w-3.5" aria-hidden />
          Novo projeto
        </button>
      </div>

      <div className="mt-6">
        {projects.isPending ? (
          <SectionSkeleton blocks={6} />
        ) : projects.isError ? (
          <SectionNotice>
            Não foi possível carregar os projetos. Recarregue a página para
            tentar novamente.
          </SectionNotice>
        ) : projects.data.length === 0 ? (
          <SectionNotice>
            Você ainda não tem projetos. Clique em &quot;Novo projeto&quot;
            para criar o primeiro.
          </SectionNotice>
        ) : (
          <SectionGrid>
            {projects.data.map((project) => {
              const people = project.participants.length + 1;
              return (
                <ItemCard key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="group block"
                  >
                    <p className="truncate text-sm font-semibold text-app-text group-hover:text-app-accent">
                      {project.name}
                    </p>
                    {project.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                        {project.description}
                      </p>
                    ) : null}
                    <p className="mt-3 flex items-center justify-between text-xs text-app-muted">
                      <span className="flex items-center gap-1.5">
                        <FaUserGroup className="h-3 w-3" aria-hidden />
                        {people}{" "}
                        {people === 1 ? "participante" : "participantes"}
                      </span>
                      <span>
                        {dateFormatter.format(new Date(project.createdAt))}
                      </span>
                    </p>
                  </Link>
                </ItemCard>
              );
            })}
          </SectionGrid>
        )}
      </div>

      {creating ? (
        <ProjectFormModal onClose={() => setCreating(false)} />
      ) : null}
    </div>
  );
}
