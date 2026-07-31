import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import { ProjectDetail } from "@/components/projects/project-detail";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

const projectsPayload = [
  {
    id: "1",
    name: "Backlog",
    description: "Principal",
    createdAt: "2026-01-15T00:00:00.000Z",
    updatedAt: null,
    userOwner: { id: "owner-1", name: "Ana", email: "ana@example.com" },
    participants: [
      { id: "p1", name: "Bob", email: "bob@example.com" },
    ],
  },
];

function mockSession(user: { id: string; role: string | null } | null) {
  vi.mocked(fetch).mockImplementation(async (input, init) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();

    if (url.includes("/api/auth/me")) {
      if (!user) {
        return new Response(JSON.stringify({ message: "Não autenticado." }), {
          status: 401,
        });
      }
      return new Response(
        JSON.stringify({
          user: {
            id: user.id,
            name: "User",
            email: "u@example.com",
            role: user.role,
          },
        }),
        { status: 200 },
      );
    }
    if (url.includes("/participants") && method === "GET") {
      return new Response(
        JSON.stringify(projectsPayload[0].participants),
        { status: 200 },
      );
    }
    if (url.includes("/project-stages/project/") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/tasks/stage/") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (url.includes("/timetrack") && method === "GET") {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    if (
      (url.endsWith("/api/bff/projects") ||
        url.includes("/api/bff/projects?")) &&
      method === "GET"
    ) {
      return new Response(JSON.stringify(projectsPayload), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  });
}

describe("ProjectDetail", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra aviso para projeto inexistente", async () => {
    mockSession({ id: "owner-1", role: "CLIENT" });
    renderWithProviders(<ProjectDetail projectId="999" />);

    expect(
      await screen.findByText(/não encontrado ou você não tem acesso/i),
    ).toBeInTheDocument();
  });

  it("mostra menu de ações para o dono", async () => {
    const user = userEvent.setup();
    mockSession({ id: "owner-1", role: "CLIENT" });
    renderWithProviders(<ProjectDetail projectId="1" />);

    expect(await screen.findByRole("heading", { name: "Backlog" })).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Mais ações do projeto" }),
    );
    expect(screen.getByRole("menuitem", { name: "Editar" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Excluir" })).toBeInTheDocument();
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar", exact: true }),
    ).toBeInTheDocument();
  });

  it("oculta menu de ações e Adicionar para participante comum", async () => {
    mockSession({ id: "p1", role: "CLIENT" });
    renderWithProviders(<ProjectDetail projectId="1" />);

    await screen.findByRole("heading", { name: "Backlog" });
    expect(
      screen.queryByRole("button", { name: "Mais ações do projeto" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Adicionar", exact: true }),
    ).not.toBeInTheDocument();
  });

  it("confirma exclusão e chama DELETE", async () => {
    const user = userEvent.setup();
    mockSession({ id: "owner-1", role: "CLIENT" });

    // sobrescreve DELETE
    const original = vi.mocked(fetch).getMockImplementation()!;
    vi.mocked(fetch).mockImplementation(async (input, init) => {
      const url = String(input);
      if (init?.method === "DELETE") {
        return new Response(null, { status: 200 });
      }
      return original(input, init);
    });

    renderWithProviders(<ProjectDetail projectId="1" />);
    await screen.findByRole("heading", { name: "Backlog" });

    await user.click(
      screen.getByRole("button", { name: "Mais ações do projeto" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Excluir" }));
    expect(
      screen.getByRole("dialog", { name: "Excluir projeto" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Excluir projeto" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/projects/1",
        expect.objectContaining({ method: "DELETE" }),
      );
      expect(push).toHaveBeenCalledWith("/projects");
    });
  });
});
