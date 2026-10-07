/**
 * Renders the custom JSON-LD structured data saved in Admin → Pages (Core /
 * Category). Renders nothing when empty.
 */
export function CmsJsonLd({
  jsonLd,
  id,
}: {
  jsonLd?: string | null;
  id: string;
}) {
  if (!jsonLd || !String(jsonLd).trim()) return null;
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: String(jsonLd).replace(/</g, "\\u003c") }}
    />
  );
}
