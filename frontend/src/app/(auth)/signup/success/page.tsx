import Success from "@/assets/images/Simplification.png";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Signup Success",
  description: "Account created successfully.",
  ...privateCanonical("/signup/success"),
};

export default function SignupSuccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-[420px] text-center">
          <div className="mb-6 flex justify-center">
            <Image src={Success} alt="successImage" width={105} height={105} />
          </div>

          <h1 className="text-[28px] font-semibold leading-8 tracking-[-0.02em] text-ink-900 dark:text-foreground">
            Congratulations
          </h1>

          <p className="mx-auto mt-2 max-w-[420px] text-base text-gray-600">
            A link has been sent to your inbox to set a new password for your{" "}
            <span className="whitespace-nowrap">account.</span>
          </p>

          <div className="mt-6 flex justify-center">
            <Link href="/" className="w-full max-w-[320px]">
              <Button className="h-11 w-full rounded-full text-base font-medium bg-brand-orange-500 hover:bg-brand-orange-400 text-white cursor-pointer">
                View Bouncy Castles
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
