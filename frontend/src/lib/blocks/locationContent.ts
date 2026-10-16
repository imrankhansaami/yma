import type {
  LocationBodyContent,
  LocationHeroContent,
  LocationItem,
} from "./types";

/**
 * Converts the legacy structured location copy (title + paragraph arrays, item
 * lists) into the rich HTML the editor now works with.
 *
 * Used to seed the WYSIWYG fields for pages saved before the change, so the SEO
 * team opens a page and sees its real copy instead of an empty editor. The
 * legacy fields are left untouched, so nothing is lost if the conversion is
 * ever revisited.
 */

const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const heading = (level: number, text?: string) => {
  const value = String(text ?? "").trim();
  return value ? `<h${level}>${esc(value)}</h${level}>` : "";
};

const paragraph = (text?: string) => {
  const value = String(text ?? "").trim();
  return value ? `<p>${esc(value)}</p>` : "";
};

const itemList = (items: LocationItem[] | undefined, level = 3) =>
  (items || [])
    .map((item) => `${heading(level, item?.title)}${paragraph(item?.body)}`)
    .join("");

/** The hero block's copy as HTML: an H2 title followed by its paragraphs. */
export function heroToHtml(
  content?: Partial<LocationHeroContent> | null,
): string {
  if (!content) return "";
  return [
    heading(2, content.title),
    ...(content.paragraphs || []).map((text) => paragraph(text)),
  ].join("");
}

/** The body block's copy as HTML, one string per section. */
export function bodyToHtml(content?: Partial<LocationBodyContent> | null): {
  aboutHtml: string;
  whyHtml: string;
  servicesHtml: string;
  safetyHtml: string;
  occasionsHtml: string;
} {
  const c = content || {};
  const occasions = (c.occasionsItems || []).filter((text) =>
    String(text || "").trim(),
  );

  return {
    aboutHtml: [
      heading(2, c.aboutTitle),
      ...(c.aboutParagraphs || []).map((text) => paragraph(text)),
    ].join(""),
    whyHtml: `${heading(2, c.whyTitle)}${itemList(c.whyItems)}`,
    servicesHtml: `${heading(2, c.servicesTitle)}${itemList(c.servicesItems)}`,
    safetyHtml: `${heading(2, c.safetyTitle)}${itemList(c.safetyItems)}`,
    occasionsHtml: [
      heading(2, c.occasionsTitle),
      paragraph(c.occasionsSubtitle),
      occasions.length
        ? `<ul>${occasions.map((text) => `<li>${esc(text)}</li>`).join("")}</ul>`
        : "",
    ].join(""),
  };
}

/** True when any rich text has already been saved for this block. */
export function hasRichLocationCopy(data: Record<string, unknown> | undefined) {
  if (!data) return false;
  const values = [
    data.html,
    data.aboutHtml,
    data.whyHtml,
    data.servicesHtml,
    data.safetyHtml,
    data.occasionsHtml,
  ];
  return values.some((value) => String(value ?? "").trim().length > 0);
}
