"use client";

import { type PaletteId, usePalette } from "./palette-context";

const OPTIONS: { id: PaletteId; label: string }[] = [
  { id: "navy", label: "Midnight Navy" },
  { id: "pearl", label: "Soft Pearl" },
  { id: "forest", label: "Deep Forest" },
];

const ACTIVE_PALETTE_CLASS =
  "border-app-accent bg-app-accent/15 text-app-text shadow-sm ring-1 ring-app-accent/30";

/** Seletor das três paletas de marca (data-palette no documento). */
export function PaletteSwitcher() {
  const { palette, setPalette } = usePalette();

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setPalette(opt.id)}
          className={`rounded-lg border border-app-border px-3 py-2 text-sm font-medium backdrop-blur-sm transition ${
            palette === opt.id
              ? ACTIVE_PALETTE_CLASS
              : "bg-app-surface/60 text-app-muted hover:bg-app-surface hover:text-app-text"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
