import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCouponsView } from "@/components/admin/admin-coupons-view";
import type { AdminCoupon } from "@/lib/coupons-api";
import type { AdminPlan } from "@/lib/plans-api";
import { renderWithProviders } from "@tests/helpers/render";

const starter: AdminPlan = {
  id: "plan-starter",
  slug: "starter",
  name: "Starter",
  description: null,
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
  benefits: [],
};

const trial: AdminPlan = {
  ...starter,
  id: "plan-trial",
  slug: "free-trial",
  name: "Free Trial",
  priceCents: 0,
  isSystem: true,
  sortOrder: 0,
};

const welcome: AdminCoupon = {
  id: "c1",
  code: "WELCOME10",
  type: "PERCENT",
  value: 10,
  maxRedemptions: 50,
  redeemedCount: 1,
  startsAt: null,
  expiresAt: null,
  isActive: true,
  applicablePlans: [{ id: "plan-starter", slug: "starter", name: "Starter" }],
  redemptions: [
    {
      id: "r1",
      createdAt: "2026-09-01T12:00:00.000Z",
      subscriptionId: null,
      user: { id: "u1", name: "Ana", email: "ana@example.com" },
    },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("AdminCouponsView", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (url.endsWith("/api/bff/admin/coupons") && method === "GET") {
          return jsonResponse([welcome]);
        }
        if (url.endsWith("/api/bff/admin/plans") && method === "GET") {
          return jsonResponse([trial, starter]);
        }
        return jsonResponse({ message: "not found" }, 404);
      }),
    );
  });

  it("lista cupons, redemptions e esconde o trial nos planos", async () => {
    renderWithProviders(<AdminCouponsView />);

    expect(
      await screen.findByRole("button", { name: /WELCOME10/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("ana@example.com")).toBeInTheDocument();
    expect(screen.getByText("Redemptions")).toBeInTheDocument();
    expect(
      await screen.findByRole("checkbox", { name: "Starter" }),
    ).toBeChecked();
    expect(
      screen.queryByRole("checkbox", { name: "Free Trial" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Apagar cupom" }),
    ).toBeInTheDocument();
  });

  it("mostra o formulário de novo cupom", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AdminCouponsView />);
    await screen.findByRole("button", { name: /WELCOME10/ });
    await user.click(screen.getByRole("button", { name: "Novo cupom" }));
    expect(screen.getByRole("form", { name: "Novo cupom" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar cupom" }),
    ).toBeInTheDocument();
  });
});

describe("AdminCouponsView — criar", () => {
  it("envia POST com código e planos", async () => {
    const fetchMock = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method ?? "GET";
        if (url.endsWith("/api/bff/admin/coupons") && method === "GET") {
          return jsonResponse([]);
        }
        if (url.endsWith("/api/bff/admin/plans") && method === "GET") {
          return jsonResponse([starter]);
        }
        if (url.endsWith("/api/bff/admin/coupons") && method === "POST") {
          return jsonResponse({ ...welcome, code: "PROMO20", redemptions: [] });
        }
        return jsonResponse({ message: "not found" }, 404);
      },
    );
    vi.stubGlobal("fetch", fetchMock);

    const user = userEvent.setup();
    renderWithProviders(<AdminCouponsView />);
    const code = await screen.findByLabelText("Código");
    await user.clear(code);
    await user.type(code, "promo20");
    await user.click(await screen.findByRole("checkbox", { name: "Starter" }));
    await user.click(screen.getByRole("button", { name: "Criar cupom" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post).toBeTruthy();
      expect(JSON.parse(String(post?.[1]?.body))).toEqual(
        expect.objectContaining({
          code: "promo20",
          type: "PERCENT",
          planIds: ["plan-starter"],
        }),
      );
    });
  });
});
