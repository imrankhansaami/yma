import type { Metadata } from "next";

function cleanSegment(segment: string) {
  return segment.trim().replace(/^\/+|\/+$/g, "");
}

export function normalizeCanonicalPath(path: string) {
  const value = String(path || "").trim();
  if (!value) return "/";

  const [rawPath] = value.split(/[?#]/, 1);
  const normalized = rawPath
    .split("/")
    .map(cleanSegment)
    .filter(Boolean)
    .join("/")
    .toLowerCase();

  return normalized ? `/${normalized}` : "/";
}

export function normalizeCanonicalSlug(value?: string | null) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function joinCanonicalPath(parts: Array<string | undefined | null>) {
  const joined = parts
    .map((part) => cleanSegment(String(part || "")))
    .filter(Boolean)
    .join("/");
  return normalizeCanonicalPath(`/${joined}`);
}

/**
 * Resolve a canonical value saved in the admin.
 *
 * Accepts either a site-relative path ("/terms", "/blog/my-post") or a full
 * http(s) URL, so the field can point at another domain when a page is
 * duplicated elsewhere. Anything else - empty, a bare word, a javascript: or
 * mailto: value - falls back to the page's own path rather than emitting a
 * canonical that points nowhere. A trailing slash is not stripped: "/terms"
 * and "/terms/" are different URLs to a crawler, and the admin may mean either.
 */
export function resolveCanonical(
  value: string | null | undefined,
  fallback: string,
): string {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("/")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.toString();
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function publicCanonical(path: string): Pick<Metadata, "alternates"> {
  return {
    alternates: {
      canonical: normalizeCanonicalPath(path),
    },
  };
}

export function privateCanonical(
  path: string,
): Pick<Metadata, "alternates" | "robots"> {
  return {
    alternates: {
      canonical: normalizeCanonicalPath(path),
    },
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
        "max-snippet": 0,
        "max-image-preview": "none",
        "max-video-preview": 0,
      },
    },
  };
}

export function noIndexCanonical(
  path: string,
): Pick<Metadata, "alternates" | "robots"> {
  return {
    alternates: {
      canonical: normalizeCanonicalPath(path),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
