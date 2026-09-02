import { notFound, redirect } from "next/navigation";
import { isAdminRole } from "@/lib/account-kind";
import { logAuthNavigation } from "@/lib/auth-navigation-log";
import { loginRedirectTargetFromServer } from "@/lib/login-redirect-path";
import { getSessionUser, type SessionUser } from "@/lib/session";

/** Redirect server-side para login com host público (evita `0.0.0.0:3000`). */
export async function redirectToLogin(next?: string | null): Promise<never> {
  const { target, source, from } = await loginRedirectTargetFromServer(next);

  logAuthNavigation({
    context: "redirect-to-login",
    from,
    to: target,
    originSource: source,
    extra: { next: next ?? null },
  });

  redirect(target);
}

/** Sessão validada ou redirect — estreita o tipo para `SessionUser`. */
export async function requireSessionUser(
  next?: string | null,
): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    await redirectToLogin(next);
    throw new Error("requireSessionUser: unreachable");
  }
  return user;
}

/** Sessão admin ou 404 — CLIENT não deve descobrir que `/admin` existe. */
export async function requireAdmin(
  next: string | null = "/admin",
): Promise<SessionUser> {
  const user = await requireSessionUser(next);
  if (!isAdminRole(user.role)) {
    notFound();
  }
  return user;
}
