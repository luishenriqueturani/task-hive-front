import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Header da landing: logo, âncoras Produto/Planos e CTAs de sessão.
 */
export function LandingHeader({ signedIn }: { signedIn: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-app-border/80 bg-app-surface/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <AppLogo />
        <nav aria-label="Secções" className="hidden items-center gap-6 sm:flex">
          <a
            href="#produto"
            className="text-sm font-medium text-app-muted transition hover:text-app-text"
          >
            Produto
          </a>
          <a
            href="#planos"
            className="text-sm font-medium text-app-muted transition hover:text-app-text"
          >
            Planos
          </a>
        </nav>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-app-accent px-3 py-1.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:px-4 sm:py-2"
            >
              Abrir painel
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-app-border bg-app-surface/80 px-3 py-1.5 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 sm:px-3 sm:py-2"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-app-accent px-3 py-1.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:px-4 sm:py-2"
              >
                Começar grátis
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
