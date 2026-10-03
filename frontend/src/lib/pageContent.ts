/**
 * Server-side helper to fetch PageContent from the backend API.
 * Used by generateMetadata functions in core, category, and location pages.
 */

export type PageContentData = {
  /** Heading for CMS-rendered pages. */
  title?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  isActive?: boolean;
  sections?: {
    sectionKey: string;
    title: string;
    content: string;
    order: number;
  }[];
};

export async function fetchPageContent(
  pageType: string,
  pageKey: string
): Promise<PageContentData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SERVER_URI;
    if (!baseUrl) return null;
    const res = await fetch(
      `${baseUrl}/api/v1/page-content/${pageType}/${pageKey}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    // The API nests the record as `data.pageContent`; fall back to `data`
    // in case the shape is ever flattened.
    const record = json?.data?.pageContent ?? json?.data ?? null;
    // A page switched off in the admin must not affect the storefront.
    if (record && record.isActive === false) return null;
    return record;
  } catch {
    return null;
  }
}
