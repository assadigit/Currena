"use client";

import * as React from "react";
import { clamp } from "@/lib/gold/format";

interface BiasMeterProps {
  /** -100 (max bearish) .. +100 (max bullish). */
  score: number;
  compact?: boolean;
}

function biasLabel(score: number): string {
  if (score <= -60) return "Strongly bearish";
  if (score <= -20) return "Bearish tilt";
  if (score < 20) return "Neutral";
  if (score < 60) return "Bullish tilt";
  return "Strongly bullish";
}

/**
 * Horizontal -100..+100 bias gauge for the executive summary.
 * Pure CSS: a neutral track, a centre tick and a gold marker dot.
 */
export function BiasMeter({ score, compact = false }: BiasMeterProps) {
  const pos = clamp((score + 100) / 2, 0, 100);

  return (
    <div
      className="w-full"
      role="meter"
      aria-valuemin={-100}
      aria-valuemax={100}
      aria-valuenow={Math.round(score)}
      aria-label="Daily bias score"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Daily bias
        </p>
        <p className="text-xs font-semibold tabular text-foreground">
          {score > 0 ? "+" : ""}
          {score.toFixed(0)} · {biasLabel(score)}
        </p>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-muted">
        {/* centre tick */}
        <span className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-x-1/2 -translate-y-1/2 bg-border" />
        {/* marker */}
        <span
          className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-sm transition-all duration-500"
          style={{ left: `calc(${pos}% - 8px)` }}
        />
      </div>
      {!compact ? (
        <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
          <span>Bearish -100</span>
          <span>Bullish +100</span>
        </div>
      ) : null}
    </div>
  );
}
