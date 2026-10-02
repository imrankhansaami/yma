/**
 * Expand bracketed multipart field names into nested objects.
 *
 * The admin form posts multipart/form-data (it uploads images), and multer
 * passes bracketed names through literally: `location[city]`, not nested. The
 * product schema is strict, so Mongoose silently drops those paths — a product
 * created from the form saved with no dimensions and only a partial location.
 *
 * Handles both nested objects and indexed arrays:
 *   location[city]              -> location: { city }
 *   dimensions[length]          -> dimensions: { length }
 *   location[postcodes][0]      -> location: { postcodes: ["RM9"] }
 *
 * Only the fields listed here are expanded, so the indexed keys handled
 * elsewhere (`categories[0]`, `imageAltTexts[1]`) keep working.
 */

const NESTED_FIELDS = ["location", "dimensions", "ageRange", "qualityAssurance"];

export function expandBracketedFields(
  input: Record<string, any> | undefined,
): Record<string, any> {
  const source = input || {};
  const output: Record<string, any> = {};

  const ensureObject = (key: string) => {
    const current = output[key];
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      output[key] = {};
    }
  };

  for (const [key, value] of Object.entries(source)) {
    const match = key.match(
      /^([A-Za-z0-9_]+)\[([^\]]+)\](?:\[(\d+)\])?$/,
    );

    if (!match || !NESTED_FIELDS.includes(match[1])) {
      output[key] = value;
      continue;
    }

    const [, parent, child, index] = match;
    ensureObject(parent);

    if (index === undefined) {
      output[parent][child] = value;
      continue;
    }

    // Indexed child -> build an array, dropping empty entries.
    const list = Array.isArray(output[parent][child])
      ? output[parent][child]
      : [];
    list[Number(index)] = value;
    output[parent][child] = list;
  }

  // Tidy any nested arrays that ended up with holes.
  for (const parent of NESTED_FIELDS) {
    const obj = output[parent];
    if (!obj || typeof obj !== "object") continue;
    for (const [child, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        obj[child] = val.filter(
          (entry) => entry !== undefined && entry !== null && String(entry).trim() !== "",
        );
      }
    }
  }

  return output;
}
