"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import type { AdminPlan } from "@/lib/plans-api";
import {
  ADMIN_COUPONS_QUERY_KEY,
  createAdminCoupon,
  updateAdminCoupon,
  type AdminCoupon,
  type CouponPayload,
  type CouponType,
} from "@/lib/coupons-api";

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function readPayload(form: FormData): CouponPayload {
  const maxRaw = String(form.get("maxRedemptions") ?? "").trim();
  return {
    code: String(form.get("code") ?? "").trim(),
    type: String(form.get("type") ?? "PERCENT") as CouponType,
    value: Number(form.get("value")),
    maxRedemptions: maxRaw ? Number(maxRaw) : null,
    startsAt: fromLocalInput(String(form.get("startsAt") ?? "")),
    expiresAt: fromLocalInput(String(form.get("expiresAt") ?? "")),
    isActive: form.get("isActive") === "on",
    planIds: form.getAll("planIds").map(String),
  };
}

/**
 * Criar/editar cupom: código, tipo, valor, datas, tecto e planos pagos.
 */
export function AdminCouponForm({
  coupon,
  paidPlans,
  onCreated,
}: {
  coupon: AdminCoupon | null;
  paidPlans: AdminPlan[];
  onCreated?: (id: string) => void;
}) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const selectedIds = new Set(coupon?.applicablePlans.map((plan) => plan.id));

  const save = useMutation({
    mutationFn: (dto: CouponPayload) =>
      coupon
        ? updateAdminCoupon(coupon.id, dto)
        : createAdminCoupon(dto),
    onSuccess: (result) => {
      setError(null);
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
      if (!coupon) onCreated?.(result.id);
    },
    onError: (err: unknown) => {
      setSaved(false);
      setError(
        err instanceof Error ? err.message : "Não foi possível guardar o cupom.",
      );
    },
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate(readPayload(new FormData(event.currentTarget)));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4"
      aria-label={coupon ? "Editar cupom" : "Novo cupom"}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-app-muted">Código</span>
          <input
            name="code"
            required
            defaultValue={coupon?.code ?? ""}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 uppercase text-app-text"
            placeholder="WELCOME10"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Tipo</span>
          <select
            name="type"
            defaultValue={coupon?.type ?? "PERCENT"}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          >
            <option value="PERCENT">Percentual (%)</option>
            <option value="FIXED_CENTS">Valor fixo (cêntimos)</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Valor</span>
          <input
            name="value"
            type="number"
            required
            min={1}
            defaultValue={coupon?.value ?? 10}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Tecto de usos (vazio = ilimitado)</span>
          <input
            name="maxRedemptions"
            type="number"
            min={1}
            defaultValue={coupon?.maxRedemptions ?? ""}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Início</span>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.startsAt ?? null)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Fim</span>
          <input
            name="expiresAt"
            type="datetime-local"
            defaultValue={toLocalInput(coupon?.expiresAt ?? null)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm text-app-text">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={coupon?.isActive ?? true}
          className="h-4 w-4 accent-app-accent"
        />
        Activo
      </label>
      <fieldset>
        <legend className="text-sm font-medium text-app-text">
          Planos aplicáveis
        </legend>
        <p className="mt-1 text-xs text-app-muted">
          Sem selecção = todos os planos pagos (nunca o trial).
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {paidPlans.map((plan) => (
            <label
              key={plan.id}
              className="flex items-center gap-2 text-sm text-app-text"
            >
              <input
                type="checkbox"
                name="planIds"
                value={plan.id}
                defaultChecked={selectedIds.has(plan.id)}
                className="h-4 w-4 accent-app-accent"
              />
              {plan.name}
            </label>
          ))}
        </div>
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
        {coupon ? "Guardar cupom" : "Criar cupom"}
      </button>
    </form>
  );
}
