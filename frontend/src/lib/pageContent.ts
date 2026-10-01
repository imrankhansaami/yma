/**
 * Server-side helper to fetch PageContent from the backend API.
 * Used by generateMetadata functions in core, category, and location pages.
 */

export type PageContentData = {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
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
    return json?.data?.pageContent ?? json?.data ?? null;
  } catch {
    return null;
  }
}
