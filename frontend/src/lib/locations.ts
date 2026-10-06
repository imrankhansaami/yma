/**
 * Where each postcode district sits, for the location pages.
 *
 * Locations are stored as postcode districts ("CM18", "RM8"), so a page needs
 * a human place to show in "Bouncy Castles Hire in ...". There is one entry per
 * active district. A district with no entry falls back to the location's
 * original name (kept as a slug alias), then to the district itself.
 */
export const POSTCODE_PLACE_NAMES: Record<string, string> = {
  // Harlow (CM)
  CM17: "Old Harlow",
  CM18: "Harlow",
  CM19: "Great Parndon",
  CM20: "Harlow Town",

  // East London (E)
  E1: "Shoreditch",
  E8: "Hackney",
  E10: "Leyton",
  E15: "Stratford",
  E17: "Walthamstow",

  // North London (EN, N)
  EN4: "Barnet",
  N13: "Palmers Green",
  N17: "Tottenham",

  // Essex & outer London (IG, RM)
  IG10: "Loughton",
  RM4: "Stapleford Abbotts",
  RM5: "Collier Row",
  RM6: "Chadwell Heath",
  RM7: "Rush Green",
  RM8: "Becontree",
  RM9: "Dagenham East",
  RM10: "Dagenham",
  RM11: "Hornchurch",
  RM12: "Elm Park",
  RM13: "Rainham",
  RM14: "Upminster",
  RM15: "South Ockendon",
  RM16: "Chafford Hundred",
  RM17: "Grays",
  RM18: "Tilbury",
  RM19: "Purfleet",
  RM20: "West Thurrock",
};

/** A UK postcode district, e.g. CM18, RM10, E1, IG10, N13. */
export const POSTCODE_DISTRICT = /^[A-Z]{1,2}\d{1,2}[A-Z]?$/i;

function toTitle(value: string) {
  if (!value) return "";
  return value
    .split(" ")
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace a location's postcode code inside saved copy with the place shown on
 * the page ("Cm18" -> "Harlow").
 *
 * The location page blocks were seeded with the district code as the name, so
 * copy saved in the CMS still carries it. A human name typewritten in the admin
 * is untouched because only the code is matched.
 */
export function substituteLocationCode<T>(
  value: T,
  codes: string[],
  name: string,
): T {
  const cleaned = Array.from(
    new Set(codes.map((c) => String(c || "").trim()).filter(Boolean)),
  );
  if (cleaned.length === 0) return value;

  const pattern = new RegExp(
    `\\b(?:${cleaned.map(escapeRegExp).join("|")})\\b`,
    "gi",
  );

  const walk = (item: unknown): unknown => {
    if (typeof item === "string") return item.replace(pattern, name);
    if (Array.isArray(item)) return item.map(walk);
    if (item && typeof item === "object") {
      return Object.fromEntries(
        Object.entries(item).map(([key, val]) => [key, walk(val)]),
      );
    }
    return item;
  };

  return walk(value) as T;
}

/**
 * The place shown for a location.
 *
 * A human name saved in the admin wins. Otherwise a postcode district is
 * resolved to its known place (CM18 -> Harlow, RM8 -> Becontree). When the
 * district is unknown, the original area name kept as a slug alias is used,
 * and only then does the code itself fall through.
 */
export function locationDisplayName(
  name: string | undefined,
  slug: string,
  aliases: string[] = [],
): string {
  const saved = String(name || "").trim();

  if (saved && !POSTCODE_DISTRICT.test(saved)) return saved;

  const code = String(saved || slug).toUpperCase();
  const mapped = POSTCODE_PLACE_NAMES[code];
  if (mapped) return mapped;

  const alias = aliases.find((a) => a && !POSTCODE_DISTRICT.test(a));
  if (alias) return toTitle(alias.replace(/-/g, " "));

  return saved || toTitle(slug.replace(/-/g, " "));
}
