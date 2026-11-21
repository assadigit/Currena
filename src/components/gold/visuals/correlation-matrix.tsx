"use client";

import * as React from "react";
import type { CorrelationMatrix } from "@/lib/gold/types";

interface CorrelationMatrixVisualProps {
  data: CorrelationMatrix;
}

/**
 * Cell background: a diverging ramp — positive correlations mix in gold,
 * negative ones mix in terracotta. Intensity scales with |r|.
 */
function cellStyle(v: number, diagonal: boolean): React.CSSProperties {
  if (diagonal) {
    return { backgroundColor: "color-mix(in oklab, var(--muted) 60%, transparent)" };
  }
  const intensity = Math.round(6 + Math.min(Math.abs(v), 1) * 44); // 6%..50%
  const base =
    v >= 0
      ? "color-mix(in oklab, var(--gold) "
      : "color-mix(in oklab, var(--bear) ";
  return { backgroundColor: `${base}${intensity}%, transparent)` };
}

/** V3 · Cross-asset correlation heatmap (CSS grid, no chart lib needed). */
export function CorrelationMatrixVisual({ data }: CorrelationMatrixVisualProps) {
  const n = data.assets.length;

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[520px]">
        {/* Column headers */}
        <div
          className="grid gap-1"
          style={{
            gridTemplateColumns: `96px repeat(${n}, minmax(56px, 1fr))`,
          }}
        >
          <span />
          {data.assets.map((a) => (
            <span
              key={a}
              className="truncate pb-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
              title={a}
            >
              {a}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-1">
          {data.assets.map((rowAsset, i) => (
            <div
              key={rowAsset}
              className="grid gap-1"
              style={{
                gridTemplateColumns: `96px repeat(${n}, minmax(56px, 1fr))`,
              }}
            >
              <span
                className="flex items-center truncate pr-2 text-[11px] font-medium text-foreground/90"
                title={rowAsset}
              >
                {rowAsset}
              </span>
              {data.matrix[i].map((v, j) => {
                const diagonal = i === j;
                return (
                  <div
                    key={j}
                    role="img"
                    aria-label={`Correlation of ${rowAsset} with ${data.assets[j]}: ${v.toFixed(2)}`}
                    title={`${rowAsset} vs ${data.assets[j]}: ${v.toFixed(2)}`}
                    className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-semibold tabular transition-transform hover:scale-[1.04] ${
                      diagonal
                        ? "text-muted-foreground/60"
                        : v >= 0
                          ? "text-foreground"
                          : "text-foreground"
                    }`}
                    style={cellStyle(v, diagonal)}
                  >
                    {diagonal ? "—" : v.toFixed(2)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Diverging legend */}
        <div className="mt-4 flex items-center gap-3 text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>Inverse -1</span>
          <span
            aria-hidden="true"
            className="h-2.5 flex-1 rounded-full"
            style={{
              background:
                "linear-gradient(to right, var(--bear), var(--background), var(--gold))",
            }}
          />
          <span>Aligned +1</span>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          Pearson correlation of daily returns · trailing {data.window} trading
          days
        </p>
      </div>
    </div>
  );
}
