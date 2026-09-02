import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiTokensView } from "@/components/settings/api-tokens-view";
import { renderWithProviders } from "@tests/helpers/render";
import {
  clientPlanFixture,
  sessionUserFixture,
} from "@tests/helpers/session-user";

function mockPatApi(me = sessionUserFixture({ plan: clientPlanFixture() })) {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("/api/auth/me")) {
      return new Response(JSON.stringify({ user: me }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (url.includes("/personal-access-tokens")) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("not found", { status: 404 });
  });
}

describe("ApiTokensView", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("permite criar token abaixo do tecto", async () => {
    mockPatApi();
    renderWithProviders(<ApiTokensView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Criar token/i })).toBeEnabled();
    });
    expect(screen.queryByRole("link", { name: "Ver planos" })).not.toBeInTheDocument();
  });

  it("desactiva Criar token no tecto do plano", async () => {
    mockPatApi(
      sessionUserFixture({
        plan: clientPlanFixture({
          usage: {
            projects: 0,
            apiKeys: 1,
            standaloneTasks: 0,
            projectGuests: null,
          },
        }),
      }),
    );

    renderWithProviders(<ApiTokensView />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Criar token/i })).toBeDisabled();
    });
    expect(screen.getByRole("button", { name: /Criar token/i })).toHaveAttribute(
      "title",
      "Limite do plano",
    );
    expect(screen.getByRole("link", { name: "Ver planos" })).toHaveAttribute(
      "href",
      "/settings/plan",
    );
  });
});
