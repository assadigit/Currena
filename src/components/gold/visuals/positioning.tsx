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
import { fmtAxisDate, fmtNumber } from "@/lib/gold/format";

const chartConfig = {
  netSpecs: { label: "Net spec position (k)", color: "var(--chart-2)" },
  etfFlow: { label: "ETF flow (t)", color: "var(--gold)" },
} satisfies ChartConfig;

interface PositioningVisualProps {
  data: VisualsPayload["positioning"];
}

/** V5 · Positioning & flows: net specs line vs weekly ETF flow bars. */
export function PositioningVisual({ data }: PositioningVisualProps) {
  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[240px] w-full"
      >
        <ComposedChart
          data={data.series}
          margin={{ top: 14, right: 8, bottom: 0, left: 4 }}
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
            yAxisId="specs"
            width={52}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}k`}
            domain={["dataMin - 10", "dataMax + 10"]}
          />
          <YAxis
            yAxisId="flow"
            orientation="right"
            width={40}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v.toFixed(0)}`}
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
                          name === "etfFlow"
                            ? "var(--gold)"
                            : "var(--chart-2)",
                      }}
                    />
                    {name === "etfFlow" ? "ETF flow" : "Net specs"}
                    <span className="ml-auto font-semibold tabular">
                      {name === "etfFlow"
                        ? `${Number(value).toFixed(1)} t`
                        : `${fmtNumber(Number(value))}k`}
                    </span>
                  </>
                )}
              />
            }
          />

          <ReferenceLine
            yAxisId="flow"
            y={0}
            stroke="var(--border)"
          />

          <Bar
            yAxisId="flow"
            dataKey="etfFlow"
            barSize={7}
            radius={[2, 2, 0, 0]}
          >
            {data.series.map((p, i) => (
              <Cell
                key={i}
                fill={p.etfFlow >= 0 ? "var(--gold)" : "var(--bear)"}
                fillOpacity={0.75}
              />
            ))}
          </Bar>
          <Line
            yAxisId="specs"
            dataKey="netSpecs"
            type="monotone"
            stroke="var(--chart-2)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </ComposedChart>
      </ChartContainer>

      {/* Direct axis legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-0.5 w-5 rounded-full"
            style={{ backgroundColor: "var(--chart-2)" }}
          />
          Net spec position · left axis (thousand contracts)
        </span>
        <span className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="inline-block h-3 w-2.5 rounded-sm"
            style={{ backgroundColor: "var(--gold)" }}
          />
          Weekly ETF flow · right axis (tonnes) —{" "}
          <span className="tabular">
            4-week {data.etfFlow4w >= 0 ? "+" : ""}
            {data.etfFlow4w.toFixed(1)} t
          </span>
        </span>
      </div>
    </div>
  );
}
