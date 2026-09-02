import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { ACCOUNT_KIND, type AccountKind } from "@/lib/account-kind";
import { SESSION_COOKIE } from "@/lib/session";
import { proxy } from "@/proxy";
import { makeFakeJwt } from "@tests/helpers/jwt";

function sessionJwt(accountKind: AccountKind = ACCOUNT_KIND.INDIVIDUAL) {
  return makeFakeJwt({
    id: "user-1",
    name: "Ana",
    email: "ana@example.com",
    role: "CLIENT",
    accountKind,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
}

function makeRequest(path: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) {
    headers.set("cookie", `${SESSION_COOKIE}=${token}`);
  }
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("proxy (guard de rotas)", () => {
  it("permite /login com cookie (redirect autenticado fica em login/page.tsx)", () => {
    const res = proxy(makeRequest("/login", "fake-token"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("permite /register e /forgot-password com cookie", () => {
    expect(
      proxy(makeRequest("/register", "fake-token")).headers.get("location"),
    ).toBeNull();
    expect(
      proxy(makeRequest("/forgot-password", "fake-token")).headers.get(
        "location",
      ),
    ).toBeNull();
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
    const res = proxy(makeRequest("/projects", "fake-token"));
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("permite /to-do para conta PF", () => {
    const res = proxy(makeRequest("/to-do", sessionJwt()));
    expect(res.headers.get("location")).toBeNull();
    expect(res.status).toBe(200);
  });

  it("redirecciona /to-do para /dashboard quando a conta é CNPJ", () => {
    const res = proxy(
      makeRequest("/to-do", sessionJwt(ACCOUNT_KIND.COMPANY)),
    );
    expect(res.status).toBe(307);
    expect(new URL(res.headers.get("location")!).pathname).toBe("/dashboard");
  });

  it("permite /login sem sessão", () => {
    const res = proxy(makeRequest("/login"));
    expect(res.headers.get("location")).toBeNull();
  });
});
