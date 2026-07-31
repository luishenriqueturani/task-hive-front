"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { FaPlus, FaTrashCan, FaUserGroup } from "react-icons/fa6";
import { FormError, FormField } from "@/components/auth/form-field";
import { Modal } from "@/components/ui/modal";
import type { ProjectParticipant, ProjectSummary, UserRef } from "@/lib/api-types";
import {
  addParticipant,
  fetchParticipants,
  fetchUsers,
  participantsQueryKey,
  PROJECTS_QUERY_KEY,
  removeParticipant,
} from "@/lib/projects-api";

function MemberChip({
  member,
  owner,
  onRemove,
}: {
  member: Pick<UserRef, "id" | "name" | "email">;
  owner?: boolean;
  onRemove?: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded-full border border-app-border/70 bg-app-surface/70 py-1 pl-1 pr-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-app-accent/20 text-[10px] font-semibold text-app-accent">
        {(member.name || member.email)[0]?.toUpperCase()}
      </span>
      <span className="text-xs text-app-text">
        {member.name || member.email}
      </span>
      {owner ? (
        <span className="rounded-full bg-app-accent/15 px-1.5 py-0.5 text-[10px] font-medium text-app-accent">
          Dono
        </span>
      ) : null}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-app-muted transition hover:bg-red-500/15 hover:text-red-700 dark:hover:text-red-300"
          aria-label={`Remover ${member.name || member.email}`}
        >
          <FaTrashCan className="h-3 w-3" aria-hidden />
        </button>
      ) : null}
    </li>
  );
}

/**
 * Participantes do projeto (inline no cabeçalho): chips do dono + GET
 * participants; adicionar via busca em GET /users; remover com confirmação.
 * Acções de gestão só quando `canManage` é true.
 */
export function ProjectParticipants({
  project,
  canManage,
}: {
  project: ProjectSummary;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<ProjectParticipant | null>(null);

  const participants = useQuery({
    queryKey: participantsQueryKey(project.id),
    queryFn: () => fetchParticipants(project.id),
  });

  const users = useQuery({
    queryKey: ["/users"],
    queryFn: fetchUsers,
    enabled: adding && canManage,
  });

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: participantsQueryKey(project.id),
      }),
      queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY }),
    ]);
  };

  const add = useMutation({
    mutationFn: (userId: string) => addParticipant(project.id, userId),
    onSuccess: async () => {
      setAddError(null);
      setSearch("");
      setAdding(false);
      await invalidate();
    },
    onError: (err: unknown) => {
      setAddError(
        err instanceof Error && err.message
          ? err.message
          : "Não foi possível adicionar o participante.",
      );
    },
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeParticipant(project.id, userId),
    onSuccess: async () => {
      setRemoving(null);
      await invalidate();
    },
  });

  const excludedIds = useMemo(() => {
    const ids = new Set((participants.data ?? []).map((p) => p.id));
    if (project.userOwner) ids.add(project.userOwner.id);
    return ids;
  }, [participants.data, project.userOwner]);

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = (users.data ?? []).filter((u) => !excludedIds.has(u.id));
    if (!q) return list.slice(0, 20);
    return list
      .filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.name ?? "").toLowerCase().includes(q),
      )
      .slice(0, 20);
  }, [users.data, excludedIds, search]);

  return (
    <div
      className="flex min-w-0 max-w-xl flex-1 flex-col items-end gap-1.5"
      aria-label="Participantes"
    >
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-app-muted">
        <FaUserGroup className="h-3.5 w-3.5 text-app-accent" aria-hidden />
        Participantes
      </div>

      {participants.isPending ? (
        <div
          className="h-8 w-40 animate-pulse rounded-full bg-app-surface-elevated/70"
          aria-hidden
        />
      ) : participants.isError ? (
        <p className="text-xs text-red-700 dark:text-red-300">
          Não foi possível carregar os participantes.
        </p>
      ) : (
        <ul className="flex flex-wrap items-center justify-end gap-1.5">
          {project.userOwner ? (
            <MemberChip member={project.userOwner} owner />
          ) : null}
          {(participants.data ?? []).map((member) => (
            <MemberChip
              key={member.id}
              member={member}
              onRemove={
                canManage ? () => setRemoving(member) : undefined
              }
            />
          ))}
          {canManage ? (
            <li>
              <button
                type="button"
                onClick={() => {
                  setAddError(null);
                  setSearch("");
                  setAdding(true);
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-app-border/80 bg-app-surface/50 px-2.5 py-1 text-xs font-medium text-app-muted transition hover:border-app-accent/50 hover:text-app-text"
              >
                <FaPlus className="h-3 w-3" aria-hidden />
                Adicionar
              </button>
            </li>
          ) : null}
        </ul>
      )}

      {adding ? (
        <Modal
          title="Adicionar participante"
          onClose={() => {
            if (!add.isPending) setAdding(false);
          }}
        >
          <FormError message={addError} />
          <FormField
            id="participant-search"
            label="Buscar por nome ou e-mail"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ex.: maria@empresa.com"
            disabled={add.isPending}
            autoFocus
          />

          <div className="mt-3 max-h-56 overflow-y-auto rounded-lg border border-app-border/70">
            {users.isPending ? (
              <p className="px-3 py-4 text-sm text-app-muted" role="status">
                A carregar utilizadores…
              </p>
            ) : users.isError ? (
              <p className="px-3 py-4 text-sm text-red-700 dark:text-red-200" role="alert">
                Não foi possível carregar a lista de utilizadores.
              </p>
            ) : candidates.length === 0 ? (
              <p className="px-3 py-4 text-sm text-app-muted">
                Nenhum utilizador disponível com este filtro.
              </p>
            ) : (
              <ul aria-label="Utilizadores disponíveis">
                {candidates.map((user) => (
                  <li key={user.id}>
                    <button
                      type="button"
                      disabled={add.isPending}
                      onClick={() => {
                        setAddError(null);
                        add.mutate(user.id);
                      }}
                      className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-accent/20 text-xs font-semibold text-app-accent">
                        {(user.name || user.email)[0]?.toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-app-text">
                          {user.name || "—"}
                        </span>
                        <span className="block truncate text-xs text-app-muted">
                          {user.email}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {add.isPending ? (
            <p className="mt-3 text-sm text-app-muted" role="status">
              A adicionar…
            </p>
          ) : null}
        </Modal>
      ) : null}

      {removing ? (
        <Modal
          title="Remover participante"
          onClose={() => {
            if (!remove.isPending) setRemoving(null);
          }}
        >
          <p className="text-sm text-app-muted">
            Remover{" "}
            <span className="font-medium text-app-text">
              {removing.name || removing.email}
            </span>{" "}
            deste projeto?
          </p>
          {remove.isError ? (
            <p
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
              role="alert"
            >
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível remover o participante."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRemoving(null)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border bg-app-surface/80 px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(removing.id)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {remove.isPending ? "Removendo…" : "Remover"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
