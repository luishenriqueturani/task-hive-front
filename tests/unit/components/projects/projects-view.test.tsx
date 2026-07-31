import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import { ProjectsView } from "@/components/projects/projects-view";

describe("ProjectsView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra estado vazio", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    renderWithProviders(<ProjectsView />);

    expect(
      await screen.findByText(/ainda não tem projetos/i),
    ).toBeInTheDocument();
  });

  it("mostra erro de carregamento", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("fail", { status: 500 }),
    );

    renderWithProviders(<ProjectsView />);

    expect(
      await screen.findByText(/Não foi possível carregar os projetos/i),
    ).toBeInTheDocument();
  });

  it("lista projetos com link para o detalhe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            id: "1",
            name: "Backlog",
            description: "Principal",
            createdAt: "2026-01-15T00:00:00.000Z",
            updatedAt: null,
            userOwner: { id: "u1", name: "Ana", email: "a@b.com" },
            participants: [],
          },
        ]),
        { status: 200 },
      ),
    );

    renderWithProviders(<ProjectsView />);

    const link = await screen.findByRole("link", { name: /Backlog/i });
    expect(link).toHaveAttribute("href", "/projects/1");
    expect(screen.getByText("Principal")).toBeInTheDocument();
  });

  it("abre modal Novo projeto", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    renderWithProviders(<ProjectsView />);
    await waitFor(() =>
      expect(screen.getByText(/ainda não tem projetos/i)).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /Novo projeto/i }));
    expect(
      screen.getByRole("dialog", { name: "Novo projeto" }),
    ).toBeInTheDocument();
  });
});
