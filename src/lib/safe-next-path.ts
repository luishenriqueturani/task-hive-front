/** Prefixos internos permitidos em `?next=` após login (open-redirect safe). */
const ALLOWED_NEXT_PREFIXES = [
  "/dashboard",
  "/projects",
  "/to-do",
  "/companies",
  "/settings",
] as const;

/**
 * Valida redirecionamento pós-login: só paths internos conhecidos, sem `\`, `//`
 * nem esquemas embutidos.
 */
export function safeNextPath(
  nextPath?: string | null,
  fallback = "/dashboard",
): string {
  if (!nextPath || typeof nextPath !== "string") return fallback;

  const trimmed = nextPath.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("\\") || trimmed.includes("\0")) return fallback;

  try {
    const url = new URL(trimmed, "http://localhost");
    if (url.username || url.password || url.host !== "localhost") {
      return fallback;
    }
    const allowed = ALLOWED_NEXT_PREFIXES.some(
      (prefix) =>
        url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
    );
    return allowed
      ? `${url.pathname}${url.search}${url.hash}`
      : fallback;
  } catch {
    return fallback;
  }
}
