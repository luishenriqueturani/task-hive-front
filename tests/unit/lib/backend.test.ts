import { afterEach, describe, expect, it, vi } from "vitest";
import { backendBase } from "@/lib/backend";

describe("backendBase", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna null quando a env não está definida", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "");
    expect(backendBase()).toBeNull();
  });

  it("remove a barra final", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://api.local:8080/");
    expect(backendBase()).toBe("http://api.local:8080");
  });

  it("mantém URL sem barra final", () => {
    vi.stubEnv("BACKEND_API_BASE_URL", "http://api.local:8080");
    expect(backendBase()).toBe("http://api.local:8080");
  });
});
