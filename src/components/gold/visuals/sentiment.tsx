"use client";

import * as React from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
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
  score: { label: "News sentiment", color: "var(--gold)" },
  price: { label: "Gold price", color: "var(--chart-2)" },
} satisfies ChartConfig;

interface SentimentVisualProps {
  data: VisualsPayload["sentiment"];
}

/** V6 · News sentiment timeline: sentiment bars under the price line. */
export function SentimentVisual({ data }: SentimentVisualProps) {
  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[240px] w-full"
      >
        <ComposedChart
          data={data.series}
          margin={{ top: 14, right: 6, bottom: 0, left: 4 }}
        >
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
            yAxisId="score"
            width={34}
            tickLine={false}
            axisLine={false}
            domain={[-1, 1]}
            ticks={[-1, -0.5, 0, 0.5, 1]}
            tickFormatter={(v: number) => v.toFixed(1)}
          />
          <YAxis
            yAxisId="price"
            orientation="right"
            width={54}
            tickLine={false}
            axisLine={false}
            domain={["dataMin - 20", "dataMax + 20"]}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}k`}
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
                          name === "score" ? "var(--gold)" : "var(--chart-2)",
                        borderRadius: name === "score" ? 2 : 999,
                      }}
                    />
                    {name === "score" ? "Sentiment" : "Price"}
                    <span className="ml-auto font-semibold tabular">
                      {name === "score"
                        ? Number(value).toFixed(2)
                        : `$${fmtPrice(Number(value), 0)}`}
                    </span>
                  </>
                )}
              />
            }
          />

          <ReferenceLine yAxisId="score" y={0} stroke="var(--border)" />

          <Bar yAxisId="score" dataKey="score" barSize={6} radius={[2, 2, 2, 2]}>
            {data.series.map((p, i) => (
              <Cell
                key={i}
                fill={
                  p.score > 0.08
                    ? "var(--bull)"
                    : p.score < -0.08
                      ? "var(--bear)"
                      : "var(--flat)"
                }
                fillOpacity={0.7}
              />
            ))}
          </Bar>
          <Line
            yAxisId="price"
            dataKey="price"
            type="monotone"
            stroke="var(--chart-2)"
            strokeWidth={1.75}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-2.5 rounded-sm bg-bull/80" />
          Positive headlines
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-2.5 rounded-sm bg-flat/80" />
          Neutral
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-3 w-2.5 rounded-sm bg-bear/80" />
          Negative
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: "var(--chart-2)" }}
          />
          Gold price · right axis
        </span>
      </div>
    </div>
  );
}
