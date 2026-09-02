"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaCopy, FaPaperPlane, FaTrashCan } from "react-icons/fa6";
import { FormError, FormField, SubmitButton } from "@/components/auth/form-field";
import type { ProjectInvite } from "@/lib/api-types";
import { PLAN_LIMIT_TOOLTIP } from "@/lib/plan-quota";
import {
  createProjectInvite,
  inviteShareUrl,
  projectInvitesQueryKey,
  revokeProjectInvite,
} from "@/lib/projects-api";

export function InviteByEmailForm({
  projectId,
  disabled,
  onCreated,
}: {
  projectId: string;
  disabled?: boolean;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => createProjectInvite(projectId, email),
    onSuccess: () => {
      setEmail("");
      setError(null);
      onCreated();
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível enviar o convite.",
      );
    },
  });

  return (
    <form
      className="mt-4 border-t border-app-border/60 pt-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        if (!email.includes("@")) {
          setError("Informe um e-mail válido.");
          return;
        }
        setError(null);
        invite.mutate();
      }}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-app-muted">
        Convidar por e-mail
      </p>
      <FormError message={error} id="invite-email-error" />
      <FormField
        id="invite-email"
        label="E-mail"
        type="email"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="maria@empresa.com"
        disabled={invite.isPending || disabled}
      />
      <div className="mt-3">
        <SubmitButton
          pending={invite.isPending}
          pendingLabel="A enviar…"
          disabled={disabled}
          title={disabled ? PLAN_LIMIT_TOOLTIP : undefined}
        >
          <span className="inline-flex items-center gap-2">
            <FaPaperPlane className="h-3.5 w-3.5" aria-hidden />
            Convidar
          </span>
        </SubmitButton>
      </div>
    </form>
  );
}

/** Convites pendentes: copiar link e revogar. */
export function ProjectInvitesPanel({
  projectId,
  invites,
}: {
  projectId: string;
  invites: ProjectInvite[];
}) {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: projectInvitesQueryKey(projectId),
    });

  const revoke = useMutation({
    mutationFn: (inviteId: string) =>
      revokeProjectInvite(projectId, inviteId),
    onSuccess: () => invalidate(),
  });

  async function copyLink(invite: ProjectInvite) {
    const url = inviteShareUrl(invite.token, window.location.origin);
    await navigator.clipboard.writeText(url);
    setCopiedId(invite.id);
  }

  return (
    <div className="mt-2 w-full max-w-xl text-left">
      {invites.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-app-muted">
            Convites pendentes
          </p>
          <ul className="mt-1.5 space-y-1.5">
            {invites.map((invite) => (
              <li
                key={invite.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-app-border/70 bg-app-surface/60 px-2.5 py-1.5"
              >
                <span className="min-w-0 truncate text-xs text-app-text">
                  {invite.email}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => void copyLink(invite)}
                    className="flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-app-accent transition hover:bg-app-accent/10"
                  >
                    <FaCopy className="h-3 w-3" aria-hidden />
                    {copiedId === invite.id ? "Copiado" : "Copiar link"}
                  </button>
                  <button
                    type="button"
                    onClick={() => revoke.mutate(invite.id)}
                    disabled={revoke.isPending}
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-muted transition hover:bg-red-500/15 hover:text-red-700 disabled:opacity-60 dark:hover:text-red-300"
                    aria-label={`Revogar convite de ${invite.email}`}
                  >
                    <FaTrashCan className="h-3 w-3" aria-hidden />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-xs text-app-muted">Nenhum convite pendente.</p>
      )}
    </div>
  );
}
