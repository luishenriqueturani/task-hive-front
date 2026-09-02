"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { FaChevronDown, FaListCheck } from "react-icons/fa6";
import {
  fetchTodos,
  isTodoOpen,
  TODO_STATUS_LABELS,
  TODOS_QUERY_KEY,
} from "@/lib/todos-api";
import { ItemCard, SectionNotice } from "./dashboard-section";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

function CompactList() {
  const todos = useQuery({ queryKey: TODOS_QUERY_KEY, queryFn: fetchTodos });
  const open = todos.data?.filter(isTodoOpen);

  return (
    <div>
      {todos.isPending ? (
        <div className="space-y-2" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-xl bg-app-surface-elevated/70"
            />
          ))}
        </div>
      ) : todos.isError ? (
        <SectionNotice>Não foi possível carregar suas tarefas.</SectionNotice>
      ) : !open || open.length === 0 ? (
        <SectionNotice>
          Nenhuma tarefa pendente.{" "}
          <Link
            href="/to-do"
            className="font-medium text-app-accent hover:underline"
          >
            Gerir tarefas
          </Link>
        </SectionNotice>
      ) : (
        <ul className="space-y-2">
          {open.slice(0, 6).map((todo) => (
            <ItemCard key={todo.id}>
              <Link href="/to-do" className="group block">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-app-text group-hover:text-app-accent">
                    {todo.title}
                  </p>
                  <span className="shrink-0 rounded-full bg-app-accent/15 px-2 py-0.5 text-xs font-medium text-app-accent">
                    {todo.type === "RECURRING" ? "Recorrente" : "Pontual"}
                  </span>
                </div>
                {todo.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-app-muted">
                    {todo.description}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-app-muted">
                  {todo.type === "RECURRING" && todo.recurringNextDate
                    ? `Próxima: ${dateFormatter.format(new Date(todo.recurringNextDate))}`
                    : TODO_STATUS_LABELS[todo.status]}
                </p>
              </Link>
            </ItemCard>
          ))}
        </ul>
      )}
      <p className="mt-3">
        <Link
          href="/to-do"
          className="text-sm font-medium text-app-accent hover:underline"
        >
          Ver todas
        </Link>
      </p>
    </div>
  );
}

/**
 * Coluna do painel: lista compacta de to-dos. Accordion no telemóvel;
 * sticky à esquerda no desktop.
 */
export function ToDosSection() {
  const [open, setOpen] = useState(true);

  return (
    <aside className="w-full lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-app-text">
          <FaListCheck className="h-4 w-4 text-app-accent" aria-hidden />
          Tarefas avulsas
        </h2>
        <button
          type="button"
          className="rounded-lg p-1.5 text-app-muted transition hover:bg-app-surface-elevated/80 hover:text-app-text lg:hidden"
          aria-expanded={open}
          aria-controls="dashboard-todos-list"
          aria-label={
            open ? "Recolher tarefas avulsas" : "Expandir tarefas avulsas"
          }
          onClick={() => setOpen((value) => !value)}
        >
          <FaChevronDown
            className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
      </div>
      <div
        id="dashboard-todos-list"
        className={`mt-4 ${open ? "block" : "hidden"} lg:block`}
      >
        <CompactList />
      </div>
    </aside>
  );
}
