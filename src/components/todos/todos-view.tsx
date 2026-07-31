"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  FaCheck,
  FaPenToSquare,
  FaPlus,
  FaTrashCan,
} from "react-icons/fa6";
import {
  ItemCard,
  SectionNotice,
  SectionSkeleton,
} from "@/components/dashboard/dashboard-section";
import { Modal } from "@/components/ui/modal";
import type { ToDoStatus, ToDoSummary, ToDoType } from "@/lib/api-types";
import {
  advanceRecurringTodo,
  deleteTodo,
  endTodo,
  fetchTodos,
  isTodoOpen,
  TODO_STATUS_LABELS,
  TODO_TYPE_LABELS,
  TODOS_QUERY_KEY,
} from "@/lib/todos-api";
import { TodoFormModal } from "./todo-form-modal";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

type StatusFilter = "all" | "open" | ToDoStatus;
type TypeFilter = "all" | ToDoType;

type DialogState =
  | { type: "create" }
  | { type: "edit"; todo: ToDoSummary }
  | { type: "delete"; todo: ToDoSummary }
  | null;

/** Listagem de tarefas avulsas com filtros, CRUD, conclusão e recorrência. */
export function TodosView() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dialog, setDialog] = useState<DialogState>(null);

  const todos = useQuery({
    queryKey: TODOS_QUERY_KEY,
    queryFn: fetchTodos,
  });

  const filtered = useMemo(() => {
    const list = todos.data ?? [];
    return list.filter((t) => {
      if (statusFilter === "open" && !isTodoOpen(t)) return false;
      if (
        statusFilter !== "all" &&
        statusFilter !== "open" &&
        t.status !== statusFilter
      ) {
        return false;
      }
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      return true;
    });
  }, [todos.data, statusFilter, typeFilter]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: TODOS_QUERY_KEY });

  const conclude = useMutation({
    mutationFn: (todo: ToDoSummary) =>
      todo.type === "RECURRING"
        ? advanceRecurringTodo(todo.id)
        : endTodo(todo.id),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTodo(id),
    onSuccess: async () => {
      setDialog(null);
      await invalidate();
    },
  });

  const busy = conclude.isPending || remove.isPending;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-app-text">
            Tarefas avulsas
          </h1>
          <p className="mt-1 text-sm text-app-muted">
            Tarefas pontuais e recorrentes fora de projetos.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDialog({ type: "create" })}
          className="flex cursor-pointer items-center gap-2 rounded-lg bg-app-accent px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:opacity-95 sm:px-4"
        >
          <FaPlus className="h-3.5 w-3.5" aria-hidden />
          Nova tarefa
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-app-muted">
          Status
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            aria-label="Filtrar por status"
            className="rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-text outline-none focus:border-app-accent"
          >
            <option value="open">Abertas</option>
            <option value="all">Todas</option>
            {(Object.keys(TODO_STATUS_LABELS) as ToDoStatus[]).map((s) => (
              <option key={s} value={s}>
                {TODO_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-app-muted">
          Tipo
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
            aria-label="Filtrar por tipo"
            className="rounded-lg border border-app-border bg-app-surface px-2.5 py-1.5 text-sm text-app-text outline-none focus:border-app-accent"
          >
            <option value="all">Todos</option>
            <option value="PUNCTUAL">Pontual</option>
            <option value="RECURRING">Recorrente</option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        {todos.isPending ? (
          <SectionSkeleton blocks={4} />
        ) : todos.isError ? (
          <SectionNotice>
            Não foi possível carregar as tarefas. Recarregue a página.
          </SectionNotice>
        ) : filtered.length === 0 ? (
          <SectionNotice>
            Nenhuma tarefa com estes filtros.{" "}
            {statusFilter === "open"
              ? "Crie uma nova ou altere o filtro."
              : null}
          </SectionNotice>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((todo) => {
              const done = todo.status === "DONE";
              return (
              <li key={todo.id}>
                <ItemCard>
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`min-w-0 truncate text-sm font-semibold ${
                        done
                          ? "text-app-muted line-through"
                          : "text-app-text"
                      }`}
                    >
                      {todo.title}
                    </p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="rounded-full bg-app-accent/15 px-2 py-0.5 text-[11px] font-medium text-app-accent">
                        {TODO_TYPE_LABELS[todo.type]}
                      </span>
                      {done ? (
                        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          Concluída
                        </span>
                      ) : null}
                    </div>
                  </div>
                  {todo.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                      {todo.description}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-app-muted">
                    {TODO_STATUS_LABELS[todo.status] ?? "—"}
                    {todo.type === "RECURRING" && todo.recurringNextDate
                      ? ` · Próxima: ${dateFormatter.format(new Date(todo.recurringNextDate))}`
                      : null}
                    {todo.type === "RECURRING" && todo.recurringDeadline
                      ? ` · Até: ${dateFormatter.format(new Date(todo.recurringDeadline))}`
                      : null}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1 border-t border-app-border/50 pt-2">
                    {isTodoOpen(todo) ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => conclude.mutate(todo)}
                        className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-app-accent transition hover:bg-app-accent/10 disabled:opacity-40"
                        title={
                          todo.type === "RECURRING"
                            ? "Regista conclusão e avança a próxima data"
                            : "Marcar como concluída"
                        }
                      >
                        <FaCheck className="h-3 w-3" aria-hidden />
                        Concluir
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDialog({ type: "edit", todo })}
                      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-40"
                    >
                      <FaPenToSquare className="h-3 w-3" aria-hidden />
                      Editar
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDialog({ type: "delete", todo })}
                      className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 transition hover:bg-red-500/10 disabled:opacity-40 dark:text-red-300"
                    >
                      <FaTrashCan className="h-3 w-3" aria-hidden />
                      Excluir
                    </button>
                  </div>
                </ItemCard>
              </li>
              );
            })}
          </ul>
        )}
      </div>

      {dialog?.type === "create" ? (
        <TodoFormModal onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.type === "edit" ? (
        <TodoFormModal
          todo={dialog.todo}
          onClose={() => setDialog(null)}
        />
      ) : null}

      {dialog?.type === "delete" ? (
        <Modal
          title="Excluir tarefa"
          onClose={() => {
            if (!remove.isPending) setDialog(null);
          }}
        >
          <p className="text-sm text-app-muted">
            Excluir{" "}
            <span className="font-medium text-app-text">
              {dialog.todo.title}
            </span>
            ? A tarefa sairá da sua lista.
          </p>
          {remove.isError ? (
            <p
              className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-200"
              role="alert"
            >
              {remove.error instanceof Error
                ? remove.error.message
                : "Não foi possível excluir."}
            </p>
          ) : null}
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDialog(null)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg border border-app-border px-3 py-2 text-sm font-medium text-app-text transition hover:bg-app-surface-elevated/90 disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(dialog.todo.id)}
              disabled={remove.isPending}
              className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
            >
              {remove.isPending ? "Excluindo…" : "Excluir tarefa"}
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
