import { describe, expect, it } from "vitest";
import {
  formatCnpj,
  formatCpf,
  inviteQueryLooksLikeEmail,
  isValidCnpj,
  isValidCpf,
  normalizeCnpj,
  onlyDigits,
} from "@/lib/br-documents";

describe("br-documents", () => {
  it("formata CPF e CNPJ numérico", () => {
    expect(formatCpf("39053344705")).toBe("390.533.447-05");
    expect(formatCnpj("11444777000161")).toBe("11.444.777/0001-61");
    expect(onlyDigits("11.444.777/0001-61")).toBe("11444777000161");
  });

  it("formata e normaliza CNPJ alfanumérico", () => {
    expect(normalizeCnpj("12.abc.345/01de-35")).toBe("12ABC34501DE35");
    expect(formatCnpj("12abc34501de35")).toBe("12.ABC.345/01DE-35");
  });

  it("valida dígitos verificadores numéricos e alfanuméricos", () => {
    expect(isValidCpf("390.533.447-05")).toBe(true);
    expect(isValidCpf("000.000.000-00")).toBe(false);
    expect(isValidCnpj("11.444.777/0001-61")).toBe(true);
    expect(isValidCnpj("11.111.111/1111-11")).toBe(false);
    expect(isValidCnpj("12.ABC.345/01DE-35")).toBe(true);
    expect(isValidCnpj("12.ABC.345/01DE-00")).toBe(false);
  });

  it("reconhece e-mail no query de convite", () => {
    expect(inviteQueryLooksLikeEmail("a@b.com")).toBe(true);
    expect(inviteQueryLooksLikeEmail("tok_abc")).toBe(false);
  });
});
