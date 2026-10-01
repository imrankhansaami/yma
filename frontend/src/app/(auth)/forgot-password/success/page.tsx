import Success from "@/assets/images/forgot.png";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  title: "Check your inbox",
  description: "Password reset instructions sent.",
  ...privateCanonical("/forgot-password/success"),
};

export default function ForgotPasswordSuccessPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter">
      <div className="container mx-auto flex min-h-screen items-center justify-center px-4">
        <section className="w-full max-w-[520px] text-center">
          <div className="mb-6 flex justify-center">
            <Image src={Success} alt="success image" width={272} height={195} />
          </div>

          <h1 className="text-[30px] font-semibold leading-8 tracking-[-0.02em] text-ink-900 dark:text-foreground">
            Check your inbox
          </h1>

          <p className="mx-auto mt-3 max-w-[520px] text-base text-gray-600">
            We’ve sent a link to reset your password.
            <br />
            Please check your email and follow the instructions to set a new
            one.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="h-11 w-full sm:w-auto rounded-full bg-brand-orange-500 px-6 text-base font-medium text-white hover:bg-brand-orange-450"
            >
              <Link href="/">Go to Home</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 w-full sm:w-auto rounded-full px-6 text-base font-medium"
            >
              <Link href="/login">Back to Login</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
