"use client";

import Link from "next/link";
import { FaTriangleExclamation } from "react-icons/fa6";
import { AmbientBackground } from "@/components/layout/ambient-background";

type ErrorScreenProps = {
  title: string;
  description: string;
  /** Código HTTP ou rótulo curto (ex. 403, 404). */
  code?: string | number;
  resetLabel?: string;
  onReset?: () => void;
  homeHref?: string;
  /**
   * `page`: ecrã completo com fundo (not-found / error raiz).
   * `embedded`: conteúdo dentro do shell autenticado (sem segundo fundo).
   */
  variant?: "page" | "embedded";
};

/**
 * Ecrã de erro partilhado (limites React + not-found). Soft Pearl, sem cards.
 */
export function ErrorScreen({
  title,
  description,
  code,
  resetLabel = "Tentar novamente",
  onReset,
  homeHref = "/dashboard",
  variant = "page",
}: ErrorScreenProps) {
  const body = (
    <div
      className={
        variant === "page"
          ? "relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-16 sm:px-6"
          : "mx-auto w-full max-w-lg py-10"
      }
    >
      {code != null ? (
        <p className="font-mono text-sm font-medium tracking-wide text-app-accent">
          {code}
        </p>
      ) : null}
      <div className="mt-3 flex items-start gap-3">
        <FaTriangleExclamation
          className="mt-1 size-6 shrink-0 text-app-accent"
          aria-hidden
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text sm:text-3xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-app-muted sm:text-base">
            {description}
          </p>
        </div>
      </div>
      <div className="mt-10 flex flex-wrap items-center gap-3">
        {onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg bg-app-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-app-accent-secondary"
          >
            {resetLabel}
          </button>
        ) : null}
        <Link
          href={homeHref}
          className="rounded-lg border border-app-border bg-app-surface px-4 py-2.5 text-sm font-medium text-app-text transition hover:border-app-accent/40 hover:text-app-accent"
        >
          Ir ao painel
        </Link>
        <Link
          href="/login"
          className="text-sm font-medium text-app-muted underline-offset-4 hover:text-app-accent hover:underline"
        >
          Entrar novamente
        </Link>
      </div>
    </div>
  );

  if (variant === "embedded") {
    return body;
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-app-bg">
      <AmbientBackground />
      {body}
    </div>
  );
}
