# Task Hive — Frontend

UI em **Next.js 16** (App Router), **React 19** e **Tailwind 4**. O browser fala só com o BFF (`/api/bff`, `/api/auth`); a sessão vive em cookies **httpOnly** definidos pelos Route Handlers — não há JWT no `localStorage`.

Repositório Git independente: [`task-hive-front`](https://github.com/luishenriqueturani/task-hive-front.git) (`main`). Stack completa (Postgres + API + Nginx) na [raiz do monorepo](../README.md#docker-em-casa-stack-completa).

---

## Pré-requisitos

- Node.js **22** (alinhado ao CI)
- Backend Nest a correr (local ou Docker) — ver [`backend/README.md`](../backend/README.md)
- Opcional: Docker na raiz para deploy LAN

---

## Setup (desenvolvimento local)

```bash
cd FrontEnd
cp .env.example .env
npm ci
```

Edite `.env`: no mínimo `BACKEND_API_BASE_URL=http://localhost:3001` (porta da API Nest).

### Subir com backend local

Terminal 1 — API + Postgres (na pasta `backend/`):

```bash
cd backend
cp .env.example .env   # se ainda não existir
docker compose up -d   # ou npm run start:dev com DB configurado
```

Terminal 2 — frontend:

```bash
cd FrontEnd
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Login, registo e rotas autenticadas exigem a API acessível em `BACKEND_API_BASE_URL`.

### Cliente OpenAPI (Orval)

Tipos e hooks gerados a partir do Swagger do backend:

```bash
# 1. Exportar/atualizar o spec (backend a correr)
npm run api:fetch-spec
# ou copiar manualmente para openapi/openapi.json

# 2. Regenerar src/api/generated
npm run api:generate
```

O BFF em `src/app/api/bff/[...path]/route.ts` usa allowlist (`src/lib/bff-allowlist.ts`); rotas novas da API precisam de entrada explícita antes de expor ao browser.

---

## Variáveis de ambiente

Ver [`.env.example`](.env.example) — secções **dev local** vs **produção (Docker/LAN)**. Resumo:

| Variável | Dev local | Docker / LAN |
|----------|-----------|----------------|
| `BACKEND_API_BASE_URL` | `http://localhost:3001` | `http://api:3001` (já no compose) |
| `PUBLIC_WS_URL` | opcional | host:porta do Nginx (Socket.IO) |
| `PUBLIC_APP_URL` | opcional | URL pública da UI (redirects de sessão) |
| `CSRF_ALLOWED_ORIGINS` | opcional | origens do browser (fallback de redirect) |
| `SESSION_COOKIE_SECURE` | `false` em HTTP | `false` na LAN HTTP; `true` com HTTPS |

---

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Next.js em desenvolvimento |
| `npm run build` / `npm start` | Build de produção + servidor |
| `npm run lint` | ESLint |
| `npm test` | Vitest (unit + componentes + a11y axe) |
| `npm run test:a11y` | Só testes axe (`tests/unit/a11y/`) |
| `npm run test:e2e` | Playwright smoke (mock backend + build) |
| `npm run api:generate` | Orval → `src/api/generated` |
| `npm run audit:ci` | `npm audit` (nível high) |

---

## Testes

```bash
npm test
npm run test:watch
npm run test:coverage
npm run test:a11y

# E2E — primeira vez: npx playwright install chromium
npm run test:e2e
```

- `tests/unit/` — Vitest; `*.test.ts` (node) e `*.test.tsx` (jsdom)
- `tests/unit/a11y/` — axe nos formulários auth e no `AppHeader`
- `tests/e2e/smoke.spec.ts` — mock em `tests/e2e/mock-backend.mjs`, Next na porta **3100**
- Utilizador seed do mock: `e2e@taskhive.test` / `SenhaForte123!`

CI (GitHub Actions): [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — `lint`, `build`, `npm test` e job separado `test:e2e`.

---

## Docker (produção em casa)

O [`Dockerfile`](Dockerfile) gera output `standalone`. A stack completa sobe na **raiz** com `docker compose up -d --build` — ver [README da raiz](../README.md#docker-em-casa-stack-completa).

Variáveis LAN (`PUBLIC_APP_URL`, `PUBLIC_WS_URL`, `CSRF_ALLOWED_ORIGINS`) definem-se no `.env` ligado ao compose (via `backend/.env` + `scripts/link-compose-env.sh`).

---

## Estrutura útil

| Área | Caminho |
|------|---------|
| Páginas autenticadas | `src/app/(app)/` |
| Auth + BFF | `src/app/login/`, `src/app/api/auth/`, `src/app/api/bff/` |
| Guard de rotas | `src/proxy.ts` |
| Sessão / cookies | `src/lib/session.ts` |
| Roadmap | [`to-do.md`](to-do.md) |
| Convenções | [`.cursor/rules/task-hive-conventions.mdc`](.cursor/rules/task-hive-conventions.mdc) |

---

## Acessibilidade

- Formulários auth: labels, `role="alert"` em erros, `aria-describedby` no `<form>`, foco visível (`focus-visible:ring`)
- Testes automatizados: `npm run test:a11y` (jest-axe; contraste desligado em jsdom)
- Tema escuro: paleta Soft Pearl em `src/app/globals.css` (`html.dark`)
