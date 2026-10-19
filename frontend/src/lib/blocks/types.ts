import type { StaticImageData } from "next/image";

/**
 * A CMS "page block". Blocks are stored in `PageContent.sections`; the legacy
 * rich-text sections are simply blocks of `type: "richText"`.
 */
export type PageBlock = {
  sectionKey: string;
  type?: string;
  title?: string;
  content?: string;
  order?: number;
  visible?: boolean;
  data?: Record<string, unknown>;
  /** Optional presentation overrides (typography, spacing). */
  styles?: BlockStyles;
};

/* -------------------------------------------------------------------------- */
/* Typography & block styles                                                   */
/* -------------------------------------------------------------------------- */

/** CSS typography for a single element role (a heading level, paragraph, ...). */
export type TextStyle = {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
  textAlign?: string;
  color?: string;
  marginTop?: string;
  marginBottom?: string;
};

/** Element roles a block's typography can target. */
export const TYPOGRAPHY_ROLES = [
  "base",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "span",
  "a",
  "li",
] as const;

export type TypographyRole = (typeof TYPOGRAPHY_ROLES)[number];

export type TypographyMap = Partial<Record<TypographyRole, TextStyle>>;

/** Presentation overrides stored on a block. */
export type BlockStyles = {
  typography?: TypographyMap;
  /** Outer spacing and background for the block wrapper. */
  marginTop?: string;
  marginBottom?: string;
  paddingY?: string;
  background?: string;
};

/** Typography that applies to the whole page rather than a single block. */
export const PAGE_STYLES_TYPE = "pageStyles";

/** The class the storefront puts on a page wrapper for page-wide styles. */
export const PAGE_STYLES_SCOPE_CLASS = "cms-page";

/** One column inside a "columns" block. Columns may hold nested blocks. */
export type ColumnContent = {
  heading?: string;
  html?: string;
  blocks?: PageBlock[];
};

/**
 * Blocks that can be nested inside a column. Deliberately flat (no columns
 * inside columns) so the editor cannot recurse without end.
 */
export const NESTED_BLOCK_TYPES: string[] = [
  "heading",
  "paragraph",
  "richText",
  "bulletList",
  "quote",
  "image",
  "button",
  "html",
  "divider",
  "spacer",
];

/** Images may come from the repo (imported asset) or the CMS (URL string). */
export type BlockImage = string | StaticImageData;

export type HeroPill = { label: string; category: string };

export type HeroContent = {
  title: string;
  subtitle: string;
  backgroundImage?: BlockImage;
  bookLabel: string;
  callLabel: string;
  phone: string;
  pills: HeroPill[];
};

export type CategoryTile = {
  title: string;
  href: string;
  image?: BlockImage;
  imageAlt?: string;
};

export type CategoryTilesContent = {
  title: string;
  subtitle: string;
  tiles: CategoryTile[];
};

export type ProductGridContent = {
  title: string;
  subtitle: string;
  source: "topPicks" | "newest";
  limit: number;
};

export type FeatureItem = {
  /** Icon key (see FeatureGrid icon map) — not a user-facing string. */
  icon: string;
  title: string;
  description: string;
};

export type FeatureGridContent = {
  title: string;
  titleAccent?: string;
  items: FeatureItem[];
};

export type MediaTextContent = {
  badges: string[];
  title: string;
  body: string;
  listItems: string[];
  linkText: string;
  linkHref: string;
  image?: BlockImage;
  imageAlt?: string;
  reserveLabel?: string;
};

export type TestimonialItem = {
  quote: string;
  author: string;
  rating: number;
};

export type TestimonialsContent = {
  items: TestimonialItem[];
};

export type ProductTabsContent = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
};

export type CtaContent = {
  title: string;
  body: string;
};

export type NewsletterContent = {
  title: string;
  body: string;
  placeholder: string;
  buttonLabel: string;
  privacyPrefix: string;
  privacyLinkText: string;
  privacyHref: string;
};

export type RichTextContent = {
  title?: string;
  content?: string;
};

export type PageHeaderContent = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: string[];
};

export type FaqItem = { question: string; answer: string };
export type FaqContent = {
  eyebrow?: string;
  title?: string;
  intro?: string;
  items: FaqItem[];
};

export type BulletItem = { title: string; text: string };
export type BulletListContent = {
  title?: string;
  intro?: string;
  items: BulletItem[];
};

export type ContactDetailsContent = {
  heading?: string;
  label?: string;
  phone?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
};

export type ContactFormContent = {
  heading?: string;
  intro?: string;
};

/** A numbered legal document section: heading plus rich-text body. */
export type LegalSection = { title: string; content: string };

/** A titled paragraph used by the location page sections. */
export type LocationItem = { title: string; body: string };

/** The two-column hero at the top of a location detail page. */
export type LocationHeroContent = {
  title: string;
  paragraphs: string[];
  /** Rich text version; when present it replaces title + paragraphs. */
  html?: string;
};

/** The long-form sections under a location detail page's product grid. */
export type LocationBodyContent = {
  aboutTitle: string;
  aboutParagraphs: string[];
  whyTitle: string;
  whyItems: LocationItem[];
  servicesTitle: string;
  servicesItems: LocationItem[];
  safetyTitle: string;
  safetyItems: LocationItem[];
  occasionsTitle: string;
  occasionsSubtitle: string;
  occasionsItems: string[];
  /** Rich text versions; when present they replace the legacy fields above. */
  aboutHtml?: string;
  whyHtml?: string;
  servicesHtml?: string;
  safetyHtml?: string;
  occasionsHtml?: string;
};

/** The sections of a location body, in page order. */
export const LOCATION_BODY_SECTIONS = [
  { key: "aboutHtml", label: "About" },
  { key: "whyHtml", label: "Why choose us" },
  { key: "servicesHtml", label: "Services" },
  { key: "safetyHtml", label: "Safety & quality" },
  { key: "occasionsHtml", label: "Occasions" },
] as const;

/** The /locations hub page: hero copy and the four regional showcases. */
export type LocationHubContent = {
  eyebrow: string;
  title: string;
  description: string;
  subtext: string;
  showcases: { title: string; intro: string }[];
};

/** A category page's SEO copy: intro, "why choose" reasons and offerings. */
export type SeoListItem = { title: string; body: string };
export type SeoLink = { label: string; href: string };
export type SeoContentContent = {
  heading: string;
  intro: string;
  reasonsHeading: string;
  reasons: SeoListItem[];
  offeringsHeading: string;
  offerings: SeoListItem[];
  crossLinks: SeoLink[];
};

/** Terms / Privacy layout: page heading, last-updated date and sections. */
export type LegalPageContent = {
  heading: string;
  lastUpdated?: string;
  sections: LegalSection[];
};

/** The bespoke two-column Contact page layout, as editable fields. */
export type ContactPageContent = {
  badge: string;
  title: string;
  intro: string;
  pills: string[];
  stepsLabel: string;
  stepsTitle: string;
  steps: string[];
  detailsLabel: string;
  detailsHeading: string;
  phone: string;
  email: string;
  facebook: string;
  instagram: string;
  formBadges: string[];
};

/** Admin-facing catalogue of block types that can be added to a page. */
export const BLOCK_CATALOG: {
  type: string;
  label: string;
  description: string;
  /** Groups the inserter; blocks without one fall under "Blocks". */
  group?: string;
}[] = [
  // --- Content -------------------------------------------------------------
  { type: "heading", label: "Heading", description: "A single H1-H6 heading", group: "Text" },
  { type: "paragraph", label: "Paragraph", description: "Free-form rich text", group: "Text" },
  { type: "richText", label: "Rich Text", description: "A heading and free-form text", group: "Text" },
  { type: "bulletList", label: "List", description: "A titled list of items (steps, reasons, services)", group: "Text" },
  { type: "quote", label: "Quote", description: "A highlighted quotation", group: "Text" },
  { type: "image", label: "Image", description: "An image with optional caption", group: "Media" },
  { type: "button", label: "Button", description: "A call-to-action link", group: "Media" },
  { type: "html", label: "Custom HTML", description: "Raw HTML for advanced embeds", group: "Media" },
  // --- Layout --------------------------------------------------------------
  { type: "columns", label: "Columns", description: "Two or more side-by-side columns", group: "Layout" },
  { type: "divider", label: "Divider", description: "A horizontal rule", group: "Layout" },
  { type: "spacer", label: "Spacer", description: "Vertical space between sections", group: "Layout" },
  { type: PAGE_STYLES_TYPE, label: "Page Typography", description: "Site-wide text styles for this page (H1-H6, body, links)", group: "Layout" },
  // --- Sections ------------------------------------------------------------
  { type: "hero", label: "Hero", description: "Big banner with headline, image and booking buttons", group: "Sections" },
  { type: "pageHeader", label: "Page Header", description: "Page title, intro and optional badges", group: "Sections" },
  { type: "faq", label: "FAQ", description: "Question and answer list", group: "Sections" },
  { type: "categoryTiles", label: "Category Tiles", description: "Grid of image tiles linking to catalogues", group: "Sections" },
  { type: "productGrid", label: "Product Grid", description: "Top picks or newest products", group: "Sections" },
  { type: "featureGrid", label: "Feature Grid", description: "Why-choose-us style feature cards", group: "Sections" },
  { type: "mediaText", label: "Image + Text", description: "Text beside an image with a call-to-action", group: "Sections" },
  { type: "testimonials", label: "Testimonials", description: "Customer review slides", group: "Sections" },
  { type: "productTabs", label: "Product Tabs", description: "Tabbed product carousel", group: "Sections" },
  { type: "cta", label: "Call to Action", description: "Closing call-to-action with buttons", group: "Sections" },
  { type: "newsletter", label: "Newsletter", description: "Email sign-up block", group: "Sections" },
  // --- Page layouts --------------------------------------------------------
  { type: "contactPage", label: "Contact Page Layout", description: "The full two-column contact page", group: "Page layouts" },
  { type: "legalPage", label: "Legal Page", description: "Page heading, last-updated date and numbered sections", group: "Page layouts" },
  { type: "seoContent", label: "Category SEO Content", description: "Intro, why-choose reasons, offerings and cross links", group: "Page layouts" },
  // --- Location ------------------------------------------------------------
  { type: "locationHero", label: "Location Hero", description: "Location page headline and intro paragraphs", group: "Location" },
  { type: "locationShop", label: "Location Product Grid", description: "The one-stop party shop catalogue for this location", group: "Location" },
  { type: "locationBody", label: "Location Body", description: "About, why choose us, services, safety and occasions", group: "Location" },
  { type: "locationAreas", label: "Delivery Areas & FAQ", description: "Delivery areas list and the location FAQ", group: "Location" },
  { type: "locationHub", label: "Locations Hub", description: "Locations index hero copy and regional showcases", group: "Location" },
];

export const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_CATALOG.map((b) => [b.type, b.label]),
);

/**
 * Block types that the owning page component renders itself, in a position
 * chosen for its layout. They need page context (the category slug, the
 * location name, the map) so they cannot go through the generic renderer.
 *
 * PageBlocks skips these, so a copy of one accidentally added to the wrong
 * page renders nothing instead of an empty heading.
 */
export const PAGE_OWNED_BLOCK_TYPES = [
  "contactPage",
  "seoContent",
  "locationHero",
  "locationShop",
  "locationBody",
  "locationAreas",
  "locationHub",
] as const;

/**
 * The location page's own sections, in their default order. The page renders
 * whatever is saved, in the saved order, so these can be dragged anywhere in
 * the editor. Used to seed pages created before these were blocks.
 */
export const LOCATION_SECTION_ORDER = [
  { type: "locationHero", sectionKey: "location-hero" },
  { type: "locationShop", sectionKey: "location-shop" },
  { type: "locationBody", sectionKey: "location-body" },
  { type: "cta", sectionKey: "location-cta" },
  { type: "locationAreas", sectionKey: "location-areas" },
] as const;

/**
 * Block types PageBlocks renders on its own. These are safe to offer on any
 * page, so admin editors whose page is assembled from blocks restrict their
 * "add a block" picker to this list.
 */
export const GENERIC_BLOCK_TYPES: string[] = BLOCK_CATALOG.map((b) => b.type).filter(
  (type) => !(PAGE_OWNED_BLOCK_TYPES as readonly string[]).includes(type),
);
