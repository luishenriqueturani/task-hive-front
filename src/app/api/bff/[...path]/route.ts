import { NextRequest, NextResponse } from "next/server";
import {
  canUseStandaloneTodos,
  isStandaloneTodosBffPath,
} from "@/lib/account-kind";
import { isBffPathAllowed, BFF_BLOCKED_PATHS } from "@/lib/bff-allowlist";
import { backendBase } from "@/lib/backend";
import { decodeSessionUser, getSessionToken } from "@/lib/session";

export const dynamic = "force-dynamic";

const PATH_SAFE = /^[a-zA-Z0-9/_-]+$/;

/**
 * Login, logout e reset de senha têm Route Handlers dedicados (/api/auth/*)
 * que gerem o cookie httpOnly; pelo proxy genérico a sessão nunca seria
 * estabelecida e o token vazaria ao navegador.
 */
const BLOCKED_PATHS = BFF_BLOCKED_PATHS;

async function proxy(request: NextRequest, segments: string[]) {
  const joined = segments.join("/");
  if (!joined || !PATH_SAFE.test(joined) || joined.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  if (BLOCKED_PATHS.has(joined)) {
    return NextResponse.json(
      { error: `Use /api/${joined} em vez do proxy genérico.` },
      { status: 404 },
    );
  }

  if (!isBffPathAllowed(joined)) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  const clientAuth = request.headers.get("authorization");
  let sessionToken: string | null = null;
  if (clientAuth?.startsWith("Bearer th_pat_")) {
    sessionToken = null;
  } else {
    sessionToken = await getSessionToken();
  }

  if (isStandaloneTodosBffPath(joined) && sessionToken) {
    const session = decodeSessionUser(sessionToken);
    if (session && !canUseStandaloneTodos(session.accountKind)) {
      return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
    }
  }

  const base = backendBase();
  if (!base) {
    return NextResponse.json(
      { error: "BACKEND_API_BASE_URL is not configured" },
      { status: 503 },
    );
  }

  const src = new URL(request.url);
  const targetUrl = `${base}/${joined}${src.search}`;

  const forward: Record<string, string> = {};
  if (clientAuth?.startsWith("Bearer th_pat_")) {
    forward.authorization = clientAuth;
  } else if (sessionToken) {
    forward.authorization = `Bearer ${sessionToken}`;
  }
  const accept = request.headers.get("accept");
  if (accept) forward.accept = accept;
  const origin = request.headers.get("origin");
  if (origin) forward.origin = origin;
  const referer = request.headers.get("referer");
  if (referer) forward.referer = referer;

  const method = request.method.toUpperCase();
  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const ct = request.headers.get("content-type");
    if (ct) forward["content-type"] = ct;
    const buf = await request.arrayBuffer();
    body = buf.byteLength ? buf : undefined;
  }

  const upstream = await fetch(targetUrl, {
    method,
    headers: forward,
    body,
    cache: "no-store",
  });

  const out = new Headers();
  const ctOut = upstream.headers.get("content-type");
  if (ctOut) out.set("content-type", ctOut);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: out,
  });
}

type RouteCtx = { params: Promise<{ path?: string[] }> };

async function handle(request: NextRequest, ctx: RouteCtx) {
  const { path = [] } = await ctx.params;
  return proxy(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const HEAD = handle;
