"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  CalibrationDayRow,
  CalibrationPayload,
  DataMode,
} from "@/lib/gold/types";
import { deltaClass, fmtDayLabel, fmtPct, fmtPrice } from "@/lib/gold/format";

interface CalibrationBandProps {
  calibration: CalibrationPayload;
  /** The desk day currently stamped in the view. */
  deskDate: string | null;
}

/** A resolved-day count below which the band refuses to call its numbers a verdict. */
const MIN_VERDICT_SAMPLE = 10;

/* ------------------------------------------------------------------ */
/* Small helpers                                                        */
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

function scenarioColor(id: string): string {
  if (id === "bull") return "var(--bull)";
  if (id === "bear") return "var(--bear)";
  return "var(--gold)";
}

function biasClass(bias: number): string {
  if (bias > 0) return "text-bull";
  if (bias < 0) return "text-bear";
  return "text-muted-foreground";
}

function fmtRate(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(0)}%`;
}

function fmtPct1(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(1)}%`;
}

/* ------------------------------------------------------------------ */
/* The three score cards                                               */
/* ------------------------------------------------------------------ */

function ScoreCard({
  title,
  value,
  sub,
  sampleLine,
  children,
}: {
  title: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  sampleLine: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 rounded-lg border border-border/70 bg-card/60 px-3.5 py-3"
      role="group"
      aria-label={title}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="text-lg font-semibold leading-tight tabular">{value}</p>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{sub}</p>
      {children}
      <p className="mt-auto pt-1 text-[10px] font-medium text-muted-foreground/80">
        {sampleLine}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Per-day grade table                                                  */
/* ------------------------------------------------------------------ */

function outcomeLabel(d: CalibrationDayRow): { label: string; cls: string } {
  switch (d.biasOutcome) {
    case "hit":
      return { label: "hit", cls: "text-bull" };
    case "miss":
      return { label: "miss", cls: "text-bear" };
    case "flat":
      return { label: "flat", cls: "text-muted-foreground" };
    default:
      return { label: "not graded", cls: "text-muted-foreground/70" };
  }
}

function shortExclusion(d: CalibrationDayRow): string {
  const e = d.nextMoveExclusion ?? "";
  if (e.includes("modelled-era")) return "modelled era";
  if (e.includes("in flight")) return "in flight";
  if (e.includes("never a real close")) return "no own close";
  if (e.includes("neutral bias")) return "neutral stance";
  return "not graded";
}

function DayGradeRow({
  day,
  deskDate,
}: {
  day: CalibrationDayRow;
  deskDate: string | null;
}) {
  const out = outcomeLabel(day);
  const resolved = day.baseErrorPct !== null;
  const viewed = deskDate === day.date;
  return (
    <div
      role="row"
      className={cn(
        "grid min-w-[660px] grid-cols-[92px_58px_128px_118px_112px_1fr] items-center gap-x-3 border-b border-border/40 px-2 py-2 text-xs last:border-b-0",
        viewed && "rounded-sm bg-primary/[0.07]"
      )}
    >
      {/* Day + era */}
      <div className="flex items-center gap-1.5">
        <span
          className={cn(
            "font-semibold tabular",
            viewed && "text-primary"
          )}
        >
          {fmtDayLabel(day.date)}
        </span>
        <span
          className={cn(
            "rounded-full border px-1.5 py-px text-[9px] font-medium leading-none",
            modeChipClass(day.dataMode)
          )}
        >
          {modeChipLabel(day.dataMode)}
        </span>
      </div>
      {/* Bias */}
      <span className={cn("font-semibold tabular", biasClass(day.bias))}>
        {day.bias > 0 ? "+" : ""}
        {day.bias}
      </span>
      {/* Next-move direction grade */}
      {day.nextMovePct !== null ? (
        <span className="tabular">
          <span className={deltaClass(day.nextMovePct)}>
            {fmtPct(day.nextMovePct)}
          </span>{" "}
          <span className={cn("font-semibold", out.cls)}>{out.label}</span>
        </span>
      ) : (
        <span className="italic text-muted-foreground/70">
          {shortExclusion(day)}
        </span>
      )}
      {/* Base case + miss */}
      {resolved ? (
        <span className="tabular">
          ${fmtPrice(day.baseTarget, 0)} ·{" "}
          <span className="text-muted-foreground">
            {fmtPct(day.baseTargetPct, 1)}
          </span>{" "}
          miss{" "}
          <span className="font-semibold">{fmtPct1(day.baseErrorPct)}</span>
        </span>
      ) : (
        <span className="italic text-muted-foreground/70">
          {day.dataMode === "modelled" ? "modelled era" : "in flight"}
        </span>
      )}
      {/* Closest scenario */}
      {day.closest !== null ? (
        <span className="tabular">
          <span
            className="font-semibold"
            style={{ color: scenarioColor(day.closest) }}
          >
            {day.closest}
          </span>{" "}
          <span className="text-muted-foreground">
            (stated {day.closestProb}%)
          </span>
        </span>
      ) : (
        <span className="italic text-muted-foreground/70">—</span>
      )}
      {/* Favourite outcome */}
      {resolved && day.favoured ? (
        <span
          className={cn(
            "font-semibold tabular",
            day.favouredWon ? "text-bull" : "text-bear"
          )}
        >
          {day.favoured.id} {day.favoured.probability}% ·{" "}
          {day.favouredWon ? "favoured won" : "favoured lost"}
        </span>
      ) : resolved && day.favoured === null ? (
        <span className="italic text-muted-foreground/70">
          favourite tied — not graded
        </span>
      ) : (
        <span className="italic text-muted-foreground/70">—</span>
      )}
    </div>
  );
}

function DayGradeTable({
  days,
  deskDate,
}: {
  days: CalibrationDayRow[];
  deskDate: string | null;
}) {
  return (
    <div className="max-h-96 overflow-y-auto scroll-slim">
      <div className="min-w-full overflow-x-auto">
        <div
          role="table"
          aria-label="Per-day calibration grades"
          className="min-w-[660px]"
        >
          <div
            role="row"
            className="grid grid-cols-[92px_58px_128px_118px_112px_1fr] gap-x-3 border-b border-border/60 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            <span>Desk day</span>
            <span>Bias</span>
            <span>Next move</span>
            <span>Base case · miss</span>
            <span>Closest call</span>
            <span>Favourite</span>
          </div>
          {days.map((day) => (
            <DayGradeRow key={day.date} day={day} deskDate={deskDate} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The band                                                             */
/* ------------------------------------------------------------------ */

/**
 * The S12 calibration band: the desk's honesty made measurable — a
 * rolling scorecard over the cached archive (bias-direction hit rate,
 * scenario-target accuracy, probability calibration), every number
 * stating its sample size and its era. Reads the calibration payload
 * only — no new data fetching.
 */
export function CalibrationBand({
  calibration,
  deskDate,
}: CalibrationBandProps) {
  const [guideOpen, setGuideOpen] = React.useState(false);

  const record = calibration.record;
  const bias = calibration.biasDirection;
  const accuracy = calibration.scenarioAccuracy;
  const prob = calibration.probabilityCalibration;

  if (record.cachedDays === 0) {
    return null; // nothing cached yet — the band stays hidden, honestly
  }

  const resolved = accuracy.sample;
  const scoredAnything = resolved > 0 || bias.sample > 0;
  const tooFew = resolved < MIN_VERDICT_SAMPLE;
  const anchor = calibration.anchor;
  const deskCount = record.cachedDays;
  const scoredText =
    record.modelledDays > 0
      ? `${record.liveDays + record.mixedDays} live-era + ${record.modelledDays} modelled (labelled, never graded)`
      : `${record.liveDays + record.mixedDays} live-era day${
          record.liveDays + record.mixedDays === 1 ? "" : "s"
        }`;

  /* Insight-first title: the actual story the scorecard tells today. */
  const dirText =
    bias.hitRate === null
      ? "no scorable direction day yet"
      : `${bias.hits}/${bias.sample} next-day direction calls landed (${fmtRate(bias.hitRate)})${
          bias.flat > 0 ? ` — ${bias.flat} flat day${bias.flat === 1 ? "" : "s"} excluded` : ""
        }`;
  const accText =
    accuracy.meanAbsErrorPct === null
      ? "no resolved day to grade targets yet"
      : `the base cases have missed realized by ${accuracy.meanAbsErrorPct.toFixed(
          1
        )}% on average (median ${fmtPct1(accuracy.medianAbsErrorPct)})`;
  const insight = scoredAnything
    ? `${dirText}, while ${accText} — over ${resolved} resolved live desk day${
        resolved === 1 ? "" : "s"
      }${
        tooFew
          ? ", a sample too small to judge the desk: these numbers are the record, not a verdict"
          : ""
      }.`
    : `The desk has nothing to score yet — the cache holds ${deskCount} desk day${
        deskCount === 1 ? "" : "s"
      } but no live-era day with realized evidence beyond it.`;

  const guides = [
    "Bias-direction hit rate — the sign of the desk's published bias (its -100..+100 stance) versus the sign of gold's next observed daily move. Flat repeats (a next close equal to the day's own) and neutral (zero) stances are excluded and counted, never folded into the rate.",
    "Scenario-target accuracy — how close each day's base case (the middle scenario) landed versus realized: |latest observed close − base target|, in percent. Targets carry a 90-day horizon, so grades are drawn to-date against the latest observed close — never claimed as end-of-horizon verdicts.",
    "Probability calibration — the day's highest-probability scenario is its favourite; a tied top means no favourite (counted, excluded). The favourite won when its target proved the nearest to realized. Bands show how often favourites at each stated level won; empty bands state their zero sample honestly.",
    "Era — every realized number above pools live/mixed desk days only. Modelled-era days (pre-S10 rows and deterministic fallback builds) stay in the record, labelled, and never enter the math: their synthetic prices are not what the market did.",
    `Sample sizes — every figure states its n. Below roughly ${MIN_VERDICT_SAMPLE} resolved days the scorecard stays descriptive; the archive grows one desk day per trading day and the scorecard re-grades itself as days roll in.`,
  ];

  return (
    <Card className="w-full border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <Badge
            variant="outline"
            className="gap-1.5 border-chart-4/50 bg-chart-4/5 font-normal text-chart-4"
          >
            <Gauge className="h-3 w-3" />
            S12 Calibration · scorecard
          </Badge>
          <p className="text-[11px] text-muted-foreground">
            {scoredText}
            {anchor ? ` · anchor ${fmtDayLabel(anchor.asOf)}` : ""}
          </p>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {insight}
        </h3>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2.5 sm:grid-cols-3">
          <ScoreCard
            title="Bias direction"
            value={
              bias.hitRate === null ? (
                "—"
              ) : (
                <span>
                  {bias.hits}/{bias.sample}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    {fmtRate(bias.hitRate)}
                  </span>
                </span>
              )
            }
            sub={
              <>
                sign of the stance vs gold&apos;s next observed move
                {bias.flat > 0 || bias.neutralBias > 0 ? (
                  <>
                    {" "}
                    —{" "}
                    {[
                      bias.flat > 0
                        ? `${bias.flat} flat excluded`
                        : null,
                      bias.neutralBias > 0
                        ? `${bias.neutralBias} neutral excluded`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </>
                ) : null}
                {bias.recent ? (
                  <>
                    {" "}
                    · recent {bias.recent.windowDays}-day window:{" "}
                    {bias.recent.hits}/{bias.recent.sample} (
                    {fmtRate(bias.recent.hitRate)})
                  </>
                ) : null}
              </>
            }
            sampleLine={`n=${bias.sample} live desk days only`}
          />
          <ScoreCard
            title="Base-case accuracy"
            value={
              accuracy.meanAbsErrorPct === null ? (
                "—"
              ) : (
                <span>
                  {fmtPct1(accuracy.meanAbsErrorPct)}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    mean miss
                  </span>
                </span>
              )
            }
            sub={
              accuracy.minAbsErrorPct !== null ? (
                <>
                  range {fmtPct1(accuracy.minAbsErrorPct)} –{" "}
                  {fmtPct1(accuracy.maxAbsErrorPct)} · 90-day targets graded
                  to-date
                  {accuracy.recent ? (
                    <>
                      {" "}
                      · recent {accuracy.recent.windowDays}-day window:{" "}
                      {fmtPct1(accuracy.recent.meanAbsErrorPct)}
                    </>
                  ) : null}
                </>
              ) : (
                <>no resolved day yet — calls still in flight</>
              )
            }
            sampleLine={`n=${resolved} live desk days only`}
          />
          <ScoreCard
            title="Probability calibration"
            value={
              prob.favouredWinRate === null ? (
                "—"
              ) : (
                <span>
                  {prob.favouredWins}/{prob.sample}
                  <span className="ml-1 text-sm font-medium text-muted-foreground">
                    {fmtRate(prob.favouredWinRate)} won
                  </span>
                </span>
              )
            }
            sub={
              <>
                favourites stated{" "}
                {prob.meanFavouredProb === null
                  ? "—"
                  : `${prob.meanFavouredProb.toFixed(1)}%`}
                ; winners stated{" "}
                {prob.meanWinnerProb === null
                  ? "—"
                  : `${prob.meanWinnerProb.toFixed(1)}%`}
                {prob.ties > 0 ? ` · ${prob.ties} tied favourite${prob.ties === 1 ? "" : "s"} excluded` : ""}
              </>
            }
            sampleLine={`n=${prob.sample} live desk days only`}
          />
        </div>

        {/* The stated-probability bands — empty bands show their zero sample */}
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {prob.buckets.map((b) => (
            <div
              key={b.label}
              role="group"
              aria-label={b.label}
              className="flex min-w-[180px] flex-1 flex-col gap-0.5 rounded-lg border border-border/70 bg-card/40 px-3 py-2"
            >
              <p className="text-[10px] font-medium text-muted-foreground">
                {b.label}
              </p>
              <p className="text-xs font-semibold tabular">
                {b.sample === 0
                  ? "no day yet"
                  : `${b.wins}/${b.sample} won (${fmtRate(b.winRate)})`}
              </p>
              {b.sample > 0 ? (
                <p className="text-[10px] text-muted-foreground tabular">
                  mean stated {b.meanStated?.toFixed(1)}% · n={b.sample}
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground/70">
                  fills as the archive grows
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Per-day grades */}
        <div className="mt-4">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
            Per-day grades · the viewed desk day is outlined · every row
            states its era and its exclusions
          </p>
          <div className="rounded-lg border border-border/70 bg-card/40">
            <DayGradeTable days={calibration.days} deskDate={deskDate} />
          </div>
        </div>

        {/* Current reading */}
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-primary">Current reading · </span>
            {anchor && scoredAnything
              ? `Realized math covers the ${record.liveDays + record.mixedDays} live-era desk day${
                  record.liveDays + record.mixedDays === 1 ? "" : "s"
                } (${record.liveFrom} → ${record.liveTo}), each graded against the latest observed close $${fmtPrice(
                  anchor.close
                )} on ${fmtDayLabel(anchor.asOf)} across ${calibration.coverage?.observations ?? 0} observed gold trading days${
                  record.inFlight > 0
                    ? `; ${record.inFlight} call${record.inFlight === 1 ? " is" : "s are"} still in flight`
                    : ""
                }. The ${record.modelledDays} modelled-era day${
                  record.modelledDays === 1 ? "" : "s"
                } stay in the record, labelled, and never enter these numbers${
                  tooFew
                    ? ` — and with n=${resolved} resolved day${resolved === 1 ? "" : "s"} the scorecard is a descriptive record, not a verdict`
                    : ""
                }.`
              : anchor
                ? `Nothing scored yet: the cache holds ${record.cachedDays} desk day${record.cachedDays === 1 ? "" : "s"} but no live-era day with realized evidence beyond it. The observation store covers ${calibration.coverage?.observations ?? 0} gold trading days to ${fmtDayLabel(anchor.asOf)}.`
                : `No live observations in the store yet — the cache holds ${record.cachedDays} desk day${record.cachedDays === 1 ? "" : "s"} without realized grades.`}
          </p>
        </div>

        {/* Reading guide — the S9 convention */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-3">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={guideOpen}
          >
            <span>How to read this scorecard</span>
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
