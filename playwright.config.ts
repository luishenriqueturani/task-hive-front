import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);
const MOCK_PORT = Number(process.env.MOCK_BACKEND_PORT || 4099);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Smoke E2E: sobe mock backend + Next.js (build + start) e corre cenários
 * críticos (auth + projetos). Requer `npx playwright install chromium` na
 * primeira vez.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: `node tests/e2e/mock-backend.mjs`,
      url: `http://127.0.0.1:${MOCK_PORT}/health`,
      reuseExistingServer: !process.env.CI,
      env: {
        ...process.env,
        MOCK_BACKEND_PORT: String(MOCK_PORT),
      },
    },
    {
      command: `npm run build && npx next start -p ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ...process.env,
        BACKEND_API_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
        PORT: String(PORT),
      },
    },
  ],
});
