import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOverview } from "@/components/admin/admin-overview";
import { renderWithProviders } from "@tests/helpers/render";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("AdminOverview", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input).includes("/api/bff/admin/stats")) {
          return jsonResponse({ users: 12, companies: 3, openTickets: 0 });
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("mostra as três contagens do resumo", async () => {
    renderWithProviders(<AdminOverview />);
    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Utilizadores/ })).toHaveAttribute(
      "href",
      "/admin/users",
    );
    expect(screen.getByRole("link", { name: /Empresas/ })).toHaveAttribute(
      "href",
      "/admin/companies",
    );
    expect(screen.getByRole("link", { name: /Tickets abertos/ })).toHaveAttribute(
      "href",
      "/admin/support",
    );
  });
});
