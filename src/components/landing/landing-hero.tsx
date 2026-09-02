import Link from "next/link";

/**
 * Hero da landing: proposta de valor (kanban, to-do e tempo).
 */
export function LandingHero({ signedIn }: { signedIn: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-app-accent">
        Quadros, tarefas e tempo
      </p>
      <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-app-text sm:text-5xl sm:leading-tight">
        Organize projetos, tarefas e tempo em um só lugar.
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-relaxed text-app-muted sm:text-lg">
        O Task Hive junta kanban, tarefas avulsas e registo de tempo para a
        equipa ver o que está a acontecer — sem planilha nem reunião extra para
        alinhar status.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        {signedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex rounded-lg bg-app-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            Abrir painel
          </Link>
        ) : (
          <>
            <Link
              href="/register"
              className="inline-flex rounded-lg bg-app-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
            >
              Começar grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-lg border border-app-border bg-app-surface/80 px-4 py-2.5 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90"
            >
              Já tenho conta
            </Link>
          </>
        )}
      </div>
    </section>
  );
}
