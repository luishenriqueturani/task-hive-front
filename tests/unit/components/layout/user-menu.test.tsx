import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UserMenu } from "@/components/layout/user-menu";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const user = {
  id: "u1",
  name: "Luis Silva",
  email: "luis@example.com",
  role: "CLIENT",
};

describe("UserMenu", () => {
  it("mostra iniciais e abre o drawer com dados do perfil", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<UserMenu user={user} />);

    expect(screen.getByText("LS")).toBeInTheDocument();

    await ue.click(screen.getByRole("button", { name: "Abrir perfil" }));

    const dialog = await screen.findByRole("dialog", { name: "Perfil" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("Meu perfil")).toBeInTheDocument();
    // e-mail aparece no subtítulo do avatar e na linha "E-mail"
    expect(screen.getAllByText("luis@example.com").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Sair da conta" }),
    ).toBeInTheDocument();
  });

  it("fecha o drawer pelo botão", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<UserMenu user={user} />);

    await ue.click(screen.getByRole("button", { name: "Abrir perfil" }));
    await ue.click(screen.getByRole("button", { name: "Fechar perfil" }));

    expect(
      screen.queryByRole("dialog", { name: "Perfil" }),
    ).not.toBeInTheDocument();
  });
});
