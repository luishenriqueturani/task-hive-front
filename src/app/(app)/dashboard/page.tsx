import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { ToDosSection } from "@/components/dashboard/todos-section";
import { getSessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Painel · Task Hive",
  description: "Resumo dos seus projetos e tarefas.",
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

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
