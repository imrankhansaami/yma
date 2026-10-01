"use client";

import { addDays, format } from "date-fns";
import { Calendar as CalendarIcon, Loader2 } from "lucide-react";
import * as React from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fetchRevenueOverTime } from "@/services/order.service";

type RevenuePoint = {
  date: Date;
  xLabel: string;
  displayDate: string;
  value: number;
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: any[];
}) => {
  if (!active || !payload || !payload.length) return null;
  const point = payload[0].payload as RevenuePoint;

  return (
    <div className="rounded-lg bg-black px-3 py-2 shadow-lg">
      <div className="text-[11px] text-white/80">{point.displayDate}</div>
      <div className="mt-1 text-sm font-semibold text-white">
        ${point.value.toLocaleString()}
      </div>
    </div>
  );
};

export default function RevenueOverview() {
  const [range, setRange] = React.useState<DateRange | undefined>(() => {
    const to = new Date();
    const from = addDays(to, -30); // Default to last 30 days
    return { from, to };
  });

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ["revenue-over-time", range],
    queryFn: async () => {
      if (!range?.from) return [];
      const startDate = format(range.from, "yyyy-MM-dd");
      const endDate = format(range.to || range.from, "yyyy-MM-dd");
      return fetchRevenueOverTime({ startDate, endDate, status: "confirmed" });
    },
    enabled: !!range?.from,
  });

  const chartData = React.useMemo(() => {
    if (!revenueData) return [];

    return revenueData.map((item) => {
      const d = new Date(item.date);
      return {
        date: d,
        xLabel: format(d, "MMM d"),
        displayDate: format(d, "d MMM, yyyy"),
        value: item.revenue,
      };
    });
  }, [revenueData]);

  const selectedLabel =
    range?.from
      ? range.to
        ? `${format(range.from, "MMM d, yyyy")} – ${format(
            range.to,
            "MMM d, yyyy"
          )}`
        : format(range.from, "MMM d, yyyy")
      : "Select date range";

  const xTicks =
    chartData.length >= 2
      ? [chartData[0].xLabel, chartData[chartData.length - 1].xLabel]
      : [];

  return (
    <section className="w-full max-w-[70%]">
      {/* Top heading */}
      <div className="mb-4">
        <h2 className="font-semibold text-slate-900">Revenue Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Detailed revenue breakdown for the selected date range.
        </p>
      </div>

      <Card className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 px-5 pt-4 pb-3">
          <div>
            <CardTitle className="font-semibold text-slate-900">
              Sales
            </CardTitle>
          </div>

          {/* Date range picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-8 rounded-lg border-slate-200 bg-white px-3 text-xs font-medium text-slate-900 shadow-sm",
                  "inline-flex items-center gap-2"
                )}
              >
                <CalendarIcon className="h-3.5 w-3.5 text-slate-500" />
                <span className="truncate max-w-[160px] text-left">
                  {selectedLabel}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-xl border-slate-200 bg-white p-3"
              align="end"
            >
              <Calendar
                mode="range"
                numberOfMonths={2}
                selected={range}
                disabled={{ after: new Date() }}
                onSelect={setRange}
                defaultMonth={range?.from}
                className="rounded-md font-inter"
              />
            </PopoverContent>
          </Popover>
        </CardHeader>

        <CardContent className="px-1">
          <div className="h-56 w-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                <Loader2 className="h-6 w-6 animate-spin text-brand-orange-500" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 24, left: 24, bottom: 16 }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="var(--c-F97316)"
                      stopOpacity={0.22}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--c-F97316)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="xLabel"
                  ticks={xTicks}
                  tickLine={false}
                  axisLine={{ stroke: "var(--c-E5E7EB)" }}
                  tick={{
                    fontSize: 11,
                    fill: "var(--c-9CA3AF)",
                  }}
                />

                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "var(--c-D1D5DB)",
                    strokeWidth: 1,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--c-F97316)"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
