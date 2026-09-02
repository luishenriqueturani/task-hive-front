import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPlansView } from "@/components/admin/admin-plans-view";
import type { AdminPlan } from "@/lib/plans-api";
import { renderWithProviders } from "@tests/helpers/render";

const trial: AdminPlan = {
  id: "trial",
  slug: "free-trial",
  name: "Free Trial",
  description: "Trial técnico",
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
  id: "starter",
  slug: "starter",
  name: "Starter",
  description: "Plano base",
  accountKind: "BOTH",
  interval: "MONTHLY",
  priceCents: 2900,
  currency: "BRL",
  sortOrder: 1,
  isActive: true,
  isSystem: false,
  maxProjects: 5,
  maxApiKeys: 2,
  maxStandaloneTasks: 30,
  maxProjectGuests: 3,
  benefits: [{ id: "b1", title: "Kanban", body: null, icon: null, sortOrder: 0 }],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("AdminPlansView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/api/bff/admin/plans") && !url.includes("/benefits")) {
          return jsonResponse([trial, starter]);
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("lista planos e não permite apagar o trial de sistema", async () => {
    renderWithProviders(<AdminPlansView />);

    expect(
      await screen.findByRole("button", { name: /Free Trial/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Starter/ })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Apagar plano" }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Quotas do plano")).toBeInTheDocument();
  });

  it("mostra Apagar plano só em planos que não são de sistema", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminPlansView />);
    await screen.findByRole("button", { name: /Free Trial/ });
    await user.click(screen.getByRole("button", { name: /Starter/ }));
    expect(
      await screen.findByRole("button", { name: "Apagar plano" }),
    ).toBeInTheDocument();
  });

  it("mostra benefícios e o formulário de CRUD", async () => {
    renderWithProviders(<AdminPlansView />);
    await screen.findByRole("button", { name: /Starter/ });
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Starter/ }));
    expect(await screen.findByText("Kanban")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Adicionar benefício" }),
    ).toBeInTheDocument();
  });
});

describe("AdminPlansView — guardar quotas", () => {
  it("envia PATCH com as quotas editadas", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/api/bff/admin/plans") && method === "GET") {
        return jsonResponse([starter]);
      }
      if (url.includes("/api/bff/admin/plans/starter") && method === "PATCH") {
        return jsonResponse({ ...starter, maxProjects: 8 });
      }
      return jsonResponse({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AdminPlansView />);
    const projects = await screen.findByLabelText("Projectos");
    await user.clear(projects);
    await user.type(projects, "8");
    await user.click(screen.getByRole("button", { name: "Guardar quotas" }));

    await waitFor(() => {
      const patch = fetchMock.mock.calls.find(
        ([, init]) => init?.method === "PATCH",
      );
      expect(patch).toBeTruthy();
      expect(JSON.parse(String(patch?.[1]?.body))).toEqual(
        expect.objectContaining({ maxProjects: 8 }),
      );
    });
  });
});
