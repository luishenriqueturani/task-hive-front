/** Catálogo estático da landing v1 (plano §5.2). Trial não entra nestes cards. */

export type LandingPlan = {
  slug: "starter" | "pro" | "business";
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
