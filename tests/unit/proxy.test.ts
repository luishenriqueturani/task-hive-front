import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { SESSION_COOKIE } from "@/lib/session";
import { proxy } from "@/proxy";

function makeRequest(path: string, withSession = false): NextRequest {
  const headers = new Headers();
  if (withSession) {
    headers.set("cookie", `${SESSION_COOKIE}=fake-token`);
  }
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("proxy (guard de rotas)", () => {
  it("redireciona autenticado de /login para /dashboard", () => {
    const res = proxy(makeRequest("/login", true));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/dashboard");
  });

  it("redireciona autenticado de /register e /forgot-password", () => {
    expect(proxy(makeRequest("/register", true)).headers.get("location")).toBe(
      "http://localhost/dashboard",
    );
    expect(
      proxy(makeRequest("/forgot-password", true)).headers.get("location"),
    ).toBe("http://localhost/dashboard");
  });

  it("redireciona sem sessão em rota protegida para /login?next=", () => {
    const res = proxy(makeRequest("/projects"));
    expect(res.status).toBe(307);
    const loc = new URL(res.headers.get("location")!);
    expect(loc.pathname).toBe("/login");
    expect(loc.searchParams.get("next")).toBe("/projects");
  });

  it("redireciona sub-rotas protegidas (ex.: /dashboard/foo)", () => {
    const res = proxy(makeRequest("/dashboard"));
    expect(res.headers.get("location")).toContain("/login");
    expect(new URL(res.headers.get("location")!).searchParams.get("next")).toBe(
      "/dashboard",
    );
  });

  it("permite rota protegida com sessão", () => {
    const res = proxy(makeRequest("/projects", true));
    // NextResponse.next() → status 200 sem Location
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("permite /login sem sessão", () => {
    const res = proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toBeNull();
  });
});
