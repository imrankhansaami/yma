import Logo from "@/assets/logo2.png";
import type { Metadata } from "next";
import Image from "next/image";

import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your YMA Bouncy Castles account password.",
  alternates: {
    canonical: "/forgot-password",
  },
};

export default function Page() {
  return (
    <main className="min-h-screen bg-background text-foreground font-inter">
      <div className="container mx-auto flex min-h-screen max-w-[920px] items-center justify-center px-4">
        <div className="w-full">
          {/* Logo */}
          <div className="flex justify-center">
            <Image src={Logo} alt="YMA Bouncy Castles" width={102} priority />
          </div>

          {/* Heading */}
          <div className="mt-6 text-center">
            <h1 className="text-[30px] font-semibold leading-8 tracking-[-0.02em] text-ink-900 dark:text-foreground">
              Forgot password?
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Please enter email we will sent you a link to
              <br className="hidden sm:block" />
              reset your password.
            </p>
          </div>

          {/* Form */}
          <div className="mx-auto mt-8 w-full max-w-[360px]">
            <ForgotPasswordClient />
          </div>
        </div>
      </div>
    </main>
  );
}
