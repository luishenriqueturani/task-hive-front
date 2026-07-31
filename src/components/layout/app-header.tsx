import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { HeaderActiveTimer } from "@/components/layout/header-active-timer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/session";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel", ready: true },
  { href: "/projects", label: "Projetos", ready: true },
  { href: "/to-do", label: "Tarefas avulsas", ready: true },
];

/** Cabeçalho do ambiente autenticado: logo, navegação, usuário e ações. */
export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="relative z-10 border-b border-app-border/80 bg-app-surface/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="Ir ao painel">
            <AppLogo />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV_ITEMS.map((item) =>
              item.ready ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  key={item.href}
                  className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-app-muted/70"
                  title="Em breve"
                  aria-disabled
                >
                  {item.label}
                </span>
              ),
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <HeaderActiveTimer />
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
