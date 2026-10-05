import {
  BulletList,
  FaqBlock,
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
import type { PageBlock } from "@/lib/blocks/types";

/**
 * Renders a page's CMS blocks. Each block is one typed section; legacy blocks
 * with no `type` (or `type: "richText"`) render as a heading + rich text, which
 * keeps every previously-saved page working unchanged.
 */
export function PageBlocks({ blocks }: { blocks?: PageBlock[] | null }) {
  const visible = (Array.isArray(blocks) ? blocks : [])
    .filter((block) => block && block.visible !== false)
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (visible.length === 0) return null;

  return (
    <>
      {visible.map((block, index) => (
        <BlockView key={block.sectionKey || `block-${index}`} block={block} />
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
    case "richText":
    default:
      return <RichTextBlock title={block.title} content={block.content} />;
  }
}
