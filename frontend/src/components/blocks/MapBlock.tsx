type MapBlockProps = {
  /** A place, a full address, or "lat,lng". */
  query?: string;
  zoom?: number;
  className?: string;
};

/**
 * Google map pinned to a place. Used by the `map` block so a map can be added
 * to any page and dragged anywhere in its sections.
 */
export function MapBlock({ query, zoom = 12, className }: MapBlockProps) {
  const place = String(query || "").trim();
  if (!place) return null;
  const level = Math.min(20, Math.max(1, Number(zoom) || 12));

  return (
    <div
      className={`my-8 overflow-hidden rounded-xl border border-brand-gray-175 shadow-sm ${
        className || ""
      }`}
    >
      <iframe
        title={`Map of ${place}`}
        src={`https://www.google.com/maps?q=${encodeURIComponent(
          place,
        )}&z=${level}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[300px] w-full border-0 sm:h-[360px]"
        allowFullScreen
      />
    </div>
  );
}
