import type { ElementType, ReactNode } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import type { FaqItem } from "@/lib/blocks/types";

/**
 * Shared question & answer accordion. Used by the CMS FAQ block, the /faqs page
 * and the location pages so every FAQ on the site looks and behaves the same.
 */
export function FaqAccordion({
  items,
  name,
}: {
  items: FaqItem[];
  name?: string;
}) {
  const visible = (items || []).filter((item) => item?.question?.trim());
  if (visible.length === 0) return null;

  return (
    <div className="mt-8 grid gap-3">
      {visible.map((faq, i) => (
        <details
          key={`${faq.question}-${i}`}
          name={name}
          className="group overflow-hidden rounded-2xl border border-brand-gray-200 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-colors duration-200 open:border-brand-orange-100 open:bg-brand-orange-50"
        >
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 sm:px-6 sm:py-[18px] [&::-webkit-details-marker]:hidden">
            <span className="flex items-start gap-3">
              <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-orange-100 text-[12px] font-bold text-brand-orange-700 transition-colors group-open:bg-brand-orange-500 group-open:text-white">
                {i + 1}
              </span>
              <span className="text-[15px] font-semibold leading-snug text-brand-ink-900 sm:text-base">
                {faq.question}
              </span>
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-brand-gray-200 bg-brand-gray-50 text-brand-gray-600 transition-all duration-200 group-open:rotate-180 group-open:border-brand-orange-500 group-open:bg-brand-orange-500 group-open:text-white">
              <ChevronDown className="h-4 w-4" />
            </span>
          </summary>
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <p className="ml-9 border-l-2 border-brand-orange-100 pl-3 text-[14px] leading-relaxed text-brand-gray-650 sm:text-[15px]">
              {faq.answer}
            </p>
          </div>
        </details>
      ))}
    </div>
  );
}

/**
 * Full FAQ section: a tinted panel that lifts the section off the page, a
 * prominent header and the accordion list. Shared so every page matches.
 */
export function FaqSection({
  eyebrow = "FAQ section",
  title = "Frequently asked questions",
  intro,
  items,
  headingAs: Heading = "h2",
  name,
}: {
  eyebrow?: string;
  title?: string;
  intro?: ReactNode;
  items: FaqItem[];
  headingAs?: ElementType;
  name?: string;
}) {
  const visible = (items || []).filter((item) => item?.question?.trim());

  return (
    <section className="mt-12 rounded-3xl border border-brand-orange-100 bg-linear-to-b from-brand-orange-50 to-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] sm:p-8 lg:p-10">
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-orange-700">
        <HelpCircle className="h-3.5 w-3.5" />
        {eyebrow}
      </span>
      <Heading className="mt-4 text-[24px] font-semibold leading-tight tracking-[-0.02em] text-brand-ink-900 sm:text-[30px]">
        {title}
      </Heading>
      {intro ? (
        <p className="mt-3 max-w-[720px] text-sm text-brand-gray-650 sm:text-base">
          {intro}
        </p>
      ) : null}
      {visible.length > 0 ? <FaqAccordion items={visible} name={name} /> : null}
    </section>
  );
}
