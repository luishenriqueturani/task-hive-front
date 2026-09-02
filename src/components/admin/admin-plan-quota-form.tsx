"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import {
  ADMIN_PLANS_QUERY_KEY,
  updateAdminPlan,
  type AdminPlan,
} from "@/lib/plans-api";

const QUOTA_FIELDS = [
  { name: "maxProjects", label: "Projectos" },
  { name: "maxApiKeys", label: "Chaves API" },
  { name: "maxStandaloneTasks", label: "Tarefas avulsas" },
  { name: "maxProjectGuests", label: "Convidados / projecto" },
] as const;

/**
 * Editor das quatro quotas (-1 = ilimitado) e metadados comerciais.
 */
export function AdminPlanQuotaForm({ plan }: { plan: AdminPlan }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: (dto: Parameters<typeof updateAdminPlan>[1]) =>
      updateAdminPlan(plan.id, dto),
    onSuccess: () => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY });
    },
    onError: (err: unknown) => {
      setSaved(false);
      setError(
        err instanceof Error ? err.message : "Não foi possível guardar.",
      );
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const readInt = (key: string) => Number(form.get(key));
    save.mutate({
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
      priceCents: readInt("priceCents"),
      isActive: form.get("isActive") === "on",
      maxProjects: readInt("maxProjects"),
      maxApiKeys: readInt("maxApiKeys"),
      maxStandaloneTasks: readInt("maxStandaloneTasks"),
      maxProjectGuests: readInt("maxProjectGuests"),
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4" aria-label="Quotas do plano">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-app-muted">Nome</span>
          <input
            name="name"
            required
            defaultValue={plan.name}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Preço (cêntimos)</span>
          <input
            name="priceCents"
            type="number"
            required
            defaultValue={plan.priceCents}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-app-muted">Descrição</span>
        <textarea
          name="description"
          rows={2}
          defaultValue={plan.description ?? ""}
          className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-app-text">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={plan.isActive}
          className="h-4 w-4 accent-app-accent"
        />
        Activo no catálogo público
      </label>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-1 text-sm font-medium text-app-text">
          Quotas (−1 = ilimitado)
        </legend>
        {QUOTA_FIELDS.map((field) => (
          <label key={field.name} className="block text-sm">
            <span className="text-app-muted">{field.label}</span>
            <input
              name={field.name}
              type="number"
              required
              defaultValue={plan[field.name]}
              className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
            />
          </label>
        ))}
      </fieldset>
      {error ? (
        <p className="text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {saved && !save.isPending ? (
        <p className="text-sm text-app-muted">Alterações guardadas.</p>
      ) : null}
      <button
        type="submit"
        disabled={save.isPending}
        className="cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
      >
        Guardar quotas
      </button>
    </form>
  );
}
