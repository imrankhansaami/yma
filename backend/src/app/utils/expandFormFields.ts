/**
 * Expand bracketed multipart field names into nested objects.
 *
 * The admin form posts multipart/form-data (it uploads images), and multer
 * passes bracketed names through literally: `location[city]`, not nested. The
 * product schema is strict, so Mongoose silently drops those paths — a product
 * created from the form saved with no dimensions and only a partial location.
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

  for (const [key, value] of Object.entries(source)) {
    const match = key.match(/^([A-Za-z0-9_]+)\[([^\]]+)\]$/);

    if (!match || !NESTED_FIELDS.includes(match[1])) {
      output[key] = value;
      continue;
    }

    const parent = match[1];
    const child = match[2];

    const existing = output[parent];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      output[parent] = {};
    }
    output[parent][child] = value;
  }

  return output;
}
