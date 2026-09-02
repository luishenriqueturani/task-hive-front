"use client";

import {
  formatPlanQuota,
  LANDING_PLANS,
} from "@/components/landing/plans-catalog";
import { SettingsShell } from "@/components/settings/settings-shell";
import { canUseStandaloneTodos } from "@/lib/account-kind";
import { formatQuotaUsage } from "@/lib/plan-quota";
import { useSessionUser } from "@/lib/use-session-user";

const STATUS_LABELS: Record<string, string> = {
  TRIAL: "Trial",
  ACTIVE: "Ativo",
  PAST_DUE: "Pagamento pendente",
  CANCELED: "Cancelado",
  CANCELLED: "Cancelado",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

/**
 * Plano actual, uso das quotas e tabela informativa de upgrade (sem checkout).
 */
export function PlanSettingsView() {
  const session = useSessionUser();
  const user = session.data;
  const plan = user?.plan ?? null;
  const showTodos = user ? canUseStandaloneTodos(user.accountKind) : true;

  return (
    <SettingsShell
      current="plan"
      wide
      title="Plano"
      description="Uso actual e comparação com os planos pagos. O checkout ainda não está disponível nesta etapa."
    >
      {session.isPending ? (
        <div className="h-28 animate-pulse rounded-2xl bg-app-surface-elevated/70" aria-hidden />
      ) : session.isError ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          Não foi possível carregar a sessão.
        </p>
      ) : plan ? (
        <section
          aria-labelledby="current-plan-heading"
          className="rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
        >
          <h2
            id="current-plan-heading"
            className="text-lg font-semibold text-app-text"
          >
            {plan.name}
          </h2>
          <p className="mt-1 text-sm text-app-muted">
            {statusLabel(plan.status)}
            {plan.slug === "free-trial" ? " · trial gratuito" : null}
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-app-text">
            <li>
              Projectos:{" "}
              {formatQuotaUsage(plan.usage.projects, plan.limits.maxProjects)}
            </li>
            <li>
              Chaves API:{" "}
              {formatQuotaUsage(plan.usage.apiKeys, plan.limits.maxApiKeys)}
            </li>
            {showTodos ? (
              <li>
                Tarefas avulsas:{" "}
                {formatQuotaUsage(
                  plan.usage.standaloneTasks,
                  plan.limits.maxStandaloneTasks,
                )}
              </li>
            ) : null}
            <li>
              Convidados / projecto: até{" "}
              {formatPlanQuota(plan.limits.maxProjectGuests)}
            </li>
          </ul>
        </section>
      ) : (
        <p className="rounded-2xl border border-dashed border-app-border/70 bg-app-surface/40 px-4 py-6 text-sm text-app-muted">
          A sua conta não tem um plano de cliente associado (administração ou
          dados ainda indisponíveis).
        </p>
      )}

      <section className="mt-10" aria-labelledby="upgrade-heading">
        <h2
          id="upgrade-heading"
          className="text-lg font-semibold text-app-text"
        >
          Comparar planos
        </h2>
        <p className="mt-1 text-sm text-app-muted">
          Tabela informativa. Não há pagamento nesta etapa.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-xl border-collapse text-left text-sm">
            <caption className="sr-only">
              Quotas dos planos Starter, Pro e Business
            </caption>
            <thead>
              <tr className="border-b border-app-border/70 text-app-muted">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Quota
                </th>
                {LANDING_PLANS.map((item) => (
                  <th
                    key={item.slug}
                    scope="col"
                    className="py-2 px-3 font-medium"
                  >
                    <span className="block text-app-text">{item.name}</span>
                    <span className="block text-xs font-normal">
                      {item.priceLabel} / mês
                    </span>
                    {plan?.slug === item.slug ? (
                      <span className="mt-1 inline-block rounded-full bg-app-accent/15 px-2 py-0.5 text-xs font-medium text-app-accent">
                        Plano actual
                      </span>
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-app-text">
              <tr className="border-b border-app-border/50">
                <th scope="row" className="py-2 pr-3 font-medium text-app-muted">
                  Projectos
                </th>
                {LANDING_PLANS.map((item) => (
                  <td key={item.slug} className="py-2 px-3">
                    {formatPlanQuota(item.maxProjects)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-app-border/50">
                <th scope="row" className="py-2 pr-3 font-medium text-app-muted">
                  Chaves API
                </th>
                {LANDING_PLANS.map((item) => (
                  <td key={item.slug} className="py-2 px-3">
                    {formatPlanQuota(item.maxApiKeys)}
                  </td>
                ))}
              </tr>
              {showTodos ? (
                <tr className="border-b border-app-border/50">
                  <th
                    scope="row"
                    className="py-2 pr-3 font-medium text-app-muted"
                  >
                    Tarefas avulsas
                  </th>
                  {LANDING_PLANS.map((item) => (
                    <td key={item.slug} className="py-2 px-3">
                      {formatPlanQuota(item.maxStandaloneTasks)}
                    </td>
                  ))}
                </tr>
              ) : null}
              <tr>
                <th scope="row" className="py-2 pr-3 font-medium text-app-muted">
                  Convidados / projecto
                </th>
                {LANDING_PLANS.map((item) => (
                  <td key={item.slug} className="py-2 px-3">
                    {formatPlanQuota(item.maxProjectGuests)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </SettingsShell>
  );
}
