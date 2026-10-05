import { SeoContentBlock } from "@/components/blocks/SeoContentBlock";
import type { SeoContentContent } from "@/lib/blocks/types";

/** Current copy, used until a `seoContent` block exists for this category. */
export const DEFAULT_SEO_CONTENT: SeoContentContent = {
  heading: "Fun Food Hire for Any Event",
  intro:
    "Add a sweet touch to your event. At YMA Bouncy Castles, we offer candy floss and popcorn machine rentals that will add fun and flavor to your celebration. Whether it's a kids' party, wedding, corporate event, or festival, our fun food options provide a delicious and interactive experience that will have your guests talking long after the event is over.",
  reasonsHeading:
    "Why Choose YMA Bouncy Castles for Your Candy Floss and Popcorn Machine Hire?",
  reasons: [
    {
      title: "Fresh and Delicious",
      body: "Both our candy floss and popcorn machines provide fresh, hot, and tasty treats made on-site at your event. These crowd favorites will bring joy to guests of all ages.",
    },
    {
      title: "Fun and Interactive",
      body: "Guests will love watching their favorite treats being made fresh right before their eyes. Our fun food stations are interactive, making them a hit at any event.",
    },
    {
      title: "Easy Setup and Takedown",
      body: "Our professional team will set up and operate the machines, ensuring a hassle-free experience. We handle everything from setup to cleanup, so you can focus on enjoying your event.",
    },
    {
      title: "Transparent Pricing",
      body: "Our pricing is clear and competitive with no hidden fees. You'll know exactly what you're paying for, and we offer great value for your investment.",
    },
    {
      title: "Trusted by Our Customers",
      body: "We've helped make many events extra special with our fun food services.",
    },
  ],
  offeringsHeading: "Our Candy Floss and Popcorn Machine Hire Options",
  offerings: [
    {
      title: "Candy Floss Machine",
      body: "Bring the carnival experience to your event with our Candy Floss Machine. Watch as fluffy, sugary candy floss is spun fresh for your guests. A timeless treat that is perfect for kids' parties, weddings, festivals, or corporate events. Available in various flavors and served on sticks or cones for easy enjoyment.",
    },
    {
      title: "Popcorn Machine",
      body: "No event is complete without Popcorn. Our Popcorn Machine delivers hot, freshly popped popcorn right at your event. With a classic buttery flavor, this treat is a favorite among kids and adults alike. Great for outdoor festivals, birthdays, and more.",
    },
  ],
  crossLinks: [
    { label: "Soft Play Hire", href: "/booking-catalog/soft-play-hire" },
    { label: "Bouncy Castle Hire", href: "/booking-catalog/bouncy-castle-hire" },
    { label: "Garden Games Hire", href: "/booking-catalog/garden-games-hire" },
    {
      label: "Obstacle Course/Slides Hire",
      href: "/booking-catalog/obstacle-course-slides-hire",
    },
  ],
};

export default function FunFoodSeoContent({
  content,
}: {
  content?: SeoContentContent;
}) {
  return (
    <SeoContentBlock content={{ ...DEFAULT_SEO_CONTENT, ...(content || {}) }} />
  );
}