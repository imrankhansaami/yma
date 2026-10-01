"use client";

import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const searchParams = useSearchParams();
  return searchParams.get("orderNumber") || searchParams.get("ref") || "—";
}
