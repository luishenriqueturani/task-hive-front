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

test.describe("admin planos", () => {
  test("CLIENT em /admin/plans vê 404", async ({ page }) => {
    await login(page, CLIENT_EMAIL);
    await page.goto("/admin/plans");
    await expect(
      page.getByRole("heading", { name: "Página não encontrada" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Planos", exact: true }),
    ).toHaveCount(0);
  });

  test("admin lista planos, não apaga o trial e edita quotas", async ({
    page,
  }) => {
    await login(page, ADMIN_EMAIL);
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await expect(page.getByRole("link", { name: "Administração" })).toBeVisible();
    await page.getByRole("link", { name: "Administração" }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page
      .getByRole("navigation", { name: "Administração" })
      .getByRole("link", { name: "Planos" })
      .click();
    await expect(page).toHaveURL(/\/admin\/plans/);

    await expect(
      page.getByRole("heading", { name: "Planos", exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Free Trial/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Starter/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pro/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Business/ })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Apagar plano" }),
    ).toHaveCount(0);

    await page.getByRole("button", { name: /Starter/ }).click();
    await expect(
      page.getByRole("heading", { name: "Starter", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Apagar plano" }),
    ).toBeVisible();

    const projects = page.getByLabel("Projectos");
    await projects.fill("8");
    await page.getByRole("button", { name: "Guardar quotas" }).click();
    await expect(page.getByText("Alterações guardadas.")).toBeVisible();
    await expect(projects).toHaveValue("8");

    const benefitTitle = `Benefício E2E ${Date.now()}`;
    await page.getByLabel("Novo título").fill(benefitTitle);
    await page.getByRole("button", { name: "Adicionar benefício" }).click();
    await expect(page.getByText(benefitTitle)).toBeVisible();
  });
});
