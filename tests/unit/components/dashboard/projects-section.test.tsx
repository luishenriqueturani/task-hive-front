import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectsSection } from "@/components/dashboard/projects-section";
import { renderWithProviders } from "@tests/helpers/render";

const sampleProject = {
  id: "1",
  name: "Backlog",
  description: "Principal",
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: null,
  userOwner: { id: "u1", name: "Ana", email: "a@b.com" },
  participants: [],
};

describe("ProjectsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra skeleton enquanto carrega", () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<ProjectsSection />);

    expect(screen.getByRole("heading", { name: "Projetos" })).toBeInTheDocument();
    expect(document.querySelector("[aria-hidden]")).toBeInTheDocument();
  });

  it("mostra erro de carregamento", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("fail", { status: 500 }));

    renderWithProviders(<ProjectsSection />);

    expect(
      await screen.findByText(/Não foi possível carregar seus projetos/i),
    ).toBeInTheDocument();
  });

  it("mostra estado vazio com link para criar", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    renderWithProviders(<ProjectsSection />);

    expect(
      await screen.findByText(/Você ainda não tem projetos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crie o primeiro" }),
    ).toHaveAttribute("href", "/projects");
  });

  it("lista projetos com link para o detalhe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([sampleProject]), { status: 200 }),
    );

    renderWithProviders(<ProjectsSection />);

    const link = await screen.findByRole("link", { name: /Backlog/i });
    expect(link).toHaveAttribute("href", "/projects/1");
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("1 participante")).toBeInTheDocument();
  });

  it("conta o dono e os participantes", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            ...sampleProject,
            participants: [
              { id: "p1", name: "Bob", email: "b@b.com" },
              { id: "p2", name: "Carol", email: "c@c.com" },
            ],
          },
        ]),
        { status: 200 },
      ),
    );

    renderWithProviders(<ProjectsSection />);

    expect(await screen.findByText("3 participantes")).toBeInTheDocument();
  });

  it("consulta a API de projetos com credenciais", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    renderWithProviders(<ProjectsSection />);

    await screen.findByText(/Você ainda não tem projetos/i);

    expect(fetch).toHaveBeenCalledWith("/api/bff/projects", {
      credentials: "include",
    });
  });
});
