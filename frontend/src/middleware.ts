import { NextRequest, NextResponse } from "next/server";
import { resolveRedirectTarget } from "@/lib/redirects";

type Redirect = {
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302;
};

let cachedRedirects: Redirect[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

async function getActiveRedirects(): Promise<Redirect[]> {
  const now = Date.now();
  if (cachedRedirects.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
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
      cacheTimestamp = now;
    }
  } catch {
    // On fetch failure, continue using stale cache (or empty list)
  }

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
