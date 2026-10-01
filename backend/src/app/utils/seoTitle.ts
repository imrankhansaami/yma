const MAX_META_TITLE_LENGTH = 60;
const DEFAULT_SITE_NAME = "YMA Bouncy Castles";

function normalizeSpace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getBrandAliases(siteName: string) {
  const normalizedSite = normalizeSpace(siteName);
  const firstToken = normalizedSite.split(" ")[0] || normalizedSite;
  const acronym =
    normalizedSite
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .toUpperCase() || firstToken.toUpperCase();

  const aliases = new Set<string>();
  if (normalizedSite) aliases.add(normalizedSite.toLowerCase());
  if (firstToken) aliases.add(firstToken.toLowerCase());
  if (acronym) aliases.add(acronym.toLowerCase());
  return aliases;
}

function trimToLength(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const cutoff = Math.max(0, maxLength - 3);
  const compact = value.slice(0, cutoff).trim().replace(/[|:,\-\/\s]+$/, "");
  if (!compact) return value.slice(0, maxLength);
  return `${compact}...`;
}

export function sanitizeSeoMetaTitle(
  rawTitle: string,
  siteName = DEFAULT_SITE_NAME,
) {
  const input = normalizeSpace(rawTitle);
  if (!input) return "";

  const aliases = getBrandAliases(siteName);
  const brand = normalizeSpace(siteName).split(" ")[0] || "YMA";
  const brandLower = brand.toLowerCase();
  const suffix = ` | ${brand}`;

  const segments = input
    .split("|")
    .map((segment) => normalizeSpace(segment))
    .filter(Boolean)
    .filter((segment) => !aliases.has(segment.toLowerCase()));

  const uniqueSegments = segments.filter(
    (segment, index) =>
      segments.findIndex((value) => value.toLowerCase() === segment.toLowerCase()) ===
      index,
  );

  let base = normalizeSpace(uniqueSegments.join(" | "));
  if (!base) base = brand;

  let candidate =
    base.toLowerCase().endsWith(`| ${brandLower}`) ||
    base.toLowerCase() === brandLower
      ? base
      : `${base}${suffix}`;

  if (candidate.length <= MAX_META_TITLE_LENGTH) return candidate;

  const shortenedBase = trimToLength(
    base,
    Math.max(10, MAX_META_TITLE_LENGTH - suffix.length),
  );

  candidate =
    shortenedBase.toLowerCase().endsWith(`| ${brandLower}`) ||
    shortenedBase.toLowerCase() === brandLower
      ? shortenedBase
      : `${shortenedBase}${suffix}`;

  return trimToLength(candidate, MAX_META_TITLE_LENGTH);
}
