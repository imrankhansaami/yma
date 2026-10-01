import Bg1 from "@/assets/images/bg1.png";
import Image from "next/image";
import Link from "next/link";
import ReserveNowBtn from "../common/btn/ReserveNowBtn";

export default function CastleHireSection() {
  return (
    <section className="w-full py-12 md:py-16 bg-brand-orange-50/40">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-stretch">
        {/* LEFT: Content */}
        <div className="rounded-2xl bg-white/90 p-6 sm:p-8 shadow-sm border border-white">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
              All ages
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
              Safe & insured
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              Fast setup
            </span>
          </div>

          <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900 mb-4">
            Bouncy Castle Hire in London, Essex & Enfield
          </h2>

          <p className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-4 font-inter">
            Friendly, professional rentals for kids and adults with great value
            and fast service across nearby areas.
          </p>

          <ul className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-6 font-inter list-disc pl-5 space-y-2">
            <li>Popular inflatables, soft play, garden games, and more.</li>
            <li>Perfect for birthdays, festivals, and corporate events.</li>
          </ul>

          <p className="text-brand-gray-450 text-[15px] sm:text-[16px] leading-relaxed mb-8 font-inter">
            Book your{" "}
            <Link
              href="/booking-catalog"
              className="text-brand-orange-500 underline hover:text-brand-orange-600"
            >
              bouncy castle hire
            </Link>{" "}
            today — safe, reliable, and fun.
          </p>
          <div className="flex justify-center md:justify-start">
            <ReserveNowBtn className="!w-[180px]" />
          </div>
        </div>

        {/* RIGHT: Image */}
        <div className="w-full h-full">
          <Image
            src={Bg1}
            alt="Bouncy castle"
            className="rounded-xl w-full h-full object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
