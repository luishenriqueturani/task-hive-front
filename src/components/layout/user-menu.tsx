"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaUser, FaXmark } from "react-icons/fa6";
import { LogoutButton } from "@/components/auth/logout-button";
import type { SessionUser } from "@/lib/session";

const ROLE_LABELS: Record<string, string> = {
  ADMIN_GOD: "Administrador",
  ADMIN_COLLABORATOR: "Colaborador admin",
  CLIENT: "Cliente",
};

/** Iniciais do nome para o avatar (ex.: "Luis Silva" → "LS"). */
function initials(name: string | null): string | null {
  if (!name?.trim()) return null;
  const parts = name.trim().split(/\s+/);
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase() || null;
}

function Avatar({ name }: { name: string | null }) {
  const text = initials(name);
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-app-accent/20 text-xs font-semibold text-app-accent"
      aria-hidden
    >
      {text ?? <FaUser className="h-3.5 w-3.5" />}
    </span>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-app-muted">
        {label}
      </dt>
      <dd className="mt-0.5 break-all text-sm text-app-text">{value}</dd>
    </div>
  );
}

/**
 * Botão de perfil do header (avatar + nome). Ao clicar, abre um menu lateral
 * (drawer) à direita com as informações do perfil.
 */
export function UserMenu({ user }: { user: SessionUser }) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-app-surface-elevated/90 sm:pr-3"
        aria-label="Abrir perfil"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <Avatar name={user.name} />
        <span className="hidden max-w-40 truncate text-sm font-medium text-app-text lg:inline">
          {user.name || user.email}
        </span>
      </button>

      {/*
        Portal no <body>: o header usa backdrop-blur, e `backdrop-filter`
        torna o elemento containing block de descendentes `fixed` — sem o
        portal, o overlay ficaria confinado à caixa do header.
      */}
      {open
        ? createPortal(
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Perfil">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />

          <aside className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-app-border/70 bg-app-surface p-5 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-app-text">
                Meu perfil
              </h2>
              <button
                type="button"
                onClick={close}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
                aria-label="Fechar perfil"
              >
                <FaXmark className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-app-accent/20 text-lg font-semibold text-app-accent">
                {initials(user.name) ?? <FaUser className="h-6 w-6" aria-hidden />}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-app-text">
                  {user.name || "—"}
                </p>
                <p className="truncate text-xs text-app-muted">{user.email}</p>
              </div>
            </div>

            <dl className="mt-8 space-y-4">
              <ProfileRow label="Nome" value={user.name || "—"} />
              <ProfileRow label="E-mail" value={user.email} />
              <ProfileRow
                label="Tipo de conta"
                value={(user.role && ROLE_LABELS[user.role]) || user.role || "—"}
              />
            </dl>

            <div className="mt-auto space-y-4 pt-6">
              <p className="text-xs text-app-muted">
                Em breve: edição de perfil, foto e preferências.
              </p>
              <LogoutButton variant="panel" />
            </div>
          </aside>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
