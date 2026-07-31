import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_COOKIE } from "@/lib/session";

const fetchMock = vi.fn();

describe("POST /api/auth/logout", () => {
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

  it("chama upstream e limpa o cookie", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: (name: string) =>
          name === SESSION_COOKIE ? { name, value: "tok" } : undefined,
      }),
    }));
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();

    expect(res.status).toBe(204);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://backend.test/auth/logout",
      expect.objectContaining({
        method: "POST",
        headers: { authorization: "Bearer tok" },
      }),
    );
    const cleared = res.cookies.get(SESSION_COOKIE);
    expect(cleared?.value).toBe("");
  });

  it("limpa o cookie mesmo se o upstream falhar", async () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://backend.test");
    vi.doMock("next/headers", () => ({
      cookies: async () => ({
        get: () => ({ name: SESSION_COOKIE, value: "tok" }),
      }),
    }));
    fetchMock.mockRejectedValue(new Error("network"));

    const { POST } = await import("@/app/api/auth/logout/route");
    const res = await POST();

    expect(res.status).toBe(204);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBe("");
  });
});
