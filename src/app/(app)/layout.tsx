import { redirect } from "next/navigation";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { AppHeader } from "@/components/layout/app-header";
import { getSessionUser } from "@/lib/session";

/**
 * Shell do ambiente autenticado. O guard em `src/proxy.ts` já barra sem
 * cookie; aqui validamos o conteúdo do token (expiração/formato) no servidor.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />
      <AppHeader user={user} />
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
