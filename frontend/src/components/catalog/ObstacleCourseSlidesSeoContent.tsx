import { SeoContentBlock } from "@/components/blocks/SeoContentBlock";
import type { SeoContentContent } from "@/lib/blocks/types";

/** Current copy, used until a `seoContent` block exists for this category. */
export const DEFAULT_SEO_CONTENT: SeoContentContent = {
  heading:
    "Obstacle Course/Slides Hire - Action-Packed Fun for Every Event",
  intro:
    "Bring high-energy entertainment to your event with obstacle course and slide hire from YMA Bouncy Castles. Whether it's a birthday party, school event, festival, or corporate day, our inflatables deliver safe, exciting fun for guests of all ages. We offer a strong range of obstacle courses and slides to suit different venues, age groups, and event styles.",
  reasonsHeading:
    "Why Choose YMA Bouncy Castles for Your Obstacle Course/Slides Hire?",
  reasons: [
    {
      title: "Safety First - Certified Equipment",
      body: "Our obstacle courses and slides are maintained to strict safety standards so guests can enjoy active fun with confidence. Every unit is checked, cleaned, and prepared before each hire.",
    },
    {
      title: "Exciting Options for All Ages",
      body: "From fast-paced inflatable challenges to giant slides, we offer options for children, teens, and adults. Our range makes it easy to match the right setup to your event size and audience.",
    },
    {
      title: "Professional Setup and Takedown",
      body: "Our experienced team handles delivery, setup, and takedown on time, so you can focus on the event itself. We make sure every inflatable is installed securely and ready to use.",
    },
    {
      title: "Transparent Pricing",
      body: "We keep pricing clear and competitive with no hidden fees. You know exactly what is included, helping you plan your event budget with confidence.",
    },
    {
      title: "Trusted by Customers",
      body: "Families, schools, and event organizers choose us for reliable service, quality equipment, and smooth event-day support.",
    },
  ],
  offeringsHeading: "Our Obstacle Course and Slide Hire Options",
  offerings: [
    {
      title: "Inflatable Obstacle Courses",
      body: "Perfect for parties, school events, and community days, our obstacle courses challenge guests to climb, crawl, and race to the finish. Great for energetic competition and group fun.",
    },
    {
      title: "Mega Slides",
      body: "Our inflatable slides add instant excitement to any event. Guests can enjoy repeated runs in a safe, supervised setup that keeps the entertainment going all day.",
    },
    {
      title: "Obstacle and Slide Combos",
      body: "For bigger events, combo units bring together climbing, bouncing, and sliding in one inflatable. These are ideal when you want maximum variety without needing multiple separate units.",
    },
    {
      title: "Low-Height and Venue-Friendly Options",
      body: "Hosting indoors or in a limited-space venue? We offer selected units suited for tighter areas so you can still bring high-energy entertainment to your event.",
    },
    {
      title: "Event-Ready Packages",
      body: "Need a full activity setup? We can help pair obstacle courses and slides with other hire categories to create a complete package tailored to your event.",
    },
  ],
  crossLinks: [
    { label: "Garden Games Hire", href: "/booking-catalog/garden-games-hire" },
    { label: "Soft Play Hire", href: "/booking-catalog/soft-play-hire" },
    { label: "Bouncy Castle Hire", href: "/booking-catalog/bouncy-castle-hire" },
    { label: "Fun Food Hire", href: "/booking-catalog/fun-food-hire" },
  ],
};

export default function ObstacleCourseSlidesSeoContent({
  content,
}: {
  content?: SeoContentContent;
}) {
  return (
    <SeoContentBlock content={{ ...DEFAULT_SEO_CONTENT, ...(content || {}) }} />
  );
}