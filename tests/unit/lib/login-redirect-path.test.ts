import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loginRedirectUrl } from "@/lib/login-redirect-path";

describe("loginRedirectUrl", () => {
  const env = process.env;

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  it("usa X-Forwarded-Host atrás do proxy (nunca 0.0.0.0)", () => {
    const headers = new Headers({
      host: "0.0.0.0:3000",
      "x-forwarded-host": "orangepi.local:8080",
      "x-forwarded-proto": "http",
    });
    const request = new NextRequest("http://0.0.0.0:3000/projects", {
      headers,
    });

    const url = loginRedirectUrl(request, "/projects");
    expect(url.hostname).toBe("orangepi.local");
    expect(url.port).toBe("8080");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("next")).toBe("/projects");
  });

  it("cai para PUBLIC_APP_URL quando o host interno é 0.0.0.0", () => {
    process.env.PUBLIC_APP_URL = "http://192.168.1.34:8080";
    const request = new NextRequest("http://0.0.0.0:3000/dashboard", {
      headers: { host: "0.0.0.0:3000" },
    });

    const url = loginRedirectUrl(request);
    expect(url.origin).toBe("http://192.168.1.34:8080");
    expect(url.pathname).toBe("/login");
  });

  it("propaga parâmetros extra (ex.: cleared=1)", () => {
    process.env.PUBLIC_APP_URL = "http://orangepi.local:8080";
    const request = new NextRequest("http://0.0.0.0:3000/login", {
      headers: { host: "0.0.0.0:3000" },
    });

    const url = loginRedirectUrl(request, null, { cleared: "1" });
    expect(url.searchParams.get("cleared")).toBe("1");
    expect(url.hostname).toBe("orangepi.local");
  });
});
