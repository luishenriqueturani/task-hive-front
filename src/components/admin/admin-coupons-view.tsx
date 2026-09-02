"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AdminCouponForm } from "@/components/admin/admin-coupon-form";
import {
  ADMIN_COUPONS_QUERY_KEY,
  deleteAdminCoupon,
  fetchAdminCoupons,
  type AdminCoupon,
} from "@/lib/coupons-api";
import { ADMIN_PLANS_QUERY_KEY, fetchAdminPlans } from "@/lib/plans-api";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

function formatDiscount(coupon: AdminCoupon): string {
  if (coupon.type === "PERCENT") return `${coupon.value} %`;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(coupon.value / 100);
}

/**
 * Lista de cupons, editor CRUD e histórico de redemptions.
 */
export function AdminCouponsView() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ADMIN_COUPONS_QUERY_KEY,
    queryFn: fetchAdminCoupons,
  });
  const plans = useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: fetchAdminPlans,
  });

  const paidPlans = useMemo(
    () => (plans.data ?? []).filter((plan) => !plan.isSystem),
    [plans.data],
  );

  const selected = useMemo(() => {
    if (selectedId === "new") return null;
    const coupons = list.data ?? [];
    if (coupons.length === 0) return null;
    return coupons.find((coupon) => coupon.id === selectedId) ?? coupons[0];
  }, [list.data, selectedId]);

  const creating = selectedId === "new" || ((list.data?.length ?? 0) === 0 && !list.isPending);

  const remove = useMutation({
    mutationFn: deleteAdminCoupon,
    onSuccess: () => {
      setError(null);
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ADMIN_COUPONS_QUERY_KEY });
    },
    onError: (err: unknown) =>
      setError(
        err instanceof Error ? err.message : "Não foi possível apagar o cupom.",
      ),
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text">
            Cupons
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            Descontos para atribuição de plano pelo admin. O cliente ainda não
            compra.
          </p>
        </div>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          onClick={() => setSelectedId("new")}
        >
          Novo cupom
        </button>
      </div>

      {list.isPending ? (
        <div
          className="mt-8 h-40 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      ) : list.isError ? (
        <p className="mt-8 text-sm text-red-700 dark:text-red-300" role="alert">
          Não foi possível carregar os cupons.
        </p>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] lg:items-start">
          <CouponList
            coupons={list.data ?? []}
            selectedId={creating ? "new" : (selected?.id ?? null)}
            onSelect={setSelectedId}
          />
          <section
            aria-labelledby="coupon-editor-heading"
            className="rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
          >
            {creating ? (
              <>
                <h2
                  id="coupon-editor-heading"
                  className="text-lg font-semibold text-app-text"
                >
                  Novo cupom
                </h2>
                <div className="mt-4">
                  <AdminCouponForm
                    key="new"
                    coupon={null}
                    paidPlans={paidPlans}
                    onCreated={(id) => setSelectedId(id)}
                  />
                </div>
              </>
            ) : selected ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2
                      id="coupon-editor-heading"
                      className="text-lg font-semibold text-app-text"
                    >
                      {selected.code}
                    </h2>
                    <p className="mt-1 text-sm text-app-muted">
                      {formatDiscount(selected)}
                      {selected.isActive ? "" : " · inactivo"}
                      {" · "}
                      {selected.redeemedCount}
                      {selected.maxRedemptions != null
                        ? ` / ${selected.maxRedemptions}`
                        : ""}{" "}
                      usos
                    </p>
                  </div>
                  <button
                    type="button"
                    className="cursor-pointer rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (window.confirm(`Apagar o cupom ${selected.code}?`)) {
                        remove.mutate(selected.id);
                      }
                    }}
                  >
                    Apagar cupom
                  </button>
                </div>
                {error ? (
                  <p
                    className="mt-3 text-sm text-red-700 dark:text-red-300"
                    role="alert"
                  >
                    {error}
                  </p>
                ) : null}
                <div className="mt-6">
                  <AdminCouponForm
                    key={selected.id}
                    coupon={selected}
                    paidPlans={paidPlans}
                  />
                </div>
                <RedemptionsTable coupon={selected} />
              </>
            ) : (
              <p className="text-sm text-app-muted">Nenhum cupom cadastrado.</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function CouponList({
  coupons,
  selectedId,
  onSelect,
}: {
  coupons: AdminCoupon[];
  selectedId: string | null;
  onSelect: (id: string | "new") => void;
}) {
  if (coupons.length === 0) {
    return (
      <p className="text-sm text-app-muted">Ainda não há cupons.</p>
    );
  }
  return (
    <ul className="space-y-2" aria-label="Lista de cupons">
      {coupons.map((coupon) => {
        const active = coupon.id === selectedId;
        return (
          <li key={coupon.id}>
            <button
              type="button"
              onClick={() => onSelect(coupon.id)}
              aria-current={active ? "true" : undefined}
              className={`flex w-full cursor-pointer flex-col rounded-xl border px-3 py-3 text-left transition ${
                active
                  ? "border-app-accent/60 bg-app-accent/10"
                  : "border-app-border/70 bg-app-surface/70 hover:bg-app-surface-elevated/80"
              }`}
            >
              <span className="text-sm font-semibold text-app-text">
                {coupon.code}
              </span>
              <span className="mt-0.5 text-xs text-app-muted">
                {formatDiscount(coupon)}
                {coupon.applicablePlans.length > 0
                  ? ` · ${coupon.applicablePlans.map((plan) => plan.name).join(", ")}`
                  : " · todos os planos pagos"}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RedemptionsTable({ coupon }: { coupon: AdminCoupon }) {
  return (
    <section className="mt-8 border-t border-app-border/60 pt-6" aria-labelledby="redemptions-heading">
      <h3 id="redemptions-heading" className="text-base font-semibold text-app-text">
        Redemptions
      </h3>
      {coupon.redemptions.length === 0 ? (
        <p className="mt-2 text-sm text-app-muted">
          Nenhuma utilização ainda. As redemptions aparecem quando um admin
          atribuir um plano com este cupom.
        </p>
      ) : (
        <table className="mt-3 w-full text-left text-sm">
          <caption className="sr-only">
            Utilizações do cupom {coupon.code}
          </caption>
          <thead>
            <tr className="border-b border-app-border/70 text-app-muted">
              <th scope="col" className="py-2 pr-3 font-medium">
                Data
              </th>
              <th scope="col" className="py-2 pr-3 font-medium">
                Utilizador
              </th>
              <th scope="col" className="py-2 font-medium">
                Assinatura
              </th>
            </tr>
          </thead>
          <tbody className="text-app-text">
            {coupon.redemptions.map((item) => (
              <tr key={item.id} className="border-b border-app-border/40">
                <td className="py-2 pr-3">
                  {dateFormatter.format(new Date(item.createdAt))}
                </td>
                <td className="py-2 pr-3">
                  {item.user?.email ?? "—"}
                </td>
                <td className="py-2 font-mono text-xs">
                  {item.subscriptionId ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
