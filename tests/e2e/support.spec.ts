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

test.describe("suporte", () => {
  test("cliente abre ticket e admin responde", async ({ browser }) => {
    const subject = `Ajuda E2E ${Date.now()}`;
    const clientContext = await browser.newContext();
    const adminContext = await browser.newContext();
    const client = await clientContext.newPage();
    const admin = await adminContext.newPage();

    await login(client, CLIENT_EMAIL);
    await client.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Suporte" }).click();
    await expect(client).toHaveURL(/\/support$/);
    await expect(client.getByRole("heading", { name: "Suporte" })).toBeVisible();

    await client.getByRole("button", { name: "Nova conversa" }).click();
    await client.getByLabel("Assunto").fill(subject);
    await client.getByLabel("Mensagem").fill("Não consigo entrar na conta.");
    await client.getByRole("button", { name: "Abrir ticket" }).click();
    await expect(client).toHaveURL(/\/support\/.+/);
    await expect(client.getByRole("heading", { name: subject })).toBeVisible();
    await expect(client.getByText("Não consigo entrar na conta.")).toBeVisible();

    await login(admin, ADMIN_EMAIL);
    await admin.goto("/admin/support");
    await expect(admin.getByRole("heading", { name: "Suporte" })).toBeVisible();
    await admin.getByRole("link", { name: new RegExp(subject) }).click();
    await expect(admin.getByRole("heading", { name: subject })).toBeVisible();
    await admin.getByRole("button", { name: "Assumir ticket" }).click();
    await admin.getByPlaceholder("Escreva a resposta").fill("Já estamos a tratar.");
    await admin.getByRole("button", { name: "Enviar" }).click();
    await expect(admin.getByText("Já estamos a tratar.")).toBeVisible();

    await client.reload();
    await expect(client.getByText("Já estamos a tratar.")).toBeVisible();

    await clientContext.close();
    await adminContext.close();
  });
});
