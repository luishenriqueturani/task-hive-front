import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LandingPage } from "@/components/landing/landing-page";
import { renderWithAppProviders } from "@tests/helpers/app-render";

describe("LandingPage", () => {
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

  it("esconde tarefas avulsas no toggle Empresas", async () => {
    const user = userEvent.setup();
    renderWithAppProviders(<LandingPage signedIn={false} />);

    expect(screen.getAllByText(/Tarefas avulsas:/).length).toBe(3);
    await user.click(screen.getByRole("button", { name: "Empresas" }));
    expect(screen.queryByText(/Tarefas avulsas:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Pessoas" }));
    expect(screen.getAllByText(/Tarefas avulsas:/).length).toBe(3);
  });
});
