import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCompanyDetail } from "@/components/admin/admin-company-detail";
import type { AdminPlan } from "@/lib/plans-api";
import { renderWithProviders } from "@tests/helpers/render";

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

const starter: AdminPlan = {
  ...trial,
  id: "plan-starter",
  slug: "starter",
  name: "Starter",
  priceCents: 2900,
  isSystem: false,
  sortOrder: 1,
  maxProjects: 5,
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("AdminCompanyDetail", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        if (url.includes("/api/bff/admin/plans")) {
          return jsonResponse([trial, starter]);
        }
        if (url.includes("/api/bff/admin/subscriptions") && init?.method === "POST") {
          return jsonResponse({ id: "sub-1", status: "ACTIVE" });
        }
        if (url.includes("/api/bff/admin/companies/c1")) {
          return jsonResponse({
            id: "c1",
            name: "Acme",
            legalName: "Acme Tecnologia Ltda",
            tradeName: "Acme",
            document: "11444777000161",
            createdAt: "2026-03-01T12:00:00.000Z",
            owner: { id: "u1", name: "Ana Silva", email: "ana@acme.test" },
            plan: {
              id: "plan-trial",
              slug: "free-trial",
              name: "Free Trial",
              status: "TRIAL",
            },
            usage: { projects: 1 },
            limits: {
              maxProjects: 3,
              maxApiKeys: 1,
              maxStandaloneTasks: 0,
              maxProjectGuests: 2,
            },
            projects: [
              {
                id: "p1",
                name: "Kanban empresa",
                createdAt: "2026-02-01T12:00:00.000Z",
              },
            ],
            subscription: null,
          });
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("mostra dono, usage e atribui plano à empresa", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<AdminCompanyDetail companyId="c1" />);

    expect(
      await screen.findByRole("heading", { name: "Acme Tecnologia Ltda" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ana Silva" })).toHaveAttribute(
      "href",
      "/admin/users/u1",
    );
    expect(screen.getByText(/Projectos: 1 \/ 3/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Kanban empresa" }),
    ).toHaveAttribute("href", "/projects/p1");

    await screen.findByRole("option", { name: "Starter" });
    await ue.selectOptions(screen.getByLabelText("Novo plano"), "plan-starter");
    await ue.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => {
      expect(screen.getByText("Plano actualizado.")).toBeInTheDocument();
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/bff/admin/subscriptions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
