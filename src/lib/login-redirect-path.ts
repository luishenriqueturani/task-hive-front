import { safeNextPath } from "@/lib/safe-next-path";

/**
 * Path relativo para `/login` (com `?next=` opcional).
 * Route Handlers e proxy devem usar isto em vez de `new URL(..., request.url)`:
 * atrás do Nginx o `request.url` pode ter host `0.0.0.0` (bind do contentor).
 */
export function loginRedirectPath(next?: string | null): string {
  if (!next) return "/login";

  const params = new URLSearchParams({
    next: safeNextPath(next, "/dashboard"),
  });
  return `/login?${params.toString()}`;
}
