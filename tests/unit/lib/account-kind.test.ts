import { describe, expect, it } from "vitest";
import {
  ACCOUNT_KIND,
  canUseStandaloneTodos,
  isStandaloneTodosAppPath,
  isStandaloneTodosBffPath,
} from "@/lib/account-kind";

describe("account-kind helpers", () => {
  it("contas CNPJ não usam tarefas avulsas", () => {
    expect(canUseStandaloneTodos(ACCOUNT_KIND.INDIVIDUAL)).toBe(true);
    expect(canUseStandaloneTodos(ACCOUNT_KIND.COMPANY)).toBe(false);
  });

  it("reconhece paths de to-do na app e no BFF", () => {
    expect(isStandaloneTodosAppPath("/to-do")).toBe(true);
    expect(isStandaloneTodosAppPath("/to-do/123")).toBe(true);
    expect(isStandaloneTodosAppPath("/dashboard")).toBe(false);
    expect(isStandaloneTodosBffPath("to-do")).toBe(true);
    expect(isStandaloneTodosBffPath("to-do/1")).toBe(true);
    expect(isStandaloneTodosBffPath("projects")).toBe(false);
  });
});
