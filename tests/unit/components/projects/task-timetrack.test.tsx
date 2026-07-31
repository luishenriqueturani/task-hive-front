import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskTimetrack } from "@/components/projects/task-timetrack";
import type { TimetrackEntry } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("@/lib/use-task-timetrack-socket", () => ({
  useTaskTimetrackSocket: vi.fn(),
}));

const sessionUser = {
  id: "u1",
  name: "Ana",
  email: "ana@test.com",
  role: "CLIENT",
};

function mockTimetrackApi(initial: TimetrackEntry[] = [], opts?: { listStatus?: number }) {
  let items = [...initial];
  const listStatus = opts?.listStatus ?? 200;

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/timetrack/start") && method === "POST") {
      const created: TimetrackEntry = {
        id: String(items.length + 1),
        start: new Date().toISOString(),
        end: null,
        userId: sessionUser.id,
        userName: sessionUser.name,
      };
      items = items.map((e) =>
        e.userId === sessionUser.id && e.end == null
          ? { ...e, end: new Date().toISOString() }
          : e,
      );
      items = [...items, created];
      return new Response(JSON.stringify(created), { status: 201 });
    }

    const stopMatch = /\/timetrack\/([^/]+)\/stop$/.exec(url);
    if (stopMatch && method === "PATCH") {
      const id = stopMatch[1];
      items = items.map((e) =>
        e.id === id ? { ...e, end: new Date().toISOString() } : e,
      );
      const updated = items.find((e) => e.id === id)!;
      return new Response(JSON.stringify(updated), { status: 200 });
    }

    if (url.includes("/timetrack") && method === "GET") {
      if (listStatus === 403) {
        return new Response(
          JSON.stringify({
            message: "Sem permissão para listar timetrack desta tarefa",
          }),
          { status: 403 },
        );
      }
      return new Response(JSON.stringify(items), { status: 200 });
    }

    if (url.match(/\/timetrack\/[^/]+$/) && method === "DELETE") {
      const id = url.split("/").pop()!;
      items = items.filter((e) => e.id !== id);
      return new Response(JSON.stringify({ deleted: true }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("TaskTimetrack", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("lista vazia e inicia timer", async () => {
    const user = userEvent.setup();
    mockTimetrackApi([]);

    renderWithProviders(
      <TaskTimetrack
        taskId="t1"
        sessionUser={sessionUser}
        canManageProject
      />,
    );

    expect(
      await screen.findByText(/ainda não há registos/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Iniciar/i }));

    expect(await screen.findByText(/Em curso/i)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/tasks/t1/timetrack/start",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("para o timer activo", async () => {
    const user = userEvent.setup();
    mockTimetrackApi([
      {
        id: "10",
        start: new Date(Date.now() - 60_000).toISOString(),
        end: null,
        userId: "u1",
        userName: "Ana",
      },
    ]);

    renderWithProviders(
      <TaskTimetrack
        taskId="t1"
        sessionUser={sessionUser}
        canManageProject={false}
      />,
    );

    expect(await screen.findByText(/Em curso/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Parar$/ }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/tasks/t1/timetrack/10/stop",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("mostra erro 403 ao listar", async () => {
    mockTimetrackApi([], { listStatus: 403 });

    renderWithProviders(
      <TaskTimetrack
        taskId="t1"
        sessionUser={sessionUser}
        canManageProject={false}
      />,
    );

    expect(
      await screen.findByText(/sem permissão para listar/i),
    ).toBeInTheDocument();
  });

  it("oculta eliminar para quem não gere o registo", async () => {
    mockTimetrackApi([
      {
        id: "10",
        start: "2026-07-31T10:00:00.000Z",
        end: "2026-07-31T10:30:00.000Z",
        userId: "other",
        userName: "Outro",
      },
    ]);

    renderWithProviders(
      <TaskTimetrack
        taskId="t1"
        sessionUser={sessionUser}
        canManageProject={false}
      />,
    );

    expect(await screen.findByText("Outro")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Excluir registo/i }),
    ).not.toBeInTheDocument();
  });
});
