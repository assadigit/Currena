"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";
import type {
  BriefingSection,
  NewsItem,
  Scenario,
} from "@/lib/gold/types";
import { BiasMeter } from "./bias-meter";
import { fmtPct, fmtPrice, sentimentBg } from "@/lib/gold/format";

interface BriefingCardProps {
  section: BriefingSection;
  news?: NewsItem[];
  scenarios?: Scenario[];
  spot?: number;
  onJumpToVisual?: (visualId: string) => void;
}

/** Impact badge colouring for news rows. */
function ImpactBadge({ impact }: { impact: NewsItem["impact"] }) {
  return (
    <Badge
      variant="outline"
      className={`px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide ${
        impact === "high"
          ? "border-bear/40 bg-bear/10 text-bear"
          : impact === "medium"
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border text-muted-foreground"
      }`}
    >
      {impact}
    </Badge>
  );
}

function NewsList({ news }: { news: NewsItem[] }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Today&apos;s tape · {news.length} items
      </p>
      <ul className="scroll-slim max-h-96 space-y-1.5 overflow-y-auto pr-1">
        {news.map((n, i) => (
          <li
            key={`${n.time}-${i}`}
            className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
          >
            <span
              aria-label={n.sentiment}
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${sentimentBg(n.sentiment)}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug">{n.headline}</p>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                <span className="tabular">{n.time}</span>
                <span>·</span>
                <span>{n.source}</span>
                <ImpactBadge impact={n.impact} />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScenarioStrip({ scenarios, spot }: { scenarios: Scenario[]; spot?: number }) {
  const colorMap: Record<Scenario["id"], string> = {
    bull: "text-bull border-bull/40",
    base: "text-primary border-primary/40",
    bear: "text-bear border-bear/40",
  };

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {scenarios.map((s) => (
        <div
          key={s.id}
          className="rounded-lg border border-border/60 bg-background/60 p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className={`text-[11px] font-medium uppercase tracking-wide ${colorMap[s.id]}`}
            >
              {s.id}
            </Badge>
            <span className="text-xs font-semibold tabular text-foreground">
              {s.probability}% prob
            </span>
          </div>
          {/* probability bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${
                s.id === "bull"
                  ? "bg-bull"
                  : s.id === "bear"
                    ? "bg-bear"
                    : "bg-primary"
              }`}
              style={{ width: `${s.probability}%` }}
            />
          </div>
          <p className="mt-2.5 text-sm font-semibold tabular">
            ${fmtPrice(s.target, 0)}{" "}
            {spot ? (
              <span
                className={`text-xs font-medium tabular ${
                  s.target >= spot ? "text-bull" : "text-bear"
                }`}
              >
                ({fmtPct(((s.target - spot) / spot) * 100, 1)})
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
            {s.trigger}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">
            Horizon · {s.horizon}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * S8 briefing narrative card. The text layer of the desk — each card is
 * paired with its S9 supporting visuals in the section grid.
 */
export function BriefingCard({
  section,
  news,
  scenarios,
  spot,
  onJumpToVisual,
}: BriefingCardProps) {
  return (
    <Card className="h-full border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            {section.kicker}
          </p>
          {section.visualIds.length > 0 ? (
            <div className="flex items-center gap-1">
              {section.visualIds.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onJumpToVisual?.(v)}
                  className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                  aria-label={`Show supporting visual: ${v}`}
                >
                  <BarChart3 className="h-3 w-3" />
                  visual
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <h2 className="text-lg font-semibold leading-snug tracking-tight">
          {section.title}
        </h2>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-foreground/90">{section.body}</p>

        <ul className="mt-3 space-y-2">
          {section.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
              <span className="leading-snug">{b}</span>
            </li>
          ))}
        </ul>

        {section.bias !== undefined ? (
          <div className="mt-5 border-t border-border/60 pt-4">
            <BiasMeter score={section.bias} />
          </div>
        ) : null}

        {news && news.length > 0 ? <NewsList news={news} /> : null}
        {scenarios && scenarios.length > 0 ? (
          <ScenarioStrip scenarios={scenarios} spot={spot} />
        ) : null}
      </CardContent>
    </Card>
  );
}
