import {
  BulletList,
  FaqBlock,
  LegalPageBlock,
  PageHeader,
  RichTextBlock,
} from "@/components/blocks/contentBlocks";
import CastleHireSection from "@/components/sections/CastleHireSection";
import CtaReadySection from "@/components/sections/CtaReadySection";
import HeroSection from "@/components/sections/HeroSection";
import NewsletterSection from "@/components/sections/NewsletterSection";
import OneStopPartyShop from "@/components/sections/OneStopPartyShop";
import PickCastle from "@/components/sections/PickCastle";
import TestimonialSection from "@/components/sections/Testimonial";
import TopPicksSection from "@/components/sections/TopPicksSection";
import WhyChoose from "@/components/sections/WhyChoose";
import { PAGE_OWNED_BLOCK_TYPES, PAGE_STYLES_TYPE } from "@/lib/blocks/types";
import type { PageBlock } from "@/lib/blocks/types";
import { pageStyleCss } from "@/lib/blocks/blockStyles";

import { BlockStyleScope } from "./BlockStyleScope";
import {
  ButtonBlock,
  ColumnsBlock,
  DividerBlock,
  HeadingBlock,
  HtmlBlock,
  ImageBlock,
  ParagraphBlock,
  QuoteBlock,
  SpacerBlock,
} from "./editorBlocks";

const PAGE_OWNED = PAGE_OWNED_BLOCK_TYPES as readonly string[];

/**
 * Renders a page's CMS blocks. Each block is one typed section; legacy blocks
 * with no `type` (or `type: "richText"`) render as a heading + rich text, which
 * keeps every previously-saved page working unchanged.
 *
 * Blocks whose type is page-owned (a category's SEO content, a location's hero
 * and body, the contact and locations-hub layouts) are skipped: their page
 * renders those itself, in a position chosen for that layout.
 *
 * A block's saved typography/spacing is applied through BlockStyleScope, which
 * adds a scoped wrapper only when the block actually has overrides.
 */
export function PageBlocks({ blocks }: { blocks?: PageBlock[] | null }) {
  const visible = (Array.isArray(blocks) ? blocks : [])
    .filter((block) => block && block.visible !== false)
    .filter((block) => !PAGE_OWNED.includes(block.type || "richText"))
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((block, index) => (
        <BlockStyleScope key={block.sectionKey || `block-${index}`} block={block}>
          <BlockView block={block} />
        </BlockStyleScope>
      ))}
    </>
  );
}

function BlockView({ block }: { block: PageBlock }) {
  const type = block.type || "richText";
  const data = (block.data || {}) as any;

  switch (type) {
    case "hero":
      return <HeroSection content={data} />;
    case "pageHeader":
      return <PageHeader content={data} />;
    case "faq":
      return <FaqBlock content={data} />;
    case "bulletList":
      return <BulletList content={data} />;
    case "legalPage":
      return <LegalPageBlock content={data} />;
    case "categoryTiles":
      return <PickCastle content={data} />;
    case "productGrid":
      return <TopPicksSection content={data} />;
    case "featureGrid":
      return <WhyChoose content={data} />;
    case "mediaText":
      return <CastleHireSection content={data} />;
    case "testimonials":
      return <TestimonialSection content={data} />;
    case "productTabs":
      return <OneStopPartyShop content={data} />;
    case "cta":
      return <CtaReadySection content={data} />;
    case "newsletter":
      return <NewsletterSection content={data} />;
    case "heading":
      return <HeadingBlock content={data} />;
    case "paragraph":
      return <ParagraphBlock content={data} />;
    case "quote":
      return <QuoteBlock content={data} />;
    case "image":
      return <ImageBlock content={data} />;
    case "button":
      return <ButtonBlock content={data} />;
    case "html":
      return <HtmlBlock content={data} />;
    case "divider":
      return <DividerBlock />;
    case "spacer":
      return <SpacerBlock content={data} />;
    case "columns":
      return <ColumnsBlock content={data} />;
    case PAGE_STYLES_TYPE: {
      // Settings-only block: its styles apply to the whole page wrapper.
      const css = pageStyleCss(block);
      return css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null;
    }
    case "richText":
    default:
      return <RichTextBlock title={block.title} content={block.content} />;
  }
}
