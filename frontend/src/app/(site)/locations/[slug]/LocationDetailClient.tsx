"use client";

import { fetchLocations } from "@/services/location.service";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { normalizeCanonicalSlug } from "@/lib/canonical";

export default function LocationDetailClient({
  locationName,
}: {
  locationName: string;
}) {
  const toSlug = (name: string) =>
    normalizeCanonicalSlug(name);

  const { data: locationsData } = useQuery({
    queryKey: ["locations", "delivery-areas"],
    queryFn: () => fetchLocations({ page: 1, limit: 50 }),
    staleTime: 5 * 60 * 1000,
  });

  const deliveryAreas = useMemo(() => {
    const slug = toSlug(locationName);
    const all = Array.isArray(locationsData) ? (locationsData as any[]) : [];

    const match =
      all.find(
        (loc) =>
          toSlug(String(loc.slug || loc.name)) === slug ||
          (Array.isArray(loc.slugAliases) &&
            loc.slugAliases.some((alias: string) => toSlug(alias) === slug)),
      ) ??
      all
        .flatMap((loc) => (Array.isArray(loc.children) ? loc.children : []))
        .find(
          (child: any) =>
            toSlug(String(child.slug || child.name)) === slug ||
            (Array.isArray(child.slugAliases) &&
              child.slugAliases.some((alias: string) => toSlug(alias) === slug)),
        );

    const names: string[] = [];
    const addNames = (list?: any[]) => {
      if (!Array.isArray(list)) return;
      list.forEach((area) => {
        const n = String(area?.name ?? "").trim();
        if (n && !names.includes(n)) names.push(n);
      });
    };

    if (match) {
      addNames((match as any).deliveryAreas);
      if (Array.isArray(match.children)) {
        match.children.forEach((child: any) =>
          addNames(child?.deliveryAreas as any[]),
        );
      }
    }

    return names;
  }, [locationsData, locationName]);

  const faqs = [
    {
      question: "Where can I hire a bouncy castle near me?",
      answer: `We provide bouncy castle hire in ${locationName}, including Barking, Ilford, Romford, and surrounding areas. Get in touch to check availability in your location.`,
    },
    {
      question: "How do I find the best bouncy castle hire near me?",
      answer:
        "Browse our catalog to compare sizes, themes, and prices, or message us for quick recommendations based on your event space.",
    },
    {
      question: "Do you offer same-day bookings?",
      answer:
        "Yes—depending on availability. Contact us early in the day to confirm if we can accommodate your timeframe.",
    },
    {
      question: "How do you ensure safety during the event?",
      answer:
        "All inflatables are inspected, cleaned, and anchored to PIPA standards. We provide clear safety guidance and perform setup checks.",
    },
    {
      question: "What areas do you cover for bouncy castle hire?",
      answer:
        "We cover most surrounding neighborhoods; reach out with your postcode and we’ll confirm delivery and setup options.",
    },
  ];

  const [openFaq, setOpenFaq] = useState(0);

  return (
    <>
      {deliveryAreas.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xl sm:text-2xl font-semibold">
            Delivery Areas – Bouncy Castle Hire in {locationName}
          </h3>
          <p className="text-sm sm:text-base text-brand-gray-700">
            We offer free and fast delivery within {locationName}, including
            areas like:
          </p>
          <div className="space-y-2">
            {deliveryAreas.map((name, idx) => (
              <div
                key={`${name}-${idx}`}
                className="flex items-start gap-2 text-sm sm:text-base text-brand-ink-900"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-brand-orange-500" />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs uppercase tracking-[0.12em] text-brand-gray-400 font-semibold mt-8">
        FAQ section
      </p>
      <div className="flex flex-col gap-2">
        <h3 className="text-[22px] sm:text-[24px] font-semibold text-brand-ink-900">
          Frequently asked questions
        </h3>
        <p className="text-sm sm:text-base text-brand-gray-650">
          We&apos;ve compiled the most important information to help you get the
          most out of your experience. Can&apos;t find what you&apos;re looking
          for?{" "}
          <Link
            href="/contact"
            className="text-brand-slate-950 underline underline-offset-4"
          >
            Contact us.
          </Link>
        </p>
      </div>

      <div className="divide-y divide-brand-gray-175 overflow-hidden mt-6">
        {faqs.map((item, idx) => {
          const isOpen = openFaq === idx;
          return (
            <button
              key={item.question}
              onClick={() => setOpenFaq(isOpen ? -1 : idx)}
              className="w-full text-left py-3 sm:py-4 bg-white transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-sm sm:text-base font-semibold text-brand-ink-900">
                    {item.question}
                  </p>
                  {isOpen && (
                    <p className="mt-2 text-sm sm:text-base text-brand-gray-650">
                      {item.answer}
                    </p>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-brand-gray-650 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}
