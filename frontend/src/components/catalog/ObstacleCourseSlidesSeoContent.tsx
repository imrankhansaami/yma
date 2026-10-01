import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const reasons = [
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
];

const offerings = [
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

export default function ObstacleCourseSlidesSeoContent() {
  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Obstacle Course/Slides Hire - Action-Packed Fun for Every Event
          </h2>
          <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
            Bring high-energy entertainment to your event with obstacle course
            and slide hire from YMA Bouncy Castles. Whether it&apos;s a birthday
            party, school event, festival, or corporate day, our inflatables
            deliver safe, exciting fun for guests of all ages. We offer a
            strong range of obstacle courses and slides to suit different
            venues, age groups, and event styles.
          </p>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Why Choose YMA Bouncy Castles for Your Obstacle Course/Slides Hire?
          </h2>
          <ul className="mt-6 space-y-5">
            {reasons.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Our Obstacle Course and Slide Hire Options
          </h2>
          <ul className="mt-6 space-y-5">
            {offerings.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>

          <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
            <Link href="/booking-catalog/garden-games-hire">Garden Games Hire</Link>{" "}
            | <Link href="/booking-catalog/soft-play-hire"> Soft Play Hire</Link>{" "}
            | <Link href="/booking-catalog/bouncy-castle-hire"> Bouncy Castle Hire</Link>{" "}
            | <Link href="/booking-catalog/fun-food-hire"> Fun Food Hire</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
