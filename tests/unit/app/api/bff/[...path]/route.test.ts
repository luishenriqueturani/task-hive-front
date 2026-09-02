import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { SESSION_COOKIE } from "@/lib/session";
import { makeFakeJwt } from "@tests/helpers/jwt";

const fetchMock = vi.fn();

describe("BFF proxy /api/bff/[...path]", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.doUnmock("next/headers");
  });

  async function loadHandlers(cookieToken?: string) {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          cookieToken && name === SESSION_COOKIE
            ? { name, value: cookieToken }
            : undefined,
      }),
    }));
    return import("@/app/api/bff/[...path]/route");
  }

  it("injeta Authorization Bearer quando há cookie", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const { GET } = await loadHandlers("my-token");
    const req = new NextRequest("http://localhost/api/bff/projects");
    const res = await GET(req, { params: Promise.resolve({ path: ["projects"] }) });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/projects",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          authorization: "Bearer my-token",
        }),
      }),
    );
  });

  it("não injeta Authorization sem cookie", async () => {
    fetchMock.mockResolvedValue(new Response("[]", { status: 200 }));
    const { GET } = await loadHandlers();
    await GET(new NextRequest("http://localhost/api/bff/projects"), {
      params: Promise.resolve({ path: ["projects"] }),
    });

    const opts = fetchMock.mock.calls[0][1] as { headers: Record<string, string> };
    expect(opts.headers.authorization).toBeUndefined();
  });

  it("bloqueia auth/login, auth/logout, auth/reset-password e auth/refresh", async () => {
    const { POST } = await loadHandlers("tok");
    for (const path of [
      ["auth", "login"],
      ["auth", "logout"],
      ["auth", "reset-password"],
      ["auth", "refresh"],
    ]) {
      const res = await POST(
        new NextRequest(`http://localhost/api/bff/${path.join("/")}`, {
          method: "POST",
        }),
        { params: Promise.resolve({ path }) },
      );
      expect(res.status).toBe(404);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("repassa método, corpo e status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: "1", name: "P" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );
    const { POST } = await loadHandlers("tok");
    const req = new NextRequest("http://localhost/api/bff/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "P" }),
    });
    const res = await POST(req, {
      params: Promise.resolve({ path: ["projects"] }),
    });

    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "1", name: "P" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/projects",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("rejeita path inválido", async () => {
    const { GET } = await loadHandlers();
    const res = await GET(new NextRequest("http://localhost/api/bff/../x"), {
      params: Promise.resolve({ path: ["..", "x"] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejeita paths fora da allowlist (ex.: metrics)", async () => {
    const { GET } = await loadHandlers("tok");
    const res = await GET(new NextRequest("http://localhost/api/bff/metrics"), {
      params: Promise.resolve({ path: ["metrics"] }),
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("permite GET /invites/:token (onda 1)", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ email: "a@b.com" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const { GET } = await loadHandlers("tok");
    const res = await GET(
      new NextRequest("http://localhost/api/bff/invites/token-abc"),
      { params: Promise.resolve({ path: ["invites", "token-abc"] }) },
    );
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/invites/token-abc",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("bloqueia /to-do no BFF para conta CNPJ", async () => {
    const token = makeFakeJwt({
      id: "user-1",
      email: "empresa@example.com",
      role: "CLIENT",
      accountKind: ACCOUNT_KIND.COMPANY,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const { GET } = await loadHandlers(token);
    const res = await GET(new NextRequest("http://localhost/api/bff/to-do"), {
      params: Promise.resolve({ path: ["to-do"] }),
    });
    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
