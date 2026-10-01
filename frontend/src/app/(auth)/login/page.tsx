import Logo from "@/assets/logo2.png";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your YMA Bouncy Castles account.",
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
              Log in to your account
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Welcome back! Please enter your details.
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto mt-8 w-full max-w-[360px]">
            <Suspense
              fallback={
                <div className="rounded-2xl border border-brand-gray-150 bg-white px-4 py-6 text-sm text-brand-gray-600">
                  Loading login form...
                </div>
              }
            >
              <LoginClient />
            </Suspense>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-orange-500-brand hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
