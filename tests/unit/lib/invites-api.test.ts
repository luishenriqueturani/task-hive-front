import { describe, expect, it } from "vitest";
import {
  inviteAuthHrefs,
  invitePagePath,
  registerHrefFromNext,
} from "@/lib/invites-api";

describe("invite helpers", () => {
  it("monta path e hrefs de auth", () => {
    expect(invitePagePath("th_inv_abc")).toBe("/invite/th_inv_abc");
    expect(inviteAuthHrefs("th_inv_abc")).toEqual({
      login: "/login?next=%2Finvite%2Fth_inv_abc",
      register:
        "/register?invite=th_inv_abc&next=%2Finvite%2Fth_inv_abc",
    });
  });

  it("preserva convite ao ir de login para cadastro", () => {
    expect(registerHrefFromNext("/invite/th_inv_abc")).toBe(
      "/register?invite=th_inv_abc&next=%2Finvite%2Fth_inv_abc",
    );
    expect(registerHrefFromNext("/projects")).toBe(
      "/register?next=%2Fprojects",
    );
    expect(registerHrefFromNext()).toBe("/register");
  });
});
