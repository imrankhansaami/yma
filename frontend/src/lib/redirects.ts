/**
 * Server-side reader for the admin-managed redirects.
 *
 * The middleware also applies redirects, but it caches its list in memory for a
 * minute, so a redirect created a moment ago may not be known to it yet. The
 * storefront falls back to this lookup when a page is missing, which lets a
 * renamed page forward immediately instead of 404ing until that cache expires.
 *
 * Tagged "redirects" so a rename can purge it through /api/revalidate.
 */

export type ActiveRedirect = {
  fromPath: string;
  toPath: string;
  statusCode?: number;
};

export async function fetchActiveRedirects(): Promise<ActiveRedirect[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return [];

    const res = await fetch(`${baseUrl}/api/v1/redirects/active`, {
      next: { revalidate: 60, tags: ["redirects"] },
    });
    if (!res.ok) return [];

    const json = await res.json();
    const data = json?.data;
    return Array.isArray(data) ? (data as ActiveRedirect[]) : [];
  } catch {
    return [];
  }
}

/** The destination for a path, or null when nothing redirects it. */
export async function fetchRedirectTarget(
  pathname: string,
): Promise<string | null> {
  const redirects = await fetchActiveRedirects();
  const match = redirects.find((r) => r.fromPath === pathname);
  return match?.toPath ?? null;
}
