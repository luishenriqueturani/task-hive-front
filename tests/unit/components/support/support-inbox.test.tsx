import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SupportInbox } from "@/components/support/support-inbox";
import { renderWithProviders } from "@tests/helpers/render";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/support",
  useSearchParams: () => new URLSearchParams(),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("SupportInbox", () => {
  beforeEach(() => {
    push.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/bff/support/tickets") && init?.method === "POST") {
          return jsonResponse(
            {
              id: "t-new",
              subject: "Ajuda E2E",
              status: "PENDING_ADMIN",
              lastMessageAt: "2026-11-20T12:00:00.000Z",
              createdAt: "2026-11-20T12:00:00.000Z",
              updatedAt: null,
              createdBy: { id: "u1", name: "Ana", email: "ana@example.com" },
              assignedTo: null,
            },
            201,
          );
        }
        if (url.includes("/api/bff/support/tickets")) {
          return jsonResponse([
            {
              id: "t1",
              subject: "Erro no login",
              status: "PENDING_ADMIN",
              lastMessageAt: "2026-11-20T12:00:00.000Z",
              createdAt: "2026-11-20T12:00:00.000Z",
              updatedAt: null,
              createdBy: { id: "u1", name: "Ana", email: "ana@example.com" },
              assignedTo: null,
            },
          ]);
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("lista tickets do cliente e abre nova conversa", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<SupportInbox mode="client" />);

    expect(await screen.findByRole("heading", { name: "Suporte" })).toBeInTheDocument();
    expect(
      await screen.findByRole("link", { name: /Erro no login/ }),
    ).toHaveAttribute("href", "/support/t1");

    await ue.click(screen.getByRole("button", { name: "Nova conversa" }));
    await ue.type(screen.getByLabelText("Assunto"), "Ajuda E2E");
    await ue.type(screen.getByLabelText("Mensagem"), "Não consigo entrar.");
    await ue.click(screen.getByRole("button", { name: "Abrir ticket" }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/support/t-new");
    });
  });
});
