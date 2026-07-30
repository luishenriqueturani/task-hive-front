"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FaXmark } from "react-icons/fa6";

/**
 * Modal genérico em portal no <body> — necessário porque elementos com
 * `backdrop-filter` (header, cards) viram containing block de `fixed`.
 * Fecha com Esc, clique no backdrop ou no botão X.
 */
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-md rounded-2xl border border-app-border/70 bg-app-surface p-5 shadow-2xl sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-app-text">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
            aria-label="Fechar"
          >
            <FaXmark className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
