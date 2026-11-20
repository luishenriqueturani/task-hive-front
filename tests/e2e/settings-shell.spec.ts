import { expect, test, type Page } from "@playwright/test";

const CLIENT_EMAIL = "e2e@taskhive.test";
const PASSWORD = "SenhaForte123!";

async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(CLIENT_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("settings no shell autenticado", () => {
  test("Plano e tokens mostram o AppHeader", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await page.getByRole("link", { name: "Plano" }).click();
    await expect(page).toHaveURL(/\/settings\/plan/);
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Definições" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Plano", exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Tokens de API" }).click();
    await expect(page).toHaveURL(/\/settings\/api-tokens/);
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Tokens de API" }),
    ).toBeVisible();
  });
});
