import { describe, expect, it } from "vitest";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { normalizeSessionUser } from "@/lib/session-user";

const trialPlan = {
  slug: "free-trial",
  name: "Trial",
  status: "TRIAL",
  limits: {
    maxProjects: 3,
    maxApiKeys: 1,
    maxStandaloneTasks: 15,
    maxProjectGuests: 2,
  },
  usage: {
    projects: 1,
    apiKeys: 0,
    standaloneTasks: 4,
    projectGuests: null,
  },
};

describe("normalizeSessionUser", () => {
  it("preenche defaults quando a API ainda não envia campos SaaS", () => {
    expect(
      normalizeSessionUser({
        id: "u1",
        name: "Ana",
        email: "ana@example.com",
        role: "CLIENT",
      }),
    ).toEqual({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
      role: "CLIENT",
      accountKind: ACCOUNT_KIND.INDIVIDUAL,
      company: null,
      plan: null,
    });
  });

  it("expõe empresa e plano de um cliente", () => {
    expect(
      normalizeSessionUser({
        id: "u1",
        email: "ana@example.com",
        role: "CLIENT",
        accountKind: ACCOUNT_KIND.COMPANY,
        company: {
          id: "c1",
          legalName: "Acme Ltda",
          tradeName: "Acme",
          document: "11444777000161",
        },
        plan: trialPlan,
      }),
    ).toMatchObject({
      accountKind: ACCOUNT_KIND.COMPANY,
      company: { id: "c1", legalName: "Acme Ltda" },
      plan: { slug: "free-trial" },
    });
  });

  it("admins ficam com plan null mesmo se a API enviar plano", () => {
    const user = normalizeSessionUser({
      id: "admin",
      email: "admin@example.com",
      role: "ADMIN_GOD",
      plan: trialPlan,
    });
    expect(user.plan).toBeNull();
  });
});
