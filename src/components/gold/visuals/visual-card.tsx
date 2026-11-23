"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualCardProps {
  /** S9 visual id, e.g. "price-180d". */
  id: string;
  /** Ordinal within the S9 layer, e.g. "V1". */
  index?: string;
  /** Insight-first chart title (a conclusion, not a field name). */
  insight: string;
  /** Dynamic, data-driven "current reading" sentence. */
  takeaway: string;
  /** Ordered "how to read this chart" steps. */
  guides: string[];
  /** Small dataset provenance note, e.g. "180 trading days · daily closes". */
  meta?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * The S9 Supporting-Visuals wrapper. Every visual on the desk ships with
 * three explanation layers: an insight-first title (what the chart means),
 * a current reading (what it says today), and a collapsible reading guide
 * (how to interpret it in general).
 */
export function VisualCard({
  id,
  index,
  insight,
  takeaway,
  guides,
  meta,
  children,
  className,
}: VisualCardProps) {
  const [open, setOpen] = React.useState(true);

  return (
    <Card
      id={`visual-${id}`}
      className={cn("h-full border-border/70 shadow-sm", className)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-4/50 bg-chart-4/5 font-normal text-chart-4"
          >
            <Eye className="h-3 w-3" />
            S9 Visual{index ? ` · ${index}` : ""}
          </Badge>
          {meta ? (
            <p className="text-[11px] text-muted-foreground">{meta}</p>
          ) : null}
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {insight}
        </h3>
      </CardHeader>

      <CardContent>
        {/* Chart body */}
        <div className="mt-1">{children}</div>

        {/* Current reading — the dynamic explanation */}
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-primary">
              Current reading ·{" "}
            </span>
            {takeaway}
          </p>
        </div>

        {/* Reading guide — the static explanation */}
        <Collapsible open={open} onOpenChange={setOpen} className="mt-3">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={open}
          >
            <span>How to read this chart</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ol className="mt-1 space-y-1.5 border-t border-border/60 pt-3">
              {guides.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs">
                  <span className="mt-[1px] flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-muted text-[9px] font-bold text-muted-foreground tabular">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed text-muted-foreground">
                    {g}
                  </span>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
