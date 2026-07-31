Frontend Next.js do Task Hive (BFF com cookies httpOnly, UI em pt-BR).

## Docker (produção em casa)

A stack completa (UI + API + Postgres + Nginx) vive na **raiz do monorepo** — ver [`../README.md`](../README.md#docker-em-casa-stack-completa). Este diretório tem o [`Dockerfile`](Dockerfile) (`output: 'standalone'`).

## Testes

```bash
# Unitários + componentes (Vitest + React Testing Library)
npm test
npm run test:watch
npm run test:coverage

# Smoke E2E (Playwright + mock backend em memória)
# Na primeira vez: npx playwright install chromium
npm run test:e2e
```

- Testes em `tests/` (fora de `src/`): `tests/unit/` (Vitest) e `tests/e2e/` (Playwright).
- `*.test.ts` → ambiente node (libs e BFF); `*.test.tsx` → jsdom (componentes). Helpers em `tests/helpers/`.
- E2E sobe `tests/e2e/mock-backend.mjs` e o Next na porta 3100; cenários em `tests/e2e/smoke.spec.ts`.
- Utilizador seed do mock: `e2e@taskhive.test` / `SenhaForte123!`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
