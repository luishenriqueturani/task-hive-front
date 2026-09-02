"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminPlanBenefits } from "@/components/admin/admin-plan-benefits";
import { AdminPlanQuotaForm } from "@/components/admin/admin-plan-quota-form";
import {
  ADMIN_PLANS_QUERY_KEY,
  deleteAdminPlan,
  fetchAdminPlans,
  type AdminPlan,
} from "@/lib/plans-api";

function formatPrice(cents: number): string {
  if (cents <= 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

/**
 * Lista de planos, editor de quotas e CRUD de benefícios.
 * Planos `isSystem` (free-trial) não podem ser apagados.
 */
export function AdminPlansView() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: fetchAdminPlans,
  });

  const selected = useMemo(() => {
    const plans = list.data ?? [];
    if (plans.length === 0) return null;
    return plans.find((plan) => plan.id === selectedId) ?? plans[0];
  }, [list.data, selectedId]);

  const remove = useMutation({
    mutationFn: deleteAdminPlan,
    onSuccess: () => {
      setError(null);
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY });
    },
    onError: (err: unknown) =>
      setError(
        err instanceof Error ? err.message : "Não foi possível apagar o plano.",
      ),
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-app-text">
        Planos
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        Quotas e benefícios comerciais. O trial de sistema não pode ser apagado.
      </p>

      {list.isPending ? (
        <div
          className="mt-8 h-40 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      ) : list.isError ? (
        <p className="mt-8 text-sm text-red-700 dark:text-red-300" role="alert">
          Não foi possível carregar os planos.
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start">
          <PlanList
            plans={list.data ?? []}
            selectedId={selected?.id ?? null}
            onSelect={setSelectedId}
          />
          {selected ? (
            <section
              aria-labelledby="plan-editor-heading"
              className="rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2
                    id="plan-editor-heading"
                    className="text-lg font-semibold text-app-text"
                  >
                    {selected.name}
                  </h2>
                  <p className="mt-1 text-sm text-app-muted">
                    {selected.slug} · {formatPrice(selected.priceCents)} / mês
                    {selected.isSystem ? " · sistema" : null}
                    {selected.isActive ? "" : " · inactivo"}
                  </p>
                </div>
                {selected.isSystem ? null : (
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Apagar o plano ${selected.name}? Esta acção não remove o histórico de assinaturas futuras.`,
                        )
                      ) {
                        remove.mutate(selected.id);
                      }
                    }}
                  >
                    Apagar plano
                  </button>
                )}
              </div>
              {error ? (
                <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
                  {error}
                </p>
              ) : null}
              <AdminPlanQuotaForm key={selected.id} plan={selected} />
              <AdminPlanBenefits plan={selected} />
            </section>
          ) : (
            <p className="text-sm text-app-muted">Nenhum plano cadastrado.</p>
          )}
        </div>
      )}
    </div>
  );
}

function PlanList({
  plans,
  selectedId,
  onSelect,
}: {
  plans: AdminPlan[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="space-y-2" aria-label="Lista de planos">
      {plans.map((plan) => {
        const active = plan.id === selectedId;
        return (
          <li key={plan.id}>
            <button
              type="button"
              onClick={() => onSelect(plan.id)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full cursor-pointer flex-col rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-app-accent/60 bg-app-accent/10"
                  : "border-app-border/70 bg-app-surface/70 hover:bg-app-surface-elevated/80"
              }`}
            >
              <span className="text-sm font-semibold text-app-text">
                {plan.name}
              </span>
              <span className="mt-0.5 text-xs text-app-muted">
                {plan.slug}
                {plan.isSystem ? " · sistema" : ""}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
