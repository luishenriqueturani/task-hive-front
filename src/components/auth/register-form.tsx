"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { AccountKindToggle } from "@/components/auth/account-kind-toggle";
import {
  buildRegisterRequestBody,
  createRegisterFormState,
  registerFormReducer,
  validateRegisterForm,
  type RegisterRequestBody,
} from "@/components/auth/register-form-state";
import {
  AUTH_FORM_ERROR_ID,
  FormError,
  FormField,
  PasswordField,
  SubmitButton,
} from "./form-field";
import { GeneratePasswordButton } from "./generate-password-button";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { inviteQueryLooksLikeEmail } from "@/lib/br-documents";
import { readApiErrorMessage } from "@/lib/api-error";
import { fetchInvitePreview } from "@/lib/invites-api";

async function registerRequest(data: RegisterRequestBody) {
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

  const login = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: data.email, password: data.password }),
  });

  return { autoLogin: login.ok };
}

/**
 * Formulário de cadastro PF ou CNPJ. Cria o usuário e inicia a sessão.
 * `inviteQuery` vem de `?invite=` (e-mail ou token de convite).
 */
export function RegisterForm({ inviteQuery }: { inviteQuery?: string }) {
  const router = useRouter();
  const [state, dispatch] = useReducer(
    registerFormReducer,
    inviteQuery,
    createRegisterFormState,
  );

  const inviteToken = useMemo(() => {
    const raw = inviteQuery?.trim();
    if (!raw || inviteQueryLooksLikeEmail(raw)) return undefined;
    return raw;
  }, [inviteQuery]);

  const invite = useQuery({
    queryKey: ["invite-preview", inviteToken],
    queryFn: () => fetchInvitePreview(inviteToken!),
    enabled: Boolean(inviteToken),
    retry: false,
  });

  useEffect(() => {
    if (invite.data?.email) {
      dispatch({ type: "lockEmailFromInvite", email: invite.data.email });
    }
  }, [invite.data?.email]);

  const register = useMutation({
    mutationFn: registerRequest,
    onSuccess: ({ autoLogin }) => {
      dispatch({ type: "setFormError", formError: null });
      router.push(autoLogin ? "/dashboard" : "/login");
      router.refresh();
    },
    onError: (err: unknown) => {
      dispatch({
        type: "setFormError",
        formError:
          err instanceof Error && err.message
            ? err.message
            : "Não foi possível concluir o cadastro.",
      });
    },
  });

  const onSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      const error = validateRegisterForm(state);
      if (error) {
        dispatch({ type: "setFormError", formError: error });
        return;
      }
      dispatch({ type: "setFormError", formError: null });
      register.mutate(buildRegisterRequestBody(state, inviteToken));
    },
    [state, inviteToken, register],
  );

  const pending = register.isPending;
  const isCompany = state.accountKind === ACCOUNT_KIND.COMPANY;
  const inviteNotice = invite.isError
    ? "Não foi possível validar o convite. Pode criar a conta na mesma."
    : invite.data?.projectName
      ? `Convite para o projecto “${invite.data.projectName}”.`
      : state.emailLocked
        ? "E-mail preenchido a partir do convite."
        : null;

  return (
    <form
      className="mt-4 space-y-3 sm:mt-6 sm:space-y-4"
      onSubmit={onSubmit}
      noValidate
      aria-describedby={state.formError ? AUTH_FORM_ERROR_ID : undefined}
    >
      <FormError message={state.formError} />

      <AccountKindToggle
        value={state.accountKind}
        onChange={(accountKind) =>
          dispatch({ type: "setAccountKind", accountKind })
        }
        disabled={pending}
      />

      {invite.isPending ? (
        <p className="text-xs text-app-muted">A carregar convite…</p>
      ) : inviteNotice ? (
        <p className="text-xs text-app-muted">{inviteNotice}</p>
      ) : null}

      <FormField
        id="register-name"
        label={isCompany ? "Nome do responsável" : "Nome"}
        name="name"
        type="text"
        autoComplete="name"
        value={state.name}
        onChange={(e) => dispatch({ type: "setName", name: e.target.value })}
        placeholder={isCompany ? "Nome de quem vai gerir a conta" : "Seu nome"}
        disabled={pending}
      />

      {isCompany ? (
        <>
          <FormField
            id="register-legal-name"
            label="Razão social"
            name="legalName"
            type="text"
            autoComplete="organization"
            value={state.legalName}
            onChange={(e) =>
              dispatch({ type: "setLegalName", legalName: e.target.value })
            }
            placeholder="Empresa Exemplo Ltda"
            disabled={pending}
          />
          <FormField
            id="register-trade-name"
            label="Nome fantasia"
            name="tradeName"
            type="text"
            value={state.tradeName}
            onChange={(e) =>
              dispatch({ type: "setTradeName", tradeName: e.target.value })
            }
            placeholder="Opcional"
            disabled={pending}
            hint="Opcional"
          />
          <FormField
            id="register-cnpj"
            label="CNPJ"
            name="companyDocument"
            type="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            value={state.companyDocument}
            onChange={(e) =>
              dispatch({
                type: "setCompanyDocument",
                companyDocument: e.target.value,
              })
            }
            placeholder="00.000.000/0000-00"
            disabled={pending}
            hint="Letras ou números nas 12 primeiras posições."
          />
        </>
      ) : (
        <FormField
          id="register-cpf"
          label="CPF"
          name="document"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          value={state.document}
          onChange={(e) =>
            dispatch({ type: "setDocument", document: e.target.value })
          }
          placeholder="000.000.000-00"
          disabled={pending}
          hint="Opcional"
        />
      )}

      <FormField
        id="register-email"
        label="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        value={state.email}
        onChange={(e) => dispatch({ type: "setEmail", email: e.target.value })}
        placeholder="você@empresa.com.br"
        disabled={pending || state.emailLocked}
        readOnly={state.emailLocked}
        aria-invalid={!!state.formError || undefined}
      />

      <div>
        <PasswordField
          id="register-password"
          label="Senha"
          name="password"
          autoComplete="new-password"
          value={state.password}
          onChange={(e) =>
            dispatch({ type: "setPassword", password: e.target.value })
          }
          placeholder="••••••••"
          disabled={pending}
          hint="Mínimo 8 caracteres, com letra maiúscula, minúscula, número e símbolo."
        />
        <GeneratePasswordButton
          onGenerate={(pwd) =>
            dispatch({ type: "setGeneratedPassword", password: pwd })
          }
          disabled={pending}
        />
      </div>

      <PasswordField
        id="register-confirm-password"
        label="Confirmar senha"
        name="confirmPassword"
        autoComplete="new-password"
        value={state.confirmPassword}
        onChange={(e) =>
          dispatch({
            type: "setConfirmPassword",
            confirmPassword: e.target.value,
          })
        }
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
