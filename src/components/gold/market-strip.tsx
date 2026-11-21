"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  TrendingDown,
  TrendingUp,
  TrendingUp as TrendNeutral,
} from "lucide-react";
import type { BriefingPayload, VisualsPayload } from "@/lib/gold/types";
import { deltaClass, fmtPct, fmtPrice } from "@/lib/gold/format";

interface MarketStripProps {
  briefing: BriefingPayload;
  visuals: VisualsPayload;
}

/** The daily market snapshot row that anchors the briefing below it. */
export function MarketStrip({ briefing, visuals }: MarketStripProps) {
  const last30 = React.useMemo(
    () => visuals.price.points.slice(-30),
    [visuals.price.points]
  );
  const sparkMin = Math.min(...last30.map((p) => p.price));
  const sparkMax = Math.max(...last30.map((p) => p.price));
  const sparkRange = Math.max(sparkMax - sparkMin, 0.01);
  const lastPrice = last30[last30.length - 1]?.price ?? sparkMin;

  const up = briefing.change.pct >= 0;
  const TrendIcon = up ? TrendingUp : briefing.change.pct < 0 ? TrendingDown : TrendNeutral;

  return (
    <Card className="w-full border-border/70 shadow-sm">
      <CardContent className="flex flex-wrap items-center gap-x-8 gap-y-5 p-6">
        {/* Spot price block */}
        <div className="flex items-baseline gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Gold spot · XAU/USD
            </p>
            <p className="mt-1 text-3xl font-semibold tabular tracking-tight sm:text-4xl">
              ${fmtPrice(briefing.spot)}
            </p>
          </div>
          <div className="flex flex-col items-start gap-1">
            <Badge
              variant="outline"
              className={`gap-1 tabular ${
                up
                  ? "border-bull/40 bg-bull/10 text-bull"
                  : "border-bear/40 bg-bear/10 text-bear"
              }`}
            >
              <TrendIcon className="h-3.5 w-3.5" />
              {up ? "+" : ""}
              {briefing.change.abs.toFixed(2)}
            </Badge>
            <span className={`text-sm font-medium tabular ${deltaClass(briefing.change.pct)}`}>
              {fmtPct(briefing.change.pct)} today
            </span>
          </div>
        </div>

        {/* 30-day sparkline */}
        <div className="hidden min-w-[180px] flex-col gap-1 md:flex">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            30-day trend
          </p>
          <svg
            viewBox={`0 0 180 48`}
            className="h-14 w-48 overflow-visible"
            role="img"
            aria-label="Gold price over the last 30 trading days"
            preserveAspectRatio="none"
          >
            <polyline
              fill="none"
              stroke="var(--gold)"
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={last30
                .map((p, i) => {
                  const x = (i / (last30.length - 1)) * 180;
                  const y = 44 - ((p.price - sparkMin) / sparkRange) * 40;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
            />
            <circle
              cx="180"
              cy={44 - ((lastPrice - sparkMin) / sparkRange) * 40}
              r="2.5"
              fill="var(--gold)"
            />
          </svg>
        </div>

        {/* Headline stats */}
        <TooltipProvider delayDuration={150}>
          <dl className="grid min-w-0 flex-1 basis-full grid-cols-2 gap-x-6 gap-y-4 sm:basis-0 sm:grid-cols-3 xl:grid-cols-6">
            {briefing.stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-0.5">
                <dt className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-muted-foreground/80 ring-1 ring-border"
                        aria-label={`What is ${stat.label}?`}
                      >
                        i
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56 text-xs">
                      <p>{stat.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                </dt>
                <dd
                  className={`text-sm font-semibold tabular ${
                    stat.delta !== undefined ? deltaClass(stat.delta) : "text-foreground"
                  }`}
                >
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
