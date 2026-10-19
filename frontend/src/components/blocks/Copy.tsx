import { RichText } from "@/components/common/RichText";

/**
 * True when a saved copy field contains HTML, i.e. it was written in the
 * WYSIWYG editor. Plain text saved before the editor has no tags.
 */
export function isRichText(value?: unknown): boolean {
  return /<\/?(?:p|h[1-6]|ul|ol|li|strong|em|br|a|img|blockquote|span|figure|figcaption)\b/i.test(
    String(value ?? ""),
  );
}

/**
 * Renders one copy field that may be plain text (saved before the WYSIWYG
 * editor) or rich HTML (edited since).
 *
 * Plain text keeps the caller's exact wrapper and classes, so pages saved
 * earlier render byte-for-byte as they did. Only content that actually carries
 * HTML goes through RichText.
 */
export function Copy({
  value,
  className,
  wrapper = "p",
}: {
  value?: string;
  className?: string;
  wrapper?: "p" | "div" | "span";
}) {
  const text = String(value ?? "");
  if (!text.trim()) return null;

  if (isRichText(text)) {
    return (
      <RichText
        html={text}
        className={`max-w-none ${className || ""}`.trim()}
      />
    );
  }

  const Tag = wrapper as "p";
  return <Tag className={className}>{text}</Tag>;
}
