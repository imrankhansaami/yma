export default function BookingInfoStrip() {
  return (
    <section className="w-full my-10">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div
          className="
            rounded-xl border border-brand-gray-200 bg-white
            px-4 py-4 sm:px-6 sm:py-5 md:px-7 md:py-6 shadow-sm
          "
        >
          {/* Copy */}
          <div className="space-y-3 sm:space-y-4 font-inter">
            <p className="text-[14px] sm:text-[15px] leading-6 text-brand-gray-700">
              YMA Bouncy Castles brings{" "}
              <strong className="text-brand-ink-900">safe, affordable</strong>{" "}
              fun to your events across London, Essex, Enfield, and nearby
              areas. From children’s parties to festivals and corporate events,
              we’ve got bouncy castles, garden games, soft play, and more.
            </p>

            <p className="text-[14px] sm:text-[15px] leading-6 text-brand-gray-700">
              <span className="mr-2 align-middle text-brand-yellow-500">
                ✨
              </span>
              <strong className="text-brand-ink-900">
                Safety is our top priority
              </strong>{" "}
              – all our inflatables are fully insured, regularly maintained, and
              securely set up for worry-free fun.
            </p>

            <p className="text-[14px] sm:text-[15px] leading-6 text-brand-gray-700">
              Choose YMA Bouncy Castles for reliable service, endless
              entertainment, and unforgettable memories!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
