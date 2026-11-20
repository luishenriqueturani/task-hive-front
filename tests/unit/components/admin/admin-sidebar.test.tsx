import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { renderWithProviders } from "@tests/helpers/render";

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/users",
}));

describe("AdminSidebar", () => {
  it("marca Utilizadores como página actual", () => {
    renderWithProviders(<AdminSidebar />);
    expect(screen.getByRole("link", { name: "Utilizadores" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Resumo" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute(
      "href",
      "/admin/companies",
    );
    expect(screen.getByRole("link", { name: "Planos" })).toHaveAttribute(
      "href",
      "/admin/plans",
    );
  });
});
