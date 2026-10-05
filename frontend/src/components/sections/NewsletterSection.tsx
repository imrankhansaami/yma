  "use client";

import api from "@/api/api";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import type { NewsletterContent } from "@/lib/blocks/types";

const DEFAULT_NEWSLETTER: NewsletterContent = {
  title: "Stay Updated with Our Newsletter",
  body: "Join our community and never miss out on the latest news, exclusive updates, and special offers. Sign up for our newsletter to get valuable content delivered straight to your inbox!",
  placeholder: "Enter your email address",
  buttonLabel: "Subscribe Now",
  privacyPrefix:
    "We value your privacy. Your email will never be shared, and you can unsubscribe at any time. For more details, please read our",
  privacyLinkText: "Privacy Policy",
  privacyHref: "/privacy-policy",
};

export default function NewsletterSection({
  content,
}: {
  content?: NewsletterContent;
}) {
  const c = { ...DEFAULT_NEWSLETTER, ...(content || {}) };
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsSubmitting(true);
      await api.post("/newsletter/subscribe", { email });
      toast.success("Thanks for subscribing!");
      setEmail("");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Unable to subscribe right now";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-brand-gray-50 font-inter">
      <div className="mx-auto max-w-[1200px] px-4  py-12  md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Heading + Subtitle */}
          <div>
            <h2 className="font-inter font-semibold text-[22px] sm:text-[28px] md:text-[30px] leading-tight text-brand-ink-900">
              {c.title}
            </h2>
            <p className="mt-3 text-brand-gray-600 text-[14px] sm:text-[15px] max-w-[620px]">
              {c.body}
            </p>
          </div>

          {/* Right: Form */}
          <div className="lg:justify-self-end w-full max-w-[560px]">
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-3"
              noValidate
            >
              <input
                type="email"
                name="email"
                aria-label="Enter your email"
                placeholder={c.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full h-11 sm:h-12 rounded-md border border-brand-gray-150
                  bg-white px-3 sm:px-4 text-[14px] text-brand-ink-900
                  placeholder:text-brand-gray-400
                  focus:outline-none focus:ring-2 focus:ring-brand-yellow-500/0 focus:border-brand-gray-300
                "
                required
              />

              <button
                type="submit"
                className="cursor-pointer font-londrina shrink-0 h-11 sm:h-12 rounded-full px-4 sm:px-5 min-w-[170px] bg-brand-orange-400 hover:bg-brand-orange-500 text-white font-semibold border-[2px] border-white shadow-sm flex items-center justify-center transition-colors"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : c.buttonLabel}
              </button>
            </form>

            <p className="mt-2 text-[13px] text-brand-gray-600">
              {c.privacyPrefix}{" "}
              <Link
                href={c.privacyHref}
                className="underline underline-offset-2 hover:text-brand-ink-900"
              >
                {c.privacyLinkText}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
