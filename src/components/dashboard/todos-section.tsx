"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { FaListCheck } from "react-icons/fa6";
import {
  fetchTodos,
  isTodoOpen,
  TODO_STATUS_LABELS,
  TODOS_QUERY_KEY,
} from "@/lib/todos-api";
import {
  DashboardSection,
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "./dashboard-section";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

/** Seção do painel: tarefas avulsas ainda abertas (atalho para /to-do). */
export function ToDosSection() {
  const todos = useQuery({ queryKey: TODOS_QUERY_KEY, queryFn: fetchTodos });

  const open = todos.data?.filter(isTodoOpen);

  return (
    <DashboardSection title="Tarefas avulsas" icon={FaListCheck}>
      {todos.isPending ? (
        <SectionSkeleton />
      ) : todos.isError ? (
        <SectionNotice>Não foi possível carregar suas tarefas.</SectionNotice>
      ) : !open || open.length === 0 ? (
        <SectionNotice>
          Nenhuma tarefa pendente.{" "}
          <Link href="/to-do" className="font-medium text-app-accent hover:underline">
            Gerir tarefas
          </Link>
        </SectionNotice>
      ) : (
        <SectionGrid>
          {open.slice(0, 6).map((todo) => (
            <ItemCard key={todo.id}>
              <Link href="/to-do" className="group block">
                <div className="flex items-start justify-between gap-3">
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
                <p className="mt-3 text-xs text-app-muted">
                  {todo.type === "RECURRING" && todo.recurringNextDate
                    ? `Próxima: ${dateFormatter.format(new Date(todo.recurringNextDate))}`
                    : TODO_STATUS_LABELS[todo.status]}
                </p>
              </Link>
            </ItemCard>
          ))}
        </SectionGrid>
      )}
    </DashboardSection>
  );
}
