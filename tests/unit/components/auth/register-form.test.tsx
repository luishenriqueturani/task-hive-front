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

  it("cadastra PF e faz auto-login com accountKind", async () => {
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
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"accountKind":"INDIVIDUAL"'),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      "/api/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("mostra campos de empresa ao escolher pessoa jurídica", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: /Pessoa jurídica/i }));

    expect(screen.getByLabelText("Nome do responsável")).toBeInTheDocument();
    expect(screen.getByLabelText("Razão social")).toBeInTheDocument();
    expect(screen.getByLabelText("CNPJ")).toBeInTheDocument();
    expect(screen.queryByLabelText("CPF")).not.toBeInTheDocument();
  });

  it("recusa CNPJ inválido no cliente", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: /Pessoa jurídica/i }));
    await user.type(screen.getByLabelText("Nome do responsável"), "Ana");
    await user.type(screen.getByLabelText("Razão social"), "Acme Ltda");
    await user.type(screen.getByLabelText("CNPJ"), "11.111.111/1111-11");
    await user.type(screen.getByLabelText("E-mail"), "a@b.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
    await user.type(screen.getByLabelText("Confirmar senha"), "SenhaForte1!");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Informe um CNPJ válido.",
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("envia company no cadastro CNPJ", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response("{}", { status: 201 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ user: { id: "1" } }), { status: 200 }),
      );

    renderWithProviders(<RegisterForm />);

    await user.click(screen.getByRole("radio", { name: /Pessoa jurídica/i }));
    await user.type(screen.getByLabelText("Nome do responsável"), "Ana");
    await user.type(screen.getByLabelText("Razão social"), "Acme Ltda");
    await user.type(screen.getByLabelText("CNPJ"), "11444777000161");
    await user.type(screen.getByLabelText("E-mail"), "empresa@b.com");
    await user.type(screen.getByLabelText("Senha"), "SenhaForte1!");
    await user.type(screen.getByLabelText("Confirmar senha"), "SenhaForte1!");
    await user.click(screen.getByRole("button", { name: "Criar conta" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/dashboard");
    });
    const body = JSON.parse(
      String(vi.mocked(fetch).mock.calls[0][1]?.body),
    ) as {
      accountKind: string;
      company: { legalName: string; document: string };
    };
    expect(body.accountKind).toBe("COMPANY");
    expect(body.company).toEqual({
      legalName: "Acme Ltda",
      document: "11444777000161",
    });
  });

  it("pré-preenche e-mail quando ?invite= é um e-mail", () => {
    renderWithProviders(<RegisterForm inviteQuery="convidado@empresa.com" />);

    expect(screen.getByLabelText("E-mail")).toHaveValue("convidado@empresa.com");
    expect(screen.getByLabelText("E-mail")).toHaveAttribute("readonly");
  });

  it("pré-preenche e-mail ao resolver o token de convite", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          email: "token@empresa.com",
          projectName: "Hive",
        }),
        { status: 200 },
      ),
    );

    renderWithProviders(<RegisterForm inviteQuery="invite-token-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText("E-mail")).toHaveValue("token@empresa.com");
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/invites/invite-token-1",
      expect.objectContaining({ credentials: "include" }),
    );
    expect(screen.getByText(/Convite para o projecto/)).toBeInTheDocument();
  });
});
