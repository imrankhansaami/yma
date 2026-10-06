import api from "@/api/api";

export interface PageSection {
  sectionKey: string;
  /** Block type; legacy records omit it (treated as "richText"). */
  type?: string;
  title: string;
  content: string;
  order: number;
  /** Hidden blocks stay in the CMS but are not rendered. */
  visible?: boolean;
  /** Structured fields for typed blocks. */
  data?: Record<string, unknown>;
}

export interface PageContent {
  _id: string;
  pageType: "category" | "location" | "core";
  pageKey: string;
  /** Heading shown at the top of a CMS-rendered page. */
  title?: string;
  sections: PageSection[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getAllPageContent(
  pageType?: string
): Promise<PageContent[]> {
  const url = pageType ? `/page-content/type/${pageType}` : "/page-content";
  const { data } = await api.get(url);
  // API shape: { data: { pageContents: [...] } }
  const payload = data?.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.pageContents)) return payload.pageContents;
  return [];
}

export async function getPageContentByKey(
  pageType: string,
  pageKey: string
): Promise<PageContent | null> {
  try {
    const { data } = await api.get(`/page-content/${pageType}/${pageKey}`);
    // API shape: { data: { pageContent: {...} } }
    return data?.data?.pageContent ?? data?.data ?? null;
  } catch {
    return null;
  }
}

export async function upsertPageContent(
  pageType: string,
  pageKey: string,
  payload: Partial<PageContent>
): Promise<PageContent> {
  const { data } = await api.put(`/page-content/key/${pageType}/${pageKey}`, {
    ...payload,
    pageType,
    pageKey,
  });
  // API shape: { data: { pageContent: {...} } }
  return data?.data?.pageContent ?? data?.data;
}

/**
 * Move a core page to a new address. The backend renames the record and writes
 * a 301 from the old path to the new one.
 */
export async function renamePageContent(
  pageType: string,
  pageKey: string,
  newPageKey: string
): Promise<PageContent> {
  const { data } = await api.put(
    `/page-content/key/${pageType}/${pageKey}/rename`,
    { newPageKey }
  );
  return data?.data?.pageContent ?? data?.data;
}

export async function deletePageContent(id: string): Promise<void> {
  await api.delete(`/page-content/${id}`);
}
