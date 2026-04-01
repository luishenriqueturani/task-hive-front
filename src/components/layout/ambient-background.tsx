/**
 * Camada decorativa de gradientes com blur (paleta Soft Pearl, claro e escuro).
 */

export function AmbientBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 opacity-40"
      aria-hidden
    >
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-app-accent-secondary/30 blur-3xl" />
      <div className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-app-accent/25 blur-3xl" />
    </div>
  );
}
