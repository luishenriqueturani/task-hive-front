import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectKanban } from "@/components/projects/project-kanban";
import type { ProjectStage } from "@/lib/api-types";
import { renderWithProviders } from "@tests/helpers/render";

const sessionUser = {
  id: "u1",
  name: "Ana",
  email: "ana@example.com",
  role: "CLIENT",
};

function mockStagesApi(initial: ProjectStage[] = []) {
  let stages = [...initial];

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

    if (url.includes("/tasks/stage/") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    if (url.endsWith("/project-stages") && method === "POST") {
      const body = JSON.parse(String(init?.body)) as {
        name: string;
        order: number;
      };
      const created: ProjectStage = {
        id: String(stages.length + 1),
        name: body.name,
        order: body.order,
      };
      stages = [...stages, created];
      return new Response(JSON.stringify(created), { status: 201 });
    }

    if (url.match(/\/project-stages\/[^/]+$/) && method === "PATCH") {
      const id = url.split("/").pop()!;
      const body = JSON.parse(String(init?.body)) as {
        name?: string;
        order?: number;
      };
      stages = stages.map((s) =>
        s.id === id
          ? {
              ...s,
              name: body.name ?? s.name,
              order: body.order ?? s.order,
            }
          : s,
      );
      const updated = stages.find((s) => s.id === id)!;
      return new Response(JSON.stringify(updated), { status: 200 });
    }

    if (url.match(/\/project-stages\/[^/]+$/) && method === "DELETE") {
      const id = url.split("/").pop()!;
      stages = stages.filter((s) => s.id !== id);
      return new Response(JSON.stringify({ id }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  });
}

describe("gestão de colunas no ProjectKanban", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra composer e oculta gestão para não-gestor", async () => {
    mockStagesApi([]);
    renderWithProviders(
      <ProjectKanban projectId="1" canManage={false} />,
    );

    expect(
      await screen.findByText(/ainda não tem colunas/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Adicionar coluna/i }),
    ).not.toBeInTheDocument();
  });

  it("cria coluna pelo composer inline", async () => {
    const user = userEvent.setup();
    mockStagesApi([]);

    renderWithProviders(<ProjectKanban projectId="1" canManage />);

    await user.click(
      await screen.findByRole("button", { name: /Adicionar coluna/i }),
    );
    await user.type(screen.getByLabelText("Nome da coluna"), "A fazer");
    await user.click(screen.getByRole("button", { name: "Criar coluna" }));

    expect(await screen.findByText("A fazer")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/project-stages",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("renomeia coluna", async () => {
    const user = userEvent.setup();
    mockStagesApi([{ id: "10", name: "Todo", order: 0 }]);

    renderWithProviders(<ProjectKanban projectId="1" canManage />);

    await user.click(
      await screen.findByRole("button", { name: /Renomear Todo/i }),
    );
    const input = screen.getByLabelText("Nome");
    await user.clear(input);
    await user.type(input, "A fazer");
    await user.click(screen.getByRole("button", { name: "Salvar" }));

    expect(await screen.findByText("A fazer")).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/project-stages/10",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("reordena com seta para a direita", async () => {
    const user = userEvent.setup();
    mockStagesApi([
      { id: "1", name: "A", order: 0 },
      { id: "2", name: "B", order: 1 },
    ]);

    renderWithProviders(<ProjectKanban projectId="p1" canManage />);

    await screen.findByText("A");
    await user.click(
      screen.getByRole("button", { name: /Mover coluna A para a direita/i }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/project-stages/1",
        expect.objectContaining({ method: "PATCH" }),
      );
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/project-stages/2",
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });

  it("exclui coluna com confirmação", async () => {
    const user = userEvent.setup();
    mockStagesApi([{ id: "10", name: "Done", order: 0 }]);

    renderWithProviders(<ProjectKanban projectId="1" canManage />);

    await user.click(
      await screen.findByRole("button", { name: /Excluir Done/i }),
    );
    expect(
      screen.getByRole("dialog", { name: "Excluir coluna" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Excluir coluna" }));

    await waitFor(() => {
      expect(screen.queryByText("Done")).not.toBeInTheDocument();
    });
  });
});
