"use client";

import { useTheme } from "next-themes";
import { useCallback, useSyncExternalStore } from "react";
import { FaMoon, FaSun } from "react-icons/fa6";

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Alterna tema claro/escuro: lua no modo claro, sol no modo escuro.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-app-border bg-app-surface/80 text-app-text backdrop-blur-md transition hover:bg-app-surface-elevated/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg"
      aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
    >
      {!mounted ? (
        <span className="h-5 w-5 rounded-full bg-app-muted/30" />
      ) : isDark ? (
        <FaSun className="h-5 w-5 text-app-accent" aria-hidden />
      ) : (
        <FaMoon className="h-5 w-5 text-app-accent" aria-hidden />
      )}
    </button>
  );
}
