import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/app-header";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { sessionUserFixture } from "@tests/helpers/session-user";
import { renderWithAppProviders } from "@tests/helpers/app-render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const navLink = (name: string) =>
  screen.queryByRole("link", { name, hidden: true });

describe("AppHeader", () => {
  it("mostra Tarefas avulsas para conta PF", () => {
    renderWithAppProviders(
      <AppHeader user={sessionUserFixture()} />,
    );

    expect(navLink("Painel")).toBeInTheDocument();
    expect(navLink("Projetos")).toBeInTheDocument();
    expect(navLink("Tarefas avulsas")).toBeInTheDocument();
    expect(navLink("Suporte")).toBeInTheDocument();
  });

  it("esconde Tarefas avulsas para conta CNPJ", () => {
    renderWithAppProviders(
      <AppHeader
        user={sessionUserFixture({ accountKind: ACCOUNT_KIND.COMPANY })}
      />,
    );

    expect(navLink("Painel")).toBeInTheDocument();
    expect(navLink("Projetos")).toBeInTheDocument();
    expect(navLink("Tarefas avulsas")).not.toBeInTheDocument();
  });
});
