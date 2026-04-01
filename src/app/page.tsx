import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function Home() {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-app-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
      >
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-app-accent-secondary/30 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-app-accent/25 blur-3xl" />
      </div>

      <header className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-app-border/80 bg-app-surface/40 px-6 py-4 backdrop-blur-xl">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-app-muted">
            Task Hive
          </p>
          <h1 className="text-xl font-semibold text-app-text">
            Boards & tasks
          </h1>
        </div>
        <ThemeToggle />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-app-border/70 bg-app-surface/65 p-8 shadow-xl backdrop-blur-2xl">
          <h2 className="text-lg font-semibold text-app-text">
            Project scaffold
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-app-muted">
            Next.js, TypeScript, Tailwind, Orval + React Query e tema Soft Pearl
            (claro/escuro). Configure{" "}
            <code className="rounded bg-app-surface-elevated/80 px-1.5 py-0.5 font-mono text-xs text-app-text">
              BACKEND_API_BASE_URL
            </code>{" "}
            no BFF; gere o cliente com{" "}
            <code className="rounded bg-app-surface-elevated/80 px-1.5 py-0.5 font-mono text-xs text-app-text">
              npm run api:generate
            </code>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
