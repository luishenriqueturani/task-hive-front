import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@tests/helpers/render";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("exige e-mail antes de enviar", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ForgotPasswordForm />);

    await user.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe o seu e-mail.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("exibe erro quando a API falha", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "E-mail não encontrado" }), {
        status: 404,
        headers: { "content-type": "application/json" },
      }),
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "E-mail não encontrado",
    );
  });

  it("mostra confirmação após sucesso", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "  a@b.com  ");
    await user.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent("a@b.com");
    expect(
      screen.queryByRole("button", { name: "Enviar instruções" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Voltar ao login" }),
    ).toHaveAttribute("href", "/login");
  });

  it("chama o BFF com o e-mail trimado", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 200 }));

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "user@test.com");
    await user.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/bff/auth/forget-password",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ email: "user@test.com" }),
        }),
      );
    });
  });

  it("mostra estado de envio enquanto aguarda a API", async () => {
    const user = userEvent.setup();
    let resolveFetch!: (value: Response) => void;
    vi.mocked(fetch).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.click(
      screen.getByRole("button", { name: "Enviar instruções" }),
    );

    expect(
      screen.getByRole("button", { name: "Enviando…" }),
    ).toBeDisabled();
    expect(screen.getByLabelText("E-mail")).toBeDisabled();

    resolveFetch(new Response(null, { status: 200 }));
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });
});
