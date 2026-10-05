import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

import type { SeoContentContent, SeoListItem } from "@/lib/blocks/types";

function BulletRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-orange-500" />
      <p className="text-[18px] leading-relaxed text-brand-gray-650">
        <strong className="text-brand-gray-700">{title}:</strong> {body}
      </p>
    </li>
  );
}

function ItemList({ items }: { items: SeoListItem[] }) {
  return (
    <ul className="mt-6 space-y-5">
      {items.map((item, i) => (
        <BulletRow
          key={`${item.title}-${i}`}
          title={item.title}
          body={item.body}
        />
      ))}
    </ul>
  );
}

/**
 * The long-form SEO copy shown under a category's product grid: an intro
 * heading and paragraph, a "why choose us" list, a "what we offer" list and
 * a row of cross links to the other categories.
 */
export function SeoContentBlock({ content }: { content: SeoContentContent }) {
  if (!content) return null;
  const reasons = content.reasons || [];
  const offerings = content.offerings || [];
  const crossLinks = (content.crossLinks || []).filter(
    (link) => link?.label?.trim() && link?.href?.trim(),
  );

  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            {content.heading}
          </h2>
          {content.intro?.trim() ? (
            <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
              {content.intro}
            </p>
          ) : null}
        </div>

        {content.reasonsHeading?.trim() || reasons.length ? (
          <div className="pt-12 sm:pt-14">
            {content.reasonsHeading?.trim() ? (
              <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
                {content.reasonsHeading}
              </h2>
            ) : null}
            <ItemList items={reasons} />
          </div>
        ) : null}

        {content.offeringsHeading?.trim() || offerings.length ? (
          <div className="pt-12 sm:pt-14">
            {content.offeringsHeading?.trim() ? (
              <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
                {content.offeringsHeading}
              </h2>
            ) : null}
            <ItemList items={offerings} />

            {crossLinks.length ? (
              <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
                {crossLinks.map((link, i) => (
                  <span key={`${link.href}-${i}`}>
                    {i > 0 ? " | " : null}
                    <Link href={link.href}>{link.label}</Link>
                  </span>
                ))}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default SeoContentBlock;
