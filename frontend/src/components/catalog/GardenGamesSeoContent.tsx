import { SeoContentBlock } from "@/components/blocks/SeoContentBlock";
import type { SeoContentContent } from "@/lib/blocks/types";

/** Current copy, used until a `seoContent` block exists for this category. */
export const DEFAULT_SEO_CONTENT: SeoContentContent = {
  heading: "Garden Games Hire - Fun & Engaging Rentals for Any Event",
  intro:
    "Find the perfect garden games for your event. At YMA Bouncy Castles, we offer a fantastic selection of garden games hire services to add extra fun to your outdoor events. Whether it's a birthday party, wedding, corporate gathering, or family celebration, our garden games are a great way to keep guests of all ages entertained. Our collection includes classic games and fun challenges that bring people together and create lasting memories.",
  reasonsHeading: "Why Choose YMA Bouncy Castles for Your Garden Games Hire?",
  reasons: [
    {
      title: "Safe and High-Quality Equipment",
      body: "We take safety seriously. All our garden games are designed to be fun and safe for players of all ages. The equipment is regularly cleaned and maintained, ensuring it's in top condition for your event.",
    },
    {
      title: "Wide Selection of Games",
      body: "Our garden games collection includes a variety of fun options for guests of all ages. From traditional games like Giant Jenga and Giant Connect 4, to more challenging options like Giant Snakes and Ladders, we have everything you need to make your event special.",
    },
    {
      title: "Easy Setup and Takedown",
      body: "Our experienced team ensures quick and easy setup of your garden games. We'll arrive on time and handle everything from setup to takedown, leaving you free to enjoy the event without any hassle.",
    },
    {
      title: "Transparent Pricing",
      body: "We offer competitive pricing with no hidden charges. You'll know exactly what you're paying for, and we provide great value for your investment.",
    },
    {
      title: "Trusted by Our Customers",
      body: "Our customers love our garden games for their simplicity and fun.",
    },
  ],
  offeringsHeading: "Our Garden Games for Every Occasion",
  offerings: [
    {
      title: "Nerf Target Shooting",
      body: "Perfect for all ages. Set up targets and take aim with Nerf guns. A thrilling game that tests accuracy and provides plenty of fun for everyone.",
    },
    {
      title: "Penalty Shootout",
      body: "Bring the excitement of football to your event. Our Penalty Shootout game lets players take penalty kicks and compete to score the most goals. Ideal for sports-themed parties and outdoor events.",
    },
    {
      title: "Snake and Ladder",
      body: "A life-size version of the classic board game. Roll the dice, climb ladders, and avoid the snakes in this exciting race to the finish line.",
    },
    {
      title: "Giant Jenga",
      body: "A classic favorite that never gets old. Stack the wooden blocks and carefully remove them one by one without toppling the tower. A great game for all ages, full of tension and fun.",
    },
    {
      title: "Connect 4",
      body: "Challenge your guests with this oversized version of the classic Connect 4 game. Drop the discs into the grid and try to get four in a row before your opponent does. Simple yet highly competitive.",
    },
  ],
  crossLinks: [
    { label: "Soft Play Hire", href: "/booking-catalog/soft-play-hire" },
    { label: "Bouncy Castle Hire", href: "/booking-catalog/bouncy-castle-hire" },
    { label: "Fun Food Hire", href: "/booking-catalog/fun-food-hire" },
    {
      label: "Obstacle Course/Slides Hire",
      href: "/booking-catalog/obstacle-course-slides-hire",
    },
  ],
};

export default function GardenGamesSeoContent({
  content,
}: {
  content?: SeoContentContent;
}) {
  return (
    <SeoContentBlock content={{ ...DEFAULT_SEO_CONTENT, ...(content || {}) }} />
  );
}