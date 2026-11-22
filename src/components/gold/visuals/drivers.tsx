"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { VisualsPayload } from "@/lib/gold/types";
import { fmtBps } from "@/lib/gold/format";

const chartConfig = {
  pos: { label: "Supported gold", color: "var(--gold)" },
  neg: { label: "Weighed on gold", color: "var(--bear)" },
} satisfies ChartConfig;

interface DriversVisualProps {
  data: VisualsPayload["drivers"];
}

/** V2 · Driver attribution: signed contributions to the daily move, in bps. */
export function DriversVisual({ data }: DriversVisualProps) {
  const rows = React.useMemo(
    () =>
      data
        .slice()
        .sort((a, b) => b.bps - a.bps)
        .map((d) => ({
          ...d,
          pos: Math.max(0, d.bps),
          neg: Math.min(0, d.bps),
        })),
    [data]
  );

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.bps)), 1);
  const pad = Math.max(6, Math.round(maxAbs * 0.18));

  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[240px] w-full"
      >
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 44, bottom: 0, left: 8 }}
          barCategoryGap={10}
        >
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis
            type="number"
            domain={[-(maxAbs + pad), maxAbs + pad]}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}`}
            tickMargin={4}
          />
          <YAxis
            dataKey="driver"
            type="category"
            tickLine={false}
            axisLine={false}
            width={104}
            tick={{ fontSize: 11 }}
          />
          <ReferenceLine x={0} stroke="var(--border)" />

          {/* Positive contributions (gold) */}
          <Bar dataKey="pos" stackId="a" fill="var(--gold)" radius={[3, 3, 3, 3]}>
            <LabelList
              dataKey="bps"
              position="right"
              fontSize={10}
              className="tabular"
              formatter={(v: number) => (v > 0 ? fmtBps(v) : "")}
            />
          </Bar>
          {/* Negative contributions (terracotta) */}
          <Bar dataKey="neg" stackId="a" fill="var(--bear)" radius={[3, 3, 3, 3]}>
            <LabelList
              dataKey="bps"
              position="left"
              fontSize={10}
              className="tabular"
              formatter={(v: number) => (v < 0 ? fmtBps(v) : "")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      {/* Driver notes: the one-line explanations per bar */}
      <ul className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
        {rows.map((r) => (
          <li
            key={r.driver}
            className="flex items-start gap-2.5 text-xs leading-relaxed"
          >
            <span
              aria-hidden="true"
              className={`mt-[6px] h-2 w-2 shrink-0 rounded-full ${
                r.bps >= 0 ? "bg-gold" : "bg-bear"
              }`}
            />
            <span className="font-medium text-foreground/90">{r.driver}</span>
            <span className="tabular text-muted-foreground">{fmtBps(r.bps)}</span>
            <span className="text-muted-foreground">— {r.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
