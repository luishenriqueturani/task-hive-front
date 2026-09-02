"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { FaPlus, FaTrashCan } from "react-icons/fa6";
import { PlanLimitHint } from "@/components/plan/plan-limit-hint";
import { SettingsShell } from "@/components/settings/settings-shell";
import {
  createPersonalAccessToken,
  fetchPersonalAccessTokens,
  PAT_QUERY_KEY,
  revokePersonalAccessToken,
} from "@/lib/personal-access-tokens-api";
import {
  formatQuotaUsage,
  isApiKeysLimitReached,
  PLAN_LIMIT_TOOLTIP,
} from "@/lib/plan-quota";
import {
  SESSION_USER_QUERY_KEY,
  useSessionUser,
} from "@/lib/use-session-user";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Gestão de tokens de API (PAT) para agentes e integrações. */
export function ApiTokensView() {
  const queryClient = useQueryClient();
  const session = useSessionUser();
  const atKeyLimit = isApiKeysLimitReached(session.data?.plan);
  const [name, setName] = useState("");
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tokens = useQuery({
    queryKey: PAT_QUERY_KEY,
    queryFn: fetchPersonalAccessTokens,
  });

  const create = useMutation({
    mutationFn: () => createPersonalAccessToken({ name: name.trim() }),
    onSuccess: (data) => {
      setName("");
      setCreatedToken(data.token);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: PAT_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SESSION_USER_QUERY_KEY });
    },
    onError: (err: unknown) =>
      setError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível criar o token.",
      ),
  });

  const revoke = useMutation({
    mutationFn: revokePersonalAccessToken,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PAT_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: SESSION_USER_QUERY_KEY });
    },
    onError: () => setError("Não foi possível revogar o token."),
  });

  const plan = session.data?.plan;
  const used = Math.max(tokens.data?.length ?? 0, plan?.usage.apiKeys ?? 0);
  const limit = plan?.limits.maxApiKeys;
  const quotaLabel =
    typeof limit === "number" ? formatQuotaUsage(used, limit) : String(used);

  return (
    <SettingsShell
      current="tokens"
      title="Tokens de API"
      description="Crie tokens para agentes de IA ou scripts. Use Authorization: Bearer th_pat_… nas chamadas directas à API."
    >
      <p className="text-sm text-app-muted">
        {quotaLabel} chaves
      </p>

      {error ? (
        <p className="mt-4 text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {createdToken ? (
        <div
          className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4"
          role="status"
        >
          <p className="text-sm font-medium text-app-text">
            Copie o token agora — não será mostrado outra vez:
          </p>
          <code className="mt-2 block break-all rounded bg-app-surface p-2 text-xs text-app-text">
            {createdToken}
          </code>
          <button
            type="button"
            className="mt-3 text-sm text-app-accent hover:underline"
            onClick={() => setCreatedToken(null)}
          >
            Fechar
          </button>
        </div>
      ) : null}

      {atKeyLimit ? (
        <div className="mt-4">
          <PlanLimitHint />
        </div>
      ) : null}

      <form
        className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (atKeyLimit) return;
          setError(null);
          if (!name.trim()) {
            setError("Indique um nome para o token.");
            return;
          }
          create.mutate();
        }}
      >
        <label className="flex-1 text-sm">
          <span className="mb-1 block text-app-muted">Nome do token</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Cursor agent"
            className="w-full rounded-lg border border-app-border bg-app-surface px-3 py-2 text-app-text"
            maxLength={120}
            disabled={create.isPending || atKeyLimit}
          />
        </label>
        <button
          type="submit"
          disabled={create.isPending || atKeyLimit}
          title={atKeyLimit ? PLAN_LIMIT_TOOLTIP : undefined}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-app-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FaPlus className="h-3.5 w-3.5" aria-hidden />
          Criar token
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {tokens.isPending ? (
          <li className="text-sm text-app-muted">A carregar…</li>
        ) : null}
        {(tokens.data ?? []).map((token) => (
          <li
            key={token.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-app-border/70 bg-app-surface p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-app-text">{token.name}</p>
              <p className="mt-1 font-mono text-xs text-app-muted">
                {token.tokenPrefix}…
              </p>
              <p className="mt-1 text-xs text-app-muted">
                Expira em {dateFormatter.format(new Date(token.expiresAt))}
                {token.lastUsedAt
                  ? ` · último uso ${dateFormatter.format(new Date(token.lastUsedAt))}`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              aria-label={`Revogar ${token.name}`}
              disabled={revoke.isPending}
              onClick={() => revoke.mutate(token.id)}
              className="shrink-0 rounded-lg p-2 text-app-muted transition hover:bg-red-500/10 hover:text-red-400"
            >
              <FaTrashCan className="h-4 w-4" />
            </button>
          </li>
        ))}
        {!tokens.isPending && (tokens.data?.length ?? 0) === 0 ? (
          <li className="text-sm text-app-muted">Nenhum token criado.</li>
        ) : null}
      </ul>
    </SettingsShell>
  );
}
