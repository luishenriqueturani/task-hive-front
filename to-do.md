# Task Hive — To-Do (frontend)

Roadmap do frontend Next.js. O **backend MVP está concluído** — ver [`../backend/to-do.md`](../backend/to-do.md) e [`../backend/README.md`](../backend/README.md) para o estado da API.

Próxima etapa (SaaS): [`../PLANEJAMENTO-ETAPA-SAAS.md`](../PLANEJAMENTO-ETAPA-SAAS.md) — decisões de produto, quotas e ondas; as tarefas de UI estão na **Fase 8** deste ficheiro.

Convenções de código: [`.cursor/rules/task-hive-conventions.mdc`](.cursor/rules/task-hive-conventions.mdc).

---

## Estado atual (baseline)

### Já implementado

- [x] **Stack:** Next.js 16, React 19, Tailwind CSS 4, TanStack Query, Orval, next-themes.
- [x] **Tema visual:** paleta Soft Pearl (claro/escuro), fontes Geist, copy em pt-BR.
- [x] **Páginas:** `/` (landing "Em construção") e `/login` (formulário funcional).
- [x] **Componentes base:** logo, header, toggle de tema, fundo ambiente, providers (Query + tema).
- [x] **BFF proxy genérico:** `/api/bff/[...path]` → backend (`BACKEND_API_BASE_URL`).
- [x] **Cliente API:** hooks Orval gerados para todos os módulos backend (auth, users, projects, project-stages, tasks, subtasks, to-do, companies).
- [x] **OpenAPI local:** `openapi/openapi.json` + scripts `api:fetch-spec` e `api:generate`.

### Lacunas críticas (bloqueiam o produto)

- [x] **Sessão no BFF:** JWT guardado em cookie httpOnly (`th_session`) via `/api/auth/login`; o proxy BFF injeta `Authorization: Bearer` nas chamadas upstream.
- [x] **Rotas protegidas:** guard em `src/proxy.ts` (convenção do Next.js 16) — redireciona rotas privadas para `/login?next=...` e `/login` para `/` quando já autenticado.
- [ ] **Telas de produto restantes:** perfil (Fase 6); landing comercial, PF/CNPJ, convites, planos, admin e suporte (Fase 8).

---

## Fase 1 — Autenticação e sessão (prioridade máxima)

Objetivo: utilizador consegue entrar, manter sessão e sair com segurança.

### 1.1 BFF de auth

- [x] **Login dedicado:** Route Handler `POST /api/auth/login` que chama `POST /auth/login` no backend, extrai o token da resposta e define cookie **httpOnly**, **Secure** (prod), **SameSite=Lax**, path `/` (`src/lib/session.ts`).
- [x] **Logout:** `POST /api/auth/logout` — invalida sessão no backend (`POST /auth/logout`) e limpa o cookie.
- [x] **Proxy autenticado:** em `/api/bff/[...path]`, ler cookie de sessão e enviar `Authorization: Bearer <token>` ao backend (não expor token ao cliente); `auth/login` e `auth/logout` bloqueados no proxy genérico.
- [x] **Atualizar `LoginForm`:** chama `/api/auth/login` e respeita `?next=` (sanitizado contra open redirect).

### 1.2 Rotas protegidas

- [x] **Guard de rotas:** `src/proxy.ts` (ex-middleware no Next.js 16) — redireciona `/login` se já autenticado; redireciona rotas privadas (`/projects`, `/to-do`, `/companies`, `/settings`, `/dashboard`) para `/login?next=...` se sem sessão.
- [x] **Layout autenticado:** grupo `(app)` com `AppHeader` (logo, nav, usuário, tema, logout); valida a sessão server-side além do guard.
- [x] **Obter utilizador actual:** endpoint BFF `GET /api/auth/me` (decodifica o payload do JWT da sessão server-side; validade real do token continua garantida pelo backend).

### 1.3 Fluxos de auth complementares

- [x] **Registo:** página `/register` + formulário (`POST /users` com `confirmPassword`); faz login automático após criar a conta.
- [x] **Esqueci a senha:** `/forgot-password` → `POST /auth/forget-password`; link "Esqueceu a senha?" no formulário de login.
- [x] **Redefinir senha:** `/reset-password?token=...` → `check-token` na carga + `POST /api/auth/reset-password` (Route Handler dedicado que grava a nova sessão no cookie httpOnly).
- [x] **Mensagens de erro** em pt-BR: `src/lib/api-error.ts` traduz as mensagens do class-validator (senha fraca, senhas diferentes, e-mail/token inválido, etc.).
  - Nota: o backend ainda não envia o e-mail de redefinição (Fase 5 do backend); o token fica na tabela `ForgetPassword`. O fluxo feliz completo do reset só é testável obtendo o token no banco.

---

## Fase 2 — Shell da aplicação e navegação

Objetivo: estrutura visual estilo Trello, reutilizável em todas as áreas.

- [x] **Layout dashboard:** top-nav no `AppHeader` — Painel activo; Projetos e Tarefas avulsas marcados "Em breve" até as telas existirem.
- [x] **Header global:** logo, nome do utilizador, toggle tema, botão sair (`LogoutButton`).
- [x] **Estados vazios e loading:** `CardSkeleton` e `CardNotice` nos cards do dashboard (padrão a estender às próximas telas).
- [ ] **Toasts / feedback:** confirmações de acção (criar, editar, eliminar) — avaliar biblioteca leve ou componente próprio.
- [x] **Página inicial autenticada:** decisão — `/` fica como landing promocional (mostra "Abrir painel" quando logado); login/cadastro/reset redirecionam para **`/dashboard`** (resumo com projetos, tarefas avulsas e perfil).

---

## Fase 3 — Projetos e kanban

Objetivo: CRUD de projetos e quadro kanban funcional (core do produto).

### 3.1 Projetos

- [x] **Listagem:** `/projects` — grade de cards (nome, descrição, nº de participantes, data) com filtro por dono/participante feito pela API.
- [x] **Criar projeto:** modal "Novo projeto" na própria `/projects` (`POST /projects`) — modal genérico em `src/components/ui/modal.tsx` (portal no body).
- [x] **Detalhe / editar:** `/projects/[id]` — metadados, chips de participantes e edição via o mesmo modal (`PATCH /projects/:id`). Nota: `GET /projects/:id` não carrega relações nem valida acesso, então o detalhe reutiliza o cache da listagem (`GET /projects`). Link para o quadro fica como placeholder até a Fase 3.4.
- [x] **Eliminar:** `DELETE /projects/:id` (soft delete no backend) com modal de confirmação; botões Editar/Excluir só aparecem para dono/admin (`canManageProject` espelhado em `src/lib/projects-api.ts`).

### 3.2 Participantes

- [x] **Listar participantes** do projeto (`GET /projects/:id/participants`) em `ProjectParticipants` no detalhe — dono vem de `userOwner` + lista da API.
- [x] **Adicionar participante** por busca de nome/e-mail em `GET /users` + `POST /projects/:id/participants` (modal com resultados filtrados).
- [x] **Remover participante** com confirmação (`DELETE .../participants/:userId`).
- [x] **Permissões na UI:** botões Adicionar/Remover só para dono/admin (`canManage` via `canManageProject`).
- [x] **Testes (participantes):** unit/RTL em `tests/unit/components/projects/project-participants.test.tsx` (listar, permissões, add, erro API, remove); E2E smoke — dono adiciona/remove `colega@taskhive.test`; mock com `GET/POST/DELETE .../participants` e `GET /users`.

### 3.3 Colunas (project stages)

- [x] **Carregar colunas** por projeto (`GET /project-stages/project/:id`) no quadro (`ProjectKanban`) — `src/lib/stages-api.ts`.
- [x] **CRUD de colunas:** criar/renomear (modais), eliminar com confirmação, reordenar com setas via dois `PATCH` trocando `order` (API sem endpoint de reorder). Acções só para dono/admin.
- [x] **Testes (colunas):** unit/RTL em `tests/unit/components/projects/project-stages.test.tsx`; E2E smoke criar/renomear/excluir; mock com `GET/POST/PATCH/DELETE` de `project-stages`.

### 3.4 Tarefas (kanban)

- [x] **Quadro kanban:** `ProjectKanban` — colunas horizontais com cards (`GET /tasks/stage/:stageId` por coluna).
- [x] **Card de tarefa:** título, descrição resumida, data limite; dono implícito (`user` na criação — API sem assignee).
- [x] **Criar / editar tarefa:** modal (`POST /tasks` + `PATCH` para description/finishDate; edição só `PATCH`).
- [x] **Mover entre colunas:** setas no card → `PATCH /tasks/:id` com `stageId` da coluna adjacente (por `order`); permissão alinhada a `canMoveOrRemoveTask` (dono da tarefa ou admin). Drag-and-drop fica nice-to-have.
- [x] **Detalhe da tarefa:** drawer lateral (portal) com metadados; subtarefas e timetrack inline.
- [x] **Eliminar tarefa** com confirmação no drawer (`DELETE /tasks/:id`, soft delete).
- [x] **Testes (kanban):** unit/RTL (`project-kanban`, `canMoveOrRemoveTask`); E2E smoke criar → mover → excluir; mock com CRUD de `/tasks`.

### 3.5 Subtarefas

- [x] **Lista na tarefa** (`GET /subtasks/task/:taskId`) em `TaskSubtasks` no drawer.
- [x] **CRUD inline** (criar, marcar concluída, editar, eliminar); gestão só para o responsável; backend aceita `isCompleted` no `PATCH`.
- [x] **Testes (subtarefas):** unit/RTL (`task-subtasks`, `canManageSubtask`); E2E smoke no drawer; mock com CRUD de `/subtasks`.

---

## Fase 4 — Timetrack e tempo real

Objetivo: registar tempo nas tarefas com feedback em tempo real.

- [x] **UI de timetrack** no detalhe da tarefa (`TaskTimetrack`): iniciar, parar, listar e eliminar (`GET/POST/PATCH/DELETE` em `/tasks/:taskId/timetrack`).
- [x] **Timer activo:** indicador “Em curso” com duração em directo.
- [x] **Permissões na UI:** `canManageTimetrack` (dono do registo ou gestor); erros 403 da API no ecrã.
- [x] **WebSocket (Socket.IO client):** `useTaskTimetrackSocket` via `/api/runtime` (`wsUrl` = `BACKEND_API_BASE_URL`); `joinTask` + eventos `timetrack:*`.
- [x] **Actualização em tempo real** do detalhe: invalida a query de timetrack ao receber eventos.
- [x] **Testes (timetrack):** unit/RTL (`task-timetrack`, helpers, mock Socket.IO); E2E smoke iniciar → parar; mock HTTP em `mock-backend.mjs`.

---

## Fase 5 — To-do (tarefas avulsas)

Objetivo: gestão de tarefas pontuais e recorrentes fora de projetos.

- [x] **Listagem:** `/to-do` (`TodosView`) — filtros por status e tipo; backend passa a devolver `status` no GET.
- [x] **Criar / editar / concluir** (`POST/PUT`, `PATCH /to-do/end/:id`); soft delete via `PATCH /to-do/:id`.
- [x] **Recorrência:** botão “Próxima data” (`PATCH /to-do/nextDateRecurring/:id`).
- [x] **Soft delete** com confirmação.
- [x] **Testes (to-do):** unit/RTL (`todos-view`); E2E smoke criar → concluir → excluir; nav “Tarefas avulsas” activa.

---

## Fase 6 — Perfil do utilizador

Empresas, admin e permissionamento por plano passaram para a **Fase 8** (etapa SaaS). Fica aqui só o perfil, que o plano SaaS deixou no backlog de settings.

- [ ] **Perfil do utilizador:** `/settings/profile` no shell `(app)` — editar nome, email (`PATCH /users/:id`).
- [ ] **Testes (perfil):** unit/RTL da tela; E2E smoke de edição de perfil.

---

## Fase 7 — Qualidade, DX e deploy

### 7.1 Infraestrutura de testes (feito)

Convenção: testes em **`tests/`** (fora de `src/`). `tests/unit/` espelha `src/` — `*.test.ts` (Vitest/node) e `*.test.tsx` (Vitest/jsdom); helpers em `tests/helpers/` (alias `@tests/*`); E2E em `tests/e2e/`. Scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`, `npm run test:e2e`.

- [x] **Vitest + RTL:** `vitest.config.mts`, setup, projects node/jsdom, `tests/helpers/render.tsx` e `jwt.ts`.
- [x] **Playwright + mock backend:** `playwright.config.ts`, `tests/e2e/mock-backend.mjs` (auth, users, projects em memória), Chromium.

### 7.2 Cobertura actual (feito — baseline auth + projetos)

**Unitários / libs**

- [x] `api-error`, `password`, `session` (`decodeSessionUser`), `projects-api` (`canManageProject`), `backend` (`backendBase`).

**BFF e guard**

- [x] Route handlers: `login`, `logout`, `me`, `reset-password`.
- [x] Proxy genérico `/api/bff/[...path]` (Bearer, paths bloqueados, repasse).
- [x] Guard `src/proxy.ts` (guest-only e rotas protegidas).

**Componentes**

- [x] Auth: `PasswordField`, `GeneratePasswordButton`, `LoginForm`, `RegisterForm`, `ResetPasswordForm`.
- [x] UI/shell: `Modal`, `UserMenu`.
- [x] Projetos: `ProjectsView`, `ProjectFormModal`, `ProjectDetail` (permissões dono vs participante).

**E2E smoke** (`tests/e2e/smoke.spec.ts`)

- [x] Rota protegida sem sessão → `/login?next=...`.
- [x] Login → `/dashboard` + perfil no header.
- [x] Cadastro com auto-login.
- [x] CRUD de projetos (criar → editar → excluir).
- [x] Logout → estado deslogado.

### 7.3 Testes pendentes (qualidade transversal)

Regra: **cada nova tela/feature da Fase 3+ inclui testes unit/RTL na mesma entrega**; smoke E2E quando o fluxo for crítico (ver itens "Testes (...)" nas fases acima).

- [x] **Mock E2E — participantes/users:** `GET /users` e CRUD de participantes no mock.
- [x] **Mock E2E — project-stages:** listagem por projeto + CRUD de colunas no mock.
- [x] **Mock E2E — tasks:** `GET /tasks/stage/:id`, POST/PATCH/DELETE de tarefas no mock.
- [x] **Estender mock E2E:** subtasks, timetrack e to-do em `tests/e2e/mock-backend.mjs`.
- [x] **Forgot-password (unit/RTL):** formulário e estados de sucesso/erro (fluxo feliz E2E depende de e-mail no backend).
- [x] **Dashboard (unit/RTL):** `ProjectsSection` / `ToDosSection` (loading, vazio, erro, links) — incluir na entrega da Fase 8.3.
- [x] **Acessibilidade automatizada:** axe (ou similar) nos formulários e shell autenticado.
- [x] **CI:** pipeline com `lint` + `build` + `npm test` + (opcional) `npm run test:e2e`.

### 7.4 DX e deploy

- [x] **README do frontend:** substituir template create-next-app por guia Task Hive (setup, env, `api:generate`, dev com backend) — a secção de testes já está no README.
- [x] **Acessibilidade manual:** revisar formulários, foco, `aria-*`, contraste no tema escuro.
- [x] **Variáveis de ambiente documentadas** em `.env.example` (prod vs dev).

---

## Fase 8 — Etapa SaaS

Fonte: [`../PLANEJAMENTO-ETAPA-SAAS.md`](../PLANEJAMENTO-ETAPA-SAAS.md). Cada item de UI assume a API da onda correspondente no backend. Actualizar `bff-allowlist.ts` e `proxy.ts` **na mesma entrega** que consumir um path novo. Regenerar Orval (`npm run api:generate`) no fim de cada onda com API.

Onda 0 é só backend (entidades, seed `free-trial`, `PlanQuotaService`). Sem tarefas de UI.

```text
8.1 → 8.2 → 8.4 → 8.5 → 8.6 → 8.7
         ↘ 8.3 (landing v1 + coluna to-do) pode paralelo após 8.1
```

O layout completo do dashboard (duas listas de projectos) depende de **8.2**. A coluna esquerda de to-dos pode começar no fim de **8.1**.

### 8.1 Cadastro PF/CNPJ e bloqueio de to-do (Onda 1)

- [x] **Sessão hidratada:** `GET /api/auth/me` / `session.ts` passam a expor `accountKind`, `company` e `plan` (`limits` + `usage`). Admins: `plan: null`.
- [x] **Registo PF | CNPJ:** toggle em `RegisterForm`. PF: nome, e-mail, senha (CPF opcional). CNPJ: responsável, e-mail, senha, razão social, nome fantasia opcional, CNPJ com máscara e validação client.
- [x] **Query `?invite=`:** pré-preencher e-mail no cadastro quando vier de um convite.
- [x] **Conta CNPJ sem to-do:** esconder “Tarefas avulsas” no `AppHeader`; não renderizar to-dos no dashboard; `/to-do` redirecciona para `/dashboard`.
- [x] **Allowlist / guard:** prefixos necessários desta onda; `proxy.ts` cobre o redirect de `/to-do` para CNPJ (página também pode 404/redirect).
- [x] **Testes:** unit/RTL do toggle de registo e da nav sem to-do em CNPJ; E2E smoke cadastro PF e CNPJ.

### 8.2 Convites e projectos próprios vs convidados (Onda 2)

- [ ] **API de listagem:** `GET /projects?scope=owned` e `scope=invited` em paralelo (`projects-api.ts` + TanStack Query).
- [ ] **Duas secções em `/projects`:** “Meus projectos” (botão criar só aqui) e “Projectos em que fui convidado” (badge “Convidado”, sem criar).
- [ ] **Convite por e-mail:** em `ProjectParticipants`, campo e-mail + copiar link `/invite/:token`; lista de convites pending + revogar; indicador `used / limit` (`guestUsage`).
- [ ] **Manter** o atalho actual de adicionar participante por `userId` (user já registado); os dois caminhos respeitam o tecto de convidados.
- [ ] **Página pública `/invite/[token]`:** nome do projecto; sem sessão → login/cadastro com `next=`; com sessão → Aceitar.
- [ ] **Allowlist:** prefixo `invites`; matcher `/invite` no `proxy.ts` (página pública — não exigir cookie).
- [ ] **Testes:** unit/RTL das duas secções e do fluxo de convite; E2E smoke convite + accept.

### 8.3 Dashboard reorganizado e landing v1 (Onda 3)

Pode avançar em paralelo com 8.1 (landing estática e coluna de to-dos). As duas secções de projectos no dashboard dependem de 8.2.

- [ ] **Landing comercial em `/`:** substituir “Em construção”. Header (logo, âncoras Produto/Planos, Entrar / Começar grátis), hero, 3–4 blocos de produto, cards de planos com copy estática (Starter / Pro / Business — ver plano §5.2), CTA, footer placeholder. Com sessão: “Abrir painel”. Componentes em `src/components/landing/`.
- [ ] **Dashboard duas colunas (só esta página):** esquerda ~280–320px sticky com tarefas avulsas (lista compacta + “Ver todas” → `/to-do`); centro só projectos (próprios em cima, convidados em baixo). CNPJ: sem coluna esquerda, centro à largura. Mobile: to-dos em accordion acima. Alargar o `main` do dashboard (`max-w-7xl` ou full); resto da app pode manter `max-w-6xl`.
- [ ] **Testes:** unit/RTL de `ProjectsSection` / `ToDosSection` (loading, vazio, erro, links — já pendente na Fase 7.3) e do layout em colunas; E2E smoke da landing pública.

### 8.4 Planos, quotas, cupons e catálogo admin (Onda 4)

- [ ] **Helpers de quota:** `src/lib/plan-quota.ts` + mensagens 402 (`PLAN_LIMIT_PROJECTS`, `PLAN_LIMIT_API_KEYS`, `PLAN_LIMIT_TODOS`, `PLAN_LIMIT_GUESTS`) em `api-error.ts`.
- [ ] **Limites na UI:** desactivar Criar projecto / Criar to-do / Gerar token / Convidar com tooltip “Limite do plano” e link para `/settings/plan`.
- [ ] **`/settings/plan`:** plano actual, usage, tabela de upgrade **informativa** (sem checkout).
- [ ] **PAT:** mostrar `x / max` chaves em `/settings/api-tokens`.
- [ ] **Landing v2:** cards a partir de `GET /plans`; fallback para copy estática se a API falhar. Toggle PF / Empresa esconde a linha “tarefas avulsas”.
- [ ] **Admin — planos:** `/admin/plans` — lista + editor de quotas (`maxProjects`, `maxApiKeys`, `maxStandaloneTasks`, `maxProjectGuests`) e CRUD da área de benefícios (`PlanBenefit`). Não apagar plano `isSystem` (`free-trial`).
- [ ] **Admin — cupons:** `/admin/coupons` — CRUD (código, percent/fixo, datas, tecto de usos, planos aplicáveis) e redemptions.
- [ ] **Allowlist:** prefixos `plans` e `admin`.
- [ ] **Testes:** unit/RTL dos botões no limite e dos cards da landing; E2E admin planos (role admin).

### 8.5 Painel admin — utilizadores e empresas (Onda 5)

- [ ] **Shell admin:** grupo `(admin)`, `src/app/(admin)/layout.tsx` — nav lateral (desktop) + header próprios. `requireAdmin()`; `CLIENT` → `notFound()` (não revelar `/admin`). Matcher `/admin` no `proxy.ts`.
- [ ] **Link Administração** no `UserMenu` quando `ADMIN_GOD` ou `ADMIN_COLLABORATOR`.
- [ ] **`/admin`:** resumo (nº users, empresas, tickets abertos).
- [ ] **`/admin/users`:** tabela paginada, busca, filtros (`accountKind`, `planSlug`, `role`), detalhe (usage + projectos), atribuir plano (+ cupom opcional).
- [ ] **`/admin/companies`:** tabela paginada, busca, filtros, detalhe (owner, projectos, plano), atribuir plano. **Não** usar `GET /users` / `GET /companies` sem paginação; usar `/admin/users` e `/admin/companies`.
- [ ] **Settings no shell:** mover `/settings/api-tokens` (e `/settings/plan`) para o grupo autenticado com `AppHeader`, se o layout for tocado nesta onda.
- [ ] **Testes:** unit/RTL das tabelas e do guard de role; E2E `CLIENT` em `/admin` → 404.

### 8.6 Chat de suporte (Onda 6)

- [ ] **Cliente `/support`:** lista de tickets, “Nova conversa”, thread (HTTP para persistir + Socket.IO namespace `/support`, `joinTicket` / `support:message`). Entrada na nav ou no `UserMenu`.
- [ ] **Admin `/admin/support`:** fila global, assumir ticket, mesmo componente de thread.
- [ ] **Allowlist:** prefixo `support`.
- [ ] **Testes:** unit/RTL da lista/thread; E2E smoke cliente abre ticket e admin responde (mock WS no padrão do timetrack).

### 8.7 Fecho frontend (Onda 7)

- [ ] **OpenAPI + Orval** alinhados com a API SaaS; mock E2E (`mock-backend.mjs`) com plans, invites, admin, support e códigos 402.
- [ ] **Revisão:** IDOR não aplicável no cliente, mas confirmar que `CLIENT` não vê links/rotas admin; contas CNPJ sem qualquer superfície de to-do.

### Fora de âmbito desta fase (backlog)

Checkout/pagamento, números finais do trial, colaboradores internos da empresa (`CompanyMember`), conversão PF → CNPJ, impersonate, upload no suporte. Perfil continua na Fase 6.

---

## Ordem sugerida de implementação

```text
Fase 1 (auth) → Fase 2 (shell) → Fase 3 (kanban) → Fase 4 (timetrack) → Fase 5 (to-do)
  → Fase 6 (perfil) e Fase 7 (qualidade) em paralelo com a Fase 8 quando fizer sentido
  → Fase 8 (SaaS): 8.1 → 8.2 → 8.4 → 8.5 → 8.6 → 8.7
                    ↘ 8.3 após 8.1 (landing; dashboard completo após 8.2)
```

A **Fase 1** desbloqueia todo o resto. A **Fase 3** entrega o valor principal do produto (estilo Trello). A **Fase 8** é a próxima etapa de produto.

---

## Referências

| Recurso | Caminho |
|---------|---------|
| Convenções frontend | `FrontEnd/.cursor/rules/task-hive-conventions.mdc` |
| OpenAPI / hooks | `FrontEnd/openapi/openapi.json`, `FrontEnd/src/api/generated/` |
| BFF proxy | `FrontEnd/src/app/api/bff/[...path]/route.ts` |
| Testes unit/RTL | `FrontEnd/tests/unit/` |
| Smoke E2E + mock | `FrontEnd/tests/e2e/` |
| Etapa SaaS (produto + API) | [`../PLANEJAMENTO-ETAPA-SAAS.md`](../PLANEJAMENTO-ETAPA-SAAS.md) |
| Backend to-do | `backend/to-do.md` |
| Cobertura E2E backend | `backend/docs/e2e-coverage.md` |
| Swagger (dev) | `http://localhost:3001/api` |

---

## Feito (infraestrutura)

- Next.js 16 + App Router, React 19, Tailwind 4
- Tema Soft Pearl + next-themes
- Landing `/` e login `/login` (UI)
- BFF proxy com sessão httpOnly + guard `proxy.ts`
- Cliente Orval + React Query para toda a API
- Componentes base (logo, tema, layout ambiente)
- Vitest + RTL (unitários/componentes) e Playwright smoke E2E com mock backend
