"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchiveDayCall, ContinuityPayload, DataMode } from "@/lib/gold/types";
import { deltaClass, fmtDayLabel, fmtPct, fmtPrice } from "@/lib/gold/format";

interface TrackRecordBandProps {
  continuity: ContinuityPayload;
  /** The desk day currently stamped in the view. */
  deskDate: string | null;
}

/* ------------------------------------------------------------------ */
/* Mode honesty chips                                                   */
/* ------------------------------------------------------------------ */

function modeChipClass(mode: DataMode): string {
  if (mode === "live") return "border-bull/50 bg-bull/5 text-bull";
  if (mode === "mixed") return "border-gold/50 bg-gold/5 text-gold";
  return "border-flat/50 bg-flat/10 text-muted-foreground";
}

function modeChipLabel(mode: DataMode): string {
  if (mode === "live") return "live";
  if (mode === "mixed") return "mixed";
  return "modelled";
}

/* ------------------------------------------------------------------ */
/* Bias history sparkline (pure SVG, hand-built like the S9 matrix)     */
/* ------------------------------------------------------------------ */

function BiasSparkline({
  days,
  deskDate,
}: {
  days: ArchiveDayCall[];
  deskDate: string | null;
}) {
  const W = 560;
  const H = 64;
  const n = days.length;
  const labelEvery = Math.max(1, Math.ceil(n / 7));

  const x = (i: number) => (n === 1 ? W / 2 : (i / (n - 1)) * (W - 8) + 4);
  const y = (bias: number) => H / 2 - (bias / 100) * (H / 2 - 6);

  const points = days.map((d, i) => `${x(i).toFixed(1)},${y(d.bias).toFixed(1)}`);
  const last = days[n - 1];

  return (
    <div className="overflow-x-auto scroll-slim">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-16 w-full min-w-[320px]"
        role="img"
        aria-label={`Bias score across ${n} cached desk days, from ${days[0].bias} on ${days[0].date} to ${last.bias} on ${last.date}`}
      >
        {/* zero line */}
        <line
          x1={4}
          y1={H / 2}
          x2={W - 4}
          y2={H / 2}
          stroke="var(--border)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
        <text x={4} y={11} fontSize={9} fill="var(--muted-foreground)">
          +100 bullish
        </text>
        <text x={4} y={H - 4} fontSize={9} fill="var(--muted-foreground)">
          -100 bearish
        </text>
        <polyline
          fill="none"
          stroke="var(--gold)"
          strokeWidth={1.75}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points.join(" ")}
        />
        {days.map((d, i) => {
          const viewed = deskDate === d.date;
          return (
            <g key={d.date}>
              <circle
                cx={x(i)}
                cy={y(d.bias)}
                r={viewed ? 4.5 : 2.6}
                fill={viewed ? "var(--primary)" : "var(--gold)"}
                stroke={viewed ? "var(--background)" : "none"}
                strokeWidth={viewed ? 1.5 : 0}
              />
              <title>
                {`${fmtDayLabel(d.date)} · bias ${d.bias > 0 ? "+" : ""}${d.bias} · ${modeChipLabel(d.dataMode)} desk day`}
              </title>
              {i % labelEvery === 0 || viewed ? (
                <text
                  x={x(i)}
                  y={d.bias >= 0 ? y(d.bias) + 16 : y(d.bias) - 8}
                  fontSize={9}
                  fill="var(--muted-foreground)"
                  textAnchor="middle"
                >
                  {d.date.slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
        <text
          x={W - 4}
          y={y(last.bias) + (last.bias > 0 ? 16 : -8)}
          fontSize={10}
          fill="var(--foreground)"
          textAnchor="end"
          fontWeight={600}
        >
          {last.bias > 0 ? "+" : ""}
          {last.bias}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Scenario-vs-realized strip                                           */
/* ------------------------------------------------------------------ */

function scenarioColor(id: string): string {
  if (id === "bull") return "var(--bull)";
  if (id === "bear") return "var(--bear)";
  return "var(--gold)";
}

function ScenarioCallRow({ day }: { day: ArchiveDayCall }) {
  const r = day.realized;
  return (
    <div
      className="flex min-w-[300px] flex-1 flex-col gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3 py-2.5"
      role="group"
      aria-label={`Scenario calls published ${day.date}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
        <p className="text-xs font-semibold tabular">
          {fmtDayLabel(day.date)}
          <span
            className={cn(
              "ml-2 rounded-full border px-1.5 py-px text-[10px] font-medium leading-none",
              modeChipClass(day.dataMode)
            )}
          >
            {modeChipLabel(day.dataMode)}
          </span>
        </p>
        <p className="text-[11px] text-muted-foreground tabular">
          bias {day.bias > 0 ? "+" : ""}
          {day.bias} · spot ${fmtPrice(day.spot, 0)}
        </p>
      </div>

      {/* The three published calls as probability chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {day.scenarios.map((s) => (
          <span
            key={s.id}
            className="rounded-full border px-2 py-0.5 text-[10px] font-medium tabular"
            style={{
              color: scenarioColor(s.id),
              borderColor: scenarioColor(s.id),
              opacity: r?.closest === s.id ? 1 : 0.75,
            }}
          >
            {s.id} {s.probability}% · ${fmtPrice(s.target, 0)}
          </span>
        ))}
      </div>

      {/* The realized verdict — live-era days only, never modelled */}
      {r ? (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Realized by {fmtDayLabel(r.asOf)}:{" "}
          <span className={`font-semibold tabular ${deltaClass(r.realizedPct)}`}>
            ${fmtPrice(r.realizedClose, 0)} ({fmtPct(r.realizedPct)})
          </span>{" "}
          — closest to the{" "}
          <span style={{ color: scenarioColor(r.closest) }} className="font-semibold">
            {r.closest}
          </span>{" "}
          call
        </p>
      ) : (
        <p className="text-[11px] leading-relaxed text-muted-foreground italic">
          {day.dataMode === "modelled"
            ? "Modelled desk day — no realized comparison drawn."
            : "Calls still in flight — no observed trading day beyond this desk day yet."}
        </p>
      )}
    </div>
  );
}

function ScenarioVsRealizedStrip({
  days,
  deskDate,
}: {
  days: ArchiveDayCall[];
  deskDate: string | null;
}) {
  const liveDays = days.filter((d) => d.dataMode !== "modelled");
  const modelledDays = days.filter((d) => d.dataMode === "modelled");
  const modelledDates = modelledDays.map((d) => d.date).join(", ");

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-2.5 overflow-x-auto scroll-slim pb-1">
        {days.map((day) => (
          <div key={day.date} className={cn(deskDate === day.date && "flex-[1.15]")}>
            <ScenarioCallRow day={day} />
          </div>
        ))}
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {liveDays.length > 0
          ? `Scenario-vs-realized comparisons are drawn only for the ${liveDays.length} live-era desk day${liveDays.length === 1 ? "" : "s"} (${liveDays
              .map((d) => d.date)
              .join(", ")}); realized closes come from the live observation store.`
          : "No live-era desk days in the cache yet, so no scenario-vs-realized comparison is drawn."}
        {modelledDays.length > 0
          ? ` Modelled-era days (${modelledDates}) are shown for the record but never mixed into realized math — their prices come from the deterministic engine.`
          : ""}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The band                                                             */
/* ------------------------------------------------------------------ */

/**
 * The S11 track-record band: what the desk said across every cached
 * day, and how its published scenarios compare with what actually
 * happened. Reads the archive payload only — no new data fetching.
 */
export function TrackRecordBand({
  continuity,
  deskDate,
}: TrackRecordBandProps) {
  const [guideOpen, setGuideOpen] = React.useState(false);
  const archive = continuity.archive;
  const n = archive.length;

  if (n === 0) {
    return null; // nothing cached yet — the band stays hidden, honestly
  }

  const liveDays = archive.filter((d) => d.dataMode !== "modelled");
  const biasRange = archive.reduce(
    (acc, d) => ({ min: Math.min(acc.min, d.bias), max: Math.max(acc.max, d.bias) }),
    { min: 100, max: -100 }
  );
  const first = archive[0];
  const last = archive[n - 1];
  const biasSwing = last.bias - first.bias;
  const modeText =
    liveDays.length === n
      ? "all live desk days"
      : `${liveDays.length} live + ${n - liveDays.length} modelled`;

  // Insight-first title: the actual story the archive tells today.
  const insight =
    Math.abs(biasSwing) >= 8
      ? `The desk's stance has shifted ${biasSwing > 0 ? "more bullish" : "more bearish"} — bias moved from ${first.bias > 0 ? "+" : ""}${first.bias} (${fmtDayLabel(first.date)}) to ${last.bias > 0 ? "+" : ""}${last.bias} (${fmtDayLabel(last.date)})`
      : `The desk's stance has held steady — bias stayed within ${Math.max(Math.abs(biasRange.min), Math.abs(biasRange.max))} of neutral across ${n} cached days`;

  const guides = [
    "Each dot is one cached desk day: its published aggregate bias score, from -100 (max bearish) to +100 (max bullish). The outlined dot is the desk day you are viewing.",
    "The scenario chips under each date are what the desk published that day — bull / base / bear with probability and a 90-day spot target, read back from the desk's own cache.",
    "The realized line appears only for live-era desk days: gold's actual close since that day (from the live observation store) versus the published targets, with the nearest scenario named.",
    "Modelled-era desk days (pre-S10 and fallback builds) are labelled and kept for the record, but their synthetic prices are never mixed into the realized math.",
  ];

  return (
    <Card className="w-full border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-4/50 bg-chart-4/5 font-normal text-chart-4"
          >
            <History className="h-3 w-3" />
            S11 Continuity · track record
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            {n} cached desk day{n === 1 ? "" : "s"} · {modeText}
          </p>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {insight}
        </h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <BiasSparkline days={archive} deskDate={deskDate} />
          <ScenarioVsRealizedStrip days={archive} deskDate={deskDate} />
        </div>

        {/* Current reading */}
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-primary">Current reading · </span>
            {continuity.realizedNow
              ? `Latest observed close ${fmtDayLabel(continuity.realizedNow.asOf)}: $${fmtPrice(continuity.realizedNow.close)} across ${continuity.realizedCoverage?.observations ?? 0} observed gold trading days (${continuity.realizedCoverage?.from} → ${continuity.realizedCoverage?.to}); the archive holds ${n} desk day${n === 1 ? "" : "s"} and compares scenarios against realized closes only on live-era days.`
              : `No live observations in the store yet — the archive records ${n} desk day${n === 1 ? "" : "s"} without realized comparisons.`}
          </p>
        </div>

        {/* Reading guide — the S9 convention */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-3">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={guideOpen}
          >
            <span>How to read this record</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                guideOpen && "rotate-180"
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
                  <span className="leading-relaxed text-muted-foreground">{g}</span>
                </li>
              ))}
            </ol>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
