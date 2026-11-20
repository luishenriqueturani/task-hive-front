"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/brand/app-logo";
import { ADMIN_NAV, isAdminNavActive } from "@/components/admin/admin-nav";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/session";

/** Cabeçalho do painel admin: logo, nav móvel e perfil. */
export function AdminHeader({ user }: { user: SessionUser }) {
  const pathname = usePathname();

  return (
    <header className="relative z-10 border-b border-app-border/80 bg-app-surface/40 backdrop-blur-xl">
      <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-4">
          <AppLogo href="/admin" linkAriaLabel="Ir à administração" />
          <nav
            className="flex items-center gap-1 overflow-x-auto md:hidden"
            aria-label="Administração"
          >
            {ADMIN_NAV.map((item) => {
              const active = isAdminNavActive(
                item.href,
                pathname,
                "exact" in item ? item.exact : false,
              );
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-app-surface-elevated text-app-text"
                      : "text-app-muted hover:bg-app-surface-elevated/90 hover:text-app-text"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
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
