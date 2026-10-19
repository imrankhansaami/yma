import Link from "next/link";

import type { LocationIndexGroup } from "@/lib/locationIndex";

type LocationsIndexProps = {
  groups: LocationIndexGroup[];
  title: string;
  intro?: string;
};

/**
 * Every area we cover, as links to the location pages.
 *
 * The A-Z layout keeps ~90 links scannable and gives each location page an
 * internal link from the hub.
 */
export default function LocationsIndex({
  groups,
  title,
  intro,
}: LocationsIndexProps) {
  if (groups.length === 0) return null;

  return (
    <section
      id="areas-we-cover"
      className="w-full scroll-mt-24 border-t border-brand-gray-175 bg-white py-10 font-inter md:py-16"
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="mx-auto mb-8 max-w-3xl text-center md:mb-12">
          <p className="mb-3 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-brand-green-600">
            Areas we cover
          </p>
          <h2 className="font-display text-[24px] sm:text-3xl md:text-4xl font-bold leading-snug text-brand-slate-900">
            {title}
          </h2>
          {intro ? (
            <p className="mt-3 text-[14px] sm:text-base leading-relaxed text-brand-gray-700">
              {intro}
            </p>
          ) : null}
        </div>

        <nav
          aria-label="Every area we cover"
          className="columns-1 gap-x-10 sm:columns-2 lg:columns-3"
        >
          {groups.map((group) => (
            <div key={group.letter} className="mb-6 break-inside-avoid">
              <h3 className="mb-2 border-b border-brand-gray-175 pb-1 text-sm font-semibold uppercase tracking-wide text-brand-slate-900">
                {group.letter}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/locations/${item.slug}`}
                      className="text-[14px] leading-snug text-brand-gray-700 underline-offset-2 transition-colors hover:text-brand-green-600 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
    </section>
  );
}
