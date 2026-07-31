import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    push.mockReset();
    refresh.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("bloqueia o form quando o token é inválido", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(false), { status: 200 }),
    );

    renderWithProviders(<ResetPasswordForm token="bad-token" />);

    expect(
      await screen.findByText(/inválido ou expirou/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Redefinir senha" }),
    ).not.toBeInTheDocument();
  });

  it("mostra aviso sem token", () => {
    renderWithProviders(<ResetPasswordForm />);
    expect(screen.getByText(/inválido ou expirou/i)).toBeInTheDocument();
  });

  it("redefine a senha com token válido", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(true), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: "1" } }), { status: 200 }),
      );

    renderWithProviders(<ResetPasswordForm token="good-token" />);

    await screen.findByLabelText("Nova senha");
    await user.type(screen.getByLabelText("Nova senha"), "SenhaForte1!");
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "SenhaForte1!",
    );
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/reset-password",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
