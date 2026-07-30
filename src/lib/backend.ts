/** URL base do backend (apenas servidor), sem barra final. */
export function backendBase(): string | null {
  const raw = process.env.BACKEND_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}
