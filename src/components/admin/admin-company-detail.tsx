"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminAssignPlan } from "@/components/admin/admin-assign-plan";
import { adminCompanyQueryKey, fetchAdminCompany } from "@/lib/admin-api";
import { formatQuotaUsage } from "@/lib/plan-quota";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/**
 * Detalhe admin: dono, usage, projectos e atribuição de plano.
 */
export function AdminCompanyDetail({ companyId }: { companyId: string }) {
  const detail = useQuery({
    queryKey: adminCompanyQueryKey(companyId),
    queryFn: () => fetchAdminCompany(companyId),
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
        Não foi possível carregar a empresa.
      </p>
    );
  }

  const company = detail.data;

  return (
    <div>
      <p className="text-sm">
        <Link
          href="/admin/companies"
          className="text-app-accent hover:underline"
        >
          ← Empresas
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-app-text">
        {company.legalName || company.name}
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        {company.document || "Sem CNPJ"}
        {company.tradeName ? ` · ${company.tradeName}` : ""}
      </p>
      {company.owner ? (
        <p className="mt-2 text-sm text-app-text">
          Dono:{" "}
          <Link
            href={`/admin/users/${company.owner.id}`}
            className="text-app-accent hover:underline"
          >
            {company.owner.name || company.owner.email}
          </Link>
          {company.owner.name ? ` · ${company.owner.email}` : ""}
        </p>
      ) : (
        <p className="mt-2 text-sm text-app-muted">Sem dono associado.</p>
      )}

      <section
        aria-labelledby="usage-heading"
        className="mt-8 rounded-2xl border border-app-border/70 bg-app-surface/70 p-5"
      >
        <h2 id="usage-heading" className="text-lg font-semibold text-app-text">
          {company.plan.name}
        </h2>
        <p className="mt-1 text-sm text-app-muted">
          {company.plan.status === "TRIAL" ? "Trial" : "Ativo"}
          {company.subscription?.coupon
            ? ` · cupom ${company.subscription.coupon.code}`
            : null}
        </p>
        <ul className="mt-4 space-y-1.5 text-sm text-app-text">
          <li>
            Projectos:{" "}
            {formatQuotaUsage(company.usage.projects, company.limits.maxProjects)}
          </li>
          <li>
            Convidados / projecto: até{" "}
            {company.limits.maxProjectGuests < 0
              ? "Ilimitado"
              : company.limits.maxProjectGuests}
          </li>
        </ul>
      </section>

      <AdminAssignPlan
        currentPlanId={company.plan.id}
        target={{ companyId }}
        invalidateKeys={[
          adminCompanyQueryKey(companyId),
          ["admin-companies"],
        ]}
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
        {company.projects.length === 0 ? (
          <p className="mt-3 text-sm text-app-muted">Sem projectos.</p>
        ) : (
          <ul className="mt-3 divide-y divide-app-border/60">
            {company.projects.map((project) => (
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
