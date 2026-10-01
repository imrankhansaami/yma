import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

const reasons = [
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
];

const offerings = [
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

export default function GardenGamesSeoContent() {
  return (
    <section className="w-full bg-white pb-14 sm:pb-16 md:pb-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 font-inter">
        <div className="border-t border-brand-gray-175 pt-10 sm:pt-12">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Garden Games Hire - Fun &amp; Engaging Rentals for Any Event
          </h2>
          <p className="mt-6 max-w-[1150px] text-[17px] leading-relaxed text-brand-gray-650">
            Find the perfect garden games for your event. At YMA Bouncy
            Castles, we offer a fantastic selection of garden games hire
            services to add extra fun to your outdoor events. Whether it&apos;s a
            birthday party, wedding, corporate gathering, or family
            celebration, our garden games are a great way to keep guests of all
            ages entertained. Our collection includes classic games and fun
            challenges that bring people together and create lasting memories.
          </p>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Why Choose YMA Bouncy Castles for Your Garden Games Hire?
          </h2>
          <ul className="mt-6 space-y-5">
            {reasons.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>
        </div>

        <div className="pt-12 sm:pt-14">
          <h2 className="text-[40px] leading-tight font-semibold text-brand-ink-900">
            Our Garden Games for Every Occasion
          </h2>
          <ul className="mt-6 space-y-5">
            {offerings.map((item) => (
              <BulletRow key={item.title} title={item.title} body={item.body} />
            ))}
          </ul>

          <p className="mt-8 text-[16px] text-brand-gray-650 underline underline-offset-2">
            <Link href="/booking-catalog/soft-play-hire">Soft Play Hire</Link>{" "}
            | <Link href="/booking-catalog/bouncy-castle-hire"> Bouncy Castle Hire</Link>{" "}
            | <Link href="/booking-catalog/fun-food-hire"> Fun Food Hire</Link>{" "}
            | <Link href="/booking-catalog/obstacle-course-slides-hire"> Obstacle Course/Slides Hire</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
