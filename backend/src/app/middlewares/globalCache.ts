import { Request, Response, NextFunction } from "express";

type CacheEntry = {
  data: any;
  expiry: number;
};

const cache = new Map<string, CacheEntry>();
const TTL = 60 * 1000; // 60s

// Prefixes that must never be served from cache: they are per-user or
// credential-bearing, so a shared entry would leak one user's data to another.
const NEVER_CACHE = [
  "/api/v1/auth",
  "/api/v1/cart",
  "/api/v1/orders",
  "/api/v1/bookings",
  "/api/v1/admin",
  "/api/v1/invoices",
  "/api/v1/customers",
  "/api/v1/checkout",
  "/api/v1/inventory",
  "/healthz",
];

const shouldNeverCache = (pathname: string) =>
  NEVER_CACHE.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * Minimal in-process response cache for public, anonymous GET requests.
 *
 * Safety rules (all enforced, because this middleware runs *before* the
 * routers and therefore before authentication):
 *  1. Only anonymous requests are cached or served from cache. If a request
 *     carries an Authorization header or a session cookie, we neither read
 *     nor write the cache — otherwise an authenticated response could be
 *     replayed to an anonymous caller.
 *  2. Only 200 responses are stored, so errors and 401s never poison the cache.
 *  3. Authenticated/privileged route prefixes are excluded outright.
 */
export const globalCache = (req: Request, res: Response, next: NextFunction) => {
  // ── Invalidations always run, regardless of caching eligibility ──
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    res.on("finish", () => {
      // Flush the whole cache on any write.
      //
      // Writes are rare (admin/checkout actions) and the TTL is only 60s, so a
      // full flush is cheap and — unlike prefix matching — can never leave a
      // stale entry behind. Note we must NOT derive the path from `req.path`
      // here: Express routers strip their mount prefix from `req.url` while
      // routing, so by the time `finish` fires `req.path` is only `/<id>`.
      cache.clear();
    });
  }


  if (req.method !== "GET") return next();

  const hasCredentials =
    !!req.headers.authorization || !!req.headers.cookie;

  if (hasCredentials || shouldNeverCache(req.path)) return next();

  const key = `${req.method} ${req.originalUrl}`;
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    res.setHeader("X-Cache", "HIT");
    return res.json(cached.data);
  }

  const originalJson = res.json.bind(res);
  res.json = (body: any) => {
    if (res.statusCode === 200) {
      cache.set(key, { data: body, expiry: Date.now() + TTL });
    }
    res.setHeader("X-Cache", "MISS");
    return originalJson(body);
  };

  next();
};

/** Drop all cached responses (used by scripts and tests). */
export const clearCache = () => cache.clear();
