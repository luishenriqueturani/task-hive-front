import { expect, test, type Page } from "@playwright/test";

const SEED_EMAIL = "e2e@taskhive.test";
const SEED_PASSWORD = "SenhaForte123!";

async function login(page: Page, email = SEED_EMAIL, password = SEED_PASSWORD) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

test.describe("smoke Task Hive", () => {
  test("rota protegida sem sessão cai em /login?next=", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);
  });

  test("login redireciona para /dashboard e mostra o utilizador", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("button", { name: "Abrir perfil" })).toBeVisible();
    // nome no header (visível em lg+) ou no drawer
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await expect(page.getByRole("dialog", { name: "Perfil" })).toBeVisible();
    await expect(page.getByText("Usuário E2E").first()).toBeVisible();
    await expect(page.getByText(SEED_EMAIL).first()).toBeVisible();
  });

  test("cadastro faz auto-login", async ({ page }) => {
    const email = `novo-${Date.now()}@taskhive.test`;
    await page.goto("/register");
    await page.getByLabel("Nome", { exact: true }).fill("Nova Pessoa");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByLabel("Confirmar senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: "Abrir perfil" })).toBeVisible();
  });

  test("CRUD de projetos", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Projetos" }).click();
    await expect(page).toHaveURL(/\/projects$/);

    await page.getByRole("button", { name: /Novo projeto/i }).click();
    const createDialog = page.getByRole("dialog", { name: "Novo projeto" });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel("Nome").fill("Projeto Smoke");
    await createDialog.getByLabel(/Descrição/).fill("Criado no E2E");
    await createDialog.getByRole("button", { name: "Criar projeto" }).click();
    await expect(createDialog).toBeHidden();

    const card = page.getByRole("link", { name: /Projeto Smoke/i });
    await expect(card).toBeVisible();
    await card.click();
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(page.getByRole("heading", { name: "Projeto Smoke" })).toBeVisible();

    await page.getByRole("button", { name: /Editar/i }).click();
    const editDialog = page.getByRole("dialog", { name: "Editar projeto" });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("Nome").fill("Projeto Smoke v2");
    await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(editDialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Projeto Smoke v2" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Excluir/i }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Excluir projeto" });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Excluir projeto" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(
      page.getByText(/ainda não tem projetos/i),
    ).toBeVisible();
  });

  test("logout volta ao estado deslogado", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
