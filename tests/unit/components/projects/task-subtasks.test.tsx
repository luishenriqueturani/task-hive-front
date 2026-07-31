import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskSubtasks } from "@/components/projects/task-subtasks";
import type { SubtaskSummary } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

const sessionUser = {
  id: "u1",
  name: "Ana",
  email: "ana@test.com",
  role: "CLIENT",
};

function mockSubtasksApi(initial: SubtaskSummary[] = []) {
  let items = [...initial];

  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/subtasks/task/") && method === "GET") {
      return new Response(JSON.stringify(items), { status: 200 });
    }

    if (url.endsWith("/subtasks") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        name: string;
        taskId: string;
      };
      const created: SubtaskSummary = {
        id: String(items.length + 1),
        name: body.name,
        isCompleted: false,
        responsible: {
          id: sessionUser.id,
          name: sessionUser.name,
          email: sessionUser.email,
        },
      };
      items = [...items, created];
      return new Response(JSON.stringify(created), { status: 201 });
    }

    if (url.match(/\/subtasks\/[^/]+$/) && method === "PATCH") {
      const id = url.split("/").pop()!;
      const body = JSON.parse(String(init?.body)) as {
        name?: string;
        isCompleted?: boolean;
      };
      items = items.map((s) =>
        s.id === id
          ? {
              ...s,
              name: body.name ?? s.name,
              isCompleted:
                body.isCompleted !== undefined
                  ? body.isCompleted
                  : s.isCompleted,
            }
          : s,
      );
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    if (url.match(/\/subtasks\/[^/]+$/) && method === "DELETE") {
      const id = url.split("/").pop()!;
      items = items.filter((s) => s.id !== id);
      return new Response(JSON.stringify({ affected: 1 }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("TaskSubtasks", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("lista subtarefas e cria nova", async () => {
    const user = userEvent.setup();
    mockSubtasksApi([]);

    renderWithProviders(
      <TaskSubtasks taskId="t1" sessionUser={sessionUser} />,
    );

    expect(await screen.findByText("Subtarefas")).toBeInTheDocument();

    await user.type(
      screen.getByLabelText("Nome da nova subtarefa"),
      "Escrever testes",
    );
    await user.click(
      screen.getByRole("button", { name: "Adicionar subtarefa" }),
    );

    expect(await screen.findByText("Escrever testes")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/subtasks",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("marca como concluída, edita e exclui quando é responsável", async () => {
    const user = userEvent.setup();
    mockSubtasksApi([
      {
        id: "10",
        name: "Revisar PR",
        isCompleted: false,
        responsible: { id: "u1", name: "Ana" },
      },
    ]);

    renderWithProviders(
      <TaskSubtasks taskId="t1" sessionUser={sessionUser} />,
    );

    expect(await screen.findByText("Revisar PR")).toBeInTheDocument();
    expect(screen.getByText("0/1 concluídas")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Concluir Revisar PR/i }),
    );
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/subtasks/10",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
    expect(await screen.findByText("1/1 concluídas")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Editar Revisar PR/i }));
    const editInput = screen.getByLabelText("Editar nome da subtarefa");
    await user.clear(editInput);
    await user.type(editInput, "Revisar e merge");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("Revisar e merge")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Excluir Revisar e merge/i }),
    );
    await waitFor(() => {
      expect(screen.queryByText("Revisar e merge")).not.toBeInTheDocument();
    });
  });

  it("oculta ações de gestão para quem não é responsável", async () => {
    mockSubtasksApi([
      {
        id: "10",
        name: "De outro",
        isCompleted: false,
        responsible: { id: "other", name: "Outro" },
      },
    ]);

    renderWithProviders(
      <TaskSubtasks taskId="t1" sessionUser={sessionUser} />,
    );

    expect(await screen.findByText("De outro")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Editar De outro/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Concluir De outro/i }),
    ).toBeDisabled();
  });
});
