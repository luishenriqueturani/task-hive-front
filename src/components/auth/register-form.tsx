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
import { GeneratePasswordButton } from "./generate-password-button";

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

async function registerRequest(data: RegisterData) {
  const res = await fetch("/api/bff/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(
      await readApiErrorMessage(res, "Não foi possível concluir o cadastro."),
    );
  }

  // Autentica em seguida para estabelecer a sessão em cookie httpOnly.
  const login = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
  });

  return { autoLogin: login.ok };
}

/**
 * Formulário de cadastro: cria o usuário e já inicia a sessão.
 * Se o login automático falhar, encaminha à tela de login.
 */
export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: registerRequest,
    onSuccess: ({ autoLogin }) => {
      setFormError(null);
      router.push(autoLogin ? "/" : "/login");
      router.refresh();
    },
    onError: (err: unknown) => {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível concluir o cadastro.",
      );
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setFormError(null);
      if (!email.trim() || !password || !confirmPassword) {
        setFormError("Preencha o e-mail e a senha.");
        return;
      }
      if (password !== confirmPassword) {
        setFormError("As senhas não coincidem.");
        return;
      }
      register.mutate({
        name: name.trim(),
        email: email.trim(),
        password,
        confirmPassword,
      });
    },
    [name, email, password, confirmPassword, register],
  );

  const pending = register.isPending;

  return (
    <form className="mt-4 space-y-3 sm:mt-6 sm:space-y-4" onSubmit={onSubmit} noValidate>
      <FormError message={formError} />

      <FormField
        id="register-name"
        label="Nome"
        name="name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Seu nome"
        disabled={pending}
      />

      <FormField
        id="register-email"
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
          id="register-password"
          label="Senha"
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
        id="register-confirm-password"
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        disabled={pending}
      />

      <SubmitButton pending={pending} pendingLabel="Criando conta…">
        Criar conta
      </SubmitButton>

      <p className="text-center text-sm text-app-muted">
        Já tem uma conta?{" "}
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
