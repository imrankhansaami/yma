import { CheckCircle2 } from "lucide-react";

import type {
  LocationBodyContent,
  LocationHeroContent,
  LocationItem,
} from "@/lib/blocks/types";

function ItemList({
  items,
  className,
}: {
  items: LocationItem[];
  className?: string;
}) {
  return (
    <div className={className || "space-y-3"}>
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`}>
          <p className="font-semibold text-brand-ink-900">{item.title}</p>
          <p>{item.body}</p>
        </div>
      ))}
    </div>
  );
}

/** Location detail hero: heading plus intro paragraphs, shown beside the map. */
export function LocationHeroBlock({
  content,
}: {
  content?: LocationHeroContent;
}) {
  const title = content?.title?.trim();
  const paragraphs = (content?.paragraphs || []).filter((p) => p?.trim());
  if (!title && paragraphs.length === 0) return null;

  return (
    <>
      {title ? (
        <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
          {title}
        </h2>
      ) : null}
      {paragraphs.length ? (
        <div className="space-y-4 text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed">
          {paragraphs.map((text, i) => (
            <p key={i}>{text}</p>
          ))}
        </div>
      ) : null}
    </>
  );
}

/**
 * The long-form copy under a location page's product grid: about, why choose
 * us, services, safety, and the list of occasions we cater for.
 */
export function LocationBodyBlock({
  content,
}: {
  content?: LocationBodyContent;
}) {
  if (!content) return null;
  const about = (content.aboutParagraphs || []).filter((p) => p?.trim());
  const whyItems = (content.whyItems || []).filter(
    (i) => i?.title?.trim() || i?.body?.trim(),
  );
  const servicesItems = (content.servicesItems || []).filter(
    (i) => i?.title?.trim() || i?.body?.trim(),
  );
  const safetyItems = (content.safetyItems || []).filter(
    (i) => i?.title?.trim() || i?.body?.trim(),
  );
  const occasions = (content.occasionsItems || []).filter((t) => t?.trim());

  return (
    <div className="mt-8 sm:mt-10 flex flex-col gap-10 text-brand-ink-900">
      {content.aboutTitle?.trim() || about.length ? (
        <div className="space-y-3">
          {content.aboutTitle?.trim() ? (
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
              {content.aboutTitle}
            </h2>
          ) : null}
          {about.map((text, i) => (
            <p
              key={i}
              className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed"
            >
              {text}
            </p>
          ))}
        </div>
      ) : null}

      {content.whyTitle?.trim() || whyItems.length ? (
        <div className="space-y-3">
          {content.whyTitle?.trim() ? (
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
              {content.whyTitle}
            </h2>
          ) : null}
          <ItemList
            items={whyItems}
            className="space-y-3 text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed"
          />
        </div>
      ) : null}

      {content.servicesTitle?.trim() || servicesItems.length ? (
        <div className="space-y-3">
          {content.servicesTitle?.trim() ? (
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
              {content.servicesTitle}
            </h2>
          ) : null}
          <ItemList
            items={servicesItems}
            className="space-y-3 text-brand-gray-700"
          />
        </div>
      ) : null}

      {content.safetyTitle?.trim() || safetyItems.length ? (
        <div className="space-y-3">
          {content.safetyTitle?.trim() ? (
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
              {content.safetyTitle}
            </h2>
          ) : null}
          <ItemList
            items={safetyItems}
            className="space-y-3 text-brand-gray-700"
          />
        </div>
      ) : null}

      {content.occasionsTitle?.trim() || occasions.length ? (
        <div className="pt-8 space-y-4">
          {content.occasionsTitle?.trim() ? (
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight">
              {content.occasionsTitle}
            </h2>
          ) : null}
          {content.occasionsSubtitle?.trim() ? (
            <p className="text-lg font-semibold text-brand-ink-900 mt-2">
              {content.occasionsSubtitle}
            </p>
          ) : null}
          {occasions.length ? (
            <div className="mt-4 space-y-3">
              {occasions.map((text, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 text-brand-gray-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-orange-500" />
                  <span className="text-sm sm:text-base">{text}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}