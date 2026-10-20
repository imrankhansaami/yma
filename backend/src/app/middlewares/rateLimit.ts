import { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Drop expired buckets once a minute so the map cannot grow without bound.
const sweeper = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 60 * 1000);
if (typeof sweeper.unref === "function") sweeper.unref();

type RateLimitOptions = {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Maximum requests allowed per window per IP. */
  max: number;
  /** Optional message returned with 429. */
  message?: string;
};

/**
 * Small in-process fixed-window rate limiter.
 *
 * The backend runs as one PM2 process, so a per-process map is enough to stop
 * credential stuffing, contact-form spam and checkout floods. Requests are
 * keyed by client IP; `trust proxy` is enabled in app.ts so the IP comes from
 * nginx's X-Forwarded-For header.
 */
export function rateLimit({ windowMs, max, message }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip =
      req.ip || req.socket.remoteAddress || req.headers["x-forwarded-for"];

    if (!ip) return next();

    const key = `${req.method} ${req.baseUrl}${req.path} ${String(ip)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    bucket.count += 1;

    if (bucket.count > max) {
      res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        status: "fail",
        message:
          message || "Too many requests. Please wait a moment and try again.",
      });
    }

    next();
  };
}
