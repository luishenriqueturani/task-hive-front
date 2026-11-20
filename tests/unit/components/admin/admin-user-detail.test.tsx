import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminUserDetail } from "@/components/admin/admin-user-detail";
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

describe("AdminUserDetail", () => {
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
        if (url.includes("/api/bff/admin/users/u1")) {
          return jsonResponse({
            id: "u1",
            name: "Ana Silva",
            email: "ana@example.com",
            role: "CLIENT",
            accountKind: "INDIVIDUAL",
            createdAt: "2026-01-02T12:00:00.000Z",
            company: null,
            document: null,
            plan: {
              id: "plan-trial",
              slug: "free-trial",
              name: "Free Trial",
              status: "TRIAL",
            },
            usage: {
              projects: 1,
              apiKeys: 0,
              standaloneTasks: 2,
              projectGuests: null,
            },
            limits: {
              maxProjects: 3,
              maxApiKeys: 1,
              maxStandaloneTasks: 15,
              maxProjectGuests: 2,
            },
            projects: [
              {
                id: "p1",
                name: "Kanban",
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

  it("mostra usage, projectos e atribui plano", async () => {
    const ue = userEvent.setup();
    renderWithProviders(<AdminUserDetail userId="u1" />);

    expect(await screen.findByRole("heading", { name: "Ana Silva" })).toBeInTheDocument();
    expect(await screen.findByRole("option", { name: "Starter" })).toBeInTheDocument();
    expect(screen.getByText(/Projectos: 1 \/ 3/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Kanban" })).toHaveAttribute(
      "href",
      "/projects/p1",
    );

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
