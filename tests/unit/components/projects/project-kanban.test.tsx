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
  const completions = new Map<
    string,
    { id: string; completedAt: string; stageId: string }[]
  >();

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

    if (url.includes("/timetrack") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    const completionsMatch = /\/tasks\/([^/]+)\/completions/.exec(url);
    if (completionsMatch) {
      const taskId = completionsMatch[1];
      if (method === "GET") {
        const list = (completions.get(taskId) ?? []).map((c) => {
          const stage = stages.find((s) => s.id === c.stageId)!;
          return {
            id: c.id,
            completedAt: c.completedAt,
            stage: { id: stage.id, name: stage.name, order: stage.order },
          };
        });
        return new Response(JSON.stringify(list), { status: 200 });
      }
      if (method === "POST") {
        const task = tasks.find((t) => t.id === taskId);
        if (!task) return new Response("not found", { status: 404 });
        if (task.completedAt) {
          return new Response(JSON.stringify({ message: "já concluída" }), {
            status: 400,
          });
        }
        const completedAt = new Date().toISOString();
        tasks = tasks.map((t) =>
          t.id === taskId ? { ...t, completedAt } : t,
        );
        const entry = {
          id: `c-${taskId}`,
          completedAt,
          stageId: task.stage!.id,
        };
        completions.set(taskId, [...(completions.get(taskId) ?? []), entry]);
        return new Response(
          JSON.stringify(tasks.find((t) => t.id === taskId)),
          { status: 201 },
        );
      }
    }

    const stageMatch = /\/tasks\/stage\/([^/?]+)/.exec(url);
    if (stageMatch && method === "GET") {
      const stageId = stageMatch[1];
      return new Response(
        JSON.stringify(
          tasks
            .filter((t) => t.stage?.id === stageId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        ),
        { status: 200 },
      );
    }

    if (url.endsWith("/tasks") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        name: string;
        stageId: string;
      };
      const stage = stages.find((s) => s.id === body.stageId)!;
      const same = tasks.filter((t) => t.stage?.id === body.stageId);
      const created: TaskSummary = {
        id: `t-${tasks.length + 1}`,
        name: body.name,
        description: null,
        completedAt: null,
        order: same.length,
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
        order?: number;
        completedAt?: null;
      };
      tasks = tasks.map((t) => {
        if (t.id !== id) return t;
        const stage = body.stageId
          ? stages.find((s) => s.id === body.stageId)
          : null;
        let order = t.order;
        if (body.order !== undefined) order = body.order;
        else if (stage) {
          order = tasks.filter((x) => x.stage?.id === stage.id && x.id !== id)
            .length;
        }
        return {
          ...t,
          name: body.name ?? t.name,
          description:
            body.description !== undefined ? body.description : t.description,
          completedAt:
            body.completedAt === null
              ? null
              : (t.completedAt ?? null),
          order,
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

    if (url.includes("/subtasks/task/") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("ProjectKanban", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.useRealTimers();
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
        order: 0,
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

  it("abre modal e exclui tarefa", async () => {
    const user = userEvent.setup();
    mockKanbanApi([
      {
        id: "t1",
        name: "Apagar",
        description: "temp",
        order: 0,
        stage: { id: "s1", name: "A fazer", order: 0 },
        user: { id: "u1" },
      },
    ]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await user.click(await screen.findByText("Apagar"));
    expect(
      await screen.findByRole("dialog", { name: "Detalhe da tarefa" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Histórico")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Excluir$/ }));
    await user.click(
      screen.getByRole("button", { name: "Excluir tarefa" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("Apagar")).not.toBeInTheDocument();
    });
  });

  it("conclui tarefa e avança após 1,5s", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    mockKanbanApi([
      {
        id: "t1",
        name: "Avancar",
        order: 0,
        completedAt: null,
        stage: { id: "s1", name: "A fazer", order: 0 },
        user: { id: "u1" },
      },
    ]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await screen.findByText("Avancar");
    await user.click(
      screen.getByRole("button", { name: /Concluir Avancar/i }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/tasks/t1/completions",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await vi.advanceTimersByTimeAsync(1600);

    await waitFor(() => {
      const patches = vi
        .mocked(fetch)
        .mock.calls.filter(
          ([url, init]) =>
            String(url) === "/api/bff/tasks/t1" &&
            (init as RequestInit | undefined)?.method === "PATCH",
        );
      expect(patches.length).toBeGreaterThan(0);
      const body = JSON.parse(String(patches.at(-1)?.[1]?.body));
      expect(body.stageId).toBe("s2");
      expect(body.completedAt).toBeNull();
    });

    vi.useRealTimers();
  });

  it("na última coluna conclui sem avançar", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({
      advanceTimers: vi.advanceTimersByTime,
    });
    mockKanbanApi([
      {
        id: "t1",
        name: "Final",
        order: 0,
        completedAt: null,
        stage: { id: "s2", name: "Feito", order: 1 },
        user: { id: "u1" },
      },
    ]);
    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await screen.findByText("Final");
    await user.click(screen.getByRole("button", { name: /Concluir Final/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/tasks/t1/completions",
        expect.objectContaining({ method: "POST" }),
      );
    });

    await vi.advanceTimersByTimeAsync(1600);

    const patches = vi
      .mocked(fetch)
      .mock.calls.filter(
        ([url, init]) =>
          String(url) === "/api/bff/tasks/t1" &&
          (init as RequestInit | undefined)?.method === "PATCH",
      );
    expect(patches).toHaveLength(0);
    vi.useRealTimers();
  });
});
