import type { FaqItem } from "./types";

/**
 * The location FAQ's default questions. Used to seed the editable FAQ block for
 * pages created before the FAQ became editable, and as the fallback when a page
 * has no FAQ items saved.
 */
export function defaultLocationFaq(locationName: string): FaqItem[] {
  const place = locationName?.trim() || "your area";
  return [
    {
      question: "Where can I hire a bouncy castle near me?",
      answer: `We provide bouncy castle hire in ${place}, including Barking, Ilford, Romford, and surrounding areas. Get in touch to check availability in your location.`,
    },
    {
      question: "How do I find the best bouncy castle hire near me?",
      answer:
        "Browse our catalog to compare sizes, themes, and prices, or message us for quick recommendations based on your event space.",
    },
    {
      question: "Do you offer same-day bookings?",
      answer:
        "Yes — depending on availability. Contact us early in the day to confirm if we can accommodate your timeframe.",
    },
    {
      question: "How do you ensure safety during the event?",
      answer:
        "All inflatables are inspected, cleaned, and anchored to PIPA standards. We provide clear safety guidance and perform setup checks.",
    },
    {
      question: "What areas do you cover for bouncy castle hire?",
      answer:
        "We cover most surrounding neighbourhoods; reach out with your postcode and we'll confirm delivery and setup options.",
    },
  ];
}
