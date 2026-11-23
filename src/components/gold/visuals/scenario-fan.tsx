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
  bull: { label: "Bull path", color: "var(--bull)" },
  base: { label: "Base path", color: "var(--gold)" },
  bear: { label: "Bear path", color: "var(--bear)" },
} satisfies ChartConfig;

interface ScenarioFanVisualProps {
  data: VisualsPayload["scenarios"];
}

/** V7 · Scenario fan: 90-day bull/base/bear paths inside a shaded band. */
export function ScenarioFanVisual({ data }: ScenarioFanVisualProps) {
  const paths = data.paths;
  const first = paths[0];
  const last = paths[paths.length - 1];
  const spot = data.spot;
  const bull = data.summary.find((s) => s.id === "bull");
  const base = data.summary.find((s) => s.id === "base");
  const bear = data.summary.find((s) => s.id === "bear");

  return (
    <div>
      {/* Probability chips — direct labels beat a legend box */}
      <div className="mb-2 flex flex-wrap items-center gap-2 text-[11px]">
        {[
          { s: bull, cls: "bg-bull/10 text-bull border-bull/40", name: "Bull" },
          { s: base, cls: "bg-primary/10 text-primary border-primary/40", name: "Base" },
          { s: bear, cls: "bg-bear/10 text-bear border-bear/40", name: "Bear" },
        ].map(({ s, cls, name }) =>
          s ? (
            <span
              key={s.id}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium tabular ${cls}`}
            >
              {name} {s.probability}% → ${fmtPrice(s.target, 0)}
            </span>
          ) : null
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[260px] w-full"
      >
        <ComposedChart
          data={paths}
          margin={{ top: 12, right: 56, bottom: 0, left: 4 }}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={36}
            tickFormatter={(v: string) => fmtAxisDate(v)}
          />
          <YAxis
            width={56}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(2)}k`}
            domain={[
              (min: number) => min - 20,
              (max: number) => max + 20,
            ]}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => fmtAxisDate(String(v))}
                formatter={(value, name) => {
                  if (name === "band" || Array.isArray(value)) {
                    return null
                  }
                  return (
                  <>
                    <div
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          name === "bull"
                            ? "var(--bull)"
                            : name === "base"
                              ? "var(--gold)"
                              : "var(--bear)",
                      }}
                    />
                    {name === "bull"
                      ? "Bull"
                      : name === "base"
                        ? "Base"
                        : "Bear"}
                    <span className="ml-auto font-semibold tabular">
                      ${fmtPrice(Number(value), 0)}
                    </span>
                  </>
                  )
                }}
              />
            }
          />

          {/* Spot anchor line */}
          <ReferenceLine
            y={spot}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.6}
            label={{
              value: `spot $${fmtPrice(spot, 0)}`,
              position: "insideBottomLeft",
              fontSize: 10,
              fill: "var(--muted-foreground)",
            }}
          />

          {/* Shaded uncertainty band — excluded from the tooltip */}
          <Area
            dataKey="band"
            type="monotone"
            stroke="none"
            fill="var(--gold)"
            fillOpacity={0.08}
            activeDot={false}
            legendType="none"
            isAnimationActive={false}
            tooltipType="none"
          />

          <Line
            dataKey="bear"
            type="monotone"
            stroke="var(--bear)"
            strokeWidth={1.75}
            strokeDasharray="6 3"
            dot={false}
          />
          <Line
            dataKey="base"
            type="monotone"
            stroke="var(--gold)"
            strokeWidth={2.25}
            dot={false}
          />
          <Line
            dataKey="bull"
            type="monotone"
            stroke="var(--bull)"
            strokeWidth={1.75}
            strokeDasharray="6 3"
            dot={false}
          />

          {/* Endpoint callouts */}
          {last ? (
            <>
              <ReferenceDot
                x={last.date}
                y={last.bull}
                r={4}
                fill="var(--bull)"
                stroke="var(--background)"
                strokeWidth={1.5}
                label={{
                  value: `$${fmtPrice(last.bull, 0)}`,
                  position: "right",
                  fontSize: 10,
                  fontWeight: 600,
                  fill: "var(--bull)",
                }}
              />
              <ReferenceDot
                x={last.date}
                y={last.base}
                r={4}
                fill="var(--gold)"
                stroke="var(--background)"
                strokeWidth={1.5}
                label={{
                  value: `$${fmtPrice(last.base, 0)}`,
                  position: "right",
                  fontSize: 10,
                  fontWeight: 600,
                  fill: "var(--gold)",
                }}
              />
              <ReferenceDot
                x={last.date}
                y={last.bear}
                r={4}
                fill="var(--bear)"
                stroke="var(--background)"
                strokeWidth={1.5}
                label={{
                  value: `$${fmtPrice(last.bear, 0)}`,
                  position: "right",
                  fontSize: 10,
                  fontWeight: 600,
                  fill: "var(--bear)",
                }}
              />
            </>
          ) : null}
          {first ? (
            <ReferenceDot
              x={first.date}
              y={spot}
              r={4.5}
              fill="var(--gold)"
              stroke="var(--background)"
              strokeWidth={2}
            />
          ) : null}
        </ComposedChart>
      </ChartContainer>
    </div>
  );
}
