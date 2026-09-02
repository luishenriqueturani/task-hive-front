import { describe, expect, it } from "vitest";
import {
  formatQuotaUsage,
  isApiKeysLimitReached,
  isPlanLimitCode,
  isProjectsLimitReached,
  isQuotaReached,
  isStandaloneTasksLimitReached,
  PLAN_LIMIT_CODE,
} from "@/lib/plan-quota";
import { clientPlanFixture } from "@tests/helpers/session-user";

describe("isQuotaReached", () => {
  it("atinge quando used >= limit finito", () => {
    expect(isQuotaReached(3, 3)).toBe(true);
    expect(isQuotaReached(4, 3)).toBe(true);
    expect(isQuotaReached(2, 3)).toBe(false);
  });

  it("nunca atinge com limite ilimitado", () => {
    expect(isQuotaReached(99, -1)).toBe(false);
  });
});

describe("limites do plano na sessão", () => {
  it("sem plano não bloqueia", () => {
    expect(isProjectsLimitReached(null)).toBe(false);
    expect(isApiKeysLimitReached(undefined)).toBe(false);
    expect(isStandaloneTasksLimitReached(null)).toBe(false);
  });

  it("detecta tecto de projectos, chaves e to-dos", () => {
    const atProjects = clientPlanFixture({
      usage: {
        projects: 3,
        apiKeys: 0,
        standaloneTasks: 0,
        projectGuests: null,
      },
    });
    expect(isProjectsLimitReached(atProjects)).toBe(true);
    expect(isApiKeysLimitReached(atProjects)).toBe(false);

    const atKeys = clientPlanFixture({
      usage: {
        projects: 0,
        apiKeys: 1,
        standaloneTasks: 0,
        projectGuests: null,
      },
    });
    expect(isApiKeysLimitReached(atKeys)).toBe(true);

    const atTodos = clientPlanFixture({
      usage: {
        projects: 0,
        apiKeys: 0,
        standaloneTasks: 15,
        projectGuests: null,
      },
    });
    expect(isStandaloneTasksLimitReached(atTodos)).toBe(true);
  });

  it("reconhece códigos 402", () => {
    expect(isPlanLimitCode(PLAN_LIMIT_CODE.PROJECTS)).toBe(true);
    expect(isPlanLimitCode("OTHER")).toBe(false);
  });
});

describe("formatQuotaUsage", () => {
  it("formata usado / tecto", () => {
    expect(formatQuotaUsage(2, 5)).toBe("2 / 5");
    expect(formatQuotaUsage(1, -1)).toBe("1 / Ilimitado");
  });
});
