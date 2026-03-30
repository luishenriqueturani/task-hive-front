import { defineConfig } from "orval";

/**
 * Gera hooks React Query e tipos a partir do OpenAPI.
 * Atualize `openapi/openapi.json` com o export do Swagger do backend e rode `npm run api:generate`.
 */
export default defineConfig({
  taskHive: {
    input: "./openapi/openapi.json",
    output: {
      mode: "tags-split",
      target: "./src/api/generated",
      schemas: "./src/api/model",
      client: "react-query",
      prettier: true,
      override: {
        mutator: {
          path: "./src/api/mutator.ts",
          name: "customInstance",
        },
      },
    },
  },
});
