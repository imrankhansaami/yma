/**
 * Where each postcode district sits, for the location pages.
 *
 * Locations are stored as postcode districts ("CM18", "RM8"), so a page needs
 * a human place to show in "Bouncy Castles Hire in ...". There is one entry per
 * active district. A district with no entry falls back to the location's
 * original name (kept as a slug alias), then to the district itself.
 */
export const POSTCODE_PLACE_NAMES: Record<string, string> = {
  // Harlow & west Essex (CM)
  CM5: "Ongar",
  CM14: "Brentwood",
  CM15: "Shenfield",
  CM16: "Epping",
  CM17: "Old Harlow",
  CM18: "Harlow",
  CM19: "Great Parndon",
  CM20: "Harlow Town",
  CM21: "Sawbridgeworth",
  CM23: "Bishop's Stortford",

  // East London (E)
  E1: "Shoreditch",
  E1W: "Wapping",
  E2: "Bethnal Green",
  E3: "Bow",
  E4: "Chingford",
  E5: "Clapton",
  E6: "East Ham",
  E7: "Forest Gate",
  E8: "Hackney",
  E9: "Homerton",
  E10: "Leyton",
  E11: "Wanstead",
  E12: "Manor Park",
  E13: "Plaistow",
  E14: "Isle of Dogs",
  E15: "Stratford",
  E16: "Canning Town",
  E17: "Walthamstow",
  E18: "South Woodford",
  E20: "Olympic Park",

  // Enfield & the Lea Valley (EN)
  EN1: "Enfield",
  EN2: "Bush Hill Park",
  EN3: "Ponders End",
  EN4: "Barnet",
  EN5: "New Barnet",
  EN6: "Potters Bar",
  EN7: "Cheshunt",
  EN8: "Waltham Cross",
  EN9: "Waltham Abbey",
  EN10: "Broxbourne",
  EN11: "Hoddesdon",

  // Ilford, Chigwell & Barking (IG)
  IG1: "Ilford",
  IG2: "Newbury Park",
  IG3: "Seven Kings",
  IG4: "Redbridge",
  IG5: "Clayhall",
  IG6: "Hainault",
  IG7: "Chigwell",
  IG8: "Woodford Green",
  IG9: "Buckhurst Hill",
  IG10: "Loughton",
  IG11: "Barking",

  // North London (N)
  N1: "Islington",
  N3: "Finchley",
  N4: "Finsbury Park",
  N5: "Highbury",
  N6: "Highgate",
  N8: "Hornsey",
  N9: "Lower Edmonton",
  N10: "Muswell Hill",
  N11: "Friern Barnet",
  N12: "North Finchley",
  N13: "Palmers Green",
  N14: "Southgate",
  N15: "South Tottenham",
  N16: "Stamford Hill",
  N17: "Tottenham",
  N18: "Edmonton",
  N20: "Whetstone",
  N21: "Winchmore Hill",
  N22: "Wood Green",

  // Havering & Thurrock (RM)
  RM1: "Romford",
  RM2: "Gidea Park",
  RM3: "Harold Hill",
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

/**
 * True when a location record is a postcode district.
 *
 * The customer-facing Location pickers are delivery filters: the value they
 * send is matched against the districts products are tagged with. Area pages
 * (Canary Wharf, Excel Centre, Golders Green) carry no district, so choosing
 * one can never match a product - they are kept out of those lists.
 */
export function isDistrictLocation(
  location: { name?: string } | string | null | undefined,
): boolean {
  const name = typeof location === "string" ? location : location?.name;
  return POSTCODE_DISTRICT.test(String(name || "").trim());
}

/** The subset of a location list that a delivery filter can use. */
export function districtLocations<T>(locations: T[] | null | undefined): T[] {
  return (Array.isArray(locations) ? locations : []).filter((loc) =>
    isDistrictLocation(loc as { name?: string }),
  );
}

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

  const codePattern = cleaned.map(escapeRegExp).join("|");
  const pattern = new RegExp(`\\b(?:${codePattern})\\b`, "gi");
  const place = String(name || "").trim();
  // When a title already names the place and then repeats the district code
  // ("Stepney Green E1", "Tottenham N17"), replacing the code with the place
  // again produces "Stepney Green Stepney Green". Drop the redundant code
  // first, then substitute any remaining standalone codes.
  const duplicatePattern = place
    ? new RegExp(`(${escapeRegExp(place)})\\s+\\b(?:${codePattern})\\b`, "gi")
    : null;

  const walk = (item: unknown): unknown => {
    if (typeof item === "string") {
      const withoutDuplicate = duplicatePattern
        ? item.replace(duplicatePattern, "$1")
        : item;
      return withoutDuplicate.replace(pattern, () => place || "");
    }
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
  place?: string,
): string {
  // A place name typed in the admin wins over everything else.
  const savedPlace = String(place || "").trim();
  if (savedPlace) return savedPlace;

  const saved = String(name || "").trim();

  if (saved && !POSTCODE_DISTRICT.test(saved)) return saved;

  const code = String(saved || slug).toUpperCase();
  const mapped = POSTCODE_PLACE_NAMES[code];
  if (mapped) return mapped;

  const alias = aliases.find((a) => a && !POSTCODE_DISTRICT.test(a));
  if (alias) return toTitle(alias.replace(/-/g, " "));

  return saved || toTitle(slug.replace(/-/g, " "));
}
