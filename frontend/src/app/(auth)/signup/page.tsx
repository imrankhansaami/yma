import Logo from "@/assets/logo2.png";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import SignupClient from "./SignupClient";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a YMA Bouncy Castles account to start booking.",
  alternates: {
    canonical: "/signup",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter">
      <div className="container mx-auto flex min-h-screen max-w-[920px] items-center justify-center px-4">
        <div className="w-full">
          {/* Logo */}
          <div className="flex justify-center">
            <Link href="/" aria-label="Go to homepage">
              <Image src={Logo} alt="YMA Bouncy Castles" width={102} priority />
            </Link>
          </div>

          {/* Heading */}
          <div className="mt-6 text-center">
            <h1 className="text-[30px] font-semibold leading-8 tracking-[-0.02em] text-ink-900 dark:text-foreground">
              Create an account
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Please enter your details to create an account.
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto mt-8 w-full max-w-[360px]">
            <Suspense
              fallback={
                <div className="rounded-2xl border border-brand-gray-150 bg-white px-4 py-6 text-sm text-brand-gray-600">
                  Loading sign up form...
                </div>
              }
            >
              <SignupClient />
            </Suspense>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-orange-500-brand hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
