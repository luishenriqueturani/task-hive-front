/** Paths que nunca devem passar pelo proxy genérico (têm Route Handlers dedicados). */
export const BFF_BLOCKED_PATHS = new Set([
  "auth/login",
  "auth/logout",
  "auth/reset-password",
  "auth/refresh",
]);

/** Rotas exactas permitidas (sem sub-path dinâmico). */
export const BFF_ALLOWED_EXACT = new Set([
  "auth/check-token",
  "auth/forget-password",
]);

/** Prefixos de API expostos ao browser via BFF. */
export const BFF_ALLOWED_PREFIXES = [
  "projects",
  "project-stages",
  "tasks",
  "subtasks",
  "to-do",
  "users",
  "companies",
  "personal-access-tokens",
  "invites",
  "plans",
  "admin",
] as const;

export function isBffPathAllowed(joined: string): boolean {
  if (BFF_BLOCKED_PATHS.has(joined)) return false;
  if (BFF_ALLOWED_EXACT.has(joined)) return true;
  return BFF_ALLOWED_PREFIXES.some(
    (prefix) => joined === prefix || joined.startsWith(`${prefix}/`),
  );
}
