export type AuthNavigationContext =
  | "proxy"
  | "clear-session"
  | "redirect-to-login"
  | "login-page"
  | "login-redirect-url";

export interface AuthNavigationLogEntry {
  context: AuthNavigationContext;
  from: string;
  to: string;
  method?: string;
  originSource?: string;
  extra?: Record<string, unknown>;
}

/** Logs estruturados para `docker compose logs web` (grep `auth-nav`). */
export function logAuthNavigation(entry: AuthNavigationLogEntry): void {
  console.log(
    JSON.stringify({
      tag: "auth-nav",
      ts: new Date().toISOString(),
      ...entry,
    }),
  );
}
