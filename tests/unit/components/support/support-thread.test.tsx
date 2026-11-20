import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportThread } from "@/components/support/support-thread";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("@/lib/use-support-socket", () => ({
  useSupportSocket: () => undefined,
}));

const ticket = {
  id: "t1",
  subject: "Erro no login",
  status: "PENDING_ADMIN",
  lastMessageAt: "2026-11-20T12:00:00.000Z",
  createdAt: "2026-11-20T12:00:00.000Z",
  updatedAt: null,
  createdBy: { id: "u1", name: "Ana", email: "ana@example.com" },
  assignedTo: null,
};

const messages = [
  {
    id: "m1",
    body: "Não consigo entrar.",
    createdAt: "2026-11-20T12:00:00.000Z",
    author: { id: "u1", name: "Ana", email: "ana@example.com" },
  },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("SupportThread", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.endsWith("/messages") && init?.method === "POST") {
          return jsonResponse(
            {
              id: "m2",
              body: "Já estamos a ver.",
              createdAt: "2026-11-20T12:05:00.000Z",
              author: {
                id: "admin-1",
                name: "Admin",
                email: "admin@example.com",
              },
            },
            201,
          );
        }
        if (url.endsWith("/messages")) {
          return jsonResponse(messages);
        }
        if (url.includes("/support/tickets/t1") && init?.method === "PATCH") {
          return jsonResponse({
            ...ticket,
            assignedTo: {
              id: "admin-1",
              name: "Admin",
              email: "admin@example.com",
            },
          });
        }
        if (url.includes("/support/tickets/t1")) {
          return jsonResponse(ticket);
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("mostra a thread e envia resposta no admin", async () => {
    const ue = userEvent.setup();
    renderWithProviders(
      <SupportThread
        ticketId="t1"
        mode="admin"
        currentUserId="admin-1"
      />,
    );

    expect(
      await screen.findByRole("heading", { name: "Erro no login" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Não consigo entrar.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Assumir ticket" }),
    ).toBeInTheDocument();

    await ue.type(screen.getByPlaceholderText("Escreva a resposta"), "Já estamos a ver.");
    await ue.click(screen.getByRole("button", { name: "Enviar" }));

    await waitFor(() => {
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        "/api/bff/support/tickets/t1/messages",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
