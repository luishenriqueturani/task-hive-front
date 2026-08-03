"use client";

import { useEffect } from "react";

/**
 * Último recurso: falha no root layout. Markup mínimo (sem providers).
 */
export default function GlobalError({
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
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f4f1ea",
          color: "#1c1917",
        }}
      >
        <main style={{ maxWidth: 28 * 16, padding: 24 }}>
          <p style={{ color: "#d97706", fontWeight: 600, margin: 0 }}>Erro</p>
          <h1 style={{ fontSize: "1.5rem", margin: "12px 0" }}>
            A aplicação falhou ao carregar
          </h1>
          <p style={{ color: "#78716c", lineHeight: 1.5 }}>
            Recarrega a página. Se o erro persistir, reinicia os contentores do
            Task Hive.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              padding: "10px 16px",
              border: 0,
              borderRadius: 8,
              background: "#d97706",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Tentar novamente
          </button>
        </main>
      </body>
    </html>
  );
}
