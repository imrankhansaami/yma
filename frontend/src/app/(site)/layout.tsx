import Footer from "@/components/common/Footer";
import Navbar from "@/components/common/Navbar";
import { Phone } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

const CartSidebar = dynamic(() => import("@/components/cart/CartSidebar"), {
  loading: () => null,
});

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <CartSidebar />
      {children}
      <Footer />
      <Link
        href="tel:07951431111"
        aria-label="Call YMA Bouncy Castles"
        className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange-500 text-white shadow-[0_6px_18px_var(--alpha-black-25)] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-300"
      >
        <Phone className="h-5 w-5" />
      </Link>
    </>
  );
}
