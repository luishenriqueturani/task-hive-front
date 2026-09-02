import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import {
  clientPlanFixture,
  sessionUserFixture,
} from "@tests/helpers/session-user";
import { ProjectsView } from "@/components/projects/projects-view";

const ownedProject = {
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
  me?: ReturnType<typeof sessionUserFixture>;
}) {
  const owned = opts?.owned ?? [];
  const invited = opts?.invited ?? [];
  const me = opts?.me ?? sessionUserFixture();
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/api/auth/me")) {
      return new Response(JSON.stringify({ user: me }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
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

describe("ProjectsView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra as duas secções vazias", async () => {
    mockProjectsApi();

    renderWithProviders(<ProjectsView />);

    expect(
      await screen.findByText(/ainda não tem projetos/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Meus projetos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projetos em que fui convidado" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Ainda não foi convidado para nenhum projeto/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Novo projeto/i }),
    ).toBeInTheDocument();
  });

  it("mostra erro de carregamento na secção afectada", async () => {
    mockProjectsApi({ ownedStatus: 500 });

    renderWithProviders(<ProjectsView />);

    expect(
      await screen.findByText(/Não foi possível carregar os projetos/i),
    ).toBeInTheDocument();
  });

  it("lista projectos próprios com link para o detalhe", async () => {
    mockProjectsApi({ owned: [ownedProject] });

    renderWithProviders(<ProjectsView />);

    const link = await screen.findByRole("link", { name: /Backlog/i });
    expect(link).toHaveAttribute("href", "/projects/1");
    expect(screen.getByText("Principal")).toBeInTheDocument();
    expect(screen.queryByText("Convidado")).not.toBeInTheDocument();
  });

  it("lista projectos convidados com badge e sem segundo botão criar", async () => {
    mockProjectsApi({ invited: [invitedProject] });

    renderWithProviders(<ProjectsView />);

    const link = await screen.findByRole("link", { name: /Kanban do time/i });
    expect(link).toHaveAttribute("href", "/projects/2");
    expect(screen.getByText("Convidado")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Novo projeto/i })).toHaveLength(
      1,
    );
  });

  it("pede owned e invited em paralelo", async () => {
    mockProjectsApi();

    renderWithProviders(<ProjectsView />);
    await screen.findByText(/ainda não tem projetos/i);

    const urls = vi.mocked(fetch).mock.calls.map(([input]) => String(input));
    expect(urls).toContain("/api/bff/projects?scope=owned");
    expect(urls).toContain("/api/bff/projects?scope=invited");
  });

  it("abre modal Novo projeto só a partir dos próprios", async () => {
    const user = userEvent.setup();
    mockProjectsApi();

    renderWithProviders(<ProjectsView />);
    await waitFor(() =>
      expect(screen.getByText(/ainda não tem projetos/i)).toBeInTheDocument(),
    );

    await user.click(screen.getByRole("button", { name: /Novo projeto/i }));
    expect(
      screen.getByRole("dialog", { name: "Novo projeto" }),
    ).toBeInTheDocument();
  });

  it("desactiva Novo projeto no tecto do plano", async () => {
    mockProjectsApi({
      me: sessionUserFixture({
        plan: clientPlanFixture({
          usage: {
            projects: 3,
            apiKeys: 0,
            standaloneTasks: 0,
            projectGuests: null,
          },
        }),
      }),
    });

    renderWithProviders(<ProjectsView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Novo projeto/i })).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: /Novo projeto/i })).toHaveAttribute(
      "title",
      "Limite do plano",
    );
    expect(screen.getByRole("link", { name: "Ver planos" })).toHaveAttribute(
      "href",
      "/settings/plan",
    );
  });
});
