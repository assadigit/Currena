"use client";

/**
 * The comparison band — gold against the alternatives, one window of
 * three months to ten years (batch L added the 10-year window).
 *
 * The owner's chart: the 10-year real yield, silver, Bitcoin and the
 * S&P 500, one line each, from today back up to ten years — with gold
 * itself for reference. Every line is indexed to 100 at the window's
 * start so one chart holds them all; the real yield is a rate, not an
 * asset, so its line rides its own honest right axis at the true %
 * level. Each line can be toggled off and on (gold against the S&P
 * alone, or any subset), the lines ride a heavier stroke than the
 * house default, and the window's own scorecard — each item's start,
 * The nominal-yield line was retired (batch L): one yield line — the
 * real one — the number that matters for gold; the average reader is
 * not asked to tell the two apart.
 * now and change in one table — sits under the chart because graphs
 * are hard to read numbers from. Served from /api/gold/compare (the
 * desk's own stitched gold window + the public Yahoo/FRED legs,
 * weekly sampled), fail-closed: legs that did not arrive are absent.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, TraceChart, type TraceSeriesDef } from "@/components/gold-page/visuals";
import type { ComparePayload } from "@/lib/gold-page/compare";
import { CorrelationLeg, type CorrelationPayload } from "@/components/gold-page/record";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

type CmpT = {
  eyebrow: string;
  title: string;
  subtitle: string;
  windowLabel: string;
  ranges: Record<"3M" | "6M" | "1Y" | "3Y" | "5Y" | "10Y", string>;
  bestLine: string;
  worstLine: string;
  bestLossLine: string;
  worstLossLine: string;
  assets: { gold: string; silver: string; btc: string; spx: string; realYield: string };
  toggleLabel: string;
  barsTitleYears: string;
  barsTitleMonths: string;
  tableTitle: string;
  colAsset: string;
  colStart: string;
  colEnd: string;
  colChange: string;
  unitPp: string;
  unavailable: string;
};

type LineId = "gold" | "silver" | "btc" | "spx" | "realYield";

/* the one rate line — it rides the right axis at its true % level and
   never joins the assets' best/worst contest (a rate is not an asset;
   the nominal line was retired in batch L — one yield, the real one) */
const YIELD_IDS: ReadonlySet<LineId> = new Set(["realYield"]);

/* the correlation lesson's own copy — the leg merged in from the old
   standalone section */
type CorrT = {
  eyebrow: string;
  title: string;
  subtitle: string;
  lessonOpen: string;
  lessonClose: string;
  goldAxis: string;
  yieldAxis: string;
  rotationLabel: string;
  methodTitle: string;
  methodLine: string;
  spanLine: string;
  unavailable: string;
};

/** The display order + the token colour of every line — five lines, the
 *  owner's literal hues (batch-I ask: gold is gold, the S&P is red,
 *  Bitcoin blue, silver silver, the real yield green — one dedicated
 *  token each, pairwise distinct at a glance; the lines are always
 *  labelled so the hue is never the sole carrier). */
const LINE_ORDER: ReadonlyArray<{ id: LineId; color: string; dashed?: boolean }> = [
  { id: "gold", color: "var(--color-cmp-gold)" },
  { id: "realYield", color: "var(--color-cmp-real)", dashed: true },
  { id: "silver", color: "var(--color-cmp-silver)" },
  { id: "btc", color: "var(--color-cmp-btc)" },
  { id: "spx", color: "var(--color-cmp-spx)" },
];

type WindowKey = "3M" | "6M" | "1Y" | "3Y" | "5Y" | "10Y";
/* the chips' own order — months then years, everywhere the windows are listed */
const WINDOW_ORDER: ReadonlyArray<WindowKey> = ["3M", "6M", "1Y", "3Y", "5Y", "10Y"];
/* the window's own span, in months — 3 and 6 ride alongside the years;
   the 10-year window joined in batch L (the owner's ask) */
const WINDOW_MONTHS: Record<WindowKey, number> = { "3M": 3, "6M": 6, "1Y": 12, "3Y": 36, "5Y": 60, "10Y": 120 };
/** The cutoff instant — `months` back from the series' own last point. */
function cutoffOf(lastDate: string, w: WindowKey): number {
  return Date.parse(`${lastDate}T00:00:00Z`) - (WINDOW_MONTHS[w] * 365.25 / 12) * 86_400_000;
}

async function fetchCompareApi(): Promise<ComparePayload> {
  const res = await fetch(`${deskBasePath}/api/gold/compare`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The comparison API responded with ${res.status}`);
  return res.json() as Promise<ComparePayload>;
}

/** Index a series to 100 at its start, sliced to the window's own span. */
function indexTo100(points: ReadonlyArray<{ d: string; v: number }>, w: WindowKey): Array<{ d: string; v: number }> | null {
  const cutoff = cutoffOf(points[points.length - 1]!.d, w);
  const slice = points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
  if (slice.length < 2) return null;
  const base = slice[0]!.v;
  if (!Number.isFinite(base) || base === 0) return null;
  return slice.map((p) => ({ d: p.d, v: (p.v / base) * 100 }));
}

export interface CompareRow {
  line: (typeof LINE_ORDER)[number];
  name: string;
  pct: number | null;
  start: number;
  end: number;
  deltaPp: number | null;
}

/** Measure a block's own width after mount (the responsive-canvas trick
 *  TraceChart uses; here so the bar view's labels never shrink to
 *  unreadable on a phone). */
function useElementWidth<T extends HTMLElement>() {
  const ref = React.useRef<T | null>(null);
  const [w, setW] = React.useState<number | null>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) setW(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/**
 * The window's own bar view (the owner's batch-H ask): each ASSET's
 * window % change as a vertical bar — the same numbers the scorecard
 * reads, at a glance, in each line's own colour (the eye ties the bar
 * to the line by hue; the signed label carries the direction, colour
 * is never the sole carrier). Bars grow from a zero baseline, negative
 * returns drop below it. The yields never join: a rate's pp is not a %
 * return — the scorecard keeps their honest unit.
 *
 * Batch M: the bars ride PASTEL fills (the owner's ask — the solid
 * hues hurt the eye; only the chart's lines stay solid), and the
 * negative bars keep a SAFE SPACE from the asset names under them (a
 * deep negative's value label once collided with the name row — the
 * name row now sits below a reserved band the bars never enter).
 */
function CompareBars({ t, rows, fmt, enabled, window: w }: { t: CmpT; rows: CompareRow[]; fmt: Fmt; enabled: Record<LineId, boolean>; window: WindowKey }) {
  const assets = rows.filter((r) => r.pct !== null && enabled[r.line.id]);
  const { ref, w: measured } = useElementWidth<HTMLDivElement>();
  /* the title names the window itself (the owner's batch-I ask): the
     years — or the months — the chart shows, in the title */
  const months = WINDOW_MONTHS[w];
  const barsTitle =
    months < 12
      ? t.barsTitleMonths.replace("{n}", fmt.num(months, 0))
      : t.barsTitleYears.replace("{n}", fmt.num(months / 12, 0));
  if (assets.length === 0) return null;
  const W = Math.max(320, Math.min(640, Math.round(measured ?? 640)));
  const H = 176;
  const padT = 18;
  /* the reserved name band — the bars and their value labels never
     enter it (the safe space the owner asked for: a deep negative bar
     used to collide with the asset's name under it) */
  const padB = 48;
  const values = assets.map((r) => r.pct ?? 0);
  const vmax = Math.max(0, ...values);
  const vmin = Math.min(0, ...values);
  const span = vmax - vmin || 1;
  const plotH = H - padT - padB;
  /* the zero baseline: at the bottom when nothing fell, otherwise
     placed by the up/down share of the range */
  const y0 = vmin < 0 ? padT + (vmax / span) * plotH : H - padB;
  const slot = W / assets.length;
  const barW = Math.min(58, slot * 0.5);
  const ariaParts = assets.map((r) => `${r.name} ${fmt.pct(r.pct ?? 0, 1)}`);
  return (
    <div className="mt-3" ref={ref}>
      <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{barsTitle}</h3>
      <svg
        dir="ltr"
        viewBox={`0 0 ${W} ${H}`}
        className="mt-1.5 block h-auto w-full"
        role="img"
        aria-label={`${barsTitle}: ${ariaParts.join(", ")}`}
      >
        {/* the zero baseline — every bar grows or drops from it */}
        <line x1={4} y1={y0} x2={W - 4} y2={y0} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.55} />
        {assets.map((r, i) => {
          const v = r.pct ?? 0;
          const cx = slot * i + slot / 2;
          const h = (Math.abs(v) / span) * plotH;
          const top = v >= 0 ? y0 - h : y0;
          /* the negative value label never leaves the plot band — the
             name row below is reserved, never entered */
          const labelY = v >= 0 ? top - 6 : Math.min(top + h + 12, H - padB - 8);
          return (
            <g key={r.line.id}>
              {/* the pastel fill (batch M) — the solid hue stays on the
                  chart's lines; a soft 40% tint carries the bar */}
              <rect
                x={cx - barW / 2}
                y={top}
                width={barW}
                height={Math.max(2, h)}
                rx={4}
                fill={r.line.color}
                fillOpacity={0.4}
              />
              <text x={cx} y={labelY} textAnchor="middle" fontSize={11} fontWeight={800} fill="var(--color-text-primary)">
                {fmt.pct(v, 1)}
              </text>
              <text x={cx} y={H - 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-text-secondary)">
                {r.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function CompareBand({ t, locale, fmt, correlation, corrT }: { t: CmpT; locale: Locale; fmt: Fmt; correlation: CorrelationPayload | null; corrT: CorrT }) {
  const [window, setWindow] = React.useState<WindowKey>("5Y");
  /* the correlation lesson — merged into the comparison band (its own
     section is gone; the real-yield relationship belongs with the
     alternatives), one tap away */
  const [corrOpen, setCorrOpen] = React.useState(false);
  /* which lines ride the chart — every line on by default, each one
     toggleable (gold against the S&P alone, or any subset) */
  const [enabled, setEnabled] = React.useState<Record<LineId, boolean>>({
    gold: true,
    realYield: true,
    silver: true,
    btc: true,
    spx: true,
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["currena-gold-compare"],
    queryFn: fetchCompareApi,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  /* every ASSET indexed to 100 at the window's start (left axis); the
     two yields ride their own honest right axis at their true % level —
     a rate is not an asset, and the dual axis says so instead of a
     nonsense index. The lines ride a heavier stroke (the owner asked
     for a little more width). */
  const series = React.useMemo(() => {
    if (data === undefined) return [];
    const out: TraceSeriesDef[] = [];
    for (const line of LINE_ORDER) {
      if (!enabled[line.id]) continue;
      const leg = data.legs.find((l) => l.id === line.id);
      if (leg === undefined) continue;
      if (YIELD_IDS.has(line.id)) {
        const cutoff = cutoffOf(leg.points[leg.points.length - 1]!.d, window);
        const slice = leg.points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
        if (slice.length < 2) continue;
        out.push({
          label: t.assets[line.id],
          color: line.color,
          points: slice,
          dashed: true,
          lineWidth: 1.9,
          axis: "right",
          format: (v: number) => `${fmt.num(v, 2)}%`,
        });
        continue;
      }
      const indexed = indexTo100(leg.points, window);
      if (indexed === null) continue;
      out.push({ label: t.assets[line.id], color: line.color, points: indexed, dashed: line.dashed, lineWidth: 2.8 });
    }
    return out;
  }, [data, window, enabled, t.assets, fmt]);

  /* the scorecard's own rows — each leg's start level, now level and the
     window's change, read as numbers because graphs are hard to read */
  const rows = React.useMemo(() => {
    if (data === undefined) return [];
    return LINE_ORDER.map((line) => {
      const leg = data.legs.find((l) => l.id === line.id);
      if (leg === undefined) return null;
      const cutoff = cutoffOf(leg.points[leg.points.length - 1]!.d, window);
      const slice = leg.points.filter((p) => Date.parse(`${p.d}T00:00:00Z`) >= cutoff);
      if (slice.length < 2) return null;
      if (YIELD_IDS.has(line.id)) {
        const delta = slice[slice.length - 1]!.v - slice[0]!.v;
        return { line, name: t.assets[line.id], pct: null, start: slice[0]!.v, end: slice[slice.length - 1]!.v, deltaPp: Number.isFinite(delta) ? delta : null };
      }
      const pct = (slice[slice.length - 1]!.v / slice[0]!.v - 1) * 100;
      return { line, name: t.assets[line.id], pct: Number.isFinite(pct) ? pct : null, start: slice[0]!.v, end: slice[slice.length - 1]!.v, deltaPp: null };
    }).filter((r) => r !== null) as Array<{ line: (typeof LINE_ORDER)[number]; name: string; pct: number | null; start: number; end: number; deltaPp: number | null }>;
  }, [data, window, t.assets]);
  /* the window's best and the worst (the assets' own % change; the
     yields are rates and never join the contest) — named, with the
     number, for the one-line summary above the scorecard */
  const extremes = React.useMemo(() => {
    const ranked = rows.filter((r) => r.pct !== null && !YIELD_IDS.has(r.line.id));
    if (ranked.length < 2) return { best: null as string | null, worst: null as string | null, bestId: null as string | null, worstId: null as string | null, bestPct: null as number | null, worstPct: null as number | null };
    const sorted = [...ranked].sort((a, b) => (a.pct ?? 0) - (b.pct ?? 0));
    const best = sorted[sorted.length - 1]!;
    const worst = sorted[0]!;
    return { best: best.name, worst: worst.name, bestId: best.line.id, worstId: worst.line.id, bestPct: best.pct, worstPct: worst.pct };
  }, [rows]);

  return (
    <section id="gold-compare" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="m-0 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the window chips + the line toggles — the window row is COMPACT
          (the owner's 2026-11-26 ask: all six windows on ONE row, «۱۰سال»
          never pushed to a second line): tight padding, tight gap, small
          font, whitespace-nowrap so the chips never break internally */}
      <div className="mt-3 flex flex-nowrap items-center gap-1 overflow-x-auto" role="group" aria-label={t.windowLabel}>
        {WINDOW_ORDER.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={window === key}
            onClick={() => setWindow(key)}
            className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors ${
              window === key
                ? "bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]"
            }`}
          >
            {t.ranges[key]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5" role="group" aria-label={t.toggleLabel}>
        {LINE_ORDER.map((line) => {
          const leg = data?.legs.find((l) => l.id === line.id);
          const on = enabled[line.id];
          return (
            <button
              key={line.id}
              type="button"
              aria-pressed={on}
              disabled={leg === undefined}
              onClick={() => setEnabled((e) => ({ ...e, [line.id]: !e[line.id] }))}
              className={`inline-flex min-h-[30px] items-center gap-1.5 rounded-full px-3 text-[12px] font-bold transition-colors ${
                leg === undefined
                  ? "cursor-default bg-[var(--color-surface)] text-[var(--color-text-tertiary)]/60 ring-1 ring-[var(--color-border)]/60"
                  : on
                    ? "bg-[var(--color-currena-soft)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)]"
              }`}
            >
              {/* the traditional legend swatch (batch M): a colour
                  SQUARE beside the name — [square]: bitcoin — not a
                  line; still the toggle it always was */}
              <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-[3px] ${on ? "" : "opacity-30"}`} style={{ background: line.color }} />
              {t.assets[line.id]}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">…</p>
      ) : isError || data === undefined || data.legs.length === 0 ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      ) : (
        <>
          <div className="mt-2.5">
            <TraceChart
              series={series}
              height={300}
              responsive
              baseline={100}
              lineLabels
              yFormat={(v) => fmt.num(v, 0)}
              yFormatRight={(v) => `${fmt.num(v, 1)}%`}
              fmt={fmt}
              ariaLabel={t.title}
              hoverNote={(s, v, first) =>
                s.axis === "right" ? null : first > 0 ? fmt.pct((v / first - 1) * 100) : null
              }
            />
          </div>

          {/* the bar view — the window's % change, one vertical bar per
              enabled asset, in each line's own colour (batch H); the
              title names the window itself (batch I) */}
          <CompareBars t={t} rows={rows} fmt={fmt} enabled={enabled} window={window} />

          {/* the scorecard — the window's gains and losses, in numbers */}
          {rows.length > 0 ? (
            <div className="mt-3">
              <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.tableTitle}</h3>
              {/* THE one-line summary — the window's own best and worst,
                  named, loss-aware: a loss is called a loss (بیشترین ضرر),
                  only a real gain is ever called a gain */}
              {extremes.best !== null && extremes.worst !== null && extremes.bestPct !== null && extremes.worstPct !== null ? (
                <p className="m-0 mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 type-caption font-bold">
                  {extremes.bestPct >= 0 ? (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-up)]/12 px-2.5 py-1 text-[var(--color-return-up)]">
                      {t.bestLine.replace("{name}", extremes.best).replace("{pct}", fmt.pct(extremes.bestPct, 1))}
                    </span>
                  ) : (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-down)]/10 px-2.5 py-1 text-[var(--color-text-secondary)] ring-1 ring-[var(--color-return-down)]/25">
                      {t.bestLossLine.replace("{name}", extremes.best).replace("{pct}", fmt.pct(extremes.bestPct, 1))}
                    </span>
                  )}
                  {extremes.worstPct < 0 ? (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-return-down)]/12 px-2.5 py-1 text-[var(--color-return-down)]">
                      {t.worstLossLine.replace("{name}", extremes.worst).replace("{pct}", fmt.pct(extremes.worstPct, 1))}
                    </span>
                  ) : (
                    <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-2.5 py-1 text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
                      {t.worstLine.replace("{name}", extremes.worst).replace("{pct}", fmt.pct(extremes.worstPct, 1))}
                    </span>
                  )}
                </p>
              ) : null}
              <div className="mt-1.5 min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
                <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption">
                  <thead>
                    <tr className="text-[var(--color-text-tertiary)]">
                      <th scope="col" className="px-2 py-1.5 text-start font-bold">{t.colAsset}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colStart}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colEnd}</th>
                      <th scope="col" className="px-2 py-1.5 text-end font-bold">{t.colChange}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const isYield = YIELD_IDS.has(row.line.id);
                      const money = row.line.id === "gold" || row.line.id === "silver" || row.line.id === "btc";
                      const fmtLevel = (v: number) =>
                        isYield ? `${fmt.num(v, 2)}%` : money ? `$${fmt.num(v, 2)}` : fmt.num(v, 2);
                      /* the window's own extremes — the best and the worst
                         highlighted with their own backgrounds */
                      const isBest = extremes.bestId === row.line.id;
                      const isWorst = extremes.worstId === row.line.id;
                      return (
                        <tr
                          key={row.line.id}
                          className={`border-t border-[var(--color-border)] ${enabled[row.line.id] ? "" : "opacity-55"}`}
                          style={
                            isBest
                              ? { backgroundColor: "color-mix(in srgb, var(--color-return-up) 12%, transparent)", boxShadow: "inset 2px 0 0 var(--color-return-up)" }
                              : isWorst
                                ? { backgroundColor: "color-mix(in srgb, var(--color-return-down) 12%, transparent)", boxShadow: "inset 2px 0 0 var(--color-return-down)" }
                                : undefined
                          }
                        >
                          <th scope="row" className="px-2 py-1.5 text-start font-bold">
                            <span className="inline-flex items-center gap-1.5">
                              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: row.line.color }} />
                              <span className="text-[var(--color-text-primary)]">{row.name}</span>
                            </span>
                          </th>
                          <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">
                            <bdi dir="ltr">{fmtLevel(row.start)}</bdi>
                          </td>
                          <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                            <bdi dir="ltr">{fmtLevel(row.end)}</bdi>
                          </td>
                          <td className="px-2 py-1.5 text-end">
                            {isYield ? (
                              <bdi
                                dir="ltr"
                                className={`font-bold tabular-nums ${
                                  row.deltaPp !== null && row.deltaPp > 0
                                    ? "text-[var(--color-return-down)]"
                                    : row.deltaPp !== null && row.deltaPp < 0
                                      ? "text-[var(--color-return-up)]"
                                      : "text-[var(--color-text-secondary)]"
                                }`}
                              >
                                {row.deltaPp === null
                                  ? "·"
                                  : `${row.deltaPp > 0 ? "+" : row.deltaPp < 0 ? "−" : ""}${fmt.num(Math.abs(row.deltaPp), 2)} ${t.unitPp}`}
                              </bdi>
                            ) : (
                              <SignedDelta v={row.pct} fmt={fmt} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* the correlation lesson — the old standalone section, merged here:
          gold's relationship with the real yield belongs with the
          alternatives; the chart + its method sit behind one tap */}
      {correlation !== null ? (
        <div className="mt-3 border-t border-[var(--color-border)] pt-3">
          <button
            type="button"
            aria-expanded={corrOpen}
            onClick={() => setCorrOpen((o) => !o)}
            /* the owner's ask: no blue fill — the blue border + blue text
               carry the chip, the background stays the page's own */
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-transparent px-3.5 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
          >
            {corrOpen ? corrT.lessonClose : corrT.lessonOpen}
            <span aria-hidden="true" className={`text-[10px] transition-transform ${corrOpen ? "rotate-180" : ""}`}>▾</span>
          </button>
          {corrOpen ? (
            <div className="mt-3 flex flex-col gap-2">
              <div>
                <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{corrT.title}</h3>
                <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{corrT.subtitle}</p>
              </div>
              <CorrelationLeg data={correlation} t={corrT} fmt={fmt} locale={locale} />
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
