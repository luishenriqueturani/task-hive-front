import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Chrome mínimo das páginas `/settings/*` (ainda fora do shell `(app)`).
 */
export function SettingsShell({
  title,
  description,
  current,
  children,
  wide,
}: {
  title: string;
  description?: string;
  current: "plan" | "tokens";
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-full bg-app-bg">
      <div
        className={`mx-auto px-4 py-8 sm:px-6 ${wide ? "max-w-4xl" : "max-w-2xl"}`}
      >
        <Link
          href="/dashboard"
          className="text-sm font-medium text-app-accent hover:underline"
        >
          ← Painel
        </Link>
        <nav
          className="mt-4 flex gap-2"
          aria-label="Definições"
        >
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
