import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const reasons = [
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
];

const offerings = [
  {
    title: "Candy Floss Machine",
    body: "Bring the carnival experience to your event with our Candy Floss Machine. Watch as fluffy, sugary candy floss is spun fresh for your guests. A timeless treat that is perfect for kids' parties, weddings, festivals, or corporate events. Available in various flavors and served on sticks or cones for easy enjoyment.",
  },
  {
    title: "Popcorn Machine",
    body: "No event is complete without Popcorn. Our Popcorn Machine delivers hot, freshly popped popcorn right at your event. With a classic buttery flavor, this treat is a favorite among kids and adults alike. Great for outdoor festivals, birthdays, and more.",
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

export default function FunFoodSeoContent() {
  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Fun Food Hire for Any Event
          </h2>
          <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
            Add a sweet touch to your event. At YMA Bouncy Castles, we offer
            candy floss and popcorn machine rentals that will add fun and
            flavor to your celebration. Whether it&apos;s a kids&apos; party, wedding,
            corporate event, or festival, our fun food options provide a
            delicious and interactive experience that will have your guests
            talking long after the event is over.
          </p>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Why Choose YMA Bouncy Castles for Your Candy Floss and Popcorn
            Machine Hire?
          </h2>
          <ul className="mt-6 space-y-5">
            {reasons.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Our Candy Floss and Popcorn Machine Hire Options
          </h2>
          <ul className="mt-6 space-y-5">
            {offerings.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>

          <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
            <Link href="/booking-catalog/soft-play-hire">Soft Play Hire</Link>{" "}
            | <Link href="/booking-catalog/bouncy-castle-hire"> Bouncy Castle Hire</Link>{" "}
            | <Link href="/booking-catalog/garden-games-hire"> Garden Games Hire</Link>{" "}
            | <Link href="/booking-catalog/obstacle-course-slides-hire"> Obstacle Course/Slides Hire</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
