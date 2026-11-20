import { AmbientBackground } from "@/components/layout/ambient-background";
import { AppHeader } from "@/components/layout/app-header";
import { requireSessionUser } from "@/lib/redirect-to-login";

/**
 * Shell do ambiente autenticado. O guard em `src/proxy.ts` já barra sem
 * cookie; aqui validamos a sessão no backend (JWT + sessão activa).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSessionUser();

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />
      <AppHeader user={user} />
      <main className="relative z-10 mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
