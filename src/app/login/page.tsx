import { LoginView } from "@/components/auth/login-view";
import { safeNextPath } from "@/lib/safe-next-path";
import { getSessionUser, getSessionToken, getRefreshToken } from "@/lib/session";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Entrar · Task Hive",
  description: "Faça login na sua conta Task Hive.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const user = await getSessionUser();

  if (user) {
    redirect(safeNextPath(next, "/dashboard"));
  }

  const hasStaleCookies =
    (await getSessionToken()) !== null || (await getRefreshToken()) !== null;
  if (hasStaleCookies) {
    const qs = next ? `?next=${encodeURIComponent(next)}` : "";
    redirect(`/api/auth/clear-session${qs}`);
  }

  return <LoginView nextPath={next} />;
}
