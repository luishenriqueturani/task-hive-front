"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { FaRightFromBracket } from "react-icons/fa6";

/** Encerra a sessão via BFF (limpa o cookie httpOnly) e volta ao login. */
export function LogoutButton() {
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

  return (
    <button
      type="button"
      onClick={() => logout.mutate()}
      disabled={logout.isPending}
      className="flex cursor-pointer items-center gap-2 rounded-lg border border-app-border bg-app-surface/80 px-2 py-1.5 text-sm font-medium text-app-text backdrop-blur-md transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3 sm:py-2"
      aria-label="Sair da conta"
    >
      <FaRightFromBracket className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">
        {logout.isPending ? "Saindo…" : "Sair"}
      </span>
    </button>
  );
}
