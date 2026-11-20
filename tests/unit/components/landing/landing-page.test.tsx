import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LandingPage } from "@/components/landing/landing-page";
import { renderWithAppProviders } from "@tests/helpers/app-render";

describe("LandingPage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("fail", { status: 500 })),
    );
  });
  it("substitui Em construção e mostra produto e planos", () => {
    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(screen.queryByText(/Em construção/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Organize projetos, tarefas e tempo/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Produto" })).toHaveAttribute(
      "href",
      "#produto",
    );
    expect(screen.getByRole("link", { name: "Planos" })).toHaveAttribute(
      "href",
      "#planos",
    );
    expect(screen.getByRole("heading", { name: /^Starter$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Pro$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Business$/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "O que entra no dia a dia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Termos, privacidade e contacto/i),
    ).toBeInTheDocument();
  });

  it("sem sessão mostra Entrar e Começar grátis", () => {
    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getAllByRole("link", { name: "Começar grátis" }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.queryByRole("link", { name: "Abrir painel" }),
    ).not.toBeInTheDocument();
  });

  it("com sessão mostra Abrir painel", () => {
    renderWithAppProviders(<LandingPage signedIn />);

    const panel = screen.getAllByRole("link", { name: "Abrir painel" });
    expect(panel.length).toBeGreaterThan(0);
    expect(panel[0]).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  });

  it("cai no catálogo estático se GET /plans falhar", async () => {
    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(screen.getByRole("heading", { name: /^Starter$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Pro$/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Business$/ })).toBeInTheDocument();
    expect(screen.getByText(/Projectos: 5/)).toBeInTheDocument();
    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalled();
    });
    expect(screen.getByRole("heading", { name: /^Starter$/ })).toBeInTheDocument();
  });

  it("esconde tarefas avulsas no toggle Empresas", async () => {
    const user = userEvent.setup();
    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(screen.getAllByText(/Tarefas avulsas:/).length).toBe(3);
    await user.click(screen.getByRole("button", { name: "Empresas" }));
    expect(screen.queryByText(/Tarefas avulsas:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pessoas" }));
    expect(screen.getAllByText(/Tarefas avulsas:/).length).toBe(3);
  });

  it("usa os cards de GET /plans quando a API responde", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          JSON.stringify([
            {
              slug: "starter",
              name: "Starter API",
              accountKind: "BOTH",
              priceCents: 3100,
              currency: "BRL",
              maxProjects: 7,
              maxApiKeys: 2,
              maxStandaloneTasks: 30,
              maxProjectGuests: 3,
              benefits: [{ title: "Kanban extra" }],
            },
            {
              slug: "pro",
              name: "Pro",
              accountKind: "BOTH",
              priceCents: 7900,
              currency: "BRL",
              maxProjects: 20,
              maxApiKeys: 10,
              maxStandaloneTasks: 200,
              maxProjectGuests: 15,
              benefits: [{ title: "Tudo do Starter" }],
            },
            {
              slug: "business",
              name: "Business",
              accountKind: "COMPANY",
              priceCents: 19900,
              currency: "BRL",
              maxProjects: -1,
              maxApiKeys: -1,
              maxStandaloneTasks: -1,
              maxProjectGuests: -1,
              benefits: [{ title: "Quotas ilimitadas" }],
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    );

    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(
      await screen.findByRole("heading", { name: "Starter API" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Kanban extra")).toBeInTheDocument();
    expect(screen.getByText(/Projectos: 7/)).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.queryByRole("heading", { name: /^Starter$/ }),
      ).not.toBeInTheDocument();
    });
  });
});
