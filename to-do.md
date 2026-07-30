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
- [ ] **Telas de produto:** dashboard, kanban, to-do, timetrack, perfil — inexistentes.

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
- [ ] **Layout autenticado:** `(app)` ou `(dashboard)` com shell comum (header, nav, logout).
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

- [ ] **Layout dashboard:** sidebar ou top-nav com links — Projetos, To-do, (futuro: Empresas, Definições).
- [ ] **Header global:** logo, nome do utilizador, toggle tema, botão sair.
- [ ] **Estados vazios e loading:** skeletons/spinners consistentes com o tema Soft Pearl.
- [ ] **Toasts / feedback:** confirmações de acção (criar, editar, eliminar) — avaliar biblioteca leve ou componente próprio.
- [ ] **Página inicial autenticada:** redirecionar `/` para `/projects` (ou dashboard resumo).

---

## Fase 3 — Projetos e kanban

Objetivo: CRUD de projetos e quadro kanban funcional (core do produto).

### 3.1 Projetos

- [ ] **Listagem:** `/projects` — cards ou tabela com nome, descrição, data; filtrar por dono/participante (API já filtra).
- [ ] **Criar projeto:** modal ou página `/projects/new` (`POST /projects`).
- [ ] **Detalhe / editar:** `/projects/[id]` — metadados, participantes, link para o quadro.
- [ ] **Eliminar:** soft delete com confirmação (`PATCH /projects/:id` ou `DELETE` conforme API).

### 3.2 Participantes

- [ ] **Listar participantes** do projeto (`GET /projects/:id/participants`).
- [ ] **Adicionar participante** por ID ou busca de utilizador (`POST /projects/:id/participants`).
- [ ] **Remover participante** com confirmação (`DELETE .../participants/:userId`).
- [ ] **Permissões na UI:** ocultar acções de gestão para quem não é dono/admin (alinhado com `canManageProject` do backend).

### 3.3 Colunas (project stages)

- [ ] **Carregar colunas** por projeto (`GET /project-stages/project/:id`).
- [ ] **CRUD de colunas** (criar, renomear, reordenar se API permitir, eliminar) — respeitar `canManageProject`.

### 3.4 Tarefas (kanban)

- [ ] **Quadro kanban:** colunas horizontais com cards de tarefa (`GET /tasks/stage/:stageId`).
- [ ] **Card de tarefa:** título, descrição resumida, responsável, datas.
- [ ] **Criar / editar tarefa:** modal ou painel lateral (`POST/PATCH /tasks`).
- [ ] **Mover entre colunas:** botões ou drag-and-drop — `PATCH /tasks/nextStage/:id` e `previousStage/:id` (drag-and-drop é nice-to-have; botões primeiro).
- [ ] **Detalhe da tarefa:** `/projects/[id]/tasks/[taskId]` ou drawer — subtarefas, timetrack, metadados.
- [ ] **Eliminar tarefa** com confirmação.

### 3.5 Subtarefas

- [ ] **Lista na tarefa** (`GET /subtasks/task/:taskId`).
- [ ] **CRUD inline** (criar, marcar concluída, editar, eliminar).

---

## Fase 4 — Timetrack e tempo real

Objetivo: registar tempo nas tarefas com feedback em tempo real.

- [ ] **UI de timetrack** no detalhe da tarefa: iniciar, parar, listar registos (`GET/POST/PATCH/DELETE` em `/tasks/:taskId/timetrack`).
- [ ] **Timer activo:** indicador visual quando há registo em curso.
- [ ] **Permissões na UI:** alinhar com regras backend (403 para quem não tem acesso).
- [ ] **WebSocket (Socket.IO client):** ligar ao gateway do backend; eventos `joinTask`, `timetrack:started|stopped|updated|deleted`.
- [ ] **Actualização em tempo real** do quadro/detalhe quando outro utilizador altera timetrack na mesma tarefa.

---

## Fase 5 — To-do (tarefas avulsas)

Objetivo: gestão de tarefas pontuais e recorrentes fora de projetos.

- [ ] **Listagem:** `/to-do` — filtros por status, tipo (pontual/recorrente).
- [ ] **Criar / editar / concluir** (`POST/PUT/PATCH /to-do`, `PATCH /to-do/end/:id`, `PATCH /to-do/status/:id`).
- [ ] **Recorrência:** acção `nextDateRecurring` na UI quando aplicável.
- [ ] **Soft delete** com confirmação.

---

## Fase 6 — Empresas e utilizadores (conforme prioridade)

O backend tem CRUD básico; permissionamento avançado de empresa está na Fase 5 do backend (futuro).

- [ ] **Empresas:** listagem e CRUD (`/companies`) — apenas para roles adequados.
- [ ] **Perfil do utilizador:** `/settings/profile` — editar nome, email (`PATCH /users/:id`).
- [ ] **Admin (ADMIN_GOD / ADMIN_COLLABORATOR):** gestão de utilizadores se necessário (`GET/POST/PATCH /users`).

---

## Fase 7 — Qualidade, DX e deploy

- [ ] **README do frontend:** substituir template create-next-app por guia Task Hive (setup, env, api:generate, dev com backend).
- [ ] **Testes:** smoke E2E (Playwright ou similar) — login, listar projetos, criar tarefa.
- [ ] **Acessibilidade:** revisar formulários, foco, `aria-*`, contraste no tema escuro.
- [ ] **Responsivo:** kanban utilizável em tablet/mobile (scroll horizontal, modais).
- [ ] **Variáveis de ambiente documentadas** em `.env.example` (prod vs dev).
- [ ] **CI:** lint + build + (opcional) testes E2E.

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
| Backend to-do | `backend/to-do.md` |
| Cobertura E2E backend | `backend/docs/e2e-coverage.md` |
| Swagger (dev) | `http://localhost:3001/api` |

---

## Feito (infraestrutura)

- Next.js 16 + App Router, React 19, Tailwind 4
- Tema Soft Pearl + next-themes
- Landing `/` e login `/login` (UI)
- BFF proxy (sem auth upstream ainda)
- Cliente Orval + React Query para toda a API
- Componentes base (logo, tema, layout ambiente)
