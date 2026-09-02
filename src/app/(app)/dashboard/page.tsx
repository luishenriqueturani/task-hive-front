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

/** Conteúdo do painel — contas CNPJ não vêem a coluna de tarefas avulsas. */
export function DashboardPageContent({ user }: { user: SessionUser }) {
  const firstName = user.name?.trim().split(/\s+/)[0];
  const showTodos = canUseStandaloneTodos(user.accountKind);

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <h1 className="text-2xl font-semibold tracking-tight text-app-text">
          {firstName ? `Olá, ${firstName}!` : "Olá!"}
        </h1>
        <p className="mt-1 text-sm text-app-muted">
          Este é o seu resumo no Task Hive.
        </p>

        <div
          data-testid="dashboard-home"
          className={
            showTodos
              ? "mt-8 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(17.5rem,20rem)_minmax(0,1fr)] lg:items-start lg:gap-8"
              : "mt-8"
          }
        >
          {showTodos ? <ToDosSection /> : null}
          <ProjectsSection />
        </div>
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const user = await requireSessionUser();
  return <DashboardPageContent user={user} />;
}
