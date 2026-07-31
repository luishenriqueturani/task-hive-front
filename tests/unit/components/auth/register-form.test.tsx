import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import { RegisterForm } from "@/components/auth/register-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("RegisterForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("valida senhas diferentes no cliente", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
    await user.type(screen.getByLabelText("Confirmar senha"), "OutraSenha1!");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As senhas não coincidem.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cadastra e faz auto-login", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("{}", { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: "1" } }), { status: 200 }),
      );

    renderWithProviders(<RegisterForm />);

    await user.type(screen.getByLabelText("Nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
    await user.type(screen.getByLabelText("Confirmar senha"), "SenhaForte1!");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
    expect(fetch).toHaveBeenNthCalledWith(
      1,
      "/api/bff/users",
      expect.objectContaining({ method: "POST" }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
