import type { Metadata } from "next";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { ToDosSection } from "@/components/dashboard/todos-section";
import { requireSessionUser } from "@/lib/redirect-to-login";

export const metadata: Metadata = {
  title: "Painel · Task Hive",
  description: "Resumo dos seus projetos e tarefas.",
};

export default async function DashboardPage() {
  const user = await requireSessionUser();

  const firstName = user.name?.trim().split(/\s+/)[0];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-app-text">
        {firstName ? `Olá, ${firstName}!` : "Olá!"}
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        Este é o seu resumo no Task Hive.
      </p>

      <div className="mt-8">
        <ProjectsSection />
        <ToDosSection />
      </div>
    </div>
  );
}
