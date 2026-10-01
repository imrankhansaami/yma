"use client";
import { fetchTopSelling } from "@/services/product.service";
import { ApiProduct } from "@/services/product.service";
import { useQuery } from "@tanstack/react-query";
import SampleImage from "@/assets/images/bg1.png";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function HighestDemandProduct() {
  const {
    data: products,
    isLoading,
    isError,
  } = useQuery<ApiProduct[]>({
    queryKey: ["top-selling-products"],
    queryFn: fetchTopSelling,
  });

  return (
    <section className="w-full max-w-[40%]">
      {/* Title + subtitle */}
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Highest Demand Product</h2>
        <p className="mt-1 text-sm text-slate-500">
          Highest-demand rental item based on total bookings
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Header row */}
        <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 px-4 pb-2">
          <span className="text-[12px] font-medium text-slate-600">
            Top Products
          </span>
          <span className="text-[12px] font-medium text-slate-600">Amount</span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-200">
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex animate-pulse items-center justify-between px-4 py-[10px]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-slate-200"></div>
                  <div className="h-4 w-48 rounded bg-slate-200"></div>
                </div>
                <div className="ml-4 h-4 w-12 rounded bg-slate-200"></div>
              </div>
            ))}
          {isError && (
            <div className="p-4 text-center text-sm text-red-500">
              Failed to load products.
            </div>
          )}
          {products?.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-4 py-[10px]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative h-9 w-9 overflow-hidden rounded-md border border-slate-200 bg-slate-100">
                  <Image
                    src={item.imageCover || SampleImage}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                </div>
                <p className="truncate text-[13px] text-slate-900">
                  {item.name}
                </p>
              </div>

              <span className="ml-4 whitespace-nowrap text-[13px] font-medium text-slate-900">
                ${item.price.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}

