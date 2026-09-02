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

  it("mostra a coluna de tarefas avulsas e o layout em duas colunas para conta PF", () => {
    renderWithProviders(
      <DashboardPageContent user={sessionUserFixture()} />,
    );

    const todos = screen.getByRole("heading", { name: "Tarefas avulsas" });
    const owned = screen.getByRole("heading", { name: "Meus projetos" });
    const invited = screen.getByRole("heading", {
      name: "Projetos em que fui convidado",
    });
    const home = screen.getByTestId("dashboard-home");

    expect(todos).toBeInTheDocument();
    expect(owned).toBeInTheDocument();
    expect(invited).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver todas" })).toHaveAttribute(
      "href",
      "/to-do",
    );
    expect(home.className).toMatch(/lg:grid-cols-\[minmax/);
    expect(home.parentElement?.className).toMatch(/max-w-7xl/);
    expect(
      todos.compareDocumentPosition(owned) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("não renderiza tarefas avulsas para conta CNPJ e ocupa a largura", () => {
    renderWithProviders(
      <DashboardPageContent
        user={sessionUserFixture({ accountKind: ACCOUNT_KIND.COMPANY })}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Meus projetos" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Projetos em que fui convidado" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Tarefas avulsas" }),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("dashboard-home").className).not.toMatch(
      /lg:grid-cols/,
    );
  });
});
