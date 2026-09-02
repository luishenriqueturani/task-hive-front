import Link from "next/link";
import { AppLogo } from "@/components/brand/app-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/session";

/** Cabeçalho do painel admin (nav própria, sem Painel/Projectos). */
export function AdminHeader({ user }: { user: SessionUser }) {
  return (
    <header className="relative z-10 border-b border-app-border/80 bg-app-surface/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-6">
          <AppLogo href="/admin/plans" linkAriaLabel="Ir à administração" />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Administração">
            <Link
              href="/admin/plans"
              className="rounded-lg px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90"
            >
              Planos
            </Link>
            <Link
              href="/admin/coupons"
              className="rounded-lg px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90"
            >
              Cupons
            </Link>
            <Link
              href="/dashboard"
              className="rounded-lg px-3 py-2 text-sm font-medium text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
            >
              App
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
