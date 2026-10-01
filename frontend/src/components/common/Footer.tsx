import { Clock3, Facebook, Instagram, Mail, Phone } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import Logo from "@/assets/logo.svg";
import { BsWhatsapp } from "react-icons/bs";

export default function Footer() {
  return (
    <footer className="w-full bg-brand-ink-975 text-white font-inter">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 py-12">
          <div>
            <Link href="/" aria-label="YMA Bouncy Castles home">
              <Image
                src={Logo}
                alt="YMA Bouncy Castles"
                className="w-[10rem]"
                priority
              />
            </Link>
            <p className="mt-6 text-sm text-brand-gray-175">
              Bringing Safe Fun to Every Event.
            </p>
            <div className="mt-5 flex items-center gap-2 text-white/90">
              <Link
                href="https://wa.me/message/VPVI6VXZP6KSJ1"
                aria-label="WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsWhatsapp className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.facebook.com/people/YMA-Bouncy-Castles-LTD/100092844622235"
                aria-label="Facebook"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="https://www.instagram.com/yma.bouncycastles"
                aria-label="Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <FooterList
            title="Useful links"
            items={[
              { label: "Booking Catalog", href: "/booking-catalog" },
              { label: "Contact Us", href: "/contact" },
              { label: "Terms & Conditions", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy-policy" },
            ]}
          />

          {/* Col 3: Explore */}
          <FooterList
            title="Explore YMA Bouncy Castle"
            items={[
              { label: "See Catalog", href: "/booking-catalog" },
              { label: "Our Locations", href: "/locations" },
              { label: "Read FAQ’s", href: "/faqs" },
            ]}
          />

          <div>
            <h2 className="text-sm font-semibold text-brand-gray-175">
              Contact Us
            </h2>

            <div className="mt-6 space-y-5">
              {/* Phone */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md border border-white/15 p-1.5 text-white/90">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] text-brand-gray-175 leading-none">
                    Phone Support
                  </p>
                  <Link
                    href="tel:07951431111"
                    className="mt-1 inline-block text-[15px] font-semibold tracking-wide hover:underline"
                  >
                    07951431111
                  </Link>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md border border-white/15 p-1.5 text-white/90">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] text-brand-gray-175 leading-none">
                    Office Hours
                  </p>
                  <p className="mt-1 text-[13px] text-brand-gray-175">
                    7 days a week–{" "}
                    <span className="font-medium">8am to 7pm</span>
                  </p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md border border-white/15 p-1.5 text-white/90">
                  <BsWhatsapp className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] text-brand-gray-175 leading-none">
                    WhatsApp
                  </p>
                  <Link
                    href="https://wa.me/message/VPVI6VXZP6KSJ1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-block text-[13px] text-brand-gray-175 hover:underline"
                  >
                    WhatsApp Chat
                  </Link>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-md border border-white/15 p-1.5 text-white/90">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[12px] text-brand-gray-175 leading-none">
                    Email Us
                  </p>
                  <Link
                    href="mailto:info@ymabouncycastles.uk"
                    className="mt-1 inline-block text-[13px] text-brand-gray-175 hover:underline"
                  >
                    info@ymabouncycastles.uk
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="border-t border-white/10" />

        <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <p className="text-[12px] text-brand-gray-175">
            © {new Date().getFullYear()} YMA Bouncy Castle– Fun Supplier.{" "}
            <span className="text-brand-gray-175">Developed By</span>{" "}
            <Link
              href="https://butterflydigital.ca"
              target="_blank"
              className="underline hover:text-white"
            >
              Butterfly Digital
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-brand-gray-175">{title}</h2>
      <ul className="mt-6 space-y-3">
        {items.map((it) => (
          <li key={it.href}>
            <Link
              href={it.href}
              className="text-[13px] text-brand-gray-175 hover:text-white transition-colors"
            >
              {it.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
