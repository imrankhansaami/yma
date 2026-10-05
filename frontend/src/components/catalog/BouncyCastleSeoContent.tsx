import { SeoContentBlock } from "@/components/blocks/SeoContentBlock";
import type { SeoContentContent } from "@/lib/blocks/types";

/** Current copy, used until a `seoContent` block exists for this category. */
export const DEFAULT_SEO_CONTENT: SeoContentContent = {
  heading: "Bouncy Castle Hire - Safe and Fun Rentals for All Ages",
  intro:
    "Find the perfect inflatable entertainment for your event. At YMA Bouncy Castles, we are a trusted bouncy castle hire company. Whether it's a children's birthday party, corporate event, or wedding, our inflatables provide safe and exciting fun for all guests. We offer a variety of bouncy castles, slides, and obstacle courses to suit any occasion.",
  reasonsHeading:
    "Why Choose YMA Bouncy Castles for Your Bouncy Castle Hire?",
  reasons: [
    {
      title: "Safety First - Certified Equipment",
      body: "All our inflatables meet PIPA and RPII safety standards. We ensure that our equipment is regularly tested to keep your guests safe throughout the event.",
    },
    {
      title: "High-Quality, Well-Maintained Equipment",
      body: "We maintain our inflatables to the highest standards. Each one is thoroughly cleaned and checked after every hire to make sure it's in top condition for your event.",
    },
    {
      title: "Experienced Team",
      body: "Our team arrives on time and handles the setup and takedown. You can count on us for a smooth experience, leaving you free to enjoy your event.",
    },
    {
      title: "Transparent Pricing",
      body: "Our pricing is straightforward with no hidden charges. We offer competitive rates that provide value for your investment.",
    },
    {
      title: "Trusted by Customers",
      body: "Our customers trust us for delivering on our promises. Check out reviews from satisfied clients.",
    },
  ],
  offeringsHeading: "Our Bouncy Castle Rentals for Every Occasion",
  offerings: [
    {
      title: "Kids' Bouncy Castles",
      body: "We offer bouncy castles in fun themes like princesses, superheroes, and jungle adventures. These are ideal for children's birthdays, school events, and community celebrations.",
    },
    {
      title: "Adult Bouncy Castles",
      body: "Our larger bouncy castles are perfect for adult parties, weddings, and corporate events. Designed for durability, they provide fun for all guests, regardless of age.",
    },
    {
      title: "Low-Height Bouncy Castles",
      body: "For indoor venues with limited ceiling space, we provide low-height bouncy castles that fit comfortably in school halls, community centers, and more.",
    },
    {
      title: "Bounce N Slide Combos",
      body: "These combo units combine the fun of bouncing with the excitement of sliding, ideal for events with mixed age groups.",
    },
    {
      title: "Disco Domes",
      body: "Our disco domes come with integrated lights and sound systems, turning your party into a dance event. Perfect for birthdays, festivals, and any celebration.",
    },
    {
      title: "Mega Slides & Obstacle Courses",
      body: "For larger events, our mega slides and obstacle courses provide added fun and excitement. These inflatables are perfect for festivals, fairs, and big gatherings.",
    },
    {
      title: "Soft Play & Ball Pools",
      body: "We offer soft play areas and ball pools for younger children, making sure everyone at your event has something fun to do.",
    },
  ],
  crossLinks: [
    { label: "Garden Games Hire", href: "/booking-catalog/garden-games-hire" },
    { label: "Soft Play Hire", href: "/booking-catalog/soft-play-hire" },
    { label: "Fun Food Hire", href: "/booking-catalog/fun-food-hire" },
    {
      label: "Obstacle Course/Slides Hire",
      href: "/booking-catalog/obstacle-course-slides-hire",
    },
  ],
};

export default function BouncyCastleSeoContent({
  content,
}: {
  content?: SeoContentContent;
}) {
  return (
    <SeoContentBlock content={{ ...DEFAULT_SEO_CONTENT, ...(content || {}) }} />
  );
}