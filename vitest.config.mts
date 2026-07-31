import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
      "@tests": path.resolve(rootDir, "./tests"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    clearMocks: true,
    restoreMocks: true,
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/api/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
      ],
    },
    // Vitest 4: environments via projects (não environmentMatchGlobs).
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "jsdom",
          environment: "jsdom",
          include: ["tests/unit/**/*.test.tsx"],
        },
      },
    ],
  },
});
