export type PageType = "category" | "location" | "core";

export interface IPageSection {
  sectionKey: string;
  title: string;
  content: string; // HTML
  order: number;
}

export interface IPageContent {
  pageType: PageType;
  pageKey: string; // unique key e.g. 'home', 'contact', 'bouncy-castle-hire'
  /** Heading shown at the top of a CMS-rendered page. */
  title?: string;
  sections: IPageSection[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  isActive: boolean;
}

export interface CreatePageContentData {
  pageType: PageType;
  pageKey: string;
  title?: string;
  sections?: IPageSection[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  isActive?: boolean;
}

export interface UpdatePageContentData {
  pageType?: PageType;
  pageKey?: string;
  title?: string;
  sections?: IPageSection[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  canonicalUrl?: string;
  customJsonLd?: string;
  isActive?: boolean;
}
