"use client";

import { useAuthControllerLogin } from "@/api/generated/auth/auth";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

/**
 * Formulário de login (e-mail e senha). Em caso de sucesso, redireciona à raiz;
 * sessão em cookie httpOnly será tratada no BFF.
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const login = useAuthControllerLogin({
    mutation: {
      onSuccess: () => {
        setFormError(null);
        router.push("/");
        router.refresh();
      },
      onError: (err: unknown) => {
        const msg =
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível entrar. Verifique seu e-mail e sua senha.";
        setFormError(msg);
      },
    },
  });

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      if (!email.trim() || !password) {
        setFormError("Preencha o e-mail e a senha.");
        return;
      }
      login.mutate({ data: { email: email.trim(), password } });
    },
    [email, password, login],
  );

  const pending = login.isPending;

  return (
    <div className="w-full max-w-md rounded-2xl border border-app-border/70 bg-app-surface/70 p-3 shadow-xl backdrop-blur-2xl sm:p-8">
      <h2 className="text-lg font-semibold text-app-text">Entrar</h2>
      <p className="mt-1 text-sm text-app-muted">
        Entre com sua conta Task Hive para continuar.
      </p>

      <form className="mt-4 space-y-2 sm:mt-8 sm:space-y-5" onSubmit={onSubmit} noValidate>
        {formError ? (
          <p
            className="rounded-lg border border-red-500/40 bg-red-500/10 px-2 py-1.5 text-sm text-red-700 dark:text-red-200 sm:px-3 sm:py-2"
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        <div>
          <label
            htmlFor="login-email"
            className="block text-sm font-medium text-app-text"
          >
            E-mail
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-surface px-2 py-2 text-app-text shadow-sm outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 sm:mt-1.5 sm:px-3 sm:py-2.5"
            placeholder="você@empresa.com.br"
            disabled={pending}
            aria-invalid={!!formError}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-app-text"
          >
            Senha
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-surface px-2 py-2 text-app-text shadow-sm outline-none transition placeholder:text-app-muted focus:border-app-accent focus:ring-2 focus:ring-app-accent/25 sm:mt-1.5 sm:px-3 sm:py-2.5"
            placeholder="••••••••"
            disabled={pending}
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2 focus-visible:ring-offset-app-surface disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
        >
          {pending ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
