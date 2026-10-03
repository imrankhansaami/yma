import { RichText } from "@/components/common/RichText";

export type CmsSection = {
  sectionKey?: string;
  title?: string;
  content?: string;
  order?: number;
};

/**
 * Renders the CMS "Page Sections" edited in Admin → Pages → (Core / Category /
 * Location). Sections are sorted by `order` and each renders an optional
 * heading plus rich-text body. Renders nothing when there is no content, so it
 * is safe to drop into any page.
 */
export function CmsSections({
  sections,
  className,
}: {
  sections?: CmsSection[] | null;
  className?: string;
}) {
  const visible = (Array.isArray(sections) ? sections : [])
    .filter(
      (s) =>
        (s?.content && String(s.content).trim()) ||
        (s?.title && String(s.title).trim()),
    )
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (visible.length === 0) return null;

  return (
    <div
      className={
        className ??
        "mx-auto w-full max-w-[1000px] px-4 sm:px-6 py-10 font-inter"
      }
    >
      {visible.map((section, index) => (
        <section
          key={section.sectionKey || `cms-section-${index}`}
          className="mb-8 last:mb-0"
        >
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
      ))}
    </div>
  );
}
