import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import type { AdminPlan } from "@/lib/plans-api";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/users",
  useSearchParams: () => new URLSearchParams(),
}));

const trial: AdminPlan = {
  id: "plan-trial",
  slug: "free-trial",
  name: "Free Trial",
  description: null,
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 0,
  currency: "BRL",
  sortOrder: 0,
  isActive: true,
  isSystem: true,
  maxProjects: 3,
  maxApiKeys: 1,
  maxStandaloneTasks: 15,
  maxProjectGuests: 2,
  benefits: [],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("AdminUsersView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/bff/admin/plans")) {
          return jsonResponse([trial]);
        }
        if (url.includes("/api/bff/admin/users")) {
          return jsonResponse({
            items: [
              {
                id: "u1",
                name: "Ana Silva",
                email: "ana@example.com",
                role: "CLIENT",
                accountKind: "INDIVIDUAL",
                createdAt: "2026-01-02T12:00:00.000Z",
                company: null,
                plan: {
                  id: null,
                  slug: "free-trial",
                  name: "Free Trial",
                  status: "TRIAL",
                },
              },
            ],
            total: 1,
            page: 1,
            pageSize: 20,
          });
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("lista utilizadores com link para o detalhe", async () => {
    renderWithProviders(<AdminUsersView />);
    expect(
      await screen.findByRole("link", { name: "Ana Silva" }),
    ).toHaveAttribute("href", "/admin/users/u1");
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Free Trial" })).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "Pessoa física" }),
    ).toBeInTheDocument();
  });
});
