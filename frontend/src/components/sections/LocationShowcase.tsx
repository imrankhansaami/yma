import Image, { type StaticImageData } from "next/image";
import Link from "next/link";

import ReserveNowBtn from "@/components/common/btn/ReserveNowBtn";

type Area = {
  name: string;
  href?: string;
  underline?: boolean;
};

type LocationShowcaseProps = {
  title: string;
  intro?: string;
  areas: Area[];
  ctaHref: string;
  ctaLabel: string;
  imageSrc?: StaticImageData | string;
  imageLeft?: boolean;
};

/**
 * Reusable layout pairing a location text list with a map/visual.
 */
export default function LocationShowcase({
  title,
  intro,
  areas,
  ctaHref,
  imageSrc,
  imageLeft = false,
}: LocationShowcaseProps) {
  // On mobile we always show text first; swap only on large screens when imageLeft is true
  const textOrder = imageLeft ? "order-1 md:order-2" : "order-1 md:order-1";
  const imageOrder = imageLeft ? "order-2 md:order-1" : "order-2 md:order-2";

  return (
    <section className="w-full py-5 md:py-16 bg-white font-inter">
      <div className="mx-auto max-w-[1200px] px-4  grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 lg:gap-16">
        <div
          className={`space-y-4 sm:space-y-6 text-brand-ink-900 ${textOrder}`}
        >
          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            {title}
          </h2>

          <p className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed font-inter">
            {intro ? `${intro} ` : ""}
            <span className="text-brand-gray-700">
              Also serving nearby areas such as{" "}
            </span>
            {areas.map((area, idx) => (
              <span key={`${area.name}-${idx}`}>
                {area.href ? (
                  <Link
                    href={area.href}
                    className={[
                      "text-brand-gray-700 hover:text-brand-slate-900 transition-colors",
                      "no-underline",
                    ].join(" ")}
                  >
                    {area.name}
                  </Link>
                ) : (
                  <span className="no-underline">{area.name}</span>
                )}
                {idx < areas.length - 1 ? ", " : ""}
              </span>
            ))}
          </p>

          <ReserveNowBtn href={ctaHref} />
        </div>

        <div
          className={`relative overflow-hidden rounded-2xl ${imageOrder} h-[185px] md:h-[300px] lg:h-[400px]`}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={`${title} location`}
              className=" h-[185px] md:h-[300px] lg:h-[400px] w-full object-cover"
              priority={false}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border border-brand-gray-175 bg-brand-gray-50 text-sm text-brand-gray-500">
              Image unavailable.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
