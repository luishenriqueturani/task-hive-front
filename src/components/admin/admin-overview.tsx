"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FaBuilding, FaLifeRing, FaUsers } from "react-icons/fa6";
import {
  ADMIN_STATS_QUERY_KEY,
  fetchAdminStats,
} from "@/lib/admin-api";

const CARDS = [
  {
    key: "users" as const,
    label: "Utilizadores",
    href: "/admin/users",
    icon: FaUsers,
  },
  {
    key: "companies" as const,
    label: "Empresas",
    href: "/admin/companies",
    icon: FaBuilding,
  },
  {
    key: "openTickets" as const,
    label: "Tickets abertos",
    href: "/admin",
    icon: FaLifeRing,
  },
];

/**
 * Resumo do painel: contagens de utilizadores, empresas e tickets.
 */
export function AdminOverview() {
  const stats = useQuery({
    queryKey: ADMIN_STATS_QUERY_KEY,
    queryFn: fetchAdminStats,
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-app-text">
        Administração
      </h1>
      <p className="mt-1 text-sm text-app-muted">
        Resumo da plataforma. O chat de suporte entra numa onda posterior.
      </p>

      {stats.isPending ? (
        <div
          className="mt-8 grid gap-4 sm:grid-cols-3"
          aria-hidden
        >
          <div className="h-28 animate-pulse rounded-2xl bg-app-surface-elevated/70" />
          <div className="h-28 animate-pulse rounded-2xl bg-app-surface-elevated/70" />
          <div className="h-28 animate-pulse rounded-2xl bg-app-surface-elevated/70" />
        </div>
      ) : stats.isError ? (
        <p className="mt-8 text-sm text-red-700 dark:text-red-300" role="alert">
          Não foi possível carregar o resumo.
        </p>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-3">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const value = stats.data?.[card.key] ?? 0;
            return (
              <li key={card.key}>
                <Link
                  href={card.href}
                  className="block rounded-2xl border border-app-border/70 bg-app-surface/70 p-5 transition hover:border-app-border hover:bg-app-surface-elevated/80"
                >
                  <div className="flex items-center gap-2 text-sm font-medium text-app-muted">
                    <Icon className="h-4 w-4" aria-hidden />
                    {card.label}
                  </div>
                  <p className="mt-3 text-3xl font-semibold tabular-nums text-app-text">
                    {value}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
