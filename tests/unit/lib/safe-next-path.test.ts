import { describe, expect, it } from "vitest";
import { loginRedirectPath, safeNextPath } from "@/lib/safe-next-path";

describe("safeNextPath", () => {
  it("aceita prefixos permitidos", () => {
    expect(safeNextPath("/invite/th_inv_abc")).toBe("/invite/th_inv_abc");
    expect(safeNextPath("/projects/abc")).toBe("/projects/abc");
    expect(safeNextPath("/settings/api-tokens")).toBe("/settings/api-tokens");
    expect(safeNextPath("/admin/plans")).toBe("/admin/plans");
  });

  it("rejeita URLs externas e open redirects", () => {
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath("/login")).toBe("/dashboard");
  });

  it("preserva query string em paths permitidos", () => {
    expect(safeNextPath("/projects?tab=1")).toBe("/projects?tab=1");
  });

  it("monta /login com next seguro", () => {
    expect(loginRedirectPath()).toBe("/login");
    expect(loginRedirectPath("/invite/th_inv_abc")).toBe(
      "/login?next=%2Finvite%2Fth_inv_abc",
    );
    expect(loginRedirectPath("https://evil.com")).toBe(
      "/login?next=%2Fdashboard",
    );
  });
});
