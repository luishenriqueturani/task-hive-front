import { LoginView } from "@/components/auth/login-view";
import { safeNextPath } from "@/lib/safe-next-path";
import {
  getSessionUser,
  REFRESH_COOKIE,
  SESSION_COOKIE,
} from "@/lib/session";
import type { Metadata } from "next";
import { cookies } from "next/headers";
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

  const store = await cookies();
  if (store.get(SESSION_COOKIE) || store.get(REFRESH_COOKIE)) {
    store.delete(SESSION_COOKIE);
    store.delete(REFRESH_COOKIE);
  }

  return <LoginView nextPath={next} />;
}
