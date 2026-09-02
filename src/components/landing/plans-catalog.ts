/** Catálogo estático da landing (fallback se `GET /plans` falhar). Trial não entra. */

export type LandingPlan = {
  slug: string;
  name: string;
  priceLabel: string;
  audience: string;
  highlight: boolean;
  maxProjects: number;
  maxApiKeys: number;
  maxStandaloneTasks: number;
  maxProjectGuests: number;
  benefits: string[];
};

export type CatalogPlanInput = {
  slug: string;
  name: string;
  description?: string | null;
  accountKind?: string;
  priceCents?: number;
  currency?: string;
  maxProjects: number;
  maxApiKeys: number;
  maxStandaloneTasks: number;
  maxProjectGuests: number;
  benefits?: Array<string | { title: string }>;
};

export const LANDING_PLANS: LandingPlan[] = [
  {
    slug: "starter",
    name: "Starter",
    priceLabel: "R$ 29",
    audience: "Pessoas e empresas",
    highlight: false,
    maxProjects: 5,
    maxApiKeys: 2,
    maxStandaloneTasks: 30,
    maxProjectGuests: 3,
    benefits: ["Quadros Kanban", "Tarefas avulsas (contas PF)", "Chaves de API"],
  },
  {
    slug: "pro",
    name: "Pro",
    priceLabel: "R$ 79",
    audience: "Pessoas e empresas",
    highlight: true,
    maxProjects: 20,
    maxApiKeys: 10,
    maxStandaloneTasks: 200,
    maxProjectGuests: 15,
    benefits: [
      "Tudo do Starter",
      "Mais projectos e convidados",
      "Mais chaves de API",
    ],
  },
  {
    slug: "business",
    name: "Business",
    priceLabel: "R$ 199",
    audience: "Sobretudo empresas",
    highlight: false,
    maxProjects: -1,
    maxApiKeys: -1,
    maxStandaloneTasks: -1,
    maxProjectGuests: -1,
    benefits: [
      "Tudo do Pro",
      "Quotas ilimitadas",
      "Suporte prioritário",
    ],
  },
];

export function formatPlanQuota(value: number): string {
  return value < 0 ? "Ilimitado" : String(value);
}

export function formatPriceLabel(cents: number, currency = "BRL"): string {
  if (cents <= 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function audienceLabel(accountKind: string | undefined): string {
  if (accountKind === "COMPANY") return "Empresas";
  if (accountKind === "INDIVIDUAL") return "Pessoas";
  if (accountKind === "BOTH") return "Pessoas e empresas";
  return "Pessoas e empresas";
}

export function mapCatalogPlan(plan: CatalogPlanInput): LandingPlan {
  const benefits = (plan.benefits ?? []).map((item) =>
    typeof item === "string" ? item : item.title,
  );
  return {
    slug: plan.slug,
    name: plan.name,
    priceLabel: formatPriceLabel(plan.priceCents ?? 0, plan.currency ?? "BRL"),
    audience: audienceLabel(plan.accountKind),
    highlight: plan.slug === "pro",
    maxProjects: plan.maxProjects,
    maxApiKeys: plan.maxApiKeys,
    maxStandaloneTasks: plan.maxStandaloneTasks,
    maxProjectGuests: plan.maxProjectGuests,
    benefits,
  };
}
