"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { readApiErrorMessage } from "@/lib/api-error";
import {
  FormError,
  FormField,
  PasswordField,
  SubmitButton,
} from "./form-field";

async function loginRequest(data: { email: string; password: string }) {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(
        res,
        "Não foi possível entrar. Verifique seu e-mail e sua senha.",
      ),
    );
  }
}

/** Só aceita caminhos internos para evitar open redirect via `?next=`. */
function safeNextPath(nextPath?: string): string {
  if (nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")) {
    return nextPath;
  }
  return "/";
}

/**
 * Formulário de login (e-mail e senha). O BFF (`/api/auth/login`) guarda a
 * sessão em cookie httpOnly; em caso de sucesso, redireciona a `nextPath`.
 */
export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: loginRequest,
    onSuccess: () => {
      setFormError(null);
      router.push(safeNextPath(nextPath));
      router.refresh();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível entrar. Verifique seu e-mail e sua senha.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      if (!email.trim() || !password) {
        setFormError("Preencha o e-mail e a senha.");
        return;
      }
      login.mutate({ email: email.trim(), password });
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
        <FormError message={formError} />

        <FormField
          id="login-email"
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="você@empresa.com.br"
          disabled={pending}
          aria-invalid={!!formError}
        />

        <div>
          <PasswordField
            id="login-password"
            label="Senha"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={pending}
          />
          <p className="mt-1.5 text-right text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-app-accent hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </p>
        </div>

        <SubmitButton pending={pending} pendingLabel="Entrando…">
          Entrar
        </SubmitButton>

        <p className="text-center text-sm text-app-muted">
          Não tem uma conta?{" "}
          <Link
            href="/register"
            className="font-medium text-app-accent hover:underline"
          >
            Cadastre-se
          </Link>
        </p>
      </form>
    </div>
  );
}
