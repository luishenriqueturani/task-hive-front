import { describe, expect, it } from "vitest";
import { readApiErrorMessage } from "@/lib/api-error";

function jsonResponse(body: unknown, status = 400): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("readApiErrorMessage", () => {
  it("traduz senha fraca", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({ message: "password is not strong enough" }),
      "fallback",
    );
    expect(msg).toMatch(/mínimo 8 caracteres/i);
  });

  it("traduz senhas diferentes", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({ message: "confirmPassword must match password" }),
      "fallback",
    );
    expect(msg).toBe("As senhas não coincidem.");
  });

  it("traduz e-mail inválido", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({ message: "email must be an email" }),
      "fallback",
    );
    expect(msg).toBe("Informe um e-mail válido.");
  });

  it("traduz JWT inválido", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({ message: "token must be a jwt string" }),
      "fallback",
    );
    expect(msg).toMatch(/link de redefinição/i);
  });

  it("traduz array de mensagens", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({
        message: [
          "password is not strong enough",
          "confirmPassword must match password",
        ],
      }),
      "fallback",
    );
    expect(msg).toMatch(/mínimo 8 caracteres/i);
    expect(msg).toMatch(/não coincidem/i);
  });

  it("mantém mensagem já em português", async () => {
    const msg = await readApiErrorMessage(
      jsonResponse({ message: "Usuário não cadastrado" }),
      "fallback",
    );
    expect(msg).toBe("Usuário não cadastrado");
  });

  it("usa fallback quando body não tem message", async () => {
    const msg = await readApiErrorMessage(jsonResponse({}), "fallback");
    expect(msg).toBe("fallback");
  });

  it("usa fallback quando resposta não é JSON", async () => {
    const msg = await readApiErrorMessage(
      new Response("not json", { status: 500 }),
      "fallback",
    );
    expect(msg).toBe("fallback");
  });

  it("traduz Unauthorized e Forbidden", async () => {
    expect(
      await readApiErrorMessage(jsonResponse({ message: "Unauthorized" }), "f"),
    ).toMatch(/Sessão expirada/i);
    expect(
      await readApiErrorMessage(
        jsonResponse({ message: "Forbidden resource" }),
        "f",
      ),
    ).toMatch(/não tem permissão/i);
  });
});
