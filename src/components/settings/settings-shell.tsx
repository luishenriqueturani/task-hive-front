import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Subnav das páginas `/settings/*` dentro do shell autenticado (`AppHeader`).
 */
export function SettingsShell({
  title,
  description,
  current,
  children,
}: {
  title: string;
  description?: string;
  current: "plan" | "tokens";
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div>
      <nav className="flex gap-2" aria-label="Definições">
        <SettingsNavLink href="/settings/plan" active={current === "plan"}>
          Plano
        </SettingsNavLink>
        <SettingsNavLink
          href="/settings/api-tokens"
          active={current === "tokens"}
        >
          Tokens de API
        </SettingsNavLink>
      </nav>
      <h1 className="mt-6 text-xl font-semibold text-app-text">{title}</h1>
      {description ? (
        <p className="mt-2 text-sm text-app-muted">{description}</p>
      ) : null}
      <div className="mt-6">{children}</div>
    </div>
  );
}

function SettingsNavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active
          ? "bg-app-accent text-white"
          : "text-app-muted hover:bg-app-surface-elevated/80 hover:text-app-text"
      }`}
    >
      {children}
    </Link>
  );
}
