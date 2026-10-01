export function normalizeSlug(value?: string | null, fallback = ""): string {
  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (normalized) return normalized;
  return String(fallback || "")
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSlugList(values: Array<string | undefined | null>) {
  const seen = new Set<string>();
  const list: string[] = [];
  values.forEach((value) => {
    const slug = normalizeSlug(value);
    if (!slug || seen.has(slug)) return;
    seen.add(slug);
    list.push(slug);
  });
  return list;
}
