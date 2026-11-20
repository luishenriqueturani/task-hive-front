import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCompaniesView } from "@/components/admin/admin-companies-view";
import type { AdminPlan } from "@/lib/plans-api";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/admin/companies",
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

describe("AdminCompaniesView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/bff/admin/plans")) {
          return jsonResponse([trial]);
        }
        if (url.includes("/api/bff/admin/companies")) {
          return jsonResponse({
            items: [
              {
                id: "c1",
                name: "Acme",
                legalName: "Acme Tecnologia Ltda",
                tradeName: "Acme",
                document: "11444777000161",
                createdAt: "2026-03-01T12:00:00.000Z",
                owner: { id: "u1", name: "Ana Silva", email: "ana@acme.test" },
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

  it("lista empresas com dono e link para o detalhe", async () => {
    renderWithProviders(<AdminCompaniesView />);
    expect(
      await screen.findByRole("link", { name: "Acme Tecnologia Ltda" }),
    ).toHaveAttribute("href", "/admin/companies/c1");
    expect(screen.getByRole("cell", { name: "Ana Silva" })).toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "11444777000161" }),
    ).toBeInTheDocument();
  });
});
