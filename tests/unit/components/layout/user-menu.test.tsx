import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { sessionUserFixture } from "@tests/helpers/session-user";
import { renderWithProviders } from "@tests/helpers/render";
import { UserMenu } from "@/components/layout/user-menu";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const user = sessionUserFixture();

describe("UserMenu", () => {
  it("mostra iniciais e abre o drawer com dados do perfil", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<UserMenu user={user} />);

    expect(screen.getByText("LS")).toBeInTheDocument();

    await ue.click(screen.getByRole("button", { name: "Abrir perfil" }));

    const dialog = await screen.findByRole("dialog", { name: "Meu perfil" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Meu perfil")).toBeInTheDocument();
    // e-mail aparece no subtítulo do avatar e na linha "E-mail"
    expect(screen.getAllByText("luis@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plano" })).toHaveAttribute(
      "href",
      "/settings/plan",
    );
    expect(screen.getByRole("link", { name: "Suporte" })).toHaveAttribute(
      "href",
      "/support",
    );
    expect(screen.getByRole("link", { name: "Tokens de API" })).toHaveAttribute(
      "href",
      "/settings/api-tokens",
    );
    expect(
      screen.getByRole("button", { name: "Sair da conta" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Administração" }),
    ).not.toBeInTheDocument();
  });

  it("mostra Administração para roles admin", async () => {
    const ue = userEvent.setup();
    renderWithProviders(
      <UserMenu user={sessionUserFixture({ role: "ADMIN_GOD" })} />,
    );
    await ue.click(screen.getByRole("button", { name: "Abrir perfil" }));
    expect(screen.getByRole("link", { name: "Administração" })).toHaveAttribute(
      "href",
      "/admin",
    );
  });

  it("fecha o drawer pelo botão", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<UserMenu user={user} />);

    await ue.click(screen.getByRole("button", { name: "Abrir perfil" }));
    await ue.click(screen.getByRole("button", { name: "Fechar perfil" }));

    expect(
      screen.queryByRole("dialog", { name: "Meu perfil" }),
    ).not.toBeInTheDocument();
  });
});
