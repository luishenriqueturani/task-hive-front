import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeJwt } from "@tests/helpers/jwt";
import { SESSION_COOKIE } from "@/lib/session";

const fetchMock = vi.fn();

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("grava nova sessão no cookie em sucesso", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    const token = makeFakeJwt({
      id: "u1",
      email: "a@b.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    const user = { id: "u1", name: "Ana", email: "a@b.com", role: "CLIENT" };
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ token, user }), { status: 200 }),
    );

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const req = new NextRequest("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        token: "reset-tok",
        password: "SenhaForte1!",
        confirmPassword: "SenhaForte1!",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe(token);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/auth/reset-password",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("propaga erro de token inválido", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Token inválido" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const req = new NextRequest("http://localhost/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token: "bad" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBeFalsy();
  });
});
