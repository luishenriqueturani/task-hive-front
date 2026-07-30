"use client";

import { useQuery } from "@tanstack/react-query";
import { FaListCheck } from "react-icons/fa6";
import type { ToDoStatus, ToDoSummary } from "@/lib/api-types";
import {
  DashboardSection,
  ItemCard,
  SectionGrid,
  SectionNotice,
  SectionSkeleton,
} from "./dashboard-section";

const STATUS_LABELS: Record<ToDoStatus, string> = {
  CREATED: "Criada",
  TODO: "A fazer",
  DONE: "Concluída",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada",
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

async function fetchToDos(): Promise<ToDoSummary[]> {
  const res = await fetch("/api/bff/to-do", { credentials: "include" });
  if (!res.ok) throw new Error("Falha ao carregar tarefas");
  return res.json();
}

/** Seção de tarefas avulsas: cada bloco é uma tarefa ainda aberta. */
export function ToDosSection() {
  const todos = useQuery({ queryKey: ["/to-do"], queryFn: fetchToDos });

  const open = todos.data?.filter(
    (t) => t.status !== "DONE" && t.status !== "CANCELLED",
  );

  return (
    <DashboardSection title="Tarefas avulsas" icon={FaListCheck}>
      {todos.isPending ? (
        <SectionSkeleton />
      ) : todos.isError ? (
        <SectionNotice>Não foi possível carregar suas tarefas.</SectionNotice>
      ) : !open || open.length === 0 ? (
        <SectionNotice>Nenhuma tarefa pendente. Bom trabalho!</SectionNotice>
      ) : (
        <SectionGrid>
          {open.map((todo) => (
            <ItemCard key={todo.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="truncate text-sm font-semibold text-app-text">
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
                  : STATUS_LABELS[todo.status]}
              </p>
            </ItemCard>
          ))}
        </SectionGrid>
      )}
    </DashboardSection>
  );
}
