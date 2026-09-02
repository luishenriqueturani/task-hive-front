import type { Metadata } from "next";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { ToDosSection } from "@/components/dashboard/todos-section";
import { canUseStandaloneTodos } from "@/lib/account-kind";
import { requireSessionUser } from "@/lib/redirect-to-login";
import type { SessionUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Painel · Task Hive",
  description: "Resumo dos seus projetos e tarefas.",
};

/** Conteúdo do painel — contas CNPJ não vêem a secção de tarefas avulsas. */
export function DashboardPageContent({ user }: { user: SessionUser }) {
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
        {canUseStandaloneTodos(user.accountKind) ? <ToDosSection /> : null}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireSessionUser();
  return <DashboardPageContent user={user} />;
}
