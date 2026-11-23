"use client";

import * as React from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
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
import { fmtAxisDate, fmtPrice } from "@/lib/gold/format";

const chartConfig = {
  price: { label: "Gold spot", color: "var(--gold)" },
  ma20: { label: "20-day MA", color: "var(--chart-2)" },
  ma50: { label: "50-day MA", color: "var(--chart-3)" },
} satisfies ChartConfig;

interface PriceChartVisualProps {
  data: VisualsPayload["price"];
}

/** V1 · Hero price chart: price, moving averages, events and key levels. */
export function PriceChartVisual({ data }: PriceChartVisualProps) {
  const points = data.points;
  const spot = points[points.length - 1]?.price ?? 0;

  // Map event dates to their price for the reference dots.
  const eventDots = React.useMemo(
    () =>
      data.events
        .map((e) => {
          const p = points.find((pt) => pt.date === e.date);
          return p ? { ...e, y: p.price } : null;
        })
        .filter((e): e is { date: string; label: string; sentiment: "positive" | "neutral" | "negative"; y: number } => e !== null),
    [data.events, points]
  );

  const support = data.levels.support[0];
  const resistance = data.levels.resistance[0];

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[320px] w-full sm:h-[340px]"
    >
      <ComposedChart data={points} margin={{ top: 16, right: 16, bottom: 0, left: 4 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={48}
          tickFormatter={(v: string) => fmtAxisDate(v)}
        />
        <YAxis
          width={62}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
          domain={["dataMin - 40", "dataMax + 40"]}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(v) => fmtAxisDate(String(v))}
              formatter={(value, name) => (
                <>
                  <div
                    className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                    style={{
                      backgroundColor:
                        name === "price"
                          ? "var(--gold)"
                          : name === "ma20"
                            ? "var(--chart-2)"
                            : "var(--chart-3)",
                    }}
                  />
                  {name === "price"
                    ? "Gold spot"
                    : name === "ma20"
                      ? "20-day MA"
                      : "50-day MA"}
                  <span className="ml-auto font-semibold tabular">
                    {name === "price"
                      ? `$${fmtPrice(Number(value))}`
                      : Number(value).toFixed(0)}
                  </span>
                </>
              )}
            />
          }
        />

        {/* Support / resistance context */}
        {resistance !== undefined ? (
          <ReferenceLine
            y={resistance}
            stroke="var(--bear)"
            strokeDasharray="5 5"
            strokeOpacity={0.55}
            label={{
              value: `R $${resistance.toFixed(0)}`,
              position: "insideTopRight",
              fontSize: 10,
              fill: "var(--bear)",
            }}
          />
        ) : null}
        {support !== undefined ? (
          <ReferenceLine
            y={support}
            stroke="var(--bull)"
            strokeDasharray="5 5"
            strokeOpacity={0.55}
            label={{
              value: `S $${support.toFixed(0)}`,
              position: "insideBottomRight",
              fontSize: 10,
              fill: "var(--bull)",
            }}
          />
        ) : null}

        <Area
          dataKey="price"
          type="monotone"
          stroke="var(--gold)"
          strokeWidth={2}
          fill="var(--gold)"
          fillOpacity={0.1}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          dataKey="ma20"
          type="monotone"
          stroke="var(--chart-2)"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="1 0"
        />
        <Line
          dataKey="ma50"
          type="monotone"
          stroke="var(--chart-3)"
          strokeWidth={1.5}
          dot={false}
          strokeDasharray="6 3"
        />

        {/* Today's spot callout */}
        <ReferenceDot
          x={points[points.length - 1]?.date}
          y={spot}
          r={4.5}
          fill="var(--gold)"
          stroke="var(--background)"
          strokeWidth={2}
          label={{
            value: `$${fmtPrice(spot, 0)}`,
            position: "right",
            fontSize: 11,
            fontWeight: 600,
            fill: "var(--gold)",
          }}
          isFront
        />

        {/* Catalyst events */}
        {eventDots.map((e) => (
          <ReferenceDot
            key={e.date}
            x={e.date}
            y={e.y}
            r={4}
            fill={
              e.sentiment === "positive"
                ? "var(--bull)"
                : e.sentiment === "negative"
                  ? "var(--bear)"
                  : "var(--flat)"
            }
            stroke="var(--background)"
            strokeWidth={1.5}
            label={{
              value: e.label,
              position: "top",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />
        ))}
      </ComposedChart>
    </ChartContainer>
  );
}
