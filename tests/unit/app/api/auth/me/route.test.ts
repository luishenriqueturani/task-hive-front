import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeJwt } from "@tests/helpers/jwt";
import { SESSION_COOKIE } from "@/lib/session";

const fetchMock = vi.fn();

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.doUnmock("next/headers");
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("retorna o user do cookie", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    const token = makeFakeJwt({
      id: "u1",
      name: "Ana",
      email: "ana@example.com",
      role: "CLIENT",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === SESSION_COOKIE ? { name, value: token } : undefined,
      }),
    }));
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "u1",
          name: "Ana",
          email: "ana@example.com",
          role: "CLIENT",
        }),
        { status: 200 },
      ),
    );

    const { GET } = await import("@/app/api/auth/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: "u1",
        name: "Ana",
        email: "ana@example.com",
        role: "CLIENT",
        accountKind: "INDIVIDUAL",
        company: null,
        plan: null,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/users/u1",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${token}`,
        }),
      }),
    );
  });

  it("admins no /me ficam com plan null", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    const token = makeFakeJwt({
      id: "admin-1",
      name: "Admin",
      email: "admin@example.com",
      role: "ADMIN_GOD",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === SESSION_COOKIE ? { name, value: token } : undefined,
      }),
    }));
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "admin-1",
          name: "Admin",
          email: "admin@example.com",
          role: "ADMIN_GOD",
          plan: {
            slug: "pro",
            name: "Pro",
            status: "ACTIVE",
            limits: {
              maxProjects: 20,
              maxApiKeys: 10,
              maxStandaloneTasks: 200,
              maxProjectGuests: 15,
            },
            usage: {
              projects: 0,
              apiKeys: 0,
              standaloneTasks: 0,
              projectGuests: null,
            },
          },
        }),
        { status: 200 },
      ),
    );

    const { GET } = await import("@/app/api/auth/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.plan).toBeNull();
    expect(body.user.accountKind).toBe("INDIVIDUAL");
  });

  it("retorna 401 sem cookie", async () => {
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: () => undefined,
      }),
    }));

    const { GET } = await import("@/app/api/auth/me/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("retorna 401 com token expirado", async () => {
    const token = makeFakeJwt({
      id: "u1",
      email: "ana@example.com",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: () => ({ name: SESSION_COOKIE, value: token }),
      }),
    }));

    const { GET } = await import("@/app/api/auth/me/route");
    const res = await GET();
    expect(res.status).toBe(401);
  });
});
