"use client";

import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, Printer, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  DataMode,
  DigestPayload,
  DigestTrigger,
} from "@/lib/gold/types";
import { deltaClass, fmtDayLabel, fmtPct, fmtPrice } from "@/lib/gold/format";

/* ------------------------------------------------------------------ */
/* Shared formatting (the band and the print sheet quote the same      */
/* sentences, so the two renditions can never drift apart)             */
/* ------------------------------------------------------------------ */

function fmtUsd(n: number): string {
  return `$${fmtPrice(n, 0)}`;
}

function fmtBias(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

function fmtRate(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(0)}%`;
}

function fmtPctAbs(n: number | null): string {
  return n === null ? "—" : `${n.toFixed(2)}%`;
}

function fmtTimestamp(iso: string): string {
  return `${new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })} UTC`;
}

function modeChipClass(mode: string): string {
  if (mode === "live") return "border-bull/50 bg-bull/5 text-bull";
  if (mode === "mixed") return "border-gold/50 bg-gold/5 text-gold";
  return "border-flat/50 bg-flat/10 text-muted-foreground";
}

function modeChipLabel(mode: string): string {
  if (mode === "live") return "live";
  if (mode === "mixed") return "mixed";
  return "modelled";
}

function scenarioTextClass(id: string): string {
  if (id === "bull") return "text-bull";
  if (id === "bear") return "text-bear";
  return "text-gold";
}

/** The day's scenario calls on one compact line. */
export function digestScenarioLine(d: DigestPayload): string {
  return d.scenarios
    .map(
      (s) =>
        `${s.label} ${s.probability.toFixed(0)}% → ${fmtUsd(s.target)} (${fmtPct(s.impliedPct)})`
    )
    .join("  ·  ");
}

/** Insight-first title: the news first (fired watches), else the day's own lead. */
export function digestInsight(d: DigestPayload): string {
  const h = d.headline;
  if (!h) {
    return "No desk day on file yet — the digest assembles itself from the desk's first cached briefing.";
  }
  const w = d.watch;
  if (w.totalRules === 0) {
    return `${h.headline} — no watches pinned yet.`;
  }
  if (w.triggeredCount > 0) {
    return `${w.triggeredCount} of ${w.activeCount} watch${w.activeCount === 1 ? "" : "es"} fired: ${w.triggers
      .map((t) => t.label)
      .join("; ")}.`;
  }
  return `All ${w.activeCount} watch${w.activeCount === 1 ? "" : "es"} quiet — ${h.headline}`;
}

/** The one-glance numbers line for the viewed desk day. */
export function digestSubline(d: DigestPayload): string {
  const h = d.headline;
  if (!h) return "";
  const base = d.scenarios.find((s) => s.id === "base");
  return [
    `Gold ${fmtUsd(h.spot)} (${fmtPct(h.changePct)}, ${fmtDayLabel(h.date)})`,
    `desk bias ${fmtBias(h.bias)}`,
    base
      ? `base case ${fmtUsd(base.target)} (${fmtPct(base.impliedPct)})`
      : null,
  ]
    .filter(Boolean)
    .join("  ·  ");
}

/** The day row: the desk's own lead with its provenance. */
export function digestDaySentence(d: DigestPayload): string {
  const h = d.headline;
  if (!h) {
    return "No cached desk day exists at or before this view — the briefing, the scenario calls and the digest all begin with the desk's first build.";
  }
  const served = `narrative ${
    h.narrativeSource === "llm" ? "model-written" : "deterministic template"
  }`;
  const series =
    h.totalSeries > 0
      ? `data as of ${fmtDayLabel(h.asOf ?? h.date)}, ${h.liveSeries} of ${h.totalSeries} series live`
      : "no provenance on this row (pre-S10 build)";
  const stamped =
    h.stampNote ?? (h.date !== d.viewedDate ? `stamped onto ${fmtDayLabel(h.date)} — the latest desk day at or before ${fmtDayLabel(d.viewedDate)}` : null);
  return `On ${fmtDayLabel(h.date)} the desk led with “${h.headline}” — ${served}; ${series}.${
    stamped ? ` ${stamped}.` : ""
  }${h.fallbackReason ? ` ${h.fallbackReason}.` : ""}`;
}

/** The quiet summary under the verbatim triggers. */
export function digestWatchQuietSentence(d: DigestPayload): string {
  const w = d.watch;
  if (w.totalRules === 0) {
    return "No watch rules are pinned yet — add one in the watch band below and the digest will carry its verdict here.";
  }
  const parts: string[] = [];
  if (w.triggeredCount === 0) {
    parts.push(
      `All ${w.activeCount} active watch${w.activeCount === 1 ? "" : "es"} are quiet — none of the conditions you pinned currently holds.`
    );
  } else if (w.quietLabels.length > 0) {
    parts.push(
      `The other ${w.quietLabels.length} active watch${
        w.quietLabels.length === 1 ? " is" : "es are"
      } quiet: ${w.quietLabels.join("; ")}.`
    );
  }
  if (w.pausedCount > 0) {
    parts.push(
      `${w.pausedCount} paused rule${w.pausedCount === 1 ? "" : "s"} keep${
        w.pausedCount === 1 ? "s" : ""
      } their place in the watch band.`
    );
  }
  return parts.join(" ");
}

/** The three scorecard verdicts (the S12 numbers, each with its n). */
export function digestScorecardSentences(d: DigestPayload): string[] {
  const s = d.scorecard;
  const direction =
    s.direction.sample > 0
      ? `Direction — ${s.direction.hits} of ${s.direction.sample} graded live desk days called gold's next move (${fmtRate(
          s.direction.hitRate
        )}); ${s.direction.flat} flat and ${s.direction.neutralBias} neutral day${
          s.direction.flat + s.direction.neutralBias === 1 ? "" : "s"
        } excluded and counted.`
      : "Direction — not gradeable yet: no live-era desk day has a resolved next-day move.";
  const baseMiss =
    s.baseMiss.sample > 0
      ? `Base case — mean miss ${fmtPctAbs(s.baseMiss.meanPct)} against the latest observed close (median ${fmtPctAbs(
          s.baseMiss.medianPct
        )}, graded to-date; n=${s.baseMiss.sample} resolved live day${
          s.baseMiss.sample === 1 ? "" : "s"
        }).`
      : "Base case — no resolved live desk day yet, so no miss can be graded.";
  const favourites =
    s.probability.sample > 0
      ? `Favourites — the day's favoured scenario proved closest ${s.probability.wins} of ${
          s.probability.sample
        } times (${fmtRate(s.probability.winRate)}); ${s.probability.ties} tied-top day${
          s.probability.ties === 1 ? "" : "s"
        } had no favourite.`
      : "Favourites — no resolved day with a single favourite yet.";
  const cap = s.verdictCap
    ? `n=${s.resolvedDays} resolved days — a descriptive record, not a verdict (the scorecard refuses verdicts below ten).`
    : `n=${s.resolvedDays} resolved days.`;
  return [direction, baseMiss, favourites, cap];
}

/** The memory line: the live era, compressed. */
export function digestMemorySentence(d: DigestPayload): string {
  const m = d.memory;
  if (m.archiveDays === 0) {
    return "No desk days are on file yet — the desk's memory begins with its first cached briefing.";
  }
  if (!m.from) {
    return `The archive holds ${m.archiveDays} desk day${
      m.archiveDays === 1 ? "" : "s"
    }, all modelled-era so far — realized memory begins with the desk's first live day.`;
  }
  const to = m.to!;
  const realized =
    m.realizedPct !== null && m.realizedClose !== null && m.realizedAsOf !== null
      ? `gold has ${m.realizedPct >= 0 ? "risen" : "fallen"} ${fmtPct(
          m.realizedPct
        )} to ${fmtUsd(m.realizedClose)} (as of ${fmtDayLabel(m.realizedAsOf)})`
      : "gold has no observed close beyond that day yet";
  return `Since the live era began ${fmtDayLabel(m.from.date)} (${m.liveDays} live day${
    m.liveDays === 1 ? "" : "s"
  }${
    m.modelledDays > 0
      ? `, ${m.modelledDays} modelled labelled, never pooled`
      : ""
  }): ${realized}; the stance moved ${fmtBias(m.from.bias)} → ${fmtBias(
    to.bias
  )} and the base target ${fmtUsd(m.from.baseTarget)} → ${fmtUsd(
    to.baseTarget
  )} (now a ${modeChipLabel(to.dataMode)} desk day).`;
}

/** The current-reading anchor + record composition. */
export function digestCurrentReading(d: DigestPayload): string {
  const r = d.scorecard.record;
  if (!d.anchor) {
    return "No live observations are in the store yet — the digest will anchor itself once the desk has data.";
  }
  return `Every number above is drawn from the persisted record as of the latest observed gold close (${fmtUsd(
    d.anchor.close
  )}, ${fmtDayLabel(d.anchor.asOf)}): ${r.liveDays + r.mixedDays} live-era and ${
    r.modelledDays
  } modelled desk days cached (${r.llmDays} model-written, ${
    r.templateDays
  } template narratives, ${r.inFlight} call${
    r.inFlight === 1 ? "" : "s"
  } still in flight). Realized math pools live desk days only; the digest is an observation, never advice.`;
}

/** The print sheet's provenance footer. */
export function digestProvenanceSentence(d: DigestPayload): string {
  const r = d.scorecard.record;
  return `Assembled server-side from the desk's own persisted record — the briefing cache, the S13 watch evaluation, the S12 scorecard and the S11 archive (${
    r.cachedDays
  } cached desk days: ${r.liveDays + r.mixedDays} live-era, ${
    r.modelledDays
  } modelled labelled, never pooled). The once-per-day EODHD sync is the only network surface and this digest adds none. Every rate states its n; the deterministic engine stays reachable via /api/desk?source=modelled.`;
}

/* ------------------------------------------------------------------ */
/* The band                                                             */
/* ------------------------------------------------------------------ */

interface DigestBandProps {
  digest: DigestPayload;
}

/** One compact digest row: a labelled lane with a fact group. */
function DigestRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={`Digest — ${label}`}
      className="rounded-lg border border-border/70 bg-card/60 px-3.5 py-3"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5 space-y-1.5">{children}</div>
    </div>
  );
}

/** Small provenance chip (era / n / as-of), mirroring the S13 watch rows. */
function DigestChip({
  children,
  className,
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "rounded-full border border-border bg-background px-1.5 py-px text-[10px] font-medium leading-none text-muted-foreground",
        className
      )}
    >
      {children}
    </span>
  );
}

function TriggerQuote({ t }: { t: DigestTrigger }) {
  return (
    <div className="rounded-md border-l-2 border-primary/60 bg-primary/[0.04] px-2.5 py-1.5">
      <p className="text-xs font-semibold leading-snug">{t.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {t.statement}
      </p>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        <DigestChip className={modeChipClass(t.era)} title="The era of the evidence behind this trigger">
          {modeChipLabel(t.era)}
        </DigestChip>
        {t.sample !== null ? <DigestChip>n={t.sample}</DigestChip> : null}
        {t.watchedDate ? (
          <DigestChip>as of {fmtDayLabel(t.watchedDate)}</DigestChip>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The S14 digest band: the whole day in one glance at the top of the
 * desk. Insight-first title + current reading + collapsible guide (the
 * S9 convention); fired triggers verbatim; every number stating its era
 * and its sample. The export button prints the same payload as a
 * self-contained sheet (no new fetch — the payload is already on the
 * page).
 */
export function DigestBand({ digest }: DigestBandProps) {
  const [guideOpen, setGuideOpen] = React.useState(false);

  const exportDigest = React.useCallback(() => {
    // Isolate the print sheet (globals.css), print, then restore. The
    // print call blocks until the dialog closes, so the class is always
    // cleaned up.
    document.body.classList.add("digest-printing");
    try {
      window.print();
    } finally {
      document.body.classList.remove("digest-printing");
    }
  }, []);

  const h = digest.headline;
  const w = digest.watch;
  const s = digest.scorecard;
  const scorecardLines = digestScorecardSentences(digest);
  const base = digest.scenarios.find((sc) => sc.id === "base");

  const guides = [
    "The digest is the whole day in one glance, assembled server-side from what the desk already persists — the cached briefing (the headline, the snapshot, the scenario calls), the S13 watch evaluation, the S12 scorecard and the S11 archive. It adds no new network: the once-per-day EODHD sync stays the only network surface.",
    "It is an observation, never advice — it quotes what the desk said and what gold did, and never tells you to buy or sell.",
    "Every number states its era: realized comparisons pool live desk days only, and modelled-era days stay in the record, labelled, never pooled. Rates state their n; excluded days (flat, neutral, in-flight, tied-favourite) are counted, never folded into a rate.",
    "Fired watch triggers are quoted verbatim from the S13 evaluation — the fact, the date it last held, its era and its sample. Quiet and paused rules are summarised by count.",
    "The scorecard verdicts are the S12 numbers. Scenario targets carry a 90-day horizon, so base-case grades are drawn to-date against the latest observed close — and below ten resolved days they are a descriptive record, not a verdict.",
    "The memory line compresses the live era: the first live desk day's stance and targets against the latest. When you view an older day, the day and scenario rows show that day's own calls; the watch, scorecard and memory always read the whole rolling record.",
    "The deterministic engine stays reachable via /api/desk?source=modelled — the digest reads the desk of record and never triggers a build.",
    "Print digest exports this same payload as a self-contained, print-friendly sheet — no new fetch, no images: everything the morning read needs on one page.",
  ];

  return (
    <Card className="w-full border-border/70 shadow-sm" data-gold-digest-band>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <Badge
            variant="outline"
            className="gap-1.5 border-primary/40 bg-primary/5 font-normal text-primary"
          >
            <Sunrise className="h-3 w-3" aria-hidden="true" />
            S14 Digest · the morning read
          </Badge>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-muted-foreground">
              {s.record.cachedDays} desk day{s.record.cachedDays === 1 ? "" : "s"} on file
              {digest.anchor ? ` · anchor ${fmtDayLabel(digest.anchor.asOf)}` : ""}
            </p>
            <Button
              variant="outline"
              className="h-11 gap-1.5 font-normal"
              onClick={exportDigest}
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              Print digest
            </Button>
          </div>
        </div>
        <h3 className="text-base font-semibold leading-snug tracking-tight">
          {digestInsight(digest)}
        </h3>
        {h ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {digestSubline(digest)}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-2.5">
          {/* The day — the desk's own lead */}
          <DigestRow label="The day">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {digestDaySentence(digest)}
            </p>
            {h ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <DigestChip className={modeChipClass(h.dataMode)} title="How this desk day's series were served">
                  {modeChipLabel(h.dataMode)} desk day
                </DigestChip>
                <DigestChip>{h.narrativeSource === "llm" ? "model-written narrative" : "template narrative"}</DigestChip>
                {h.totalSeries > 0 ? (
                  <DigestChip title="Live / live-proxy datasets on this row's provenance record">
                    {h.liveSeries}/{h.totalSeries} series live
                  </DigestChip>
                ) : null}
              </div>
            ) : null}
            {digest.scenarios.length > 0 ? (
              <p className="text-xs leading-relaxed">
                {digest.scenarios.map((sc) => (
                  <span key={sc.id} className="font-medium">
                    <span className={scenarioTextClass(sc.id)}>
                      {sc.label} {sc.probability.toFixed(0)}%
                    </span>{" "}
                    → {fmtUsd(sc.target)} ({fmtPct(sc.impliedPct)})
                    {sc.id !== digest.scenarios[digest.scenarios.length - 1].id ? (
                      <span className="text-muted-foreground"> · </span>
                    ) : null}
                  </span>
                ))}
              </p>
            ) : null}
          </DigestRow>

          {/* Watches — fired triggers verbatim */}
          <DigestRow label={`Watches${w.totalRules > 0 ? ` · ${w.triggeredCount} of ${w.activeCount} fired` : ""}`}>
            {w.triggers.length > 0 ? (
              w.triggers.map((t) => <TriggerQuote key={t.id} t={t} />)
            ) : null}
            <p className="text-xs leading-relaxed text-muted-foreground">
              {digestWatchQuietSentence(digest)}
            </p>
          </DigestRow>

          {/* Scorecard — the three S12 verdicts */}
          <DigestRow label="Scorecard">
            <div className="space-y-1">
              {scorecardLines.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-xs leading-relaxed",
                    i === scorecardLines.length - 1
                      ? "font-medium text-foreground/80"
                      : "text-muted-foreground"
                  )}
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <DigestChip className={modeChipClass("live")} title="Realized math pools live-era desk days only">
                live-era days only
              </DigestChip>
              {s.record.modelledDays > 0 ? (
                <DigestChip className={modeChipClass("modelled")}>
                  {s.record.modelledDays} modelled labelled, never pooled
                </DigestChip>
              ) : null}
            </div>
          </DigestRow>

          {/* Memory — the live era, compressed */}
          <DigestRow label="Memory">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {digestMemorySentence(digest)}
            </p>
            {digest.memory.realizedPct !== null ? (
              <p className={cn("text-xs font-semibold tabular", deltaClass(digest.memory.realizedPct))}>
                {fmtPct(digest.memory.realizedPct)} since{" "}
                {digest.memory.from ? fmtDayLabel(digest.memory.from.date) : ""}
                {digest.memory.realizedAsOf
                  ? ` · observed through ${fmtDayLabel(digest.memory.realizedAsOf)}`
                  : ""}
              </p>
            ) : null}
          </DigestRow>
        </div>

        {/* Current reading */}
        <div className="mt-4 rounded-lg border-l-2 border-primary bg-primary/[0.06] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed">
            <span className="font-semibold text-primary">Current reading · </span>
            {digestCurrentReading(digest)}
          </p>
        </div>

        {/* Reading guide — the S9 convention */}
        <Collapsible open={guideOpen} onOpenChange={setGuideOpen} className="mt-3">
          <CollapsibleTrigger
            className="flex w-full items-center justify-between rounded-md px-1 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            aria-expanded={guideOpen}
          >
            <span>How to read this digest</span>
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

/* ------------------------------------------------------------------ */
/* The print sheet — the same payload as a self-contained page          */
/* ------------------------------------------------------------------ */

/**
 * The export view: the digest payload as a self-contained,
 * print-friendly document. Hidden on screen (display: none — see
 * globals.css); the band's export button adds body.digest-printing and
 * calls print(), so only this sheet reaches the paper. Theme-free
 * styling (explicit ink-on-white) so it prints identically from light
 * or dark mode.
 */
export function DigestPrintSheet({ digest }: DigestBandProps) {
  const h = digest.headline;
  const w = digest.watch;
  const scorecardLines = digestScorecardSentences(digest);

  return (
    <div className="digest-print-sheet" aria-hidden="true">
      <header className="sheet-header">
        <h1>AURUM Desk — Daily Digest</h1>
        <p className="sheet-meta">
          {digest.effectiveDeskDate
            ? `The desk day of ${fmtDayLabel(digest.effectiveDeskDate)}`
            : "No desk day on file"}{" "}
          · viewed {fmtDayLabel(digest.viewedDate)} · assembled{" "}
          {fmtTimestamp(digest.generatedAt)}
        </p>
        <p className="sheet-tagline">
          An observation, never advice — assembled server-side from the
          desk&apos;s own persisted record.
        </p>
      </header>

      <section className="sheet-section">
        <h2>The day</h2>
        {h ? (
          <React.Fragment>
            <p className="sheet-lead">“{h.headline}”</p>
            <p>{digestSubline(digest)}</p>
            <p>{digestDaySentence(digest)}</p>
            {digest.scenarios.length > 0 ? (
              <p className="sheet-scenarios">{digestScenarioLine(digest)}</p>
            ) : null}
          </React.Fragment>
        ) : (
          <p>{digestDaySentence(digest)}</p>
        )}
      </section>

      <section className="sheet-section">
        <h2>Watched questions</h2>
        {w.triggers.length > 0 ? (
          <React.Fragment>
            {w.triggers.map((t) => (
              <p key={t.id} className="sheet-trigger">
                <span className="sheet-trigger-label">{t.label}</span> — {t.statement}{" "}
                <span className="sheet-chip">
                  [{modeChipLabel(t.era)}
                  {t.sample !== null ? `, n=${t.sample}` : ""}]
                </span>
              </p>
            ))}
          </React.Fragment>
        ) : null}
        <p>{digestWatchQuietSentence(digest)}</p>
      </section>

      <section className="sheet-section">
        <h2>Scorecard</h2>
        {scorecardLines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
        <p className="sheet-fine">
          Live-era desk days only; modelled-era days stay in the record,
          labelled, never pooled.
        </p>
      </section>

      <section className="sheet-section">
        <h2>Memory</h2>
        <p>{digestMemorySentence(digest)}</p>
      </section>

      <footer className="sheet-footer">
        <p>{digestProvenanceSentence(digest)}</p>
        {digest.anchor ? (
          <p className="sheet-fine">
            Anchor: latest observed gold close {fmtUsd(digest.anchor.close)} on{" "}
            {fmtDayLabel(digest.anchor.asOf)}.
          </p>
        ) : null}
      </footer>
    </div>
  );
}
