"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent } from "react";
import { assignAdminSubscription } from "@/lib/admin-api";
import { ADMIN_PLANS_QUERY_KEY, fetchAdminPlans } from "@/lib/plans-api";

/**
 * Formulário admin para atribuir plano (+ cupom opcional) a user ou empresa.
 */
export function AdminAssignPlan({
  currentPlanId,
  target,
  invalidateKeys,
}: {
  currentPlanId: string | null;
  target: { userId: string } | { companyId: string };
  invalidateKeys: ReadonlyArray<readonly unknown[]>;
}) {
  const queryClient = useQueryClient();
  const plans = useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: fetchAdminPlans,
  });

  const assign = useMutation({
    mutationFn: assignAdminSubscription,
    onSuccess: () => {
      for (const key of invalidateKeys) {
        void queryClient.invalidateQueries({ queryKey: [...key] });
      }
    },
  });

  function onAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const planId = String(form.get("planId") ?? "");
    const couponCode = String(form.get("couponCode") ?? "").trim();
    if (!planId) return;
    assign.mutate({
      ...target,
      planId,
      couponCode: couponCode || undefined,
    });
  }

  return (
    <section
      aria-labelledby="assign-heading"
      className="mt-6 rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
    >
      <h2 id="assign-heading" className="text-lg font-semibold text-app-text">
        Atribuir plano
      </h2>
      <form
        onSubmit={onAssign}
        className="mt-4 grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
      >
        <label className="block text-sm">
          <span className="text-app-muted">Novo plano</span>
          <select
            name="planId"
            required
            aria-label="Novo plano"
            defaultValue={
              currentPlanId ??
              plans.data?.find((plan) => plan.slug === "free-trial")?.id ??
              ""
            }
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          >
            {(plans.data ?? []).map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Cupom (opcional)</span>
          <input
            name="couponCode"
            type="text"
            autoComplete="off"
            placeholder="WELCOME10"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm uppercase text-app-text"
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={assign.isPending}
            className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            Guardar
          </button>
        </div>
      </form>
      {assign.isSuccess ? (
        <p className="mt-3 text-sm text-app-muted">Plano actualizado.</p>
      ) : null}
      {assign.isError ? (
        <p className="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">
          {assign.error instanceof Error
            ? assign.error.message
            : "Não foi possível atribuir o plano."}
        </p>
      ) : null}
    </section>
  );
}
