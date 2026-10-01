import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const reasons = [
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
];

const offerings = [
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

export default function BouncyCastleSeoContent() {
  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Bouncy Castle Hire - Safe and Fun Rentals for All Ages
          </h2>
          <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
            Find the perfect inflatable entertainment for your event. At YMA
            Bouncy Castles, we are a trusted bouncy castle hire company.
            Whether it&apos;s a children&apos;s birthday party, corporate event, or
            wedding, our inflatables provide safe and exciting fun for all
            guests. We offer a variety of bouncy castles, slides, and obstacle
            courses to suit any occasion.
          </p>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Why Choose YMA Bouncy Castles for Your Bouncy Castle Hire?
          </h2>
          <ul className="mt-6 space-y-5">
            {reasons.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Our Bouncy Castle Rentals for Every Occasion
          </h2>
          <ul className="mt-6 space-y-5">
            {offerings.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>

          <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
            <Link href="/booking-catalog/garden-games-hire">Garden Games Hire</Link>{" "}
            | <Link href="/booking-catalog/soft-play-hire"> Soft Play Hire</Link>{" "}
            | <Link href="/booking-catalog/fun-food-hire"> Fun Food Hire</Link>{" "}
            | <Link href="/booking-catalog/obstacle-course-slides-hire"> Obstacle Course/Slides Hire</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
