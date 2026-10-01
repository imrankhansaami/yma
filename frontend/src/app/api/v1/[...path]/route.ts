import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);

function attachUpstreamCookies(upstream: Response, responseHeaders: Headers) {
  const headers = upstream.headers as Headers & {
    getSetCookie?: () => string[];
  };
  if (typeof headers.getSetCookie === "function") {
    for (const cookie of headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }
    return;
  }
  const cookie = upstream.headers.get("set-cookie");
  if (cookie) responseHeaders.append("set-cookie", cookie);
}

function buildTargetUrl(pathname: string, search: string) {
  const backendBase = process.env.NEXT_PUBLIC_SERVER_URI;
  if (!backendBase) {
    throw new Error("NEXT_PUBLIC_SERVER_URI is not configured");
  }

  const normalizedBase = backendBase.endsWith("/")
    ? backendBase.slice(0, -1)
    : backendBase;

  return `${normalizedBase}${pathname}${search}`;
}

async function proxy(req: NextRequest, path: string[]) {
  const sourceUrl = new URL(req.url);
  const targetPath = `/api/v1/${path.join("/")}`;
  const targetUrl = buildTargetUrl(targetPath, sourceUrl.search);

  const upstreamHeaders = new Headers(req.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("connection");
  upstreamHeaders.delete("keep-alive");
  upstreamHeaders.delete("content-length");
  upstreamHeaders.delete("accept-encoding");
  upstreamHeaders.delete("expect");
  upstreamHeaders.delete("transfer-encoding");
  upstreamHeaders.delete("upgrade");
  upstreamHeaders.set("x-frontend-origin", sourceUrl.origin);

  const init: RequestInit = {
    method: req.method,
    headers: upstreamHeaders,
    redirect: "manual",
  };

  if (!METHODS_WITHOUT_BODY.has(req.method)) {
    init.body = await req.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  const hopByHop = new Set([
    "set-cookie",
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
  ]);
  upstream.headers.forEach((value, key) => {
    if (hopByHop.has(key.toLowerCase())) return;
    responseHeaders.set(key, value);
  });
  attachUpstreamCookies(upstream, responseHeaders);

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  return proxy(req, path);
}
