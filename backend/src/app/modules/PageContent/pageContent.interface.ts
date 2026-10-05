export type PageType = "category" | "location" | "core";

export interface IPageSection {
  sectionKey: string;
  /**
   * Block type. Legacy records omit it and are treated as "richText".
   * Other values map to the typed blocks rendered by the storefront
   * (hero, featureGrid, faq, cta, ...).
   */
  type?: string;
  title: string;
  content: string; // HTML
  order: number;
  /** Hidden blocks stay in the CMS but are not rendered. */
  visible?: boolean;
  /** Structured fields for typed blocks. */
  data?: Record<string, any>;
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
