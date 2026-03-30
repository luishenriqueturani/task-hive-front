#!/usr/bin/env node
/**
 * Baixa o OpenAPI JSON do backend e grava em openapi/openapi.json.
 * Uso: OPENAPI_URL=http://host:8080/v3/api-docs node scripts/fetch-openapi.mjs
 */

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const url =
  process.env.OPENAPI_URL ?? "http://orangepi.local:8080/v3/api-docs";
const outFile = resolve(process.cwd(), "openapi/openapi.json");

const res = await fetch(url);
if (!res.ok) {
  console.error(`Falha HTTP ${res.status} ao obter ${url}`);
  process.exit(1);
}

const json = await res.json();
await writeFile(outFile, `${JSON.stringify(json, null, 2)}\n`, "utf8");
console.log(`OpenAPI guardado em ${outFile}`);
