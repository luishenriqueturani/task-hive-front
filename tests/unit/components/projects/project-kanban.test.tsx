import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectKanban } from "@/components/projects/project-kanban";
import type { ProjectStage, TaskSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

const stages: ProjectStage[] = [
  { id: "s1", name: "A fazer", order: 0 },
  { id: "s2", name: "Feito", order: 1 },
];

const sessionUser = {
  id: "u1",
  name: "Ana",
  email: "ana@example.com",
  role: "CLIENT",
};

function mockKanbanApi(initialTasks: TaskSummary[] = []) {
  let tasks = [...initialTasks];

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/auth/me")) {
      return new Response(JSON.stringify({ user: sessionUser }), {
        status: 200,
      });
    }

    if (url.includes("/project-stages/project/") && method === "GET") {
      return new Response(JSON.stringify(stages), { status: 200 });
    }

    const stageMatch = /\/tasks\/stage\/([^/?]+)/.exec(url);
    if (stageMatch && method === "GET") {
      const stageId = stageMatch[1];
      return new Response(
        JSON.stringify(tasks.filter((t) => t.stage?.id === stageId)),
        { status: 200 },
      );
    }

    if (url.endsWith("/tasks") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        name: string;
        stageId: string;
      };
      const stage = stages.find((s) => s.id === body.stageId)!;
      const created: TaskSummary = {
        id: `t-${tasks.length + 1}`,
        name: body.name,
        description: null,
        stage: { id: stage.id, name: stage.name, order: stage.order },
        user: { id: sessionUser.id },
      };
      tasks = [...tasks, created];
      return new Response(JSON.stringify(created), { status: 201 });
    }

    if (url.match(/\/tasks\/[^/]+$/) && method === "PATCH") {
      const id = url.split("/").pop()!;
      const body = JSON.parse(String(init?.body)) as {
        name?: string;
        description?: string;
        stageId?: string;
      };
      tasks = tasks.map((t) => {
        if (t.id !== id) return t;
        const stage = body.stageId
          ? stages.find((s) => s.id === body.stageId)
          : null;
        return {
          ...t,
          name: body.name ?? t.name,
          description:
            body.description !== undefined ? body.description : t.description,
          stage: stage
            ? { id: stage.id, name: stage.name, order: stage.order }
            : t.stage,
        };
      });
      return new Response(
        JSON.stringify(tasks.find((t) => t.id === id)),
        { status: 200 },
      );
    }

    if (url.match(/\/tasks\/[^/]+$/) && method === "DELETE") {
      const id = url.split("/").pop()!;
      tasks = tasks.filter((t) => t.id !== id);
      return new Response(JSON.stringify({ id }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("ProjectKanban", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("renderiza colunas do quadro", async () => {
    mockKanbanApi([]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    expect(await screen.findByText("A fazer")).toBeInTheDocument();
    expect(screen.getByText("Feito")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Adicionar coluna/i }),
    ).toBeInTheDocument();
  });

  it("cria tarefa na coluna", async () => {
    const user = userEvent.setup();
    mockKanbanApi([]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await user.click(
      await screen.findByRole("button", { name: /Nova tarefa em A fazer/i }),
    );
    await user.type(screen.getByLabelText("Título"), "Escrever docs");
    await user.click(screen.getByRole("button", { name: "Criar tarefa" }));

    expect(await screen.findByText("Escrever docs")).toBeInTheDocument();
  });

  it("move tarefa para a próxima coluna", async () => {
    const user = userEvent.setup();
    mockKanbanApi([
      {
        id: "t1",
        name: "Card",
        stage: { id: "s1", name: "A fazer", order: 0 },
        user: { id: "u1" },
      },
    ]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await screen.findByText("Card");
    await user.click(
      screen.getByRole("button", {
        name: /Mover Card para a próxima coluna/i,
      }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/tasks/t1",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("abre drawer e exclui tarefa", async () => {
    const user = userEvent.setup();
    mockKanbanApi([
      {
        id: "t1",
        name: "Apagar",
        description: "temp",
        stage: { id: "s1", name: "A fazer", order: 0 },
        user: { id: "u1" },
      },
    ]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await user.click(await screen.findByText("Apagar"));
    expect(
      await screen.findByRole("dialog", { name: "Detalhe da tarefa" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Excluir$/ }));
    await user.click(
      screen.getByRole("button", { name: "Excluir tarefa" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Apagar")).not.toBeInTheDocument();
    });
  });
});
