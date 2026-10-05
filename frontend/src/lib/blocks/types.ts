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
};

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
};

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
}[] = [
  { type: "hero", label: "Hero", description: "Big banner with headline, image and booking buttons" },
  { type: "pageHeader", label: "Page Header", description: "Page title, intro and optional badges" },
  { type: "richText", label: "Rich Text", description: "A heading and free-form text" },
  { type: "bulletList", label: "List", description: "A titled list of items (steps, reasons, services)" },
  { type: "faq", label: "FAQ", description: "Question and answer list" },
  { type: "contactPage", label: "Contact Page Layout", description: "The full two-column contact page" },
  { type: "legalPage", label: "Legal Page", description: "Page heading, last-updated date and numbered sections" },
  { type: "seoContent", label: "Category SEO Content", description: "Intro, why-choose reasons, offerings and cross links" },
  { type: "locationHero", label: "Location Hero", description: "Location page headline and intro paragraphs" },
  { type: "locationBody", label: "Location Body", description: "About, why choose us, services, safety and occasions" },
  { type: "locationHub", label: "Locations Hub", description: "Locations index hero copy and regional showcases" },
  { type: "categoryTiles", label: "Category Tiles", description: "Grid of image tiles linking to catalogues" },
  { type: "productGrid", label: "Product Grid", description: "Top picks or newest products" },
  { type: "featureGrid", label: "Feature Grid", description: "Why-choose-us style feature cards" },
  { type: "mediaText", label: "Image + Text", description: "Text beside an image with a call-to-action" },
  { type: "testimonials", label: "Testimonials", description: "Customer review slides" },
  { type: "productTabs", label: "Product Tabs", description: "Tabbed product carousel" },
  { type: "cta", label: "Call to Action", description: "Closing call-to-action with buttons" },
  { type: "newsletter", label: "Newsletter", description: "Email sign-up block" },
];

export const BLOCK_LABELS: Record<string, string> = Object.fromEntries(
  BLOCK_CATALOG.map((b) => [b.type, b.label]),
);
