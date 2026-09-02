import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanSettingsView } from "@/components/settings/plan-settings-view";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { renderWithProviders } from "@tests/helpers/render";
import {
  clientPlanFixture,
  sessionUserFixture,
} from "@tests/helpers/session-user";

function mockMe(user: ReturnType<typeof sessionUserFixture>) {
  vi.mocked(fetch).mockResolvedValue(
    new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  );
}

describe("PlanSettingsView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("mostra o plano actual, o uso e a tabela informativa", async () => {
    mockMe(
      sessionUserFixture({
        plan: clientPlanFixture({
          usage: {
            projects: 2,
            apiKeys: 0,
            standaloneTasks: 4,
            projectGuests: null,
          },
        }),
      }),
    );

    renderWithProviders(<PlanSettingsView />);

    expect(await screen.findByRole("heading", { name: "Trial" })).toBeInTheDocument();
    expect(screen.getByText(/Trial · trial gratuito/)).toBeInTheDocument();
    expect(screen.getByText(/Projectos: 2 \/ 3/)).toBeInTheDocument();
    expect(screen.getByText(/Chaves API: 0 \/ 1/)).toBeInTheDocument();
    expect(screen.getByText(/Tarefas avulsas: 4 \/ 15/)).toBeInTheDocument();
    expect(screen.getByText(/até 2/)).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: "Comparar planos" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Starter/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Pro/ })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Business/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /assinar|checkout|pagar/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/checkout ainda não está disponível/i)).toBeInTheDocument();
  });

  it("esconde tarefas avulsas em conta CNPJ", async () => {
    mockMe(
      sessionUserFixture({
        accountKind: ACCOUNT_KIND.COMPANY,
        plan: clientPlanFixture(),
      }),
    );

    renderWithProviders(<PlanSettingsView />);

    await screen.findByRole("heading", { name: "Trial" });
    expect(screen.queryByText(/Tarefas avulsas/)).not.toBeInTheDocument();
  });

  it("marca o plano actual na tabela quando o slug coincide", async () => {
    mockMe(
      sessionUserFixture({
        plan: clientPlanFixture({ slug: "pro", name: "Pro", status: "ACTIVE" }),
      }),
    );

    renderWithProviders(<PlanSettingsView />);

    await waitFor(() => {
      expect(screen.getByText("Plano actual")).toBeInTheDocument();
    });
    expect(screen.getByRole("heading", { name: "Pro" })).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("mostra aviso quando não há plano", async () => {
    mockMe(sessionUserFixture({ plan: null }));

    renderWithProviders(<PlanSettingsView />);

    expect(
      await screen.findByText(/não tem um plano de cliente/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Starter/ })).toBeInTheDocument();
  });
});
