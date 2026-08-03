"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/layout/error-screen";

/**
 * Erros no shell autenticado (projetos, to-do, dashboard, etc.).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const forbidden =
    /forbidden|403|não autorizado|acesso negado|permiss/i.test(
      error.message ?? "",
    );

  return (
    <ErrorScreen
      variant="embedded"
      code={forbidden ? 403 : "Erro"}
      title={forbidden ? "Sem permissão" : "Não foi possível abrir esta página"}
      description={
        forbidden
          ? "A tua conta não tem acesso a este recurso, ou a sessão expirou. Entra novamente ou contacta um administrador."
          : "Ocorreu um erro ao carregar o conteúdo. Tenta outra vez; se continuar, verifica a ligação à API."
      }
      onReset={reset}
      resetLabel="Tentar novamente"
    />
  );
}
