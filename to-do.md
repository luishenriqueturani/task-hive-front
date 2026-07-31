# Task Hive — To-Do (frontend)

Roadmap do frontend Next.js. O **backend MVP está concluído** — ver [`../backend/to-do.md`](../backend/to-do.md) e [`../backend/README.md`](../backend/README.md) para o estado da API.

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
- [ ] **Telas de produto restantes:** kanban, to-do, timetrack, perfil — ainda por construir (`/dashboard` e CRUD de projetos já existem).

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
- [x] **Detalhe da tarefa:** drawer lateral (portal) com metadados; subtarefas inline; placeholder para timetrack.
- [x] **Eliminar tarefa** com confirmação no drawer (`DELETE /tasks/:id`, soft delete).
- [x] **Testes (kanban):** unit/RTL (`project-kanban`, `canMoveOrRemoveTask`); E2E smoke criar → mover → excluir; mock com CRUD de `/tasks`.

### 3.5 Subtarefas

- [x] **Lista na tarefa** (`GET /subtasks/task/:taskId`) em `TaskSubtasks` no drawer.
- [x] **CRUD inline** (criar, marcar concluída, editar, eliminar); gestão só para o responsável; backend aceita `isCompleted` no `PATCH`.
- [x] **Testes (subtarefas):** unit/RTL (`task-subtasks`, `canManageSubtask`); E2E smoke no drawer; mock com CRUD de `/subtasks`.

---

## Fase 4 — Timetrack e tempo real

Objetivo: registar tempo nas tarefas com feedback em tempo real.

- [ ] **UI de timetrack** no detalhe da tarefa: iniciar, parar, listar registos (`GET/POST/PATCH/DELETE` em `/tasks/:taskId/timetrack`).
- [ ] **Timer activo:** indicador visual quando há registo em curso.
- [ ] **Permissões na UI:** alinhar com regras backend (403 para quem não tem acesso).
- [ ] **WebSocket (Socket.IO client):** ligar ao gateway do backend; eventos `joinTask`, `timetrack:started|stopped|updated|deleted`.
- [ ] **Actualização em tempo real** do quadro/detalhe quando outro utilizador altera timetrack na mesma tarefa.
- [ ] **Testes (timetrack):** unit/RTL — start/stop/list e estados de erro 403; mock do Socket.IO nos unitários; E2E smoke opcional (iniciar → parar → ver registo).

---

## Fase 5 — To-do (tarefas avulsas)

Objetivo: gestão de tarefas pontuais e recorrentes fora de projetos.

- [ ] **Listagem:** `/to-do` — filtros por status, tipo (pontual/recorrente).
- [ ] **Criar / editar / concluir** (`POST/PUT/PATCH /to-do`, `PATCH /to-do/end/:id`, `PATCH /to-do/status/:id`).
- [ ] **Recorrência:** acção `nextDateRecurring` na UI quando aplicável.
- [ ] **Soft delete** com confirmação.
- [ ] **Testes (to-do):** unit/RTL — listagem, filtros, CRUD, conclusão e recorrência; E2E smoke — criar → concluir → eliminar; ativar nav "Tarefas avulsas".

---

## Fase 6 — Empresas e utilizadores (conforme prioridade)

O backend tem CRUD básico; permissionamento avançado de empresa está na Fase 5 do backend (futuro).

- [ ] **Empresas:** listagem e CRUD (`/companies`) — apenas para roles adequados.
- [ ] **Perfil do utilizador:** `/settings/profile` — editar nome, email (`PATCH /users/:id`).
- [ ] **Admin (ADMIN_GOD / ADMIN_COLLABORATOR):** gestão de utilizadores se necessário (`GET/POST/PATCH /users`).
- [ ] **Testes (empresas/perfil):** unit/RTL das telas e permissões por role; E2E smoke de edição de perfil.

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
- [ ] **Estender mock E2E:** subtasks, to-do e timetrack em `tests/e2e/mock-backend.mjs` conforme as fases forem implementadas.
- [ ] **Forgot-password (unit/RTL):** formulário e estados de sucesso/erro (fluxo feliz E2E depende de e-mail no backend).
- [ ] **Dashboard (unit/RTL):** `ProjectsSection` / `ToDosSection` (loading, vazio, erro, links).
- [ ] **Acessibilidade automatizada:** axe (ou similar) nos formulários e shell autenticado.
- [ ] **CI:** pipeline com `lint` + `build` + `npm test` + (opcional) `npm run test:e2e`.

### 7.4 DX e deploy

- [ ] **README do frontend:** substituir template create-next-app por guia Task Hive (setup, env, `api:generate`, dev com backend) — a secção de testes já está no README.
- [ ] **Acessibilidade manual:** revisar formulários, foco, `aria-*`, contraste no tema escuro.
- [ ] **Responsivo:** kanban utilizável em tablet/mobile (scroll horizontal, modais).
- [ ] **Variáveis de ambiente documentadas** em `.env.example` (prod vs dev).

---

## Ordem sugerida de implementação

```text
Fase 1 (auth) → Fase 2 (shell) → Fase 3 (kanban) → Fase 4 (timetrack) → Fase 5 (to-do) → Fase 6 → Fase 7
```

A **Fase 1** desbloqueia todo o resto. A **Fase 3** entrega o valor principal do produto (estilo Trello).

---

## Referências

| Recurso | Caminho |
|---------|---------|
| Convenções frontend | `FrontEnd/.cursor/rules/task-hive-conventions.mdc` |
| OpenAPI / hooks | `FrontEnd/openapi/openapi.json`, `FrontEnd/src/api/generated/` |
| BFF proxy | `FrontEnd/src/app/api/bff/[...path]/route.ts` |
| Testes unit/RTL | `FrontEnd/tests/unit/` |
| Smoke E2E + mock | `FrontEnd/tests/e2e/` |
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
