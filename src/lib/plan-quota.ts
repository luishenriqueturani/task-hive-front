import type { SessionPlan } from "@/lib/session-user";

/**
 * Códigos 402 do backend quando uma quota do plano é atingida.
 * `limit < 0` significa ilimitado.
 */
export const PLAN_LIMIT_CODE = {
  PROJECTS: "PLAN_LIMIT_PROJECTS",
  API_KEYS: "PLAN_LIMIT_API_KEYS",
  TODOS: "PLAN_LIMIT_TODOS",
  GUESTS: "PLAN_LIMIT_GUESTS",
} as const;

export type PlanLimitCode =
  (typeof PLAN_LIMIT_CODE)[keyof typeof PLAN_LIMIT_CODE];

export const PLAN_LIMIT_CODES = Object.values(PLAN_LIMIT_CODE);

export function isPlanLimitCode(value: unknown): value is PlanLimitCode {
  return (
    typeof value === "string" &&
    (PLAN_LIMIT_CODES as string[]).includes(value)
  );
}

/** Tooltip partilhado nos botões desactivados por quota. */
export const PLAN_LIMIT_TOOLTIP = "Limite do plano";

export const PLAN_SETTINGS_HREF = "/settings/plan";

/** `limit < 0` = ilimitado (mesma convenção do backend). */
export function isQuotaReached(used: number, limit: number): boolean {
  return limit >= 0 && used >= limit;
}

export function isProjectsLimitReached(
  plan: SessionPlan | null | undefined,
): boolean {
  if (!plan) return false;
  return isQuotaReached(plan.usage.projects, plan.limits.maxProjects);
}

export function isApiKeysLimitReached(
  plan: SessionPlan | null | undefined,
): boolean {
  if (!plan) return false;
  return isQuotaReached(plan.usage.apiKeys, plan.limits.maxApiKeys);
}

export function isStandaloneTasksLimitReached(
  plan: SessionPlan | null | undefined,
): boolean {
  if (!plan) return false;
  return isQuotaReached(
    plan.usage.standaloneTasks,
    plan.limits.maxStandaloneTasks,
  );
}
