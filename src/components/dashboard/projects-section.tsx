"use client";

import { useQuery } from "@tanstack/react-query";
import { FaFolderOpen, FaUserGroup } from "react-icons/fa6";
import type { ProjectSummary } from "@/lib/api-types";
import {
  DashboardSection,
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "./dashboard-section";

async function fetchProjects(): Promise<ProjectSummary[]> {
  const res = await fetch("/api/bff/projects", { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao carregar projetos");
  return res.json();
}

/** Seção de projetos: cada bloco é um projeto (dono ou participante). */
export function ProjectsSection() {
  const projects = useQuery({
    queryKey: ["/projects"],
    queryFn: fetchProjects,
  });

  return (
    <DashboardSection title="Projetos" icon={FaFolderOpen}>
      {projects.isPending ? (
        <SectionSkeleton />
      ) : projects.isError ? (
        <SectionNotice>Não foi possível carregar seus projetos.</SectionNotice>
      ) : projects.data.length === 0 ? (
        <SectionNotice>
          Você ainda não tem projetos. Em breve será possível criá-los por
          aqui.
        </SectionNotice>
      ) : (
        <SectionGrid>
          {projects.data.map((project) => {
            const people = project.participants.length + 1;
            return (
              <ItemCard key={project.id}>
                <p className="truncate text-sm font-semibold text-app-text">
                  {project.name}
                </p>
                {project.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                    {project.description}
                  </p>
                ) : null}
                <p className="mt-3 flex items-center gap-1.5 text-xs text-app-muted">
                  <FaUserGroup className="h-3 w-3" aria-hidden />
                  {people} {people === 1 ? "participante" : "participantes"}
                </p>
              </ItemCard>
            );
          })}
        </SectionGrid>
      )}
    </DashboardSection>
  );
}
