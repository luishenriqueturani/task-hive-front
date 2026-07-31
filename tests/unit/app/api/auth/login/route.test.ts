import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeFakeJwt } from "@tests/helpers/jwt";
import { SESSION_COOKIE } from "@/lib/session";

const fetchMock = vi.fn();

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("grava cookie httpOnly e devolve o user", async () => {
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

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "x" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toEqual(user);
    expect(body.token).toBeUndefined();

    const setCookie = res.cookies.get(SESSION_COOKIE);
    expect(setCookie?.value).toBe(token);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/auth/login",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("propaga status do backend e não grava cookie", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );

    const { POST } = await import("@/app/api/auth/login/route");
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "wrong" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBeFalsy();
  });

  it("retorna 503 quando BACKEND_API_BASE_URL está ausente", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    const { POST } = await import("@/app/api/auth/login/route");
    const req = new NextRequest("http://localhost/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "a@b.com", password: "x" }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
