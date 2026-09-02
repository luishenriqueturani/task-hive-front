"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  acceptInvite,
  fetchInvitePreview,
  inviteAuthHrefs,
} from "@/lib/invites-api";
import { useSessionUser } from "@/lib/use-session-user";

function emailsMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Página pública do convite: mostra o projecto; sem sessão pede login/cadastro
 * com `next=`; com sessão, Aceitar.
 */
export function InviteAcceptView({ token }: { token: string }) {
  const router = useRouter();
  const session = useSessionUser();
  const preview = useQuery({
    queryKey: ["invite-preview", token],
    queryFn: () => fetchInvitePreview(token),
    retry: false,
  });
  const hrefs = inviteAuthHrefs(token);

  const accept = useMutation({
    mutationFn: () => acceptInvite(token),
    onSuccess: ({ projectId }) => {
      router.push(`/projects/${projectId}`);
      router.refresh();
    },
  });

  const loggedIn = session.isSuccess && Boolean(session.data);
  const projectLabel = preview.data?.projectName ?? "um projecto";

  if (preview.isPending || session.isPending) {
    return (
      <AuthShell title="Convite" subtitle="A validar o convite…">
        <div
          className="mt-6 h-24 animate-pulse rounded-lg bg-app-surface-elevated/70"
          aria-hidden
        />
      </AuthShell>
    );
  }

  if (preview.isError || !preview.data) {
    return (
      <AuthShell
        title="Convite inválido"
        subtitle="Este link já não é válido ou expirou."
      >
        <p className="mt-6 text-center text-sm text-app-muted">
          <Link href="/login" className="font-medium text-app-accent hover:underline">
            Entrar
          </Link>
          {" · "}
          <Link href="/" className="font-medium text-app-accent hover:underline">
            Página inicial
          </Link>
        </p>
      </AuthShell>
    );
  }

  const wrongAccount =
    loggedIn &&
    session.data &&
    !emailsMatch(session.data.email, preview.data.email);

  return (
    <AuthShell
      title="Convite para projecto"
      subtitle={`Foi convidado para “${projectLabel}”.`}
    >
      <p className="mt-4 text-sm text-app-muted">
        Convite enviado para{" "}
        <span className="font-medium text-app-text">{preview.data.email}</span>.
      </p>

      {accept.isError ? (
        <p
          className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
          role="alert"
        >
          {accept.error instanceof Error
            ? accept.error.message
            : "Não foi possível aceitar o convite."}
        </p>
      ) : null}

      {loggedIn && wrongAccount ? (
        <p className="mt-4 text-sm text-app-muted" role="status">
          Está autenticado com outra conta. Entre com{" "}
          <span className="font-medium text-app-text">{preview.data.email}</span>{" "}
          para aceitar.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-2">
        {loggedIn && !wrongAccount ? (
          <button
            type="button"
            onClick={() => accept.mutate()}
            disabled={accept.isPending}
            className="w-full cursor-pointer rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:py-3"
          >
            {accept.isPending ? "A aceitar…" : "Aceitar convite"}
          </button>
        ) : loggedIn ? (
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 sm:px-4 sm:py-3"
          >
            Ir ao painel
          </Link>
        ) : (
          <>
            <Link
              href={hrefs.login}
              className="inline-flex w-full items-center justify-center rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:px-4 sm:py-3"
            >
              Entrar
            </Link>
            <Link
              href={hrefs.register}
              className="inline-flex w-full items-center justify-center rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 sm:px-4 sm:py-3"
            >
              Criar conta
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}
