"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/layout/error-screen";

/**
 * Limite de erro da App Router: falhas não tratadas nas rotas filhas.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorScreen
      code="Erro"
      title="Algo correu mal"
      description="Não foi possível concluir o pedido. Tenta outra vez; se o problema continuar, verifica se a API está a correr."
      onReset={reset}
    />
  );
}
