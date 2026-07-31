/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard, generateStrongPassword } from "@/lib/password";

describe("generateStrongPassword", () => {
  it("gera senha com o comprimento pedido", () => {
    expect(generateStrongPassword(16)).toHaveLength(16);
    expect(generateStrongPassword(24)).toHaveLength(24);
  });

  it("inclui maiúscula, minúscula, número e símbolo", () => {
    // Várias amostras para evitar falso negativo por azar
    for (let i = 0; i < 20; i++) {
      const pwd = generateStrongPassword(16);
      expect(pwd).toMatch(/[A-Z]/);
      expect(pwd).toMatch(/[a-z]/);
      expect(pwd).toMatch(/[0-9]/);
      expect(pwd).toMatch(/[!@#$%&*\-_=+?]/);
    }
  });

  it("usa comprimento padrão 16", () => {
    expect(generateStrongPassword()).toHaveLength(16);
  });
});

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("usa navigator.clipboard quando disponível", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyToClipboard("segredo")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("segredo");
  });

  it("cai no fallback execCommand quando clipboard falha", async () => {
    vi.stubGlobal("navigator", {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error("denied")),
      },
    });
    // jsdom não implementa execCommand — stubamos no prototype
    const exec = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: exec,
    });

    await expect(copyToClipboard("segredo")).resolves.toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("retorna false quando o fallback também falha", async () => {
    vi.stubGlobal("navigator", {});
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: () => {
        throw new Error("unsupported");
      },
    });

    await expect(copyToClipboard("segredo")).resolves.toBe(false);
  });
});
