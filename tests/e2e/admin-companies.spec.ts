import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = "admin@taskhive.test";
const PASSWORD = "SenhaForte123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("admin empresas", () => {
  test("lista, filtra por CNPJ, detalhe e atribui plano", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Empresas 1" })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Administração" })
      .getByRole("link", { name: "Empresas", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/companies/);
    await expect(
      page.getByRole("heading", { name: "Empresas", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Empresa E2E Ltda" }),
    ).toBeVisible();

    await page.getByPlaceholder("00.000.000/0000-00").fill("11444777000161");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(
      page.getByRole("link", { name: "Empresa E2E Ltda" }),
    ).toBeVisible();

    await page.getByRole("link", { name: "Empresa E2E Ltda" }).click();
    await expect(
      page.getByRole("heading", { name: "Empresa E2E Ltda" }),
    ).toBeVisible();
    await expect(page.getByText(/Dono:/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Empresa E2E" })).toBeVisible();

    await page.getByLabel("Novo plano").selectOption({ label: "Pro" });
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Plano actualizado.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro", exact: true })).toBeVisible();
  });
});
