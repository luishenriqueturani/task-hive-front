"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
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
import { GeneratePasswordButton } from "./generate-password-button";

async function checkTokenRequest(token: string): Promise<boolean> {
  const res = await fetch("/api/bff/auth/check-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) return false;
  const valid = (await res.json()) as unknown;
  return valid === true;
}

async function resetPasswordRequest(data: {
  password: string;
  confirmPassword: string;
  token: string;
}) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível redefinir a senha."),
    );
  }
}

function InvalidTokenNotice() {
  return (
    <div className="mt-4 space-y-4 sm:mt-6">
      <FormError message="Este link de redefinição é inválido ou expirou. Solicite um novo." />
      <p className="text-center text-sm text-app-muted">
        <Link
          href="/forgot-password"
          className="font-medium text-app-accent hover:underline"
        >
          Solicitar novo link
        </Link>
      </p>
    </div>
  );
}

/**
 * Formulário de redefinição de senha: valida o token do link e, em caso de
 * sucesso, o BFF já cria a nova sessão (cookie httpOnly) e redireciona à raiz.
 */
export function ResetPasswordForm({ token }: { token?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const tokenCheck = useQuery({
    queryKey: ["auth", "check-token", token],
    queryFn: () => checkTokenRequest(token as string),
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const reset = useMutation({
    mutationFn: resetPasswordRequest,
    onSuccess: () => {
      setFormError(null);
      router.push("/");
      router.refresh();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível redefinir a senha.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      if (!password || !confirmPassword) {
        setFormError("Preencha a nova senha e a confirmação.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("As senhas não coincidem.");
        return;
      }
      reset.mutate({ password, confirmPassword, token: token as string });
    },
    [password, confirmPassword, token, reset],
  );

  if (!token || tokenCheck.data === false || tokenCheck.isError) {
    return <InvalidTokenNotice />;
  }

  if (tokenCheck.isPending) {
    return (
      <p className="mt-6 text-sm text-app-muted" role="status">
        Validando o link de redefinição…
      </p>
    );
  }

  const pending = reset.isPending;

  return (
    <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={onSubmit} noValidate>
      <FormError message={formError} />

      <div>
        <PasswordField
          id="reset-password"
          label="Nova senha"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={pending}
          hint="Mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
        />
        <GeneratePasswordButton
          onGenerate={(pwd) => {
            setPassword(pwd);
            setConfirmPassword(pwd);
          }}
          disabled={pending}
        />
      </div>

      <PasswordField
        id="reset-confirm-password"
        label="Confirmar nova senha"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        disabled={pending}
      />

      <SubmitButton pending={pending} pendingLabel="Redefinindo…">
        Redefinir senha
      </SubmitButton>
    </form>
  );
}
