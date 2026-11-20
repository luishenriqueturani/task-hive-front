import { expect, test, type Page } from "@playwright/test";

const CLIENT_EMAIL = "e2e@taskhive.test";
const ADMIN_EMAIL = "admin@taskhive.test";
const PASSWORD = "SenhaForte123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("admin utilizadores", () => {
  test("CLIENT em /admin vê 404", async ({ page }) => {
    await login(page, CLIENT_EMAIL);
    await page.goto("/admin");
    await expect(
      page.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Administração", exact: true }),
    ).toHaveCount(0);
  });

  test("admin vê resumo, lista e atribui plano", async ({ page }) => {
    await login(page, ADMIN_EMAIL);
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await page.getByRole("link", { name: "Administração" }).click();
    await expect(page).toHaveURL(/\/admin$/);

    await expect(
      page.getByRole("heading", { name: "Administração", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Utilizadores 5" })).toBeVisible();

    await page
      .getByRole("navigation", { name: "Administração" })
      .getByRole("link", { name: "Utilizadores", exact: true })
      .click();
    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(
      page.getByRole("heading", { name: "Utilizadores", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Usuário E2E" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Empresa E2E" })).toBeVisible();

    await page.getByPlaceholder("Nome ou e-mail").fill("empresa");
    await page.getByRole("button", { name: "Filtrar" }).click();
    await expect(page.getByRole("link", { name: "Empresa E2E" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Usuário E2E" })).toHaveCount(0);

    await page.getByRole("link", { name: "Empresa E2E" }).click();
    await expect(page.getByRole("heading", { name: "Empresa E2E" })).toBeVisible();
    await expect(page.getByText(/Projectos:/)).toBeVisible();

    await page.getByLabel("Novo plano").selectOption({ label: "Starter" });
    await page.getByLabel("Cupom (opcional)").fill("WELCOME10");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByText("Plano actualizado.")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Starter" })).toBeVisible();
  });
});
