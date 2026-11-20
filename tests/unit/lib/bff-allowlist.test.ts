import { describe, expect, it } from "vitest";
import { isBffPathAllowed } from "@/lib/bff-allowlist";

describe("BFF allowlist (onda 1)", () => {
  it("permite prefixos desta onda e o to-do de contas PF", () => {
    expect(isBffPathAllowed("invites")).toBe(true);
    expect(isBffPathAllowed("invites/token-abc")).toBe(true);
    expect(isBffPathAllowed("invites/token-abc/accept")).toBe(true);
    expect(isBffPathAllowed("to-do")).toBe(true);
    expect(isBffPathAllowed("users")).toBe(true);
    expect(isBffPathAllowed("plans")).toBe(true);
    expect(isBffPathAllowed("admin/plans")).toBe(true);
    expect(isBffPathAllowed("admin/plans/id/benefits")).toBe(true);
    expect(isBffPathAllowed("admin/stats")).toBe(true);
    expect(isBffPathAllowed("admin/users")).toBe(true);
    expect(isBffPathAllowed("admin/companies")).toBe(true);
    expect(isBffPathAllowed("admin/subscriptions")).toBe(true);
  });

  it("continua a recusar paths fora da lista", () => {
    expect(isBffPathAllowed("metrics")).toBe(false);
    expect(isBffPathAllowed("auth/login")).toBe(false);
  });
});
