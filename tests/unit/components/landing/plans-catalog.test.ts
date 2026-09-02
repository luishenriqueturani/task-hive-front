import { describe, expect, it } from "vitest";
import { formatPlanQuota, LANDING_PLANS } from "@/components/landing/plans-catalog";

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
});
