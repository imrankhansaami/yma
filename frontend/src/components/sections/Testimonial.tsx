"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { A11y, Autoplay, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

import "swiper/css";
import "swiper/css/pagination";

type Testimonial = {
  quote: string;
  author: string;
  avatar?: string | null;
  rating?: number;
};

type GoogleReview = {
  rating?: number;
  text?: { text?: string };
  originalText?: { text?: string };
  publishTime?: string;
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
};

const normalizeAvatarUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("http://")) return url.replace("http://", "https://");
  return url;
};

const getStarCount = (rating?: number) => {
  const value = typeof rating === "number" ? rating : 5;
  return Math.min(5, Math.max(1, Math.round(value)));
};

const FALLBACK_TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "YMA Bouncy Castles was 10/10. The young man that delivered was punctual, professional and friendly. The equipment was lovely and they were very understanding when I had made a mistake on my booking. The price is very affordable. I’d 100% recommend them for your party equipment!",
    author: "Sian Palmer",
    avatar: null,
    rating: 5,
  },
  {
    quote:
      "Use YMA Bouncy Castles two years running and highly recommend. Very easy to book, great selection, and friendly service. On our most recent booking, we made a mistake on the bouncy castle size but they were very helpful in upgrading to a bigger size at the last minute. Much appreciated!",
    author: "Phil Kay",
    avatar: null,
    rating: 5,
  },
  {
    quote:
      "Thank you so much to YMA bouncy castles for the didi cars & connect 4 hired for my son’s birthday party! They were the perfect addition to make his day even more special. The didi cars especially were a massive hit amongst all the children! Thanks for your flexibility and accommodating my booking. You have a new loyal customer and can’t wait to book your products again!",
    author: "Naomi R",
    avatar: null,
    rating: 5,
  },
];

const AVATAR_TONES = [
  "bg-brand-orange-100 text-brand-orange-700",
  "bg-brand-blue-100 text-brand-blue-700",
  "bg-brand-green-50 text-brand-emerald-700",
  "bg-brand-gray-200 text-brand-ink-900",
  "bg-brand-yellow-500/20 text-brand-ink-900",
];

const getInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
};

const getToneClass = (name: string) => {
  const seed = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_TONES[seed % AVATAR_TONES.length];
};

export default function TestimonialSection() {
  const [reviews, setReviews] = useState<Testimonial[]>(FALLBACK_TESTIMONIALS);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    const placeId = process.env.NEXT_PUBLIC_GOOGLE_PLACES_PLACE_ID;

    if (!apiKey || !placeId) {
      setReviews(FALLBACK_TESTIMONIALS);
      return;
    }

    const fetchReviews = async () => {
      try {
        const placeResource = placeId.startsWith("places/")
          ? placeId
          : `places/${placeId}`;
        const res = await fetch(
          `https://places.googleapis.com/v1/${placeResource}`,
          {
            cache: "no-store",
            headers: {
              "X-Goog-Api-Key": apiKey,
              "X-Goog-FieldMask":
                "reviews.rating,reviews.text,reviews.originalText,reviews.publishTime,reviews.authorAttribution.displayName,reviews.authorAttribution.photoUri",
            },
          },
        );
        const data = (await res.json()) as { reviews?: GoogleReview[] };

        if (!res.ok || !Array.isArray(data.reviews) || data.reviews.length === 0) {
          setReviews(FALLBACK_TESTIMONIALS);
          return;
        }

        const latestReviews = [...data.reviews].sort((a, b) => {
          const aTime = a.publishTime ? new Date(a.publishTime).getTime() : 0;
          const bTime = b.publishTime ? new Date(b.publishTime).getTime() : 0;
          return bTime - aTime;
        });

        const mapped = latestReviews.slice(0, 5).map((review) => ({
          quote: review.text?.text ?? review.originalText?.text ?? "",
          author: review.authorAttribution?.displayName ?? "Guest",
          avatar: normalizeAvatarUrl(review.authorAttribution?.photoUri),
          rating: typeof review.rating === "number" ? review.rating : 5,
        }));

        const nonEmpty = mapped.filter((item) => item.quote.trim().length > 0);
        setReviews(nonEmpty.length > 0 ? nonEmpty : FALLBACK_TESTIMONIALS);
      } catch {
        setReviews(FALLBACK_TESTIMONIALS);
      }
    };

    void fetchReviews();
  }, []);

  return (
    <section className="w-full py-12 md:py-16 font-inter">
      <div className="mx-auto max-w-[900px] px-4 sm:px-6">
        <Swiper
          modules={[Pagination, A11y, Autoplay]}
          slidesPerView={1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 6000, disableOnInteraction: false }}
          className="testimonial-swiper"
        >
          {reviews.map((t, i) => (
            <SwiperSlide key={i} aria-roledescription="slide">
              <article className="text-center">
                <div className="mb-3 flex items-center justify-center gap-1.5 sm:mb-4 sm:gap-2">
                  {Array.from({ length: 5 }).map((_, idx) => {
                    const filled = idx < getStarCount(t.rating);
                    return (
                      <Star
                        key={idx}
                        className={`h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 ${
                          filled
                            ? "fill-current text-brand-yellow-500"
                            : "text-brand-yellow-500/35"
                        }`}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    );
                  })}
                </div>

                <p className="mx-auto max-w-[780px] text-[14px] leading-6 text-brand-ink-900 sm:text-[16px] sm:leading-7 md:text-[18px] md:leading-8">
                  {t.quote}
                </p>

                <div className="mt-5 flex flex-col items-center gap-2 sm:mt-6">
                  {t.avatar ? (
                    <img
                      src={t.avatar}
                      alt={t.author}
                      className="h-12 w-12 rounded-full object-cover sm:h-14 sm:w-14"
                      loading={i === 0 ? "eager" : "lazy"}
                    />
                  ) : (
                    <div
                      aria-label={`${t.author} avatar`}
                      className={`h-12 w-12 rounded-full sm:h-14 sm:w-14 flex items-center justify-center text-[13px] sm:text-[14px] font-semibold ${getToneClass(
                        t.author,
                      )}`}
                    >
                      {getInitials(t.author)}
                    </div>
                  )}
                  <span className="text-[11px] font-medium text-brand-ink-900 sm:text-[12px] md:text-[13px]">
                    {t.author}
                  </span>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .testimonial-swiper .swiper-pagination {
          position: relative;
          margin-top: 10px;
        }
        .testimonial-swiper .swiper-pagination-bullet {
          width: 6px;
          height: 6px;
          margin: 0 3px !important;
          background: var(--c-D0D5DD);
          opacity: 1;
        }
        .testimonial-swiper .swiper-pagination-bullet-active {
          background: var(--c-101828);
        }
      `}</style>
    </section>
  );
}
