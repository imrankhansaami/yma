import type { Metadata } from "next";
import { privateCanonical } from "@/lib/canonical";

export const metadata: Metadata = {
  ...privateCanonical("/login"),
  title: "Account Access",
  description:
    "Login, sign up, and manage your YMA account securely to book products faster.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
