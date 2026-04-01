"use client";

import logoDarkBlue from "@/assets/brand/logo-dark-blue.png";
import logoHoney from "@/assets/brand/logo-honey.png";
import Image from "next/image";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

type AppLogoProps = {
  /** Tamanho maior na página de login. */
  prominent?: boolean;
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * Logotipo + nome: no tema claro usa a arte azul; no escuro, a arte mel (contraste).
 */
export function AppLogo({ prominent }: AppLogoProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );

  const isDark = mounted && resolvedTheme === "dark";
  /** Claro → azul; escuro → mel */
  const logo = isDark ? logoHoney : logoDarkBlue;

  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3 sm:gap-3.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg rounded-lg"
    >
      <Image
        src={logo}
        alt=""
        width={logo.width}
        height={logo.height}
        priority={prominent}
        sizes={prominent ? "(max-width: 640px) 260px, 300px" : "(max-width: 640px) 220px, 240px"}
        className={
          prominent
            ? "h-14 w-auto max-h-16 max-w-[min(100%,300px)] shrink-0 object-contain object-left sm:h-16"
            : "h-11 w-auto max-h-12 max-w-[min(100%,240px)] shrink-0 object-contain object-left sm:h-12"
        }
      />
      <span
        className={`font-semibold tracking-tight text-app-text transition group-hover:text-app-accent ${
          prominent ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
        }`}
      >
        Task Hive
      </span>
    </Link>
  );
}
