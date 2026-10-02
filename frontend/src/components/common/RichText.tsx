"use client";

import { cn } from "@/lib/utils";
import { SITE_HOST } from "@/lib/site-url";

type RichTextProps = {
  html?: string | null;
  className?: string;
};

const INTERNAL_DOMAINS = [SITE_HOST, "localhost"];

/**
 * Sanitize link attributes in HTML:
 * - Internal links: remove target="_blank" and rel="nofollow"
 * - External links: ensure target="_blank" rel="noopener noreferrer"
 */
function sanitizeLinks(html: string): string {
  return html.replace(
    /<a\s([^>]*)>/gi,
    (match, attrs: string) => {
      const hrefMatch = attrs.match(/href=["']([^"']*)["']/i);
      if (!hrefMatch) return match;

      const href = hrefMatch[1];
      const isInternal =
        href.startsWith("/") ||
        href.startsWith("#") ||
        INTERNAL_DOMAINS.some((d) => href.includes(d));

      // Strip existing target and rel
      const cleanAttrs = attrs
        .replace(/\s*target=["'][^"']*["']/gi, "")
        .replace(/\s*rel=["'][^"']*["']/gi, "")
        .trim();

      if (isInternal) {
        return `<a ${cleanAttrs}>`;
      }
      return `<a ${cleanAttrs} target="_blank" rel="noopener noreferrer">`;
    }
  );
}

export function RichText({ html, className }: RichTextProps) {
  if (!html) return null;
  const sanitized = sanitizeLinks(html);
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none rich-text-content",
        "[&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
