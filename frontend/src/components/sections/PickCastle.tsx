import Image, { StaticImageData } from "next/image";
import Link from "next/link";

import Bg1 from "@/assets/images/bg1.png";
import Bg2 from "@/assets/images/bg2.png";
import Bg3 from "@/assets/images/bg3.png";
import Bg4 from "@/assets/images/bg4.png";
import ObstacleBg from "@/assets/images/obstacle.jpeg";

type CastleItem = {
  title: string;
  href: string;
  imgSrc: StaticImageData;
  imgAlt: string;
};

const ITEMS: CastleItem[] = [
  {
    title: "Bouncy Castle\nHire Catalogue",
    href: "/booking-catalog/bouncy-castle-hire",
    imgSrc: Bg1,
    imgAlt: "Bouncy castle on a lawn",
  },
  {
    title: "Soft Play\nHire Catalogue",
    href: "/booking-catalog/soft-play-hire",
    imgSrc: Bg2,
    imgAlt: "Soft play equipment in a hall",
  },
  {
    title: "Garden Games\nHire Catalogue",
    href: "/booking-catalog/garden-games-hire",
    imgSrc: Bg3,
    imgAlt: "Giant garden game",
  },
  {
    title: "Fun Food\nHire Catalogue",
    href: "/booking-catalog/fun-food-hire",
    imgSrc: Bg4,
    imgAlt: "Popcorn machine on a counter",
  },
  {
    title: "Obstacle Course/Slides\nHire Catalogue",
    href: "/booking-catalog/obstacle-course-slides-hire",
    imgSrc: ObstacleBg,
    imgAlt: "Inflatable obstacle course with slide",
  },
];

export default function PickCastle() {
  return (
    <section className="w-full py-12  md:py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-10 md:mb-12">
          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            Pick Your Perfect Castle
          </h2>
          <p className="font-inter text-[14px] sm:text-[18px] mt-3 text-brand-gray-700 max-w-[620px] mx-auto">
            Browse our categories to discover the right bouncy castle that
            matches your party vibe.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-6 md:gap-6">
          {ITEMS.map((item, index) => (
            <CardLink
              key={item.href}
              {...item}
              className={
                index === 3
                  ? "md:col-span-2 md:col-start-2"
                  : index === 4
                    ? "col-span-2 justify-self-center w-[calc((100%-0.75rem)/2)] sm:w-[calc((100%-1.25rem)/2)] md:col-span-2 md:col-start-4 md:w-auto"
                    : "md:col-span-2"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function CardLink({
  title,
  href,
  imgSrc,
  imgAlt,
  className = "",
}: CastleItem & { className?: string }) {
  return (
    <Link
      href={href}
      aria-label={`${title.replace(/\n/g, " ")} - View Catalogue`}
      className={`group relative overflow-hidden rounded-xl border border-brand-gray-200 bg-white shadow-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-orange-500 aspect-[4/3] ${className}`}
    >
      {/* Image */}
      <Image
        src={imgSrc}
        alt={imgAlt}
        fill
        priority={false}
        sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 400px"
        className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55 transition-colors duration-300 group-hover:bg-black/65 group-focus-visible:bg-black/65" />

      {/* Title */}
      <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 text-center">
        <h3 className="font-display text-white drop-shadow-[0_2px_2px_var(--alpha-black-55)] text-lg leading-[1.15] sm:text-[24px] md:text-[44px] whitespace-pre-line">
          {title}
        </h3>
      </div>

      <div
        className="
          pointer-events-none absolute right-3 bottom-3 sm:right-6 sm:bottom-6
          hidden sm:grid place-items-center
          w-24 h-24 md:w-32 md:h-32
          rounded-full bg-brand-orange-500 text-white
          shadow-[0_8px_24px_var(--alpha-black-25)]
          translate-y-6 opacity-0 scale-90
          group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
          group-focus-visible:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:scale-100
          transition-all duration-300 ease-out
        "
      >
        <span className="text-base md:text-xl leading-tight text-center px-5">
          View Catalogue
        </span>
      </div>

      {/* Subtle ring */}
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-black/5" />
    </Link>
  );
}
