"use client";

import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** Alterna entre tema claro, escuro e sistema (após hidratação). */
export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const label = useMemo(() => {
    if (!mounted) return "Theme";
    if (theme === "system") return `System (${resolvedTheme ?? "—"})`;
    return theme === "dark" ? "Dark" : "Light";
  }, [mounted, theme, resolvedTheme]);

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <button
      type="button"
      onClick={cycle}
      className="rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text backdrop-blur-md transition hover:bg-app-surface-elevated/90"
    >
      {label}
    </button>
  );
}
