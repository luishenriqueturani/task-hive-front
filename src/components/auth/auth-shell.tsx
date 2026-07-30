import { AppLogo } from "@/components/brand/app-logo";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Layout das páginas de autenticação secundárias (cadastro, esqueci a senha,
 * redefinir senha): fundo ambiente, logo no topo e cartão centralizado.
 */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />

      <header className="relative z-10 flex items-start justify-between gap-4 px-4 pb-2 pt-4 sm:gap-6 sm:px-10 sm:pt-10">
        <AppLogo prominent />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-md rounded-2xl border border-app-border/70 bg-app-surface/70 p-4 shadow-xl backdrop-blur-2xl sm:p-8">
          <h1 className="text-lg font-semibold text-app-text">{title}</h1>
          <p className="mt-1 text-sm text-app-muted">{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  );
}
