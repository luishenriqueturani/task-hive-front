"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminAssignPlan } from "@/components/admin/admin-assign-plan";
import { adminUserQueryKey, fetchAdminUser } from "@/lib/admin-api";
import { formatQuotaUsage } from "@/lib/plan-quota";
import { ACCOUNT_KIND, canUseStandaloneTodos } from "@/lib/account-kind";

const ACCOUNT_LABELS: Record<string, string> = {
  INDIVIDUAL: "Pessoa física",
  COMPANY: "Empresa",
};

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Cliente",
  ADMIN_GOD: "Administrador",
  ADMIN_COLLABORATOR: "Colaborador",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Detalhe admin: usage, projectos e atribuição de plano (+ cupom).
 */
export function AdminUserDetail({ userId }: { userId: string }) {
  const detail = useQuery({
    queryKey: adminUserQueryKey(userId),
    queryFn: () => fetchAdminUser(userId),
  });

  if (detail.isPending) {
    return (
      <div
        className="h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
        aria-hidden
      />
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <p className="text-sm text-red-700 dark:text-red-300" role="alert">
        Não foi possível carregar o utilizador.
      </p>
    );
  }

  const user = detail.data;
  const showTodos = canUseStandaloneTodos(
    user.accountKind === ACCOUNT_KIND.COMPANY
      ? ACCOUNT_KIND.COMPANY
      : ACCOUNT_KIND.INDIVIDUAL,
  );

  return (
    <div>
      <p className="text-sm">
        <Link href="/admin/users" className="text-app-accent hover:underline">
          ← Utilizadores
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-app-text">
        {user.name || user.email}
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        {user.email} · {ACCOUNT_LABELS[user.accountKind] ?? user.accountKind} ·{" "}
        {ROLE_LABELS[user.role] ?? user.role}
        {user.company ? ` · ${user.company.legalName}` : ""}
      </p>

      <section
        aria-labelledby="usage-heading"
        className="mt-8 rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
      >
        <h2 id="usage-heading" className="text-lg font-semibold text-app-text">
          {user.plan.name}
        </h2>
        <p className="mt-1 text-sm text-app-muted">
          {user.plan.status === "TRIAL" ? "Trial" : "Ativo"}
          {user.subscription?.coupon
            ? ` · cupom ${user.subscription.coupon.code}`
            : null}
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-app-text">
          <li>
            Projectos:{" "}
            {formatQuotaUsage(user.usage.projects, user.limits.maxProjects)}
          </li>
          <li>
            Chaves API:{" "}
            {formatQuotaUsage(user.usage.apiKeys, user.limits.maxApiKeys)}
          </li>
          {showTodos ? (
            <li>
              Tarefas avulsas:{" "}
              {formatQuotaUsage(
                user.usage.standaloneTasks,
                user.limits.maxStandaloneTasks,
              )}
            </li>
          ) : null}
          <li>
            Convidados / projecto: até{" "}
            {user.limits.maxProjectGuests < 0
              ? "Ilimitado"
              : user.limits.maxProjectGuests}
          </li>
        </ul>
      </section>

      <AdminAssignPlan
        currentPlanId={user.plan.id}
        target={{ userId }}
        invalidateKeys={[adminUserQueryKey(userId), ["admin-users"]]}
      />

      <section
        aria-labelledby="projects-heading"
        className="mt-6 rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
      >
        <h2
          id="projects-heading"
          className="text-lg font-semibold text-app-text"
        >
          Projectos
        </h2>
        {user.projects.length === 0 ? (
          <p className="mt-3 text-sm text-app-muted">Sem projectos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-app-border/60">
            {user.projects.map((project) => (
              <li
                key={project.id}
                className="flex items-center justify-between gap-3 py-2 text-sm"
              >
                <Link
                  href={`/projects/${project.id}`}
                  className="font-medium text-app-accent hover:underline"
                >
                  {project.name}
                </Link>
                <span className="text-app-muted">
                  {dateFormatter.format(new Date(project.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
