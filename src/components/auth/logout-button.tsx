"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaRightFromBracket } from "react-icons/fa6";

/** Encerra a sessão via BFF (limpa o cookie httpOnly) e volta ao login. */
export function LogoutButton({
  variant = "compact",
}: {
  /** `panel` — largura total no rodapé do drawer de perfil. */
  variant?: "compact" | "panel";
}) {
  const router = useRouter();

  const logout = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST" });
    },
    onSettled: () => {
      router.push("/login");
      router.refresh();
    },
  });

  const className =
    variant === "panel"
      ? "flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-app-border bg-app-surface/80 px-3 py-2.5 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60"
      : "flex cursor-pointer items-center gap-2 rounded-lg border border-app-border bg-app-surface/80 px-2 py-1.5 text-sm font-medium text-app-text backdrop-blur-md transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-2";

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className={className}
      aria-label="Sair da conta"
    >
      <FaRightFromBracket className="h-4 w-4" aria-hidden />
      <span>{logout.isPending ? "Saindo…" : "Sair"}</span>
    </button>
  );
}
