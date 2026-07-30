"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FaFolderOpen, FaUserGroup } from "react-icons/fa6";
import { fetchProjects, PROJECTS_QUERY_KEY } from "@/lib/projects-api";
import {
  DashboardSection,
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "./dashboard-section";

/** Seção de projetos: cada bloco é um projeto (dono ou participante). */
export function ProjectsSection() {
  const projects = useQuery({
    queryKey: PROJECTS_QUERY_KEY,
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
          Você ainda não tem projetos.{" "}
          <Link
            href="/projects"
            className="font-medium text-app-accent hover:underline"
          >
            Crie o primeiro
          </Link>
          .
        </SectionNotice>
      ) : (
        <SectionGrid>
          {projects.data.map((project) => {
            const people = project.participants.length + 1;
            return (
              <ItemCard key={project.id}>
                <Link href={`/projects/${project.id}`} className="group block">
                  <p className="truncate text-sm font-semibold text-app-text group-hover:text-app-accent">
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
                </Link>
              </ItemCard>
            );
          })}
        </SectionGrid>
      )}
    </DashboardSection>
  );
}
