import Bg1 from "@/assets/images/bg1.png";
import Image from "next/image";
import Link from "next/link";
import ReserveNowBtn from "../common/btn/ReserveNowBtn";
import type { MediaTextContent } from "@/lib/blocks/types";

const DEFAULT_MEDIA_TEXT: MediaTextContent = {
  badges: ["All ages", "Safe & insured", "Fast setup"],
  title: "Bouncy Castle Hire in London, Essex & Enfield",
  body: "Friendly, professional rentals for kids and adults with great value and fast service across nearby areas.",
  listItems: [
    "Popular inflatables, soft play, garden games, and more.",
    "Perfect for birthdays, festivals, and corporate events.",
  ],
  linkText: "bouncy castle hire",
  linkHref: "/booking-catalog",
  image: Bg1,
  imageAlt: "Bouncy castle",
};

export default function CastleHireSection({
  content,
}: {
  content?: MediaTextContent;
}) {
  const c = { ...DEFAULT_MEDIA_TEXT, ...(content || {}) };
  return (
    <section className="w-full py-12 md:py-16 bg-brand-orange-50/40">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-stretch">
        {/* LEFT: Content */}
        <div className="rounded-2xl bg-white/90 p-6 sm:p-8 shadow-sm border border-white">
          <div className="flex flex-wrap gap-2 mb-4">
            {c.badges.filter(Boolean).map((badge, index) => (
              <span
                key={`${badge}-${index}`}
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  ["bg-orange-100 text-orange-700", "bg-emerald-100 text-emerald-700", "bg-blue-100 text-blue-700"][
                    index % 3
                  ]
                }`}
              >
                {badge}
              </span>
            ))}
          </div>

          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900 mb-4">
            {c.title}
          </h2>

          <p className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-4 font-inter">
            {c.body}
          </p>

          {c.listItems.filter(Boolean).length > 0 && (
            <ul className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-6 font-inter list-disc pl-5 space-y-2">
              {c.listItems.filter(Boolean).map((item, index) => (
                <li key={`${item}-${index}`}>{item}</li>
              ))}
            </ul>
          )}

          <p className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-8 font-inter">
            Book your{" "}
            <Link
              href={c.linkHref}
              className="text-brand-orange-500 underline hover:text-brand-orange-600"
            >
              {c.linkText}
            </Link>{" "}
            today — safe, reliable, and fun.
          </p>
          <div className="flex justify-center md:justify-start">
            <ReserveNowBtn className="!w-[180px]" />
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="w-full h-full">
          <Image
            src={c.image || Bg1}
            alt={c.imageAlt || c.title}
            className="rounded-xl w-full h-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
