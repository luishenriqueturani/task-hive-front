"use client";

import Link from "next/link";
import { useState } from "react";
import {
  formatPlanQuota,
  LANDING_PLANS,
} from "@/components/landing/plans-catalog";

type Audience = "person" | "company";

/**
 * Cards de planos com copy estática (§5.2). O toggle Empresa esconde
 * tarefas avulsas (não aplicam a contas CNPJ).
 */
export function LandingPlans({ signedIn }: { signedIn: boolean }) {
  const [audience, setAudience] = useState<Audience>("person");
  const ctaHref = signedIn ? "/dashboard" : "/register";
  const ctaLabel = signedIn ? "Abrir painel" : "Começar grátis";

  return (
    <section id="planos" className="scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-2xl font-semibold tracking-tight text-app-text">
          Planos
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-app-muted sm:text-base">
          Preços de referência. Comece grátis; o trial não aparece como produto
          pago.
        </p>

        <div
          className="mt-6 inline-flex rounded-lg border border-app-border bg-app-surface/80 p-1"
          role="group"
          aria-label="Ver planos para"
        >
          <button
            type="button"
            aria-pressed={audience === "person"}
            onClick={() => setAudience("person")}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
              audience === "person"
                ? "bg-app-accent text-white"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Pessoas
          </button>
          <button
            type="button"
            aria-pressed={audience === "company"}
            onClick={() => setAudience("company")}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
              audience === "company"
                ? "bg-app-accent text-white"
                : "text-app-muted hover:text-app-text"
            }`}
          >
            Empresas
          </button>
        </div>

        <ul className="mt-8 grid gap-4 lg:grid-cols-3">
          {LANDING_PLANS.map((plan) => (
            <li
              key={plan.slug}
              className={`flex flex-col rounded-2xl border bg-app-surface/70 p-5 shadow-sm backdrop-blur-xl ${
                plan.highlight
                  ? "border-app-accent/60 ring-1 ring-app-accent/30"
                  : "border-app-border/70"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-lg font-semibold text-app-text">
                  {plan.name}
                </h3>
                {plan.highlight ? (
                  <span className="rounded-full bg-app-accent/15 px-2 py-0.5 text-xs font-medium text-app-accent">
                    Mais popular
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-xs text-app-muted">{plan.audience}</p>
              <p className="mt-4 text-3xl font-semibold text-app-text">
                {plan.priceLabel}
                <span className="text-sm font-medium text-app-muted"> / mês</span>
              </p>
              <ul className="mt-4 space-y-1.5 text-sm text-app-muted">
                <li>Projectos: {formatPlanQuota(plan.maxProjects)}</li>
                <li>Chaves API: {formatPlanQuota(plan.maxApiKeys)}</li>
                {audience === "person" ? (
                  <li>
                    Tarefas avulsas: {formatPlanQuota(plan.maxStandaloneTasks)}
                  </li>
                ) : null}
                <li>
                  Convidados / projecto: {formatPlanQuota(plan.maxProjectGuests)}
                </li>
              </ul>
              <ul className="mt-4 space-y-1 text-sm text-app-text">
                {plan.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <Link
                href={ctaHref}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                {ctaLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
