import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeJwt } from "@tests/helpers/jwt";
import { SESSION_COOKIE } from "@/lib/session";

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock("next/headers");
  });

  it("retorna o user do cookie", async () => {
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

    const { GET } = await import("@/app/api/auth/me/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      user: {
        id: "u1",
        name: "Ana",
        email: "ana@example.com",
        role: "CLIENT",
      },
    });
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
