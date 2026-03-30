"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/** Identificadores das três paletas de marca para teste visual. */
export type PaletteId = "navy" | "pearl" | "forest";

type PaletteContextValue = {
  palette: PaletteId;
  setPalette: (id: PaletteId) => void;
};

const PaletteContext = createContext<PaletteContextValue | null>(null);

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<PaletteId>("navy");

  useEffect(() => {
    document.documentElement.dataset.palette = palette;
  }, [palette]);

  const setPalette = useCallback((id: PaletteId) => {
    setPaletteState(id);
  }, []);

  const value = useMemo(
    () => ({ palette, setPalette }),
    [palette, setPalette],
  );

  return (
    <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
  );
}

export function usePalette() {
  const ctx = useContext(PaletteContext);
  if (!ctx) {
    throw new Error("usePalette must be used within PaletteProvider");
  }
  return ctx;
}
