import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const PATH_SAFE = /^[a-zA-Z0-9/_-]+$/;

function backendBase(): string | null {
  const raw = process.env.BACKEND_API_BASE_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

async function proxy(request: NextRequest, segments: string[]) {
  const joined = segments.join("/");
  if (!joined || !PATH_SAFE.test(joined) || joined.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
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
  const cookie = request.headers.get("cookie");
  if (cookie) forward.cookie = cookie;
  const accept = request.headers.get("accept");
  if (accept) forward.accept = accept;

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
