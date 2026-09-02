import { describe, expect, it } from "vitest";
import { formatPlanQuota, formatPriceLabel, LANDING_PLANS, mapCatalogPlan } from "@/components/landing/plans-catalog";

describe("plans-catalog", () => {
  it("tem Starter, Pro e Business", () => {
    expect(LANDING_PLANS.map((p) => p.name)).toEqual([
      "Starter",
      "Pro",
      "Business",
    ]);
  });

  it("formata ilimitado", () => {
    expect(formatPlanQuota(5)).toBe("5");
    expect(formatPlanQuota(-1)).toBe("Ilimitado");
  });

  it("formata preço em cêntimos e mapeia o catálogo da API", () => {
    expect(formatPriceLabel(2900)).toMatch(/R\$\s*29/);
    expect(formatPriceLabel(0)).toBe("Grátis");
    const mapped = mapCatalogPlan({
      slug: "starter",
      name: "Starter API",
      accountKind: "BOTH",
      priceCents: 2900,
      currency: "BRL",
      maxProjects: 7,
      maxApiKeys: 2,
      maxStandaloneTasks: 30,
      maxProjectGuests: 3,
      benefits: [{ title: "Kanban extra" }],
    });
    expect(mapped.name).toBe("Starter API");
    expect(mapped.maxProjects).toBe(7);
    expect(mapped.benefits).toEqual(["Kanban extra"]);
    expect(mapped.highlight).toBe(false);
  });
});
