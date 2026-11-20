import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const spec = JSON.parse(
  readFileSync(resolve(process.cwd(), "openapi/openapi.json"), "utf8"),
) as {
  paths: Record<string, Record<string, { responses?: Record<string, unknown> }>>;
  tags?: { name: string }[];
};

describe("OpenAPI SaaS", () => {
  it("expõe planos, convites, admin, suporte e PAT", () => {
    const paths = Object.keys(spec.paths);
    expect(paths).toEqual(
      expect.arrayContaining([
        "/plans",
        "/invites/{token}",
        "/invites/{token}/accept",
        "/admin/stats",
        "/admin/users",
        "/admin/companies",
        "/admin/plans",
        "/admin/coupons",
        "/admin/subscriptions",
        "/support/tickets",
        "/support/tickets/{id}",
        "/support/tickets/{id}/messages",
        "/personal-access-tokens",
      ]),
    );
    const tags = (spec.tags ?? []).map((tag) => tag.name);
    expect(tags).toEqual(
      expect.arrayContaining(["plans", "invites", "admin", "support"]),
    );
  });

  it("documenta 402 de quota nos endpoints de criação", () => {
    expect(spec.paths["/projects"]?.post?.responses?.["402"]).toBeTruthy();
    expect(spec.paths["/to-do"]?.post?.responses?.["402"]).toBeTruthy();
    expect(
      spec.paths["/personal-access-tokens"]?.post?.responses?.["402"],
    ).toBeTruthy();
    expect(
      spec.paths["/projects/{id}/invites"]?.post?.responses?.["402"],
    ).toBeTruthy();
  });
});
