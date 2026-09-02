import { notFound } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ACCOUNT_KIND } from "@/lib/account-kind";
import { requireAdmin } from "@/lib/redirect-to-login";
import { getSessionUser } from "@/lib/session";
import { sessionUserFixture } from "@tests/helpers/session-user";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirect: vi.fn(),
}));

vi.mock("@/lib/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/session")>(
    "@/lib/session",
  );
  return {
    ...actual,
    getSessionUser: vi.fn(),
  };
});

describe("requireAdmin", () => {
  beforeEach(() => {
    vi.mocked(notFound).mockClear();
    vi.mocked(getSessionUser).mockReset();
  });

  it("devolve o utilizador admin", async () => {
    const admin = sessionUserFixture({ role: "ADMIN_GOD" });
    vi.mocked(getSessionUser).mockResolvedValue(admin);
    await expect(requireAdmin()).resolves.toEqual(admin);
    expect(notFound).not.toHaveBeenCalled();
  });

  it("dá 404 a CLIENT", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(
      sessionUserFixture({ role: "CLIENT", accountKind: ACCOUNT_KIND.INDIVIDUAL }),
    );
    await expect(requireAdmin()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });
});
