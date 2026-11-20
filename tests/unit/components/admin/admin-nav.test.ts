import { describe, expect, it } from "vitest";
import { isAdminNavActive } from "@/components/admin/admin-nav";

describe("isAdminNavActive", () => {
  it("Resumo só no índice /admin", () => {
    expect(isAdminNavActive("/admin", "/admin", true)).toBe(true);
    expect(isAdminNavActive("/admin", "/admin/users", true)).toBe(false);
  });

  it("Utilizadores inclui o detalhe", () => {
    expect(isAdminNavActive("/admin/users", "/admin/users")).toBe(true);
    expect(isAdminNavActive("/admin/users", "/admin/users/abc")).toBe(true);
    expect(isAdminNavActive("/admin/users", "/admin/plans")).toBe(false);
  });
});
