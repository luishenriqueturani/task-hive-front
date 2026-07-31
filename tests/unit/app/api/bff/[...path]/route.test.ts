import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/session";

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

  it("bloqueia auth/login, auth/logout e auth/reset-password", async () => {
    const { POST } = await loadHandlers("tok");
    for (const path of [
      ["auth", "login"],
      ["auth", "logout"],
      ["auth", "reset-password"],
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
});
