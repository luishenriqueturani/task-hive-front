"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { type FormEvent } from "react";
import {
  adminCompaniesQueryKey,
  fetchAdminCompanies,
  type AdminCompaniesQuery,
} from "@/lib/admin-api";
import { ADMIN_PLANS_QUERY_KEY, fetchAdminPlans } from "@/lib/plans-api";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function readQuery(params: URLSearchParams): AdminCompaniesQuery {
  const page = Number(params.get("page") || "1");
  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: 20,
    q: params.get("q")?.trim() || undefined,
    document: params.get("document")?.trim() || undefined,
    planSlug: params.get("planSlug") || undefined,
  };
}

/**
 * Tabela paginada de empresas com busca, CNPJ e plano.
 */
export function AdminCompaniesView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = readQuery(searchParams);

  const list = useQuery({
    queryKey: adminCompaniesQueryKey(query),
    queryFn: () => fetchAdminCompanies(query),
  });
  const plans = useQuery({
    queryKey: ADMIN_PLANS_QUERY_KEY,
    queryFn: fetchAdminPlans,
  });

  function hrefFor(next: Partial<AdminCompaniesQuery> & { page?: number }) {
    const params = new URLSearchParams();
    const merged = { ...query, ...next };
    if (merged.q) params.set("q", merged.q);
    if (merged.document) params.set("document", merged.document);
    if (merged.planSlug) params.set("planSlug", merged.planSlug);
    if (merged.page && merged.page > 1) params.set("page", String(merged.page));
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  function onFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    router.push(
      hrefFor({
        page: 1,
        q: String(form.get("q") ?? "").trim() || undefined,
        document: String(form.get("document") ?? "").trim() || undefined,
        planSlug: String(form.get("planSlug") ?? "") || undefined,
      }),
    );
  }

  const total = list.data?.total ?? 0;
  const page = list.data?.page ?? query.page ?? 1;
  const pageSize = list.data?.pageSize ?? 20;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-app-text">
        Empresas
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        Busca, CNPJ e plano. O detalhe mostra o dono, projectos e atribuição.
      </p>

      <form
        onSubmit={onFilter}
        className="mt-6 grid gap-3 rounded-2xl border border-app-border/70 bg-app-surface/70 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-sm lg:col-span-2">
          <span className="text-app-muted">Busca</span>
          <input
            name="q"
            type="search"
            defaultValue={query.q ?? ""}
            placeholder="Nome ou razão social"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">CNPJ</span>
          <input
            name="document"
            type="search"
            defaultValue={query.document ?? ""}
            placeholder="00.000.000/0000-00"
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Plano</span>
          <select
            name="planSlug"
            defaultValue={query.planSlug ?? ""}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-sm text-app-text"
          >
            <option value="">Todos</option>
            {(plans.data ?? []).map((plan) => (
              <option key={plan.slug} value={plan.slug}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end sm:col-span-2 lg:col-span-4">
          <button
            type="submit"
            className="rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Filtrar
          </button>
        </div>
      </form>

      {list.isPending ? (
        <div
          className="mt-8 h-48 animate-pulse rounded-2xl bg-app-surface-elevated/70"
          aria-hidden
        />
      ) : list.isError ? (
        <p className="mt-8 text-sm text-red-700 dark:text-red-300" role="alert">
          Não foi possível carregar as empresas.
        </p>
      ) : (list.data?.items.length ?? 0) === 0 ? (
        <p className="mt-8 text-sm text-app-muted">Nenhuma empresa encontrada.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-app-border/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-app-surface/80 text-app-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">CNPJ</th>
                <th className="px-4 py-3 font-medium">Dono</th>
                <th className="px-4 py-3 font-medium">Plano</th>
                <th className="px-4 py-3 font-medium">Desde</th>
              </tr>
            </thead>
            <tbody>
              {list.data?.items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-app-border/60 bg-app-surface/40"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/companies/${item.id}`}
                      className="font-medium text-app-accent hover:underline"
                    >
                      {item.legalName || item.name}
                    </Link>
                    {item.tradeName && item.tradeName !== item.legalName ? (
                      <span className="mt-0.5 block text-xs text-app-muted">
                        {item.tradeName}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-app-text">
                    {item.document || "—"}
                  </td>
                  <td className="px-4 py-3 text-app-muted">
                    {item.owner?.name || item.owner?.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-app-text">{item.plan.name}</td>
                  <td className="px-4 py-3 text-app-muted">
                    {dateFormatter.format(new Date(item.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > pageSize ? (
        <nav
          className="mt-4 flex items-center justify-between text-sm"
          aria-label="Paginação"
        >
          <p className="text-app-muted">
            Página {page} de {pageCount} · {total} empresas
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={hrefFor({ page: page - 1 })}
                className="rounded-lg border border-app-border px-3 py-1.5 text-app-text"
              >
                Anterior
              </Link>
            ) : null}
            {page < pageCount ? (
              <Link
                href={hrefFor({ page: page + 1 })}
                className="rounded-lg border border-app-border px-3 py-1.5 text-app-text"
              >
                Seguinte
              </Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
