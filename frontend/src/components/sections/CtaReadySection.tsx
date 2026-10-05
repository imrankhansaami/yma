import ReserveNowBtn from "../common/btn/ReserveNowBtn";
import WhatsappBtn from "../common/btn/WhatsappBtn";
import type { CtaContent } from "@/lib/blocks/types";

const DEFAULT_CTA: CtaContent = {
  title: "Ready to Make Your Event Unforgettable?",
  body: "Book your bouncy castle today with YMA Bouncy Castles — affordable, safe, and hassle-free fun for all ages.",
};

export default function CtaReadySection({ content }: { content?: CtaContent }) {
  const title = content?.title || DEFAULT_CTA.title;
  const body = content?.body || DEFAULT_CTA.body;
  return (
    <section className="w-full py-12  md:py-16">
      <div className="mx-auto max-w-[900px] sm:px-6 text-center">
        {/* Heading */}
        <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
          {title}
        </h2>
        <p className="font-inter text-[14px] sm:text-[18px] mt-3 text-brand-gray-700 max-w-[620px] mx-auto">
          {body}
        </p>

        {/* Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-row items-center justify-center gap-3 sm:gap-4 font-londrina! w-full px-4">
          <WhatsappBtn />
          <ReserveNowBtn />
        </div>
      </div>
    </section>
  );
}
