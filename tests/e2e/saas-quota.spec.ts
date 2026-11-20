import { expect, test, type Page } from "@playwright/test";

const CLIENT_EMAIL = "quota@taskhive.test";
const COMPANY_EMAIL = "empresa@taskhive.test";
const PASSWORD = "SenhaForte123!";

async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function postBff(
  page: Page,
  path: string,
  body: unknown,
): Promise<{ status: number; json: unknown }> {
  return page.evaluate(
    async ({ path: url, body: payload }) => {
      const res = await fetch(`/api/bff${url}`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        json = null;
      }
      return { status: res.status, json };
    },
    { path, body },
  );
}

async function postUntilStatus(
  page: Page,
  path: string,
  bodyFor: (index: number) => unknown,
  status: number,
) {
  let last: { status: number; json: unknown } | undefined;
  for (let index = 0; index < 20; index += 1) {
    last = await postBff(page, path, bodyFor(index));
    if (last.status === status) return last;
  }
  throw new Error(
    `Esperava ${status} em ${path}, último: ${last?.status} ${JSON.stringify(last?.json)}`,
  );
}

test.describe("mock SaaS 402", () => {
  test("projectos e chaves API devolvem 402; CNPJ não cria to-do", async ({
    browser,
  }) => {
    const clientContext = await browser.newContext();
    const companyContext = await browser.newContext();
    const client = await clientContext.newPage();
    const company = await companyContext.newPage();

    await login(client, CLIENT_EMAIL);

    const overProjects = await postUntilStatus(
      client,
      "/projects",
      (index) => ({ name: `Quota projecto ${Date.now()} ${index}` }),
      402,
    );
    expect(overProjects.json).toMatchObject({ code: "PLAN_LIMIT_PROJECTS" });

    const overPat = await postUntilStatus(
      client,
      "/personal-access-tokens",
      (index) => ({ name: `Quota PAT ${index}` }),
      402,
    );
    expect(overPat.json).toMatchObject({ code: "PLAN_LIMIT_API_KEYS" });

    await login(company, COMPANY_EMAIL);
    const companyTodo = await postBff(company, "/to-do", {
      title: "Tarefa empresa",
      description: "Não deve existir",
    });
    expect(companyTodo.status).toBe(403);

    await clientContext.close();
    await companyContext.close();
  });
});
