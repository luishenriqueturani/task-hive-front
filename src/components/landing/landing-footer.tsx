import Link from "next/link";

/**
 * CTA final + rodapé placeholder (sem páginas legais nesta etapa).
 */
export function LandingFooter({ signedIn }: { signedIn: boolean }) {
  return (
    <>
      <section className="border-t border-app-border/60 bg-app-surface/30">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h2 className="text-2xl font-semibold tracking-tight text-app-text">
            Pronto para organizar o trabalho?
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-app-muted">
            Crie a conta em minutos. Sem cartão nesta etapa — comece grátis e
            escolha um plano quando fizer sentido.
          </p>
          <Link
            href={signedIn ? "/dashboard" : "/register"}
            className="mt-6 inline-flex rounded-lg bg-app-accent px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
          >
            {signedIn ? "Abrir painel" : "Começar grátis"}
          </Link>
        </div>
      </section>
      <footer className="border-t border-app-border/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-app-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>Task Hive · organização de projectos e tempo</p>
          <p>Termos, privacidade e contacto — em breve.</p>
        </div>
      </footer>
    </>
  );
}
