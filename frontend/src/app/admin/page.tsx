"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { fetchDashboardStats } from "@/services/order.service";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, PackageCheck, PackagePlus, Truck } from "lucide-react";
import dynamic from "next/dynamic";

const RevenueOverview = dynamic(
  () => import("@/components/admin/dashboard/RevenueOverview"),
  {
    ssr: false,
    loading: () => <div className="h-[360px] w-full rounded-2xl bg-slate-50" />,
  },
);

const HighestDemandProduct = dynamic(
  () => import("@/components/admin/dashboard/HighestDemandProduct"),
  {
    loading: () => <div className="h-[360px] w-full rounded-2xl bg-slate-50" />,
  },
);

const OrdersTable = dynamic(
  () =>
    import("@/components/admin/dashboard/OrdersTable").then((mod) => mod.OrdersTable),
  {
    loading: () => <div className="h-[420px] w-full rounded-2xl bg-slate-50" />,
  },
);

export default function AdminDashboardPage() {
  const {
    data: stats,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
  });

  const kpiCards = [
    {
      label: "Revenue Generated Today",
      value: `$${stats?.todayRevenue?.toFixed(2) ?? "0.00"}`,
      icon: DollarSign,
    },
    {
      label: "Pending Confirmations",
      value: stats?.pendingConfirmations ?? 0,
      icon: PackageCheck,
    },
    {
      label: "Today&apos;s Bookings",
      value: stats?.todayBookings ?? 0,
      icon: PackagePlus,
    },
    {
      label: "Today&apos;s Deliveries",
      value: stats?.todayDeliveries ?? 0,
      icon: Truck,
    },
  ] as const;

  return (
    <div className="w-full mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <Card
                key={index}
                className="rounded-2xl border border-slate-200 shadow-sm"
              >
                <CardHeader className="px-6 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="h-4 w-3/4 rounded bg-slate-100" />
                    <div className="h-4 w-4 rounded bg-slate-100" />
                  </div>
                </CardHeader>
                <CardContent className="px-6 pt-0">
                  <div className="h-8 w-1/2 rounded bg-slate-100 mt-2" />
                </CardContent>
              </Card>
            ))
          : kpiCards.map(({ label, value, icon: Icon }) => (
              <Card
                key={label}
                className="rounded-2xl border border-slate-200 shadow-sm"
              >
                <CardHeader className="px-6 pb-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-sm font-medium text-slate-700 leading-4"
                      dangerouslySetInnerHTML={{ __html: label }}
                    />
                    <Icon className="h-4 w-4 text-slate-700" />
                  </div>
                </CardHeader>
                <CardContent className="px-6 pt-0">
                  <p className="text-[22px] font-semibold tracking-tight text-slate-900">
                    {value}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>
      {isError && (
        <div className="text-red-500 text-center py-4">
          Failed to load dashboard data. Please try again later.
        </div>
      )}
      <div className="mt-10 flex gap-10">
        <RevenueOverview />
        <HighestDemandProduct />
      </div>
      <div className="mt-6 mb-2">
        <h2 className="font-semibold text-slate-900">Order Summary</h2>
        <p className="mt-1 text-sm text-slate-500">
          List of all bouncy castle rental orders.
        </p>
      </div>
      <OrdersTable />
    </div>
  );
}
