"use client";

import * as React from "react";
import { ArrowRight, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContinuityPayload } from "@/lib/gold/types";
import { deltaClass, fmtDayLabel, fmtPct, fmtPrice } from "@/lib/gold/format";

interface ThenVsNowLineProps {
  continuity: ContinuityPayload;
}

function modeLabel(mode: string): string {
  if (mode === "live") return "live";
  if (mode === "mixed") return "mixed";
  return "modelled";
}

/**
 * The S11 "then vs now" affordance — a one-line memory check that rides
 * along with date navigation: what the desk believed on the viewed cached
 * day, what gold actually did since, and what the desk believes now.
 */
export function ThenVsNowLine({ continuity }: ThenVsNowLineProps) {
  const tvn = continuity.thenVsNow;
  if (!tvn) return null;

  const { then, realizedSince, realizedNote, now } = tvn;
  const viewingLatest = then.date === now.date;
  const biasShift = now.bias - then.bias;

  // One line, insight-first: the viewed day's call vs the desk's current one.
  const line = viewingLatest
    ? `This is the desk's latest call — bias ${now.bias > 0 ? "+" : ""}${now.bias}, spot $${fmtPrice(now.spot, 0)}. Future views will measure it against what gold does next.`
    : realizedSince
      ? `Then vs now: on ${fmtDayLabel(then.date)} the desk called bias ${then.bias > 0 ? "+" : ""}${then.bias} at $${fmtPrice(then.spot, 0)} — gold has ${realizedSince.pct >= 0 ? "risen" : "fallen"} ${fmtPct(realizedSince.pct)} to $${fmtPrice(realizedSince.close, 0)} since, and today the desk reads bias ${now.bias > 0 ? "+" : ""}${now.bias} at $${fmtPrice(now.spot, 0)} (${biasShift >= 0 ? "+" : ""}${biasShift} on the stance).`
      : `Then vs now: on ${fmtDayLabel(then.date)} the desk called bias ${then.bias > 0 ? "+" : ""}${then.bias} at $${fmtPrice(then.spot, 0)}; today it reads bias ${now.bias > 0 ? "+" : ""}${now.bias} at $${fmtPrice(now.spot, 0)} (${biasShift >= 0 ? "+" : ""}${biasShift} on the stance). ${realizedNote ?? ""}`;
  return (
    <div
      className="flex w-full flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed text-muted-foreground"
      role="status"
      aria-label="Then versus now — the viewed desk day against the desk's latest call"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 font-medium text-foreground/80">
        <History className="h-3.5 w-3.5 text-chart-4" aria-hidden="true" />
        Then vs now
      </span>
      <span className="min-w-0 flex-1">{line}</span>
      {realizedSince ? (
        <span
          className={cn(
            "shrink-0 font-semibold tabular",
            deltaClass(realizedSince.pct)
          )}
        >
          {fmtPct(realizedSince.pct)} since {fmtDayLabel(then.date)}
        </span>
      ) : null}
      {!viewingLatest ? (
        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/80">
          {modeLabel(then.dataMode)} day
          <ArrowRight className="h-3 w-3" aria-hidden="true" />
          now {modeLabel(now.dataMode)}
        </span>
      ) : null}
    </div>
  );
}
