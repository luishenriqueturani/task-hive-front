/**
 * Cliente HTTP usado pelo código gerado pelo Orval.
 * Requisições autenticadas devem ir para Route Handlers (BFF) sob `/api/bff`,
 * que encaminham cookies httpOnly ao backend — nunca persistir tokens em
 * localStorage ou expor segredos ao bundle do cliente.
 */

const BFF_PREFIX = "/api/bff";

export async function customInstance<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const method = (init?.method ?? "GET").toUpperCase();
  const headers = new Headers(init?.headers);

  if (method === "GET" || method === "HEAD") {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BFF_PREFIX}${url}`, {
    ...init,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }

  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }

  return res.text() as Promise<T>;
}
