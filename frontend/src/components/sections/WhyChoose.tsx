import {
  BadgeDollarSign,
  Castle,
  ShieldCheck,
  SmilePlus,
  CalendarCheck,
  LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "green" | "yellow" | "blue" | "orange" | "cyan";

type Feature = {
  title: string;
  desc: string;
  Icon: LucideIcon;
  theme: Theme;
  iconAlt?: string;
};

const THEME_STYLES: Record<
  Theme,
  {
    card: string;
    iconWrapper: string;
    icon: string;
  }
> = {
  green: {
    card: "bg-brand-green-500/[0.1] border-brand-green-500/20 hover:border-brand-green-500 hover:shadow-[0_10px_40px_-10px_rgba(34,197,94,0.3)]",
    iconWrapper: "bg-white group-hover:bg-brand-green-500",
    icon: "text-brand-green-500 group-hover:text-white",
  },
  yellow: {
    card: "bg-brand-yellow-500/[0.1] border-brand-yellow-500/20 hover:border-brand-yellow-500 hover:shadow-[0_10px_40px_-10px_rgba(234,179,8,0.3)]",
    iconWrapper: "bg-white group-hover:bg-brand-yellow-500",
    icon: "text-brand-yellow-500 group-hover:text-white",
  },
  blue: {
    card: "bg-brand-blue-500/[0.1] border-brand-blue-500/20 hover:border-brand-blue-500 hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)]",
    iconWrapper: "bg-white group-hover:bg-brand-blue-500",
    icon: "text-brand-blue-500 group-hover:text-white",
  },
  orange: {
    card: "bg-brand-orange-500/[0.1] border-brand-orange-500/20 hover:border-brand-orange-500 hover:shadow-[0_10px_40px_-10px_rgba(249,115,22,0.3)]",
    iconWrapper: "bg-white group-hover:bg-brand-orange-500",
    icon: "text-brand-orange-500 group-hover:text-white",
  },
  cyan: {
    card: "bg-brand-cyan-400/[0.1] border-brand-cyan-400/20 hover:border-brand-cyan-400 hover:shadow-[0_10px_40px_-10px_rgba(34,211,238,0.3)]",
    iconWrapper: "bg-white group-hover:bg-brand-cyan-400",
    icon: "text-brand-cyan-400 group-hover:text-white",
  },
};

const TOP_FEATURES: Feature[] = [
  {
    title: "Fair, Transparent Pricing",
    desc: "Clear pricing with great value — no surprises at checkout.",
    Icon: BadgeDollarSign,
    theme: "green",
    iconAlt: "Dollar sign icon representing affordable pricing",
  },
  {
    title: "Huge Range of Options",
    desc: "Castles, slides, soft play, and more — something for every age and event.",
    Icon: Castle,
    theme: "yellow",
    iconAlt: "Castle icon representing wide selection and variety",
  },
  {
    title: "Clean & Safety‑Checked Gear",
    desc: "Every item is cleaned, inspected, and set up to keep your event safe.",
    Icon: ShieldCheck,
    theme: "blue",
    iconAlt: "Shield check icon representing quality and standards",
  },
];

const BOTTOM_FEATURES: Feature[] = [
  {
    title: "Friendly, Reliable Team",
    desc: "On‑time delivery, quick setup, and a team that’s easy to reach.",
    Icon: SmilePlus,
    theme: "orange",
    iconAlt: "Smiley face icon representing friendly service",
  },
  {
    title: "Simple Booking, Fast Support",
    desc: "Book online in minutes and get help whenever you need it.",
    Icon: CalendarCheck,
    theme: "cyan",
    iconAlt: "Calendar check icon representing easy and hassle-free experience",
  },
];

export default function WhyChoose() {
  return (
    <section className="w-full py-12  md:py-16 font-inter">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 pb-14 sm:pb-18 lg:pb-24">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-10 md:mb-12">
          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
            Why Families and Event Organisers Across the UK <br /> Choose YMA
            Bouncy Castles
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 lg:gap-7">
          {TOP_FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        <div className="mt-8 md:mt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 lg:gap-7">
            <FeatureCard {...BOTTOM_FEATURES[0]} />

            <FeatureCard {...BOTTOM_FEATURES[1]} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ title, desc, Icon, theme }: Feature) {
  const styles = THEME_STYLES[theme];

  return (
    <div
      className={cn(
        "group relative h-full rounded-2xl border p-6 text-center transition-all duration-300",
        "shadow-md hover:-translate-y-2 hover:shadow-xl",
        styles.card
      )}
    >
      <div
        className={cn(
          "mx-auto mb-4 sm:mb-5 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl border border-brand-gray-200 transition-colors duration-300",
          styles.iconWrapper
        )}
      >
        <Icon className={cn("h-6 w-6 sm:h-7 sm:w-7 transition-colors duration-300", styles.icon)} />
      </div>
      <h3
        className="font-semibold text-[16px] sm:text-[18px] md:text-[20px] transition-colors duration-300 text-brand-ink-900"
      >
        {title}
      </h3>
      <p className="mt-3 text-brand-gray-600 text-[14px] sm:text-[15px] leading-6 font-medium">
        {desc}
      </p>
    </div>
  );
}
