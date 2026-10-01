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
