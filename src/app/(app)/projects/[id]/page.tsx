import type { Metadata } from "next";
import { ProjectDetail } from "@/components/projects/project-detail";

export const metadata: Metadata = {
  title: "Projeto · Task Hive",
  description: "Detalhes do projeto.",
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectDetail projectId={id} />;
}
