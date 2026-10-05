import { ChevronDown } from "lucide-react";
import { RichText } from "@/components/common/RichText";
import type {
  BulletListContent,
  FaqContent,
  PageHeaderContent,
} from "@/lib/blocks/types";

/** Simple page title / intro header. */
export function PageHeader({ content }: { content?: PageHeaderContent }) {
  if (!content) return null;
  return (
    <div className="mt-6">
      {content.eyebrow ? (
        <p className="text-xs uppercase tracking-[0.12em] text-brand-gray-400 font-semibold">
          {content.eyebrow}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-brand-ink-900">
          {content.title}
        </h1>
        {content.subtitle ? (
          <p className="text-sm sm:text-base text-brand-gray-650 max-w-[720px]">
            {content.subtitle}
          </p>
        ) : null}
        {content.badges?.filter(Boolean).length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {content.badges.filter(Boolean).map((badge, i) => (
              <span
                key={`${badge}-${i}`}
                className="rounded-full border border-brand-gray-200 bg-brand-gray-50 px-3 py-1 text-[12px] font-semibold text-brand-gray-700"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Rich text block that renders CMS HTML with storefront styling. */
export function RichTextBlock({
  title,
  content,
}: {
  title?: string;
  content?: string;
}) {
  if (!title?.trim() && !content?.trim()) return null;
  return (
    <section className="mt-8">
      {title?.trim() ? (
        <h2 className="mb-3 font-inter text-[22px] font-semibold leading-tight text-brand-ink-900 sm:text-[28px]">
          {title}
        </h2>
      ) : null}
      {content?.trim() ? (
        <RichText html={content} className="cms-content max-w-none" />
      ) : null}
    </section>
  );
}

/** Titled list of items — used for steps, reasons and services. */
export function BulletList({ content }: { content?: BulletListContent }) {
  const items = (content?.items || []).filter(
    (item) => item?.title?.trim() || item?.text?.trim(),
  );
  if (!content?.title?.trim() && items.length === 0) return null;
  return (
    <section className="mt-10">
      {content?.title?.trim() ? (
        <h2 className="text-[22px] sm:text-[28px] font-semibold leading-tight text-brand-ink-900">
          {content.title}
        </h2>
      ) : null}
      {content?.intro?.trim() ? (
        <p className="mt-3 text-sm sm:text-base text-brand-gray-650 max-w-[820px]">
          {content.intro}
        </p>
      ) : null}
      <ul className="mt-6 space-y-4">
        {items.map((item, i) => (
          <li key={`${item.title}-${i}`} className="flex gap-3">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-orange-500" />
            <div>
              {item.title?.trim() ? (
                <p className="text-[15px] sm:text-[16px] font-semibold text-brand-ink-900">
                  {item.title}
                </p>
              ) : null}
              {item.text?.trim() ? (
                <p className="mt-0.5 text-[14px] sm:text-[15px] text-brand-gray-650">
                  {item.text}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Question & answer list with the header (eyebrow/title/intro). */
export function FaqBlock({ content }: { content?: FaqContent }) {
  const items = (content?.items || []).filter(
    (item) => item?.question?.trim(),
  );
  return (
    <section>
      {content?.eyebrow ? (
        <p className="mt-6 text-xs uppercase tracking-[0.12em] text-brand-gray-400 font-semibold">
          {content.eyebrow}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2">
        <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-[-0.02em] text-brand-ink-900">
          {content?.title || "Frequently asked questions"}
        </h1>
        {content?.intro ? (
          <p className="text-sm sm:text-base text-brand-gray-650 max-w-[720px]">
            {content.intro}
          </p>
        ) : null}
      </div>

      <div className="mt-6 h-px w-full bg-brand-gray-170" />

      <div className="divide-y divide-brand-gray-175 overflow-hidden mt-8">
        {items.map((faq, i) => (
          <details
            key={`${faq.question}-${i}`}
            className="group bg-white py-3 sm:py-6"
          >
            <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
              <span className="text-sm sm:text-base font-semibold text-brand-ink-900">
                {faq.question}
              </span>
              <ChevronDown className="h-4 w-4 text-brand-gray-650 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-sm sm:text-base text-brand-gray-650">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
