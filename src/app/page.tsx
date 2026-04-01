import { AppLogo } from "@/components/brand/app-logo";
import { AmbientBackground } from "@/components/layout/ambient-background";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-app-border/80 bg-app-surface/40 px-4 py-3 backdrop-blur-xl sm:gap-4 sm:px-6 sm:py-4">
        <AppLogo />
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-app-border bg-app-surface/80 px-2 py-1.5 text-sm font-medium text-app-text backdrop-blur-md transition hover:bg-app-surface-elevated/90 sm:px-3 sm:py-2"
          >
            Entrar
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-16">
        <div className="w-full max-w-lg rounded-2xl border border-app-border/70 bg-app-surface/65 p-2 shadow-xl backdrop-blur-2xl sm:p-8">
          <h2 className="text-lg font-semibold text-app-text">
            Em construção
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-app-muted">
            Em breve você acessa seus projetos por aqui. Ambiente de desenvolvimento:
            defina{" "}
            <code className="rounded bg-app-surface-elevated/80 px-2 py-1 font-mono text-xs text-app-text sm:px-1.5 sm:py-0.5">
              BACKEND_API_BASE_URL
            </code>{" "}
            no BFF e rode{" "}
            <code className="rounded bg-app-surface-elevated/80 px-2 py-1 font-mono text-xs text-app-text sm:px-1.5 sm:py-0.5">
              npm run api:generate
            </code>{" "}
            quando atualizar a API.
          </p>
        </div>
      </main>
    </div>
  );
}
