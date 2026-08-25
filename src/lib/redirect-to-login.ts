import { redirect } from "next/navigation";
import { loginRedirectTarget } from "@/lib/login-redirect-path";
import {
  publicOriginFromServer,
  resolvePublicOrigin,
} from "@/lib/request-public-origin";
import { getSessionUser, type SessionUser } from "@/lib/session";

/** Redirect server-side para login com host público (evita `0.0.0.0:3000`). */
export async function redirectToLogin(next?: string | null): Promise<never> {
  const origin = resolvePublicOrigin(await publicOriginFromServer());
  redirect(loginRedirectTarget(origin, next));
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
