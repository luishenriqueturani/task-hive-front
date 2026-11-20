import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SupportTicketList } from "@/components/support/support-ticket-list";
import type { SupportTicket } from "@/lib/support-api";
import { renderWithProviders } from "@tests/helpers/render";

const ticket: SupportTicket = {
  id: "t1",
  subject: "Erro no login",
  status: "PENDING_ADMIN",
  lastMessageAt: "2026-11-20T12:00:00.000Z",
  createdAt: "2026-11-20T12:00:00.000Z",
  updatedAt: null,
  createdBy: { id: "u1", name: "Ana Silva", email: "ana@example.com" },
  assignedTo: null,
};

describe("SupportTicketList", () => {
  it("mostra estado vazio", () => {
    renderWithProviders(
      <SupportTicketList tickets={[]} basePath="/support" />,
    );
    expect(screen.getByText("Ainda não há conversas.")).toBeInTheDocument();
  });

  it("liga cada ticket ao detalhe e mostra o autor no modo admin", () => {
    renderWithProviders(
      <SupportTicketList
        tickets={[ticket]}
        basePath="/admin/support"
        showAuthor
      />,
    );
    expect(screen.getByRole("link", { name: /Erro no login/ })).toHaveAttribute(
      "href",
      "/admin/support/t1",
    );
    expect(screen.getByText("Ana Silva")).toBeInTheDocument();
    expect(screen.getByText("À espera do suporte")).toBeInTheDocument();
  });
});
