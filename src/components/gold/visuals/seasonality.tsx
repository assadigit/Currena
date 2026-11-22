"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import type { VisualsPayload } from "@/lib/gold/types";
import { fmtPct } from "@/lib/gold/format";

const chartConfig = {
  avgReturn: { label: "Avg. return", color: "var(--gold)" },
} satisfies ChartConfig;

interface SeasonalityVisualProps {
  data: VisualsPayload["seasonality"];
}

/** V8 · Seasonality: average calendar-month returns with the current month highlighted. */
export function SeasonalityVisual({ data }: SeasonalityVisualProps) {
  const rows = React.useMemo(
    () =>
      data.months.map((m, i) => ({
        ...m,
        isCurrent: i === data.currentMonth,
      })),
    [data]
  );

  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.avgReturn)), 0.5);

  return (
    <div>
      <ChartContainer
        config={chartConfig}
        className="aspect-auto h-[220px] w-full"
      >
        <BarChart
          data={rows}
          margin={{ top: 18, right: 4, bottom: 0, left: 0 }}
          barCategoryGap={6}
        >
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            interval={0}
            tick={{ fontSize: 11 }}
          />
          <YAxis hide domain={[-maxAbs * 1.3, maxAbs * 1.3]} />
          <Bar dataKey="avgReturn" radius={[3, 3, 3, 3]} barSize={26}>
            {rows.map((r, i) => (
              <Cell
                key={i}
                fill={r.avgReturn >= 0 ? "var(--gold)" : "var(--bear)"}
                fillOpacity={r.isCurrent ? 0.95 : 0.45}
                stroke={r.isCurrent ? "var(--primary)" : "none"}
                strokeWidth={r.isCurrent ? 2 : 0}
              />
            ))}
            <LabelList
              dataKey="avgReturn"
              position="top"
              fontSize={10}
              className="tabular"
              formatter={(v: number) => (v > 0 ? fmtPct(v, 1) : "")}
            />
            <LabelList
              dataKey="avgReturn"
              position="bottom"
              fontSize={10}
              className="tabular"
              formatter={(v: number) => (v < 0 ? fmtPct(v, 1) : "")}
            />
          </Bar>
        </BarChart>
      </ChartContainer>

      <p className="mt-3 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
        {data.note} The outlined bar is the current calendar month.
      </p>
    </div>
  );
}
