import { NextRequest, NextResponse } from "next/server";
import { resolveRedirectTarget } from "@/lib/redirects";

type Redirect = {
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
};

let cachedRedirects: Redirect[] = [];
let cacheTimestamp = 0;
// Short on purpose. The cache cannot be purged from outside the process, so a
// redirect written by a page move (or a hand-edited one) is only visible here
// after it expires. Keep it short so a move takes effect promptly and a
// just-deleted redirect stops firing quickly.
const CACHE_TTL_MS = 5_000;

async function getActiveRedirects(): Promise<Redirect[]> {
  const now = Date.now();
  // Cache the empty list too: otherwise every request refetches until the first
  // redirect exists, which is the common case.
  if (now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedRedirects;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return cachedRedirects;

    const res = await fetch(`${baseUrl}/api/v1/redirects/active`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) return cachedRedirects;

    const json = (await res.json()) as {
      success?: boolean;
      status?: string;
      data?: Redirect[] | { redirects?: Redirect[] };
    };

    // The API answers { success: true, count, data: { redirects: [...] } }.
    // Accept a bare array too, in case the shape is ever flattened.
    const payload = json?.data;
    const list = Array.isArray(payload) ? payload : payload?.redirects;
    const ok = json?.success === true || json?.status === "success";

    if (ok && Array.isArray(list)) {
      cachedRedirects = list;
    }
  } catch {
    // On fetch failure, continue using the stale cache.
  }

  // Record the attempt either way, so a failing backend is not hit on every
  // single request.
  cacheTimestamp = now;

  return cachedRedirects;
}

export async function middleware(request: NextRequest) {
  const redirects = await getActiveRedirects();
  const { pathname } = request.nextUrl;

  const match = redirects.find((r) => r.fromPath === pathname);
  if (match) {
    // Absolute target: the proxied request origin is the internal address, so a
    // relative redirect would point at localhost.
    return NextResponse.redirect(
      resolveRedirectTarget(match.toPath),
      match.statusCode ?? 301,
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - api routes
     * - static assets (images, fonts, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)$).*)",
  ],
};
