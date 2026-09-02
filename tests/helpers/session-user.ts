import { ACCOUNT_KIND } from "@/lib/account-kind";
import type { SessionUser } from "@/lib/session-user";

/** Utilizador de sessão completo para testes de componentes. */
export function sessionUserFixture(
  overrides: Partial<SessionUser> = {},
): SessionUser {
  return {
    id: "u1",
    name: "Luis Silva",
    email: "luis@example.com",
    role: "CLIENT",
    accountKind: ACCOUNT_KIND.INDIVIDUAL,
    company: null,
    plan: null,
    ...overrides,
  };
}

export function clientPlanFixture(
  overrides: Partial<NonNullable<SessionUser["plan"]>> = {},
): NonNullable<SessionUser["plan"]> {
  return {
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
      projects: 0,
      apiKeys: 0,
      standaloneTasks: 0,
      projectGuests: null,
    },
    ...overrides,
  };
}
