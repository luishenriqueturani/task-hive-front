"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyToClipboard, generateStrongPassword } from "@/lib/password";

/**
 * Gera uma senha forte, preenche os campos via `onGenerate` e copia
 * automaticamente para a área de transferência, com feedback textual.
 */
export function GeneratePasswordButton({
  onGenerate,
  disabled,
}: {
  onGenerate: (password: string) => void;
  disabled?: boolean;
}) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(async () => {
    const password = generateStrongPassword();
    onGenerate(password);

    const copied = await copyToClipboard(password);
    setFeedback(
      copied
        ? "Senha gerada e copiada para a área de transferência."
        : "Senha gerada. Não foi possível copiar automaticamente — copie do campo.",
    );

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setFeedback(null), 6000);
  }, [onGenerate]);

  return (
    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="cursor-pointer text-sm font-medium text-app-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
      >
        Gerar senha segura
      </button>
      {feedback ? (
        <span className="text-xs text-app-muted" role="status">
          {feedback}
        </span>
      ) : null}
    </div>
  );
}
