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

const invitedProject = {
  id: "2",
  name: "Kanban do time",
  description: "Convite",
  createdAt: "2026-02-01T00:00:00.000Z",
  updatedAt: null,
  userOwner: { id: "u2", name: "Bia", email: "b@b.com" },
  participants: [{ id: "u1", name: "Ana", email: "a@b.com" }],
};

function mockProjectsApi(opts?: {
  owned?: unknown[];
  invited?: unknown[];
  ownedStatus?: number;
  invitedStatus?: number;
}) {
  const owned = opts?.owned ?? [];
  const invited = opts?.invited ?? [];
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("scope=invited")) {
      const status = opts?.invitedStatus ?? 200;
      return new Response(
        status === 200 ? JSON.stringify(invited) : "fail",
        { status },
      );
    }
    if (url.includes("scope=owned")) {
      const status = opts?.ownedStatus ?? 200;
      return new Response(
        status === 200 ? JSON.stringify(owned) : "fail",
        { status },
      );
    }
    return new Response(JSON.stringify([]), { status: 200 });
  });
}

describe("ProjectsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra skeleton enquanto carrega", () => {
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    renderWithProviders(<ProjectsSection />);

    expect(
      screen.getByRole("heading", { name: "Meus projetos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projetos em que fui convidado" }),
    ).toBeInTheDocument();
    expect(document.querySelector("[aria-hidden]")).toBeInTheDocument();
  });

  it("mostra erro de carregamento na secção de próprios", async () => {
    mockProjectsApi({ ownedStatus: 500 });

    renderWithProviders(<ProjectsSection />);

    expect(
      await screen.findByText(/Não foi possível carregar seus projetos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ainda não foi convidado para nenhum projeto/i),
    ).toBeInTheDocument();
  });

  it("mostra erro de carregamento na secção de convidados", async () => {
    mockProjectsApi({ invitedStatus: 500, owned: [sampleProject] });

    renderWithProviders(<ProjectsSection />);

    expect(await screen.findByText("Backlog")).toBeInTheDocument();
    expect(
      screen.getByText(/Não foi possível carregar seus projetos/i),
    ).toBeInTheDocument();
  });

  it("mostra as duas secções vazias com link para criar nos próprios", async () => {
    mockProjectsApi();

    renderWithProviders(<ProjectsSection />);

    expect(
      await screen.findByText(/Você ainda não tem projetos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Crie o primeiro" }),
    ).toHaveAttribute("href", "/projects");
    expect(
      screen.getByText(/Ainda não foi convidado para nenhum projeto/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Novo projeto/i }),
    ).not.toBeInTheDocument();
  });

  it("lista projetos próprios com link para o detalhe", async () => {
    mockProjectsApi({ owned: [sampleProject] });

    renderWithProviders(<ProjectsSection />);

    const link = await screen.findByRole("link", { name: /Backlog/i });
    expect(link).toHaveAttribute("href", "/projects/1");
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.getByText("1 participante")).toBeInTheDocument();
    expect(screen.queryByText("Convidado")).not.toBeInTheDocument();
  });

  it("lista projetos convidados com badge", async () => {
    mockProjectsApi({ invited: [invitedProject] });

    renderWithProviders(<ProjectsSection />);

    const link = await screen.findByRole("link", { name: /Kanban do time/i });
    expect(link).toHaveAttribute("href", "/projects/2");
    expect(screen.getByText("Convidado")).toBeInTheDocument();
  });

  it("conta o dono e os participantes", async () => {
    mockProjectsApi({
      owned: [
        {
          ...sampleProject,
          participants: [
            { id: "p1", name: "Bob", email: "b@b.com" },
            { id: "p2", name: "Carol", email: "c@c.com" },
          ],
        },
      ],
    });

    renderWithProviders(<ProjectsSection />);

    expect(await screen.findByText("3 participantes")).toBeInTheDocument();
  });

  it("consulta a API de projetos com os dois scopes", async () => {
    mockProjectsApi();

    renderWithProviders(<ProjectsSection />);

    await screen.findByText(/Você ainda não tem projetos/i);

    expect(fetch).toHaveBeenCalledWith("/api/bff/projects?scope=owned", {
      credentials: "include",
    });
    expect(fetch).toHaveBeenCalledWith("/api/bff/projects?scope=invited", {
      credentials: "include",
    });
  });
});
