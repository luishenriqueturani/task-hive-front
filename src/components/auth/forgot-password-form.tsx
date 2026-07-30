"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useCallback, useState } from "react";
import { readApiErrorMessage } from "@/lib/api-error";
import { FormError, FormField, SubmitButton } from "./form-field";

async function forgetPasswordRequest(email: string) {
  const res = await fetch("/api/bff/auth/forget-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível iniciar a redefinição."),
    );
  }
}

/** Formulário de "esqueci a senha": solicita o token de redefinição por e-mail. */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const forget = useMutation({
    mutationFn: forgetPasswordRequest,
    onSuccess: () => setFormError(null),
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível iniciar a redefinição.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      if (!email.trim()) {
        setFormError("Informe o seu e-mail.");
        return;
      }
      forget.mutate(email.trim());
    },
    [email, forget],
  );

  if (forget.isSuccess) {
    return (
      <div className="mt-4 space-y-4 sm:mt-6">
        <p
          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200"
          role="status"
        >
          Pedido registrado. Você receberá as instruções de redefinição no
          e-mail <span className="font-medium">{email.trim()}</span>.
        </p>
        <p className="text-center text-sm text-app-muted">
          <Link
            href="/login"
            className="font-medium text-app-accent hover:underline"
          >
            Voltar ao login
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={onSubmit} noValidate>
      <FormError message={formError} />

      <FormField
        id="forgot-email"
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="você@empresa.com.br"
        disabled={forget.isPending}
        aria-invalid={!!formError}
      />

      <SubmitButton pending={forget.isPending} pendingLabel="Enviando…">
        Enviar instruções
      </SubmitButton>

      <p className="text-center text-sm text-app-muted">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="font-medium text-app-accent hover:underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
