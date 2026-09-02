import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToDosSection } from "@/components/dashboard/todos-section";
import type { ToDoSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

function mockTodosList(items: ToDoSummary[]) {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify(items), { status: 200 }),
  );
}

const openTodo: ToDoSummary = {
  id: "1",
  title: "Estudar Nest",
  description: "Guards e DTOs",
  status: "TODO",
  type: "PUNCTUAL",
  recurringType: null,
  recurringNextDate: null,
  recurringDeadline: null,
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("ToDosSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra skeleton enquanto carrega", () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<ToDosSection />);

    expect(
      screen.getByRole("heading", { name: "Tarefas avulsas" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[aria-hidden]")).toBeInTheDocument();
  });

  it("mostra erro de carregamento", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("fail", { status: 500 }));

    renderWithProviders(<ToDosSection />);

    expect(
      await screen.findByText(/Não foi possível carregar suas tarefas/i),
    ).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há tarefas abertas", async () => {
    mockTodosList([
      { ...openTodo, id: "done", status: "DONE" },
      { ...openTodo, id: "cancelled", status: "CANCELLED" },
    ]);

    renderWithProviders(<ToDosSection />);

    expect(
      await screen.findByText(/Nenhuma tarefa pendente/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Gerir tarefas" })).toHaveAttribute(
      "href",
      "/to-do",
    );
  });

  it("lista até seis tarefas abertas", async () => {
    mockTodosList(
      Array.from({ length: 8 }, (_, index) => ({
        ...openTodo,
        id: String(index + 1),
        title: `Tarefa ${index + 1}`,
      })),
    );

    renderWithProviders(<ToDosSection />);

    expect(await screen.findByText("Tarefa 1")).toBeInTheDocument();
    expect(screen.getByText("Tarefa 6")).toBeInTheDocument();
    expect(screen.queryByText("Tarefa 7")).not.toBeInTheDocument();
  });

  it("mostra badge e status de tarefa pontual", async () => {
    mockTodosList([openTodo]);

    renderWithProviders(<ToDosSection />);

    expect(await screen.findByText("Estudar Nest")).toBeInTheDocument();
    expect(screen.getByText("Pontual")).toBeInTheDocument();
    expect(screen.getByText("A fazer")).toBeInTheDocument();
    expect(screen.getByText("Guards e DTOs")).toBeInTheDocument();
  });

  it("mostra badge e próxima data de tarefa recorrente", async () => {
    mockTodosList([
      {
        ...openTodo,
        id: "2",
        title: "Revisão semanal",
        type: "RECURRING",
        recurringType: "WEEKLY",
        recurringNextDate: "2026-08-15T12:00:00.000Z",
      },
    ]);

    renderWithProviders(<ToDosSection />);

    expect(await screen.findByText("Revisão semanal")).toBeInTheDocument();
    expect(screen.getByText("Recorrente")).toBeInTheDocument();
    expect(screen.getByText(/Próxima:/i)).toBeInTheDocument();
  });

  it("liga cada card para a listagem de to-dos", async () => {
    mockTodosList([
      openTodo,
      { ...openTodo, id: "2", title: "Outra tarefa" },
    ]);

    renderWithProviders(<ToDosSection />);

    await screen.findByText("Estudar Nest");

    const links = screen.getAllByRole("link");
    expect(links.every((link) => link.getAttribute("href") === "/to-do")).toBe(
      true,
    );
  });
});
