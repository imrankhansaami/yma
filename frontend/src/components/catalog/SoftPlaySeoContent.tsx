import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const reasons = [
  {
    title: "Safety First - Certified Equipment",
    body: "All our soft play equipment meets safety standards, ensuring your little ones are safe while they play. Our equipment is regularly inspected and cleaned to guarantee a safe experience for everyone.",
  },
  {
    title: "High-Quality, Well-Maintained Equipment",
    body: "We maintain our soft play equipment to the highest standards. Each item is thoroughly cleaned and checked after every hire, making sure it's in perfect condition for your event.",
  },
  {
    title: "Experienced Team",
    body: "Our experienced team will handle the delivery, setup, and takedown, leaving you free to enjoy your event. We ensure the soft play areas are set up safely and securely, so you can relax knowing everything is taken care of.",
  },
  {
    title: "Transparent Pricing",
    body: "We offer competitive pricing with no hidden charges. You'll know exactly what to expect when you hire from us, ensuring you get great value for your investment.",
  },
  {
    title: "Trusted by Customers",
    body: "Our customers trust us for delivering safe, fun, and hassle-free experiences.",
  },
];

const offerings = [
  {
    title: "Soft Play for Toddlers",
    body: "Our soft play areas are designed for younger children, offering a safe, soft environment for them to explore and have fun. Perfect for birthday parties, family gatherings, and community events, our soft play sets will keep the little ones entertained for hours.",
  },
  {
    title: "Ball Pools",
    body: "Our colorful ball pools are a great addition to any event, providing a fun and safe environment for younger children to enjoy. They can play, jump, and dive into the soft, colorful balls, ensuring hours of entertainment.",
  },
  {
    title: "Interactive Playsets",
    body: "For more interactive fun, we offer various soft play sets that feature slides, tunnels, and obstacles designed for active play. These playsets are perfect for stimulating both physical and imaginative play, keeping children engaged throughout the event.",
  },
  {
    title: "Soft Play Combo Units",
    body: "Our soft play combo units combine multiple play features, offering more variety and fun. These are ideal for larger events or mixed-age groups, providing options that keep both toddlers and older children entertained.",
  },
  {
    title: "Portable Soft Play Areas",
    body: "If you're hosting an event at an indoor venue with limited space, our portable soft play areas are perfect. They can be easily set up in smaller spaces like community halls, school gyms, or living rooms, making them the ideal choice for indoor events.",
  },
];

function BulletRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-brand-orange-500" />
      <p className="text-[18px] leading-relaxed text-brand-gray-650">
        <strong className="text-brand-gray-700">{title}:</strong> {body}
      </p>
    </li>
  );
}

export default function SoftPlaySeoContent() {
  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Soft Play Hire - Safe and Fun Rentals for All Ages
          </h2>
          <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
            Find the perfect soft play entertainment for your event. At YMA
            Bouncy Castles, we offer trusted soft play hire services for events
            across all age groups. Whether it&apos;s a children&apos;s birthday party,
            corporate event, or wedding, our soft play equipment ensures safe
            and enjoyable fun for all your guests. We provide a range of soft
            play areas, ball pools, and interactive playsets that are perfect
            for younger children.
          </p>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Why Choose YMA Bouncy Castles for Your Soft Play Hire?
          </h2>
          <ul className="mt-6 space-y-5">
            {reasons.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Our Soft Play Rentals for Every Occasion
          </h2>
          <ul className="mt-6 space-y-5">
            {offerings.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>

          <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
            <Link href="/booking-catalog/garden-games-hire">Garden Games Hire</Link>{" "}
            | <Link href="/booking-catalog/bouncy-castle-hire"> Bouncy Castle Hire</Link>{" "}
            | <Link href="/booking-catalog/fun-food-hire"> Fun Food Hire</Link>{" "}
            | <Link href="/booking-catalog/obstacle-course-slides-hire"> Obstacle Course/Slides Hire</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
