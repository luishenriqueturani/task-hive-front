import type { NextResponse } from "next/server";

/** Evita cache de redirects auth no browser (loop login ↔ clear-session). */
export function withAuthRedirectHeaders(response: NextResponse): NextResponse {
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
