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
  test("landing pública mostra produto, planos e CTAs", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Em construção/i)).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: /Organize projetos, tarefas e tempo/i,
      }),
    ).toBeVisible();
    const sections = page.getByRole("navigation", { name: "Secções" });
    await expect(sections.getByRole("link", { name: "Produto" })).toHaveAttribute(
      "href",
      "#produto",
    );
    await expect(sections.getByRole("link", { name: "Planos" })).toHaveAttribute(
      "href",
      "#planos",
    );
    await expect(page.getByRole("link", { name: "Entrar" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Começar grátis" }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "O que entra no dia a dia" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Starter", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Business", exact: true })).toBeVisible();
    await expect(page.getByText(/Tarefas avulsas:/)).toHaveCount(3);
    await page.getByRole("button", { name: "Empresas" }).click();
    await expect(page.getByText(/Tarefas avulsas:/)).toHaveCount(0);
    await expect(page.getByText(/Termos, privacidade e contacto/i)).toBeVisible();
  });

  test("rota protegida sem sessão cai em /login?next=", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveURL(/\/login\?next=%2Fprojects/);
  });

  test("login redireciona para /dashboard e mostra o utilizador", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByRole("heading", { name: "Tarefas avulsas" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Meus projetos" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Projetos em que fui convidado" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Ver todas" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Abrir perfil" })).toBeVisible();
    // nome no header (visível em lg+) ou no drawer
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await expect(page.getByRole("dialog", { name: "Meu perfil" })).toBeVisible();
    await expect(page.getByText("Usuário E2E").first()).toBeVisible();
    await expect(page.getByText(SEED_EMAIL).first()).toBeVisible();
  });

  test("cadastro PF faz auto-login e mostra tarefas avulsas", async ({
    page,
  }) => {
    const email = `novo-${Date.now()}@taskhive.test`;
    await page.goto("/register");
    await page.getByLabel("Nome", { exact: true }).fill("Nova Pessoa");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByLabel("Confirmar senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: "Abrir perfil" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Tarefas avulsas" }),
    ).toBeVisible();
  });

  test("cadastro CNPJ faz auto-login sem tarefas avulsas", async ({
    page,
  }) => {
    const email = `cnpj-${Date.now()}@taskhive.test`;
    await page.goto("/register");
    await page.getByRole("radio", { name: /Pessoa jurídica/i }).click();
    await page.getByLabel("Nome do responsável").fill("Ana Empresa");
    await page.getByLabel("Razão social").fill("Acme Teste Ltda");
    await page.getByLabel("CNPJ").fill("11.444.777/0001-61");
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByLabel("Confirmar senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Criar conta" }).click();
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole("button", { name: "Abrir perfil" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Tarefas avulsas" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("heading", { name: "Tarefas avulsas" }),
    ).toHaveCount(0);

    await page.goto("/to-do");
    await expect(page).toHaveURL(/\/dashboard/);
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

    await page.getByRole("button", { name: "Mais ações do projeto" }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();
    const editDialog = page.getByRole("dialog", { name: "Editar projeto" });
    await expect(editDialog).toBeVisible();
    await editDialog.getByLabel("Nome").fill("Projeto Smoke v2");
    await editDialog.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(editDialog).toBeHidden();
    await expect(
      page.getByRole("heading", { name: "Projeto Smoke v2" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Mais ações do projeto" }).click();
    await page.getByRole("menuitem", { name: "Excluir" }).click();
    const deleteDialog = page.getByRole("dialog", { name: "Excluir projeto" });
    await expect(deleteDialog).toBeVisible();
    await deleteDialog.getByRole("button", { name: "Excluir projeto" }).click();

    await expect(page).toHaveURL(/\/projects$/);
    await expect(
      page.getByText(/ainda não tem projetos/i),
    ).toBeVisible();
  });

  test("kanban: criar, mover e excluir tarefa", async ({ page }) => {
    await login(page);
    await page.goto("/projects");

    await page.getByRole("button", { name: /Novo projeto/i }).click();
    const createProject = page.getByRole("dialog", { name: "Novo projeto" });
    await createProject.getByLabel("Nome").fill("Projeto Kanban");
    await createProject.getByRole("button", { name: "Criar projeto" }).click();
    await expect(createProject).toBeHidden();

    await page.getByRole("link", { name: /Projeto Kanban/i }).click();

    await page.getByRole("button", { name: /^Adicionar coluna$/ }).click();
    await page.getByLabel("Nome da coluna").fill("A fazer");
    await page.getByRole("button", { name: "Criar coluna" }).click();
    await expect(page.getByText("A fazer").first()).toBeVisible();

    await page.getByRole("button", { name: /^Adicionar coluna$/ }).click();
    await page.getByLabel("Nome da coluna").fill("Feito");
    await page.getByRole("button", { name: "Criar coluna" }).click();

    await page
      .getByRole("button", { name: /Nova tarefa em A fazer/i })
      .click();
    const taskDialog = page.getByRole("dialog", { name: "Nova tarefa" });
    await taskDialog.getByLabel("Título").fill("Tarefa smoke");
    await taskDialog.getByRole("button", { name: "Criar tarefa" }).click();
    await expect(page.getByText("Tarefa smoke")).toBeVisible();

    await page
      .getByRole("button", { name: /Mover Tarefa smoke para a próxima coluna/i })
      .click();

    await page.getByText("Tarefa smoke").click();
    const detail = page.getByRole("dialog", { name: "Detalhe da tarefa" });
    await expect(detail).toBeVisible();

    await detail.getByLabel("Nome da nova subtarefa").fill("Checklist smoke");
    await detail.getByRole("button", { name: "Adicionar subtarefa" }).click();
    await expect(detail.getByText("Checklist smoke")).toBeVisible();
    await detail
      .getByRole("button", { name: /Concluir Checklist smoke/i })
      .click();
    await expect(detail.getByText("1/1 concluídas")).toBeVisible();

    await detail.getByRole("button", { name: /^Iniciar$/ }).click();
    await expect(detail.getByText(/Em curso/i)).toBeVisible();
    await detail.getByRole("button", { name: /^Parar$/ }).click();
    await expect(detail.getByText("Usuário E2E")).toBeVisible();

    await detail.getByRole("button", { name: /^Excluir$/ }).click();
    await page
      .getByRole("dialog", { name: "Excluir tarefa" })
      .getByRole("button", { name: "Excluir tarefa" })
      .click();
    await expect(page.getByText("Tarefa smoke")).toHaveCount(0);
  });

  test("dono gere colunas do projeto", async ({ page }) => {
    await login(page);
    await page.goto("/projects");

    await page.getByRole("button", { name: /Novo projeto/i }).click();
    const createDialog = page.getByRole("dialog", { name: "Novo projeto" });
    await createDialog.getByLabel("Nome").fill("Projeto Colunas");
    await createDialog.getByRole("button", { name: "Criar projeto" }).click();
    await expect(createDialog).toBeHidden();

    await page.getByRole("link", { name: /Projeto Colunas/i }).click();
    await page.getByRole("button", { name: /^Adicionar coluna$/ }).click();
    await page.getByLabel("Nome da coluna").fill("A fazer");
    await page.getByRole("button", { name: "Criar coluna" }).click();
    await expect(page.getByText("A fazer")).toBeVisible();

    await page.getByRole("button", { name: /^Adicionar coluna$/ }).click();
    await page.getByLabel("Nome da coluna").fill("Feito");
    await page.getByRole("button", { name: "Criar coluna" }).click();
    await expect(
      page.getByRole("button", { name: /Renomear Feito/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Renomear Feito/i }).click();
    const renameDialog = page.getByRole("dialog", { name: "Renomear coluna" });
    await renameDialog.getByLabel("Nome").fill("Concluído");
    await renameDialog.getByRole("button", { name: "Salvar" }).click();
    await expect(
      page.getByRole("button", { name: /Excluir Concluído/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Excluir Concluído/i }).click();
    await page
      .getByRole("dialog", { name: "Excluir coluna" })
      .getByRole("button", { name: "Excluir coluna" })
      .click();
    await expect(
      page.getByRole("button", { name: /Excluir Concluído/i }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Renomear A fazer/i }),
    ).toBeVisible();
  });

  test("dono adiciona e remove participante", async ({ page }) => {
    await login(page);
    await page.goto("/projects");

    await page.getByRole("button", { name: /Novo projeto/i }).click();
    const createDialog = page.getByRole("dialog", { name: "Novo projeto" });
    await createDialog.getByLabel("Nome").fill("Projeto Participantes");
    await createDialog.getByRole("button", { name: "Criar projeto" }).click();
    await expect(createDialog).toBeHidden();

    await page.getByRole("link", { name: /Projeto Participantes/i }).click();
    await expect(
      page.getByRole("heading", { name: "Projeto Participantes" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Adicionar/i }).click();
    const addDialog = page.getByRole("dialog", { name: "Adicionar participante" });
    await expect(addDialog).toBeVisible();
    await addDialog
      .getByLabel("Buscar por nome ou e-mail")
      .fill("colega@taskhive.test");
    await addDialog.getByRole("button", { name: /Colega E2E/i }).click();
    await expect(addDialog).toBeHidden();
    await expect(page.getByText("Colega E2E")).toBeVisible();

    await page
      .getByRole("button", { name: /Remover Colega E2E/i })
      .click();
    const removeDialog = page.getByRole("dialog", {
      name: "Remover participante",
    });
    await expect(removeDialog).toBeVisible();
    await removeDialog.getByRole("button", { name: "Remover" }).click();
    await expect(page.getByText("Colega E2E")).toHaveCount(0);
  });

  test("tarefas avulsas: criar, concluir e excluir", async ({ page }) => {
    await login(page);
    await page.getByRole("link", { name: "Tarefas avulsas" }).click();
    await expect(page).toHaveURL(/\/to-do$/);

    await page.getByRole("button", { name: /Nova tarefa/i }).click();
    const create = page.getByRole("dialog", { name: "Nova tarefa avulsa" });
    await expect(create).toBeVisible();
    await create.getByLabel("Título").fill("Comprar café");
    await create.getByLabel("Descrição").fill("No mercado perto de casa");
    await create.getByRole("button", { name: "Criar tarefa" }).click();
    await expect(create).toBeHidden();
    await expect(page.getByText("Comprar café")).toBeVisible();

    await page.getByRole("button", { name: /^Concluir$/ }).click();
    await page.getByLabel("Filtrar por status").selectOption("DONE");
    await expect(page.getByText("Comprar café")).toBeVisible();
    await expect(
      page.locator("span").filter({ hasText: /^Concluída$/ }),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Excluir$/ }).click();
    const del = page.getByRole("dialog", { name: "Excluir tarefa" });
    await del.getByRole("button", { name: "Excluir tarefa" }).click();
    await expect(page.getByText("Comprar café")).toHaveCount(0);
  });

  test("convite por e-mail, página pública e accept", async ({ page }) => {
    await login(page);
    await page.goto("/projects");
    await expect(
      page.getByRole("heading", { name: "Meus projetos" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Projetos em que fui convidado" }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Novo projeto/i }).click();
    const createDialog = page.getByRole("dialog", { name: "Novo projeto" });
    await createDialog.getByLabel("Nome").fill("Projeto Convite E2E");
    await createDialog.getByRole("button", { name: "Criar projeto" }).click();
    await expect(createDialog).toBeHidden();

    await page.getByRole("link", { name: /Projeto Convite E2E/i }).click();
    await expect(
      page.getByRole("heading", { name: "Projeto Convite E2E" }),
    ).toBeVisible();

    const invitePosted = page.waitForResponse(
      (res) =>
        res.url().includes("/invites") &&
        res.request().method() === "POST" &&
        res.ok(),
    );
    await page
      .getByLabel("Participantes")
      .getByRole("button", { name: /Adicionar/i })
      .click();
    const addDialog = page.getByRole("dialog", {
      name: "Adicionar participante",
    });
    await addDialog.getByLabel("E-mail", { exact: true }).fill(
      "colega@taskhive.test",
    );
    await addDialog.getByRole("button", { name: /Convidar/i }).click();
    const inviteBody = (await (await invitePosted).json()) as {
      token?: string;
    };
    expect(inviteBody.token).toBeTruthy();
    await expect(page.getByText("colega@taskhive.test")).toBeVisible();

    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto(`/invite/${inviteBody.token}`);
    await expect(page).toHaveURL(new RegExp(`/invite/${inviteBody.token}`));
    await expect(
      page.getByText(/Foi convidado para “Projeto Convite E2E”/),
    ).toBeVisible();
    await page.getByRole("link", { name: "Entrar" }).click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel("E-mail", { exact: true }).fill("colega@taskhive.test");
    await page.getByLabel("Senha", { exact: true }).fill(SEED_PASSWORD);
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page).toHaveURL(new RegExp(`/invite/${inviteBody.token}`));

    await page.getByRole("button", { name: "Aceitar convite" }).click();
    await expect(page).toHaveURL(/\/projects\/\d+/);
    await expect(
      page.getByRole("heading", { name: "Projeto Convite E2E" }),
    ).toBeVisible();

    await page.goto("/projects");
    const invitedSection = page.getByRole("region", {
      name: "Projetos em que fui convidado",
    });
    await expect(
      invitedSection.getByRole("link", { name: /Projeto Convite E2E/i }),
    ).toBeVisible();
    await expect(invitedSection.getByText("Convidado", { exact: true })).toBeVisible();
  });

  test("logout volta ao estado deslogado", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Abrir perfil" }).click();
    await expect(page.getByRole("dialog", { name: "Meu perfil" })).toBeVisible();
    await page.getByRole("button", { name: "Sair da conta" }).click();
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
