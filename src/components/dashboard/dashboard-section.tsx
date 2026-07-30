import type { IconType } from "react-icons";

/** Seção do painel: título com ícone e grade de blocos. */
export function DashboardSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-app-text">
        <Icon className="h-4 w-4 text-app-accent" aria-hidden />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Grade padrão dos blocos de uma seção. */
export function SectionGrid({ children }: { children: React.ReactNode }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {children}
    </ul>
  );
}

/** Bloco individual (projeto, tarefa, etc.). */
export function ItemCard({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-2xl border border-app-border/70 bg-app-surface/70 p-4 shadow-lg backdrop-blur-2xl transition hover:border-app-accent/40 sm:p-5">
      {children}
    </li>
  );
}

/** Estado de carregamento de uma seção (blocos fantasma). */
export function SectionSkeleton({ blocks = 3 }: { blocks?: number }) {
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
      aria-hidden
    >
      {Array.from({ length: blocks }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl bg-app-surface-elevated/70"
        />
      ))}
    </div>
  );
}

/** Aviso de seção vazia ou com erro. */
export function SectionNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-dashed border-app-border/70 bg-app-surface/40 px-4 py-6 text-sm text-app-muted">
      {children}
    </p>
  );
}
