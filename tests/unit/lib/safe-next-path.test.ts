import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next-path";

describe("safeNextPath", () => {
  it("aceita prefixos permitidos", () => {
    expect(safeNextPath("/projects")).toBe("/projects");
    expect(safeNextPath("/projects/abc")).toBe("/projects/abc");
    expect(safeNextPath("/settings/api-tokens")).toBe("/settings/api-tokens");
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
});
