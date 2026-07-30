import type { Metadata } from "next";
import { ProjectsView } from "@/components/projects/projects-view";

export const metadata: Metadata = {
  title: "Projetos · Task Hive",
  description: "Seus projetos no Task Hive.",
};

export default function ProjectsPage() {
  return <ProjectsView />;
}
