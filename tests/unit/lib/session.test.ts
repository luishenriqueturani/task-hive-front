import { describe, expect, it } from "vitest";
import { makeFakeJwt } from "@tests/helpers/jwt";
import { decodeSessionUser } from "@/lib/session";

describe("decodeSessionUser", () => {
  it("decodifica JWT válido", () => {
    const token = makeFakeJwt({
      id: "user-1",
      name: "Ana",
      email: "ana@example.com",
      role: "CLIENT",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(decodeSessionUser(token)).toEqual({
      id: "user-1",
      name: "Ana",
      email: "ana@example.com",
      role: "CLIENT",
    });
  });

  it("retorna null para token expirado", () => {
    const token = makeFakeJwt({
      id: "user-1",
      email: "ana@example.com",
      exp: Math.floor(Date.now() / 1000) - 10,
    });
    expect(decodeSessionUser(token)).toBeNull();
  });

  it("retorna null para token malformado", () => {
    expect(decodeSessionUser("not.a.jwt.extra")).toBeNull();
    expect(decodeSessionUser("abc")).toBeNull();
    expect(decodeSessionUser("a.b")).toBeNull();
  });

  it("retorna null quando falta id ou email", () => {
    expect(
      decodeSessionUser(
        makeFakeJwt({
          email: "ana@example.com",
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ),
    ).toBeNull();
    expect(
      decodeSessionUser(
        makeFakeJwt({
          id: "user-1",
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ),
    ).toBeNull();
  });

  it("aceita name e role nulos", () => {
    const token = makeFakeJwt({
      id: "user-1",
      email: "ana@example.com",
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    expect(decodeSessionUser(token)).toEqual({
      id: "user-1",
      name: null,
      email: "ana@example.com",
      role: null,
    });
  });
});
