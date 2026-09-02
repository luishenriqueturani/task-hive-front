"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useReducer, type FormEvent } from "react";
import { FaPencil, FaPlus, FaTrashCan } from "react-icons/fa6";
import {
  ADMIN_PLANS_QUERY_KEY,
  createAdminPlanBenefit,
  deleteAdminPlanBenefit,
  updateAdminPlanBenefit,
  type AdminPlan,
  type PublicPlanBenefit,
} from "@/lib/plans-api";

type DraftState = {
  editingId: string | null;
  title: string;
  body: string;
};

type DraftAction =
  | { type: "reset" }
  | { type: "edit"; benefit: PublicPlanBenefit }
  | { type: "title"; value: string }
  | { type: "body"; value: string };

const emptyDraft: DraftState = { editingId: null, title: "", body: "" };

function draftReducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case "reset":
      return emptyDraft;
    case "edit":
      return {
        editingId: action.benefit.id,
        title: action.benefit.title,
        body: action.benefit.body ?? "",
      };
    case "title":
      return { ...state, title: action.value };
    case "body":
      return { ...state, body: action.value };
    default:
      return state;
  }
}

/**
 * CRUD da área de benefícios comerciais (`PlanBenefit`).
 */
export function AdminPlanBenefits({ plan }: { plan: AdminPlan }) {
  const queryClient = useQueryClient();
  const [draft, dispatch] = useReducer(draftReducer, emptyDraft);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ADMIN_PLANS_QUERY_KEY });

  const create = useMutation({
    mutationFn: () =>
      createAdminPlanBenefit(plan.id, {
        title: draft.title.trim(),
        body: draft.body.trim() || null,
      }),
    onSuccess: () => {
      dispatch({ type: "reset" });
      void invalidate();
    },
  });

  const update = useMutation({
    mutationFn: () => {
      if (!draft.editingId) throw new Error("Benefício em falta.");
      return updateAdminPlanBenefit(plan.id, draft.editingId, {
        title: draft.title.trim(),
        body: draft.body.trim() || null,
      });
    },
    onSuccess: () => {
      dispatch({ type: "reset" });
      void invalidate();
    },
  });

  const remove = useMutation({
    mutationFn: (benefitId: string) =>
      deleteAdminPlanBenefit(plan.id, benefitId),
    onSuccess: () => void invalidate(),
  });

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) return;
    if (draft.editingId) update.mutate();
    else create.mutate();
  }

  const pending = create.isPending || update.isPending;
  const formError =
    create.error instanceof Error
      ? create.error.message
      : update.error instanceof Error
        ? update.error.message
        : remove.error instanceof Error
          ? remove.error.message
          : null;

  return (
    <section className="mt-8 border-t border-app-border/60 pt-6" aria-labelledby="benefits-heading">
      <h3 id="benefits-heading" className="text-base font-semibold text-app-text">
        Benefícios
      </h3>
      <ul className="mt-3 space-y-2">
        {plan.benefits.length === 0 ? (
          <li className="text-sm text-app-muted">Nenhum benefício cadastrado.</li>
        ) : (
          plan.benefits.map((benefit) => (
            <li
              key={benefit.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-app-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-app-text">{benefit.title}</p>
                {benefit.body ? (
                  <p className="mt-0.5 text-xs text-app-muted">{benefit.body}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-app-surface-elevated/90 hover:text-app-text"
                  aria-label={`Editar ${benefit.title}`}
                  onClick={() => dispatch({ type: "edit", benefit })}
                >
                  <FaPencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-app-muted transition hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                  aria-label={`Remover ${benefit.title}`}
                  disabled={remove.isPending}
                  onClick={() => remove.mutate(benefit.id)}
                >
                  <FaTrashCan className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="text-app-muted">
            {draft.editingId ? "Editar título" : "Novo título"}
          </span>
          <input
            value={draft.title}
            onChange={(event) =>
              dispatch({ type: "title", value: event.target.value })
            }
            required
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        <label className="block text-sm">
          <span className="text-app-muted">Texto (opcional)</span>
          <textarea
            value={draft.body}
            onChange={(event) =>
              dispatch({ type: "body", value: event.target.value })
            }
            rows={2}
            className="mt-1 w-full rounded-lg border border-app-border bg-app-bg px-3 py-2 text-app-text"
          />
        </label>
        {formError ? (
          <p className="text-sm text-red-700 dark:text-red-300" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 disabled:opacity-60"
          >
            <FaPlus className="h-3.5 w-3.5" aria-hidden />
            {draft.editingId ? "Guardar benefício" : "Adicionar benefício"}
          </button>
          {draft.editingId ? (
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm text-app-muted transition hover:bg-app-surface-elevated/80"
              onClick={() => dispatch({ type: "reset" })}
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
