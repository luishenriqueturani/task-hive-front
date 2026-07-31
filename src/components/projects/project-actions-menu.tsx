"use client";

import { useEffect, useRef, useState } from "react";
import { FaEllipsisVertical, FaPenToSquare, FaTrashCan } from "react-icons/fa6";

/**
 * Menu discreto (⋯) ao lado do nome do projeto: editar e excluir.
 */
export function ProjectActionsMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
        aria-label="Mais ações do projeto"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <FaEllipsisVertical className="h-4 w-4" aria-hidden />
      </button>

      {open ? (
        <ul
          role="menu"
          aria-label="Ações do projeto"
          className="absolute left-0 top-full z-20 mt-1 min-w-40 overflow-hidden rounded-xl border border-app-border/70 bg-app-surface py-1 shadow-xl"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-app-text transition hover:bg-app-surface-elevated/90"
            >
              <FaPenToSquare className="h-3.5 w-3.5 text-app-muted" aria-hidden />
              Editar
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onDelete();
              }}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-500/10 dark:text-red-300"
            >
              <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
              Excluir
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
