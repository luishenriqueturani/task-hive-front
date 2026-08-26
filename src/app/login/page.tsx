import { LoginView } from "@/components/auth/login-view";
import { logAuthNavigation } from "@/lib/auth-navigation-log";
import { safeNextPath } from "@/lib/safe-next-path";
import { getSessionUser, getSessionToken, getRefreshToken } from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Entrar · Task Hive",
  description: "Faça login na sua conta Task Hive.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; cleared?: string }>;
}) {
  const { next, cleared } = await searchParams;
  const user = await getSessionUser();

  if (user) {
    const target = safeNextPath(next, "/dashboard");
    logAuthNavigation({
      context: "login-page",
      from: "/login",
      to: target,
      extra: { reason: "already-authenticated" },
    });
    redirect(target);
  }

  const hasStaleCookies =
    (await getSessionToken()) !== null || (await getRefreshToken()) !== null;
  if (hasStaleCookies && cleared !== "1") {
    const qs = next ? `?next=${encodeURIComponent(next)}` : "";
    const target = `/api/auth/clear-session${qs}`;
    logAuthNavigation({
      context: "login-page",
      from: `/login${qs}`,
      to: target,
      extra: { reason: "stale-session-cookies" },
    });
    redirect(target);
  }

  return <LoginView nextPath={next} />;
}
