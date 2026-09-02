import { beforeEach, describe, it, vi } from "vitest";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { LoginView } from "@/components/auth/login-view";
import { RegisterForm } from "@/components/auth/register-form";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { expectNoA11yViolations } from "@tests/helpers/a11y";
import { renderWithAppProviders } from "@tests/helpers/app-render";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

describe("a11y — formulários de autenticação", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("LoginForm não tem violações axe", async () => {
    const { container } = renderWithProviders(<LoginForm />);
    await expectNoA11yViolations(container);
  });

  it("LoginView não tem violações axe", async () => {
    const { container } = renderWithAppProviders(<LoginView />);
    await expectNoA11yViolations(container);
  });

  it("RegisterForm em AuthShell não tem violações axe", async () => {
    const { container } = renderWithAppProviders(
      <AuthShell title="Criar conta" subtitle="Comece em minutos.">
        <RegisterForm />
      </AuthShell>,
    );
    await expectNoA11yViolations(container);
  });

  it("ForgotPasswordForm em AuthShell não tem violações axe", async () => {
    const { container } = renderWithAppProviders(
      <AuthShell
        title="Esqueci a senha"
        subtitle="Enviaremos instruções por e-mail."
      >
        <ForgotPasswordForm />
      </AuthShell>,
    );
    await expectNoA11yViolations(container);
  });

  it("ResetPasswordForm em AuthShell não tem violações axe", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(true), { status: 200 }),
    );

    const { container } = renderWithAppProviders(
      <AuthShell title="Nova senha" subtitle="Defina uma senha forte.">
        <ResetPasswordForm token="valid-token" />
      </AuthShell>,
    );

    await expectNoA11yViolations(container);
  });
});
