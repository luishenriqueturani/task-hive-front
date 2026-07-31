import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TodosView } from "@/components/todos/todos-view";
import type { ToDoSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

function mockTodosApi(initial: ToDoSummary[] = []) {
  let items = [...initial];

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.endsWith("/to-do") && method === "GET") {
      return new Response(JSON.stringify(items), { status: 200 });
    }

    if (url.endsWith("/to-do") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        title: string;
        description: string;
        isRecurring?: boolean;
        recurringType?: "DAILY" | "WEEKLY" | "MONTHLY";
      };
      const created: ToDoSummary = {
        id: String(items.length + 1),
        title: body.title,
        description: body.description,
        status: "CREATED",
        type: body.isRecurring ? "RECURRING" : "PUNCTUAL",
        recurringType: body.isRecurring ? body.recurringType ?? "WEEKLY" : null,
        recurringNextDate: body.isRecurring
          ? new Date().toISOString()
          : null,
        recurringDeadline: null,
        createdAt: new Date().toISOString(),
      };
      items = [...items, created];
      return new Response(JSON.stringify(created), { status: 201 });
    }

    if (url.includes("/to-do/end/") && method === "PATCH") {
      const id = url.split("/").pop()!;
      items = items.map((t) =>
        t.id === id ? { ...t, status: "DONE" as const } : t,
      );
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    if (url.includes("/nextDateRecurring/") && method === "PATCH") {
      const id = url.split("/").pop()!;
      items = items.map((t) =>
        t.id === id
          ? {
              ...t,
              recurringCount: (t.recurringCount ?? 0) + 1,
              recurringNextDate: new Date(
                Date.now() + 7 * 86400000,
              ).toISOString(),
            }
          : t,
      );
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    if (url.match(/\/to-do\/[^/]+$/) && method === "PATCH") {
      const id = url.split("/").pop()!;
      items = items.filter((t) => t.id !== id);
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    if (url.match(/\/to-do\/[^/]+$/) && method === "PUT") {
      const id = url.split("/").pop()!;
      const body = JSON.parse(String(init?.body)) as {
        title?: string;
        description?: string;
      };
      items = items.map((t) =>
        t.id === id
          ? {
              ...t,
              title: body.title ?? t.title,
              description: body.description ?? t.description,
            }
          : t,
      );
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("TodosView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra estado vazio nas abertas", async () => {
    mockTodosApi([]);
    renderWithProviders(<TodosView />);
    expect(
      await screen.findByText(/nenhuma tarefa com estes filtros/i),
    ).toBeInTheDocument();
  });

  it("cria, conclui e exclui tarefa", async () => {
    const user = userEvent.setup();
    mockTodosApi([]);
    renderWithProviders(<TodosView />);

    await user.click(
      await screen.findByRole("button", { name: /Nova tarefa/i }),
    );
    await user.type(screen.getByLabelText("Título"), "Estudar Nest");
    await user.type(
      screen.getByLabelText("Descrição"),
      "Revisar guards e DTOs",
    );
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByText("Estudar Nest")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/to-do",
      expect.objectContaining({ method: "POST" }),
    );

    await user.click(screen.getByRole("button", { name: /^Concluir$/ }));
    await user.selectOptions(screen.getByLabelText("Filtrar por status"), "DONE");
    expect(await screen.findByText("Estudar Nest")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Excluir$/ }));
    await user.click(screen.getByRole("button", { name: "Excluir tarefa" }));

    await waitFor(() => {
      expect(screen.queryByText("Estudar Nest")).not.toBeInTheDocument();
    });
  });

  it("filtra por tipo e concluir recorrente avança a data", async () => {
    const user = userEvent.setup();
    mockTodosApi([
      {
        id: "1",
        title: "Pontual",
        description: "Uma vez",
        status: "CREATED",
        type: "PUNCTUAL",
        recurringType: null,
        recurringNextDate: null,
        recurringDeadline: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "2",
        title: "Semanal",
        description: "Toda semana",
        status: "TODO",
        type: "RECURRING",
        recurringType: "WEEKLY",
        recurringCount: 0,
        recurringNextDate: "2026-08-01T00:00:00.000Z",
        recurringDeadline: null,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);

    renderWithProviders(<TodosView />);
    expect(await screen.findByText("Uma vez")).toBeInTheDocument();
    expect(screen.getByText("Toda semana")).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Filtrar por tipo"), "RECURRING");
    expect(screen.getByText("Toda semana")).toBeInTheDocument();
    expect(screen.queryByText("Uma vez")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Concluir$/ }));
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/to-do/nextDateRecurring/2",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });
});
