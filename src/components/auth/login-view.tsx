"use client";

import { AppLogo } from "@/components/brand/app-logo";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LoginForm } from "./login-form";

/**
 * Layout da página de login: fundo, logo e alternância de tema no topo; conteúdo em duas colunas.
 */
export function LoginView() {
  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />

      <header className="relative z-10 flex items-start justify-between gap-4 px-4 pb-2 pt-4 sm:gap-6 sm:px-10 sm:pt-10">
        <AppLogo prominent />
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 items-center">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-6 sm:gap-16 sm:px-10 sm:py-10 lg:grid-cols-2 lg:items-center lg:gap-20">
          <section className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-app-accent">
              Boas-vindas
            </p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-app-text sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
              Organize projetos, tarefas e tempo em um só lugar.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-app-muted sm:text-lg">
              O Task Hive foi feito para equipes que precisam enxergar o trabalho em
              quadros claros, dividir entregas em colunas e saber quanto tempo cada
              demanda realmente consome — sem perder simplicidade no dia a dia.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-app-muted sm:mt-8 sm:space-y-3 sm:text-base">
              <li className="flex gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent"
                  aria-hidden
                />
                Veja em um quadro o que está para fazer, em andamento e concluído —
                menos reunião e planilha para alinhar status.
              </li>
              <li className="flex gap-3">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-app-accent-secondary"
                  aria-hidden
                />
                Acompanhe tarefas e subtarefas e registre tempo nelas para planejar
                melhor as próximas entregas.
              </li>
            </ul>
          </section>

          <section className="flex justify-center lg:justify-end">
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  );
}
