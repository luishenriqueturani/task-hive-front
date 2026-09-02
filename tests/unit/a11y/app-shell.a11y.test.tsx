import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { describe, it, vi } from "vitest";
import { AppHeader } from "@/components/layout/app-header";
import type { SessionUser } from "@/lib/session";
import { expectNoA11yViolations } from "@tests/helpers/a11y";
import { renderWithAppProviders } from "@tests/helpers/app-render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const sessionUser: SessionUser = {
  id: "u1",
  name: "Luis Silva",
  email: "luis@example.com",
  role: "CLIENT",
};

describe("a11y — shell autenticado", () => {
  it("AppHeader com navegação principal não tem violações axe", async () => {
    const { container } = renderWithAppProviders(
      <div className="flex min-h-full flex-col">
        <AppHeader user={sessionUser} />
        <main id="main" className="flex-1 p-6">
          <h1 className="text-2xl font-semibold">Painel</h1>
        </main>
      </div>,
    );

    await expectNoA11yViolations(container);
  });

  it("AppHeader com drawer de perfil aberto não tem violações axe", async () => {
    const user = userEvent.setup();
    const { container } = renderWithAppProviders(
      <div className="flex min-h-full flex-col">
        <AppHeader user={sessionUser} />
        <main id="main" className="flex-1 p-6">
          <h1 className="text-2xl font-semibold">Painel</h1>
        </main>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Abrir perfil" }));
    await screen.findByRole("dialog", { name: "Perfil" });

    await expectNoA11yViolations(container);
  });
});
