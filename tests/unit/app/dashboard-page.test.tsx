import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPageContent } from "@/app/(app)/dashboard/page";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { sessionUserFixture } from "@tests/helpers/session-user";
import { renderWithProviders } from "@tests/helpers/render";

describe("DashboardPageContent", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("[]", {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    );
  });

  it("mostra a secção de tarefas avulsas para conta PF", () => {
    renderWithProviders(
      <DashboardPageContent user={sessionUserFixture()} />,
    );

    expect(
      screen.getByRole("heading", { name: "Tarefas avulsas" }),
    ).toBeInTheDocument();
  });

  it("não renderiza tarefas avulsas para conta CNPJ", () => {
    renderWithProviders(
      <DashboardPageContent
        user={sessionUserFixture({ accountKind: ACCOUNT_KIND.COMPANY })}
      />,
    );

    expect(screen.getByRole("heading", { name: "Projetos" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tarefas avulsas" }),
    ).not.toBeInTheDocument();
  });
});
