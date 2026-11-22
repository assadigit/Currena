"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { VisualsPayload } from "@/lib/gold/types";
import { fmtAxisDate } from "@/lib/gold/format";

const chartConfig = {
  vol: { label: "20-day realised vol", color: "var(--gold)" },
} satisfies ChartConfig;

interface VolatilityVisualProps {
  data: VisualsPayload["volatility"];
}

/** V4 · Volatility regime: annualised realised vol with quartile bands. */
export function VolatilityVisual({ data }: VolatilityVisualProps) {
  const series = data.series;
  const last = series[series.length - 1];

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[240px] w-full"
    >
      <AreaChart
        data={series}
        margin={{ top: 14, right: 40, bottom: 0, left: 4 }}
      >
        <defs>
          <linearGradient id="volFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={40}
          tickFormatter={(v: string) => fmtAxisDate(v)}
        />
        <YAxis
          width={38}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}%`}
          domain={["dataMin - 2", "dataMax + 2"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(v) => fmtAxisDate(String(v))}
              formatter={(value) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{ backgroundColor: "var(--gold)" }}
                  />
                  Realised vol
                  <span className="ml-auto font-semibold tabular">
                    {Number(value).toFixed(2)}%
                  </span>
                </>
              )}
            />
          }
        />

        <ReferenceLine
          y={data.p75}
          stroke="var(--bear)"
          strokeDasharray="5 4"
          strokeOpacity={0.5}
          label={{
            value: `75th pct ${data.p75.toFixed(0)}%`,
            position: "insideTopRight",
            fontSize: 10,
            fill: "var(--bear)",
          }}
        />
        <ReferenceLine
          y={data.p25}
          stroke="var(--bull)"
          strokeDasharray="5 4"
          strokeOpacity={0.5}
          label={{
            value: `25th pct ${data.p25.toFixed(0)}%`,
            position: "insideBottomRight",
            fontSize: 10,
            fill: "var(--bull)",
          }}
        />

        <Area
          dataKey="vol"
          type="monotone"
          stroke="var(--gold)"
          strokeWidth={2}
          fill="url(#volFill)"
          dot={false}
          activeDot={{ r: 4 }}
        />

        {last ? (
          <ReferenceDot
            x={last.date}
            y={last.vol}
            r={4.5}
            fill="var(--gold)"
            stroke="var(--background)"
            strokeWidth={2}
            label={{
              value: `${last.vol.toFixed(1)}%`,
              position: "right",
              fontSize: 11,
              fontWeight: 600,
              fill: "var(--gold)",
            }}
          />
        ) : null}
      </AreaChart>
    </ChartContainer>
  );
}
