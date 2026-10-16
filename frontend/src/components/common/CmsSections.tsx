import { RichText } from "@/components/common/RichText";
import { PageBlocks } from "@/components/blocks/PageBlocks";
import type { PageBlock } from "@/lib/blocks/types";

export type CmsSection = {
  sectionKey?: string;
  /** Block type; legacy sections omit it (treated as rich text). */
  type?: string;
  title?: string;
  content?: string;
  order?: number;
  visible?: boolean;
  data?: Record<string, unknown>;
  styles?: Record<string, unknown>;
};

/** Legacy sections are rich text: they have no type, or an explicit richText. */
function isTypedBlock(section: CmsSection): boolean {
  return Boolean(section?.type) && section.type !== "richText";
}

function hasLegacyContent(section: CmsSection): boolean {
  return Boolean(
    String(section?.content || "").trim() || String(section?.title || "").trim(),
  );
}

/**
 * Renders the CMS "Page Sections" edited in Admin → Pages → (Core / Category /
 * Location).
 *
 * Sections are sorted by `order`. Legacy rich-text sections keep their original
 * heading + body markup, so previously-saved pages render exactly as before.
 * Typed blocks (heading, columns, faq, cta, ...) go through the shared
 * PageBlocks renderer, which also applies each block's saved typography.
 * Renders nothing when there is nothing to show.
 */
export function CmsSections({
  sections,
  className,
}: {
  sections?: CmsSection[] | null;
  className?: string;
}) {
  const ordered = (Array.isArray(sections) ? sections : [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const visible = ordered.filter(
    (section) => isTypedBlock(section) || hasLegacyContent(section),
  );

  if (visible.length === 0) return null;

  return (
    <div
      className={
        className ??
        "mx-auto w-full max-w-[1000px] px-4 sm:px-6 py-10 font-inter"
      }
    >
      {visible.map((section, index) => {
        const key = section.sectionKey || `cms-section-${index}`;

        if (isTypedBlock(section)) {
          return (
            <PageBlocks key={key} blocks={[section as PageBlock]} />
          );
        }

        return (
          <section key={key} className="mb-8 last:mb-0">
            {section.title && String(section.title).trim() ? (
              <h2 className="mb-3 font-inter text-[22px] font-semibold leading-tight text-brand-ink-900 sm:text-[28px]">
                {section.title}
              </h2>
            ) : null}
            {section.content && String(section.content).trim() ? (
              <RichText
                html={section.content}
                className="cms-content max-w-none"
              />
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
