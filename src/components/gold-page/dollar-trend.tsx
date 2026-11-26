"use client";

/**
 * DollarTrendBand — «روند نرخ طلا در برابر دلار»: the ۱۳۵۷-to-today
 * race between holding gold and holding dollars in Iran, both marked
 * in toman — the payoff of the Iran bridge: the reader who just
 * learned the حباب decomposition now sees its 47-year consequence.
 *
 * Serves off /api/gold/dollar-trend (the cited static table + the
 * TGJU evergreen legs + the parity derivation — every basis named at
 * point of use); the race, the year-by-year winners, the decoupling
 * detector «در جهان پایین، در ایران بالا», the sync score and the
 * premium arc are computed CLIENT-side through the pure engine (the
 * if-bought pattern: the route serves data, never results).
 *
 * The chart follows the house grammar: LTR root, stretched SVG,
 * tokens only, log Y by default (47 years of multiples in the tens of
 * thousands — linear would be a cliff), two indexed lines + a thin
 * global-gold context line, the era seams as quiet dashed verticals,
 * the hover trace in the HTML readout above, on-chart line labels.
 * Fail-closed: a missing leg renders its honest line, never a guess.
 * Display-only, never advice.
 */

import * as React from "react";
import { BookOpen, ChevronDown, Scale } from "lucide-react";
import type { Locale, UI } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, Sparkline } from "@/components/gold-page/visuals";
import { type RatesPayload } from "@/components/gold-page/bridge-board";
import { coinPremium, dollarTomanOf } from "@/lib/gold-page/coin-premium";
import {
  DECOUPLING_EVENTS,
  RACE_START_JY,
  chartSeries,
  decouplingYears,
  globalGoldMultiple,
  gold18ParityToman,
  growthDecomposition,
  mostDivergentYear,
  mostSyncYear,
  premiumArc,
  race,
  trendYearRows,
  winCounts,
  type DollarTrendPayload,
  type TrendVerdictYear,
} from "@/lib/gold-page/dollar-trend";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

type TrendT = (typeof UI)["en"]["dollarTrend"];

/* ------------------------------------------------------------------ *
 * The chart — a bespoke stretched SVG (the house grammar): two lines
 * indexed to 100 at the start year (gold vs the dollar, both toman)
 * + the thin global-gold (USD) context line; log Y by default; the
 * era seams as quiet dashed verticals; the hover trace reads the
 * year's three values + the winner word in the readout above.
 * ------------------------------------------------------------------ */

const CHART_W = 640;
const CHART_H = 250;
const PAD = { l: 10, r: 68, t: 16, b: 24 };

/** The basis seams (TGJU dollar ۱۳۹۰ / geram18 ۱۳۹۲) and the
 *  rial-collapse years (۱۳۹۱, ۱۳۹۷, ۱۴۰۰) — all quiet, all dashed. */
const BASIS_SEAMS = [1390, 1392] as const;
const EVENT_SEAMS = [1391, 1397, 1400] as const;

/** The two hues: gold rides the gold token, the dollar the
 *  currena-blue family — the context line stays tertiary. */
const GOLD_STROKE = "var(--color-accent-gold-strong)";
const DOLLAR_STROKE = "var(--color-currena-blue)";
const GLOBAL_STROKE = "var(--color-text-tertiary)";

/** A path over possibly-null points — nulls split the line (a missing
 *  leg is a gap, never a bridge across the unknown). */
function buildPath(
  vals: readonly (number | null)[],
  xOf: (i: number) => number,
  yOf: (v: number) => number,
): { d: string; lastIndex: number; lastV: number | null } {
  let d = "";
  let pen = false;
  let lastIndex = -1;
  let lastV: number | null = null;
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v === null || !Number.isFinite(v) || v <= 0) {
      pen = false;
      continue;
    }
    d += `${pen ? "L" : "M"}${xOf(i).toFixed(1)},${yOf(v).toFixed(1)} `;
    pen = true;
    lastIndex = i;
    lastV = v;
  }
  return { d: d.trim(), lastIndex, lastV };
}

function TrendChart({
  data,
  startJy,
  scale,
  locale,
  fmt,
  t,
  onHover,
}: {
  data: DollarTrendPayload;
  startJy: number;
  scale: "log" | "linear";
  locale: Locale;
  fmt: Fmt;
  t: TrendT;
  onHover: (jy: number | null) => void;
}) {
  const series = React.useMemo(() => chartSeries(data, startJy), [data, startJy]);

  const model = React.useMemo(() => {
    if (series === null) return null;
    const H = CHART_H;
    const { l, r, tt, b } = { l: PAD.l, r: PAD.r, tt: PAD.t, b: PAD.b };
    const n = series.jys.length;
    if (n < 2) return null;
    const all: number[] = [];
    for (const v of [...series.gold, ...series.dollar, ...series.global]) {
      if (v !== null && Number.isFinite(v) && v > 0) all.push(v);
    }
    if (all.length < 2) return null;
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (scale === "log") {
      lo = lo / 1.6;
      hi = hi * 1.6;
    } else {
      const pad = (hi - lo) * 0.05;
      lo = Math.max(0, lo - pad);
      hi = hi + pad;
    }
    if (!(hi > lo)) return null;
    const xOf = (i: number): number => l + (i / (n - 1)) * (CHART_W - l - r);
    const yOf =
      scale === "log"
        ? (v: number): number => tt + (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (H - tt - b)
        : (v: number): number => tt + (1 - (v - lo) / (hi - lo)) * (H - tt - b);
    const gold = buildPath(series.gold, xOf, yOf);
    const dollar = buildPath(series.dollar, xOf, yOf);
    const global = buildPath(series.global, xOf, yOf);
    /* the y grid: log decades (or four clean linear ticks), labelled
       on the right — indexed multiples, ×-prefixed */
    const yGrid: { v: number; label: string }[] =
      scale === "log"
        ? [100, 1000, 10000, 100000, 1000000, 10000000, 100000000]
            .filter((v) => v > lo && v < hi)
            .map((v) => ({ v, label: `×${fmt.num(v, 0)}` }))
        : (() => {
            const out: { v: number; label: string }[] = [];
            for (let i = 0; i <= 3; i++) {
              const v = lo + (i / 3) * (hi - lo);
              out.push({ v, label: `×${fmt.num(Math.round(v), 0)}` });
            }
            return out;
          })();
    /* the x ticks: the Jalali decades; fa reads the Jalali year, EN
       reads the Gregorian year the Jalali year starts in */
    const firstJy = series.jys[0]!;
    const lastJy = series.jys[n - 1]!;
    const xTicks: { jy: number; label: string }[] = [];
    for (let jy = Math.ceil(firstJy / 10) * 10; jy <= lastJy; jy += 10) {
      xTicks.push({ jy, label: yearLabel(jy, locale) });
    }
    if (xTicks.length === 0 || lastJy - xTicks[xTicks.length - 1]!.jy > 4) {
      xTicks.push({ jy: lastJy, label: yearLabel(lastJy, locale) });
    }
    return { n, firstJy, lastJy, xOf, yOf, gold, dollar, global, yGrid, xTicks };
  }, [series, scale, locale, fmt]);

  if (model === null) return null;
  const { n, firstJy, lastJy, xOf, yOf, gold, dollar, global, yGrid, xTicks } = model;

  /** one line's end label — above the endpoint, unless it crowds the top */
  const endLabel = (idx: number, v: number | null, text: string, color: string): React.ReactNode => {
    if (idx < 0 || v === null) return null;
    const x = xOf(idx);
    const y = yOf(v);
    const above = y > PAD.t + 16;
    return (
      <text
        x={x - 5}
        y={above ? y - 7 : y + 13}
        fontSize={9.5}
        fontWeight={700}
        fill={color}
        textAnchor="end"
        style={{ direction: "ltr" }}
      >
        {text}
      </text>
    );
  };

  return (
    <svg
      dir="ltr"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="block h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={t.chartAria}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        const svgX = frac * CHART_W;
        const i = Math.round(((svgX - PAD.l) / (CHART_W - PAD.l - PAD.r)) * (n - 1));
        const jy = series!.jys[Math.min(n - 1, Math.max(0, i))]!;
        onHover(jy);
      }}
      onPointerLeave={() => onHover(null)}
    >
      {/* the y grid + labels (right, the house convention) */}
      {yGrid.map((g) => (
        <g key={`y${g.v}`}>
          <line x1={PAD.l} x2={CHART_W - PAD.r} y1={yOf(g.v)} y2={yOf(g.v)} stroke="var(--color-border)" strokeOpacity={0.5} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          <text x={CHART_W - PAD.r + 6} y={yOf(g.v) + 3.5} fontSize={9.5} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
            {g.label}
          </text>
        </g>
      ))}
      {/* the x ticks */}
      {xTicks.map((tk) => (
        <text key={`x${tk.jy}`} x={xOfOf(series!, tk.jy)} y={CHART_H - 8} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="middle" style={{ direction: "ltr" }}>
          {tk.label}
        </text>
      ))}
      {/* the era seams — the basis boundaries and the rial-collapse years, quiet dashed verticals */}
      {BASIS_SEAMS.filter((jy) => jy > firstJy && jy < lastJy).map((jy) => (
        <line key={`b${jy}`} x1={xOfOf(series!, jy)} x2={xOfOf(series!, jy)} y1={PAD.t} y2={CHART_H - PAD.b} stroke="var(--color-border)" strokeOpacity={0.75} strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />
      ))}
      {EVENT_SEAMS.filter((jy) => jy > firstJy && jy < lastJy).map((jy) => (
        <line key={`e${jy}`} x1={xOfOf(series!, jy)} x2={xOfOf(series!, jy)} y1={PAD.t} y2={CHART_H - PAD.b} stroke="var(--color-border)" strokeOpacity={0.45} strokeDasharray="1 4" vectorEffect="non-scaling-stroke" />
      ))}
      {/* the three lines — gold, the dollar, the global context */}
      <path d={global.d} fill="none" stroke={GLOBAL_STROKE} strokeWidth={1.25} strokeOpacity={0.8} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={dollar.d} fill="none" stroke={DOLLAR_STROKE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={gold.d} fill="none" stroke={GOLD_STROKE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* the end dots + the on-chart line labels */}
      {gold.lastIndex >= 0 && gold.lastV !== null ? (
        <circle cx={xOf(gold.lastIndex)} cy={yOf(gold.lastV)} r={3} fill={GOLD_STROKE} />
      ) : null}
      {dollar.lastIndex >= 0 && dollar.lastV !== null ? (
        <circle cx={xOf(dollar.lastIndex)} cy={yOf(dollar.lastV)} r={3} fill={DOLLAR_STROKE} />
      ) : null}
      {global.lastIndex >= 0 && global.lastV !== null ? (
        <circle cx={xOf(global.lastIndex)} cy={yOf(global.lastV)} r={2.5} fill={GLOBAL_STROKE} />
      ) : null}
      {endLabel(gold.lastIndex, gold.lastV, t.lineGold, GOLD_STROKE)}
      {endLabel(dollar.lastIndex, dollar.lastV, t.lineDollar, DOLLAR_STROKE)}
      {endLabel(global.lastIndex, global.lastV, t.lineGlobal, GLOBAL_STROKE)}
    </svg>
  );
}

/** The x position of a specific Jalali year inside the series. */
function xOfOf(series: { jys: number[] }, jy: number): number {
  const n = series.jys.length;
  const idx = series.jys.indexOf(jy);
  if (idx < 0) {
    // between ticks: interpolate on the year grid
    const first = series.jys[0]!;
    const last = series.jys[n - 1]!;
    const frac = (jy - first) / Math.max(1, last - first);
    return PAD.l + Math.min(1, Math.max(0, frac)) * (CHART_W - PAD.l - PAD.r);
  }
  return PAD.l + (idx / (n - 1)) * (CHART_W - PAD.l - PAD.r);
}

/* ------------------------------------------------------------------ *
 * Formatting helpers (locale-aware, Persian digits in fa)
 * ------------------------------------------------------------------ */

/** A Jalali year for the axis/picker/readout: fa reads the Jalali
 *  year, EN reads the Gregorian year the Jalali year starts in. */
function yearLabel(jy: number, locale: Locale): string {
  try {
    return (locale === "fa" ? jy : jy + 621).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
  } catch {
    return String(jy);
  }
}

/** The divergent verdict's direction word — the same-side years say so
 *  honestly ("both moved, but far apart"); the opposite-side years name
 *  the two faces (gold down while the dollar rose, or the reverse). */
function directionWordOf(v: TrendVerdictYear, t: TrendT): string {
  if (v.sameDirection) return t.dirSameSide;
  return v.goldRet < 0 ? t.dirGoldDownDollarUp : t.dirGoldUpDollarDown;
}

/* ------------------------------------------------------------------ *
 * The band itself
 * ------------------------------------------------------------------ */

export function DollarTrendBand({
  t,
  locale,
  fmt,
  data,
  pending,
  rates,
}: {
  t: TrendT;
  locale: Locale;
  fmt: Fmt;
  data: DollarTrendPayload | null;
  pending: boolean;
  /** The bridge board's own live rates payload — the premium arc's
   *  current value rides ITS legs (the same engine the board above
   *  runs), so the reader never sees two numbers for one حباب. */
  rates: RatesPayload | null;
}) {
  const rows = React.useMemo(() => (data !== null ? trendYearRows(data) : []), [data]);
  const verdict = React.useMemo(() => (data !== null ? race(data) : null), [data]);
  const counts = React.useMemo(() => (data !== null ? winCounts(data) : null), [data]);
  const decoupled = React.useMemo(() => (data !== null ? decouplingYears(data) : []), [data]);
  const arc = React.useMemo(() => (data !== null ? premiumArc(data) : null), [data]);
  /* the two headline years (batch M): the most in-sync and the most
     divergent complete year of the race */
  const syncYear = React.useMemo(() => (data !== null ? mostSyncYear(data) : null), [data]);
  const divergeYear = React.useMemo(() => (data !== null ? mostDivergentYear(data) : null), [data]);
  /* the premium's current value — the bridge board's OWN computation
     (the same coinPremium engine, the same live legs), so the two
     boards can never disagree; the payload's running legs are the
     honest fallback when the board's legs are missing */
  const livePremiumPct = React.useMemo(() => {
    if (rates != null) {
      const usd = rates.rates?.find((r) => r.code === "USD");
      const dollar = dollarTomanOf(usd?.rate);
      if (dollar !== null) {
        const row = coinPremium(rates.gold ?? [], dollar).rows.find((r) => r.id === "gold-18k");
        if (row !== undefined) return row.premiumPct;
      }
    }
    if (data !== null) {
      const run = data.running;
      if (run.gold18Toman !== null && run.goldUsdOz !== null && run.dollarToman !== null) {
        const parity = gold18ParityToman(run.goldUsdOz, run.dollarToman);
        if (parity !== null && parity > 0) return (run.gold18Toman / parity - 1) * 100;
      }
    }
    return null;
  }, [rates, data]);

  /* the chart's own state — the start year and the Y scale */
  const lastJy = rows.length > 0 ? rows[rows.length - 1]!.jy : RACE_START_JY;
  const [startJy, setStartJy] = React.useState<number>(RACE_START_JY);
  React.useEffect(() => {
    if (startJy > lastJy) setStartJy(lastJy);
  }, [startJy, lastJy]);
  const [scale, setScale] = React.useState<"log" | "linear">("log");
  const [hoverJy, setHoverJy] = React.useState<number | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  /* batch M: the premium arc and the basis/sources note both hide
     until asked for (the owner's ask) */
  const [arcOpen, setArcOpen] = React.useState(false);
  const [methodOpen, setMethodOpen] = React.useState(false);
  /* the growth decomposition (batch M) — rides the chart's own start
     year, so the reader's picked span is the span being explained; the
     dollar's global decay against gold over the same span is its
     honest counterweight */
  const decomp = React.useMemo(() => (data !== null ? growthDecomposition(data, startJy) : null), [data, startJy]);
  const decayMultiple = React.useMemo(() => (data !== null ? globalGoldMultiple(data, startJy) : null), [data, startJy]);

  /* the hover trace — the readout row above the chart; null falls back
     to the last point (the running year, live) */
  const readout = React.useMemo(() => {
    if (rows.length === 0) return null;
    if (hoverJy === null) return rows[rows.length - 1]!;
    return rows.find((r) => r.jy === hoverJy) ?? rows[rows.length - 1]!;
  }, [rows, hoverJy]);

  /* the table's own money formatters — compact toman, USD beside its
     column head (the M/bn toman convention for the big years) */
  const tomanCell = (v: number): string => {
    if (v >= 1_000_000) {
      const m = v / 1_000_000;
      const digits = m >= 100 ? 1 : 2;
      return locale === "fa" ? `${fmt.num(m, digits)} ${t.millionWord}` : `${fmt.num(m, digits)}M`;
    }
    return fmt.num(v, v < 1000 ? 1 : 0);
  };
  const usdCell = (v: number): string => (locale === "en" ? `$${fmt.num(v, 0)}` : fmt.num(v, 0));

  const liveMissed =
    data !== null && data.running.dollarToman === null && data.running.gold18Toman === null;

  const visibleRows = expanded ? rows : rows.slice(-10);

  return (
    <section
      id="gold-dollar-trend"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-bridge-accent)]/30 sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      {/* zone 1 — the header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bridge-accent)]/12 text-[var(--color-bridge-accent)]" aria-hidden="true">
          <Scale className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="m-0 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h2>
          <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>
        </div>
      </div>

      {pending ? (
        <div className="mt-3 flex flex-col items-center gap-2 py-6" role="status">
          <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">{t.pendingLine}</p>
          <span className="flex justify-center gap-2.5" aria-hidden="true">
            <span className="loader-dot" />
            <span className="loader-dot" />
            <span className="loader-dot" />
          </span>
        </div>
      ) : data === null ? (
        <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      ) : (
        <>
          {liveMissed ? (
            <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.liveMissed}</p>
          ) : null}

          {/* the verdict chip — the since-۱۳۵۷ race, always visible */}
          {verdict !== null ? (
            <div
              className="mt-3 flex items-start gap-2.5 rounded-[var(--cr-radius-md)] px-3 py-2.5"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 10%, transparent)",
                boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 35%, transparent)",
              }}
              data-dollar-trend-verdict
            >
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-primary)]">
                <bdi>
                  {t.verdictLine
                    .replace("{year}", yearLabel(verdict.startJy, locale))
                    .replace("{g}", fmt.num(verdict.goldX, 0))
                    .replace("{d}", fmt.num(verdict.dollarX, 0))
                    .replace("{ratio}", fmt.num(verdict.ratio, 1))
                    .replace("{winner}", verdict.winner === "gold" ? t.winnerGold : t.winnerDollar)}
                </bdi>
              </p>
            </div>
          ) : null}

          {/* zone 1.5 — THE two most important verdicts (batch M): the
              single year the two assets moved most alike, and the single
              year they moved most apart — the race's most faithful and
              most two-faced years, one box each, always in the open */}
          {syncYear !== null || divergeYear !== null ? (
            <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {syncYear !== null ? (
                <div
                  className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]"
                  data-dollar-trend-sync-year
                >
                  <span className="type-caption font-bold text-[var(--color-text-tertiary)]">{t.syncYearLabel}</span>
                  <bdi className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-text-primary)]">
                    {yearLabel(syncYear.jy, locale)}
                  </bdi>
                  <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                    <bdi>
                      {t.syncYearLine
                        .replace("{g}", fmt.pct(syncYear.goldRet, 1))
                        .replace("{d}", fmt.pct(syncYear.dollarRet, 1))
                        .replace("{direction}", syncYear.goldRet >= 0 ? t.dirBothUp : t.dirBothDown)}
                    </bdi>
                  </p>
                </div>
              ) : null}
              {divergeYear !== null ? (
                <div
                  className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]"
                  data-dollar-trend-diverge-year
                >
                  <span className="type-caption font-bold text-[var(--color-text-tertiary)]">{t.divergeYearLabel}</span>
                  <bdi className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-text-primary)]">
                    {yearLabel(divergeYear.jy, locale)}
                  </bdi>
                  <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                    <bdi>
                      {t.divergeYearLine
                        .replace("{g}", fmt.pct(divergeYear.goldRet, 1))
                        .replace("{d}", fmt.pct(divergeYear.dollarRet, 1))
                        .replace("{gap}", fmt.num(divergeYear.gap, 0))
                        .replace("{direction}", directionWordOf(divergeYear, t))}
                    </bdi>
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* the dollar's own global decay (batch M): its Iranian rise is
              not all gain — measured in gold alone, the dollar's
              purchasing power fell over the same span; one honest line
              under the two verdicts */}
          {decayMultiple !== null && decayMultiple > 1 ? (
            <p className="m-0 mt-1.5 type-caption leading-relaxed text-[var(--color-text-tertiary)]" data-dollar-trend-decay>
              <bdi>
                {t.dollarDecayLine
                  .replace("{pct}", locale === "fa" ? `${fmt.num((1 - 1 / decayMultiple) * 100, 0)}٪` : `${fmt.num((1 - 1 / decayMultiple) * 100, 0)}%`)
                  .replace("{year}", yearLabel(startJy, locale))}
              </bdi>
            </p>
          ) : null}

          {/* zone 2 — the chart */}
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.startLabel}</span>
              <select
                value={startJy}
                onChange={(e) => setStartJy(Number(e.currentTarget.value))}
                className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                aria-label={t.startLabel}
              >
                {(() => {
                  const options: number[] = [];
                  for (let jy = RACE_START_JY; jy <= lastJy; jy++) options.push(jy);
                  return options.map((jy) => (
                    <option key={jy} value={jy}>
                      {yearLabel(jy, locale)}
                    </option>
                  ));
                })()}
              </select>
            </label>
            <div role="group" aria-label={t.scaleLog} className="flex gap-1.5">
              {([["log", t.scaleLog], ["linear", t.scaleLinear]] as const).map(([s, label]) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={scale === s}
                  onClick={() => setScale(s)}
                  className={`min-h-[32px] rounded-full px-3 py-1 text-[12.5px] font-bold transition-colors ${
                    scale === s
                      ? "bg-[var(--color-bridge-accent)] text-white"
                      : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* the readout row — the hover trace or the live last point */}
          {readout !== null ? (
            <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 type-caption font-semibold text-[var(--color-text-secondary)]">
              <bdi className="font-black tabular-nums text-[var(--color-bridge-accent)]">{yearLabel(readout.jy, locale)}</bdi>
              {readout.running ? (
                <span className="rounded-full bg-[var(--color-currena-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-currena-blue-deep)]">{t.liveWord}</span>
              ) : null}
              {readout.gold18Toman !== null ? (
                <bdi>
                  {t.goldWord} <bdi dir="ltr" className="font-bold tabular-nums text-[var(--color-text-primary)]">{tomanCell(readout.gold18Toman)}</bdi>
                </bdi>
              ) : null}
              {readout.dollarToman !== null ? (
                <bdi>
                  {t.dollarWord} <bdi dir="ltr" className="font-bold tabular-nums text-[var(--color-text-primary)]">{tomanCell(readout.dollarToman)}</bdi>
                </bdi>
              ) : null}
              {readout.goldUsdOz !== null ? (
                <bdi>
                  {t.globalWord} <bdi dir="ltr" className="font-bold tabular-nums text-[var(--color-text-primary)]">${fmt.num(readout.goldUsdOz, 0)}</bdi>
                </bdi>
              ) : null}
              {readout.winner !== null ? (
                <bdi className="text-[var(--color-text-tertiary)]">
                  {t.winnerWord}: <span className="font-bold" style={{ color: readout.winner === "gold" ? "var(--color-accent-gold-deep)" : "var(--color-currena-blue-deep)" }}>{readout.winner === "gold" ? t.chipGold : t.chipDollar}</span>
                </bdi>
              ) : null}
            </p>
          ) : null}

          <div className="mt-1">
            <TrendChart data={data} startJy={startJy} scale={scale} locale={locale} fmt={fmt} t={t} onHover={setHoverJy} />
          </div>

          {/* the era chips — the three bases, named at point of use */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
              {locale === "en" ? "1357–1389 · historical / parity" : "۱۳۵۷–۱۳۸۹ · تاریخی / برابری"}
            </span>
            <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
              {locale === "en" ? "1390–1391 · TGJU dollar + parity" : "۱۳۹۰–۱۳۹۱ · دلار TGJU + برابری"}
            </span>
            <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
              {locale === "en" ? "1392 → today · the Tehran market" : "۱۳۹۲ → امروز · بازار تهران"}
            </span>
          </div>

          {/* zone 3 — the race table */}
          <div className="mt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">{t.tableTitle}</h3>
              {counts !== null && counts.decidedYears > 0 ? (
                <p className="m-0 type-caption text-[var(--color-text-tertiary)]" data-dollar-trend-summary>
                  <bdi>
                    {t.summaryLine
                      .replace("{n}", fmt.num(counts.decidedYears, 0))
                      .replace("{g}", fmt.num(counts.goldYears, 0))
                      .replace("{d}", fmt.num(counts.dollarYears, 0))}
                  </bdi>
                </p>
              ) : null}
            </div>
            <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.tableNote}</p>
            <div className="mt-1.5 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
              <table className="m-0 w-full border-collapse type-caption">
                <thead>
                  <tr className="text-[var(--color-text-tertiary)]">
                    <th scope="col" className="px-2.5 py-1.5 text-start font-bold">{t.colYear}</th>
                    <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colGold}</th>
                    <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colDollar}</th>
                    <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colGlobal}</th>
                    <th scope="col" className="px-2.5 py-1.5 text-end font-bold">{t.colWinner}</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => (
                    <tr
                      key={row.jy}
                      className={`border-t border-[var(--color-border)] ${row.running ? "bg-[var(--color-currena-soft)]/50" : ""}`}
                    >
                      <th scope="row" className="px-2.5 py-1.5 text-start font-bold tabular-nums text-[var(--color-text-primary)]">
                        <bdi>{yearLabel(row.jy, locale)}</bdi>
                        {row.running ? (
                          <span className="ms-1.5 rounded-full bg-[var(--color-currena-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-currena-blue-deep)]">{t.liveWord}</span>
                        ) : null}
                      </th>
                      <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                        {row.gold18Toman !== null ? <bdi dir="ltr">{tomanCell(row.gold18Toman)}</bdi> : "·"}
                      </td>
                      <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                        {row.dollarToman !== null ? <bdi dir="ltr">{tomanCell(row.dollarToman)}</bdi> : "·"}
                      </td>
                      <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-primary)]">
                        {row.goldUsdOz !== null ? <bdi dir="ltr">{usdCell(row.goldUsdOz)}</bdi> : "·"}
                      </td>
                      <td className="px-2.5 py-1.5 text-end">
                        {row.winner === null ? (
                          <span className="text-[var(--color-text-tertiary)]">—</span>
                        ) : (
                          <span
                            className="inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                            style={
                              row.winner === "gold"
                                ? {
                                    backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 15%, transparent)",
                                    color: "var(--color-accent-gold-deep)",
                                  }
                                : {
                                    backgroundColor: "color-mix(in srgb, var(--color-currena-blue) 14%, transparent)",
                                    color: "var(--color-currena-blue-deep)",
                                  }
                            }
                          >
                            {row.winner === "gold" ? t.chipGold : t.chipDollar}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 10 ? (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mt-1.5 min-h-[32px] rounded-full bg-[var(--color-surface)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                {expanded ? t.collapseTen : t.expandAll.replace("{n}", fmt.num(rows.length, 0))}
              </button>
            ) : null}
          </div>

          {/* zone 4 — the decoupling list, the section's signature.
              The third column is the RIAL's own value (the owner's ask):
              not "the dollar grew" — the toman lost value against the
              dollar; each row states the year-end toman-per-USD rate,
              the rial's own % fall riding under it in red */}
          <div className="mt-3">
            <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-bridge-accent)]">{t.decouplingTitle}</h3>
            <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.decouplingSubtitle}</p>
            {decoupled.length === 0 ? (
              <p className="m-0 mt-1.5 type-caption text-[var(--color-text-tertiary)]">{t.decouplingEmpty}</p>
            ) : (
              <div className="mt-1.5 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
                <table className="m-0 w-full border-collapse type-caption">
                  <thead>
                    <tr className="text-[var(--color-text-tertiary)]">
                      <th scope="col" className="px-2.5 py-1.5 text-start font-bold">{t.colYear}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.decouplingColGlobal}</th>
                      <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.decouplingColIran}</th>
                      <th scope="col" className="px-2.5 py-1.5 text-end font-bold">{t.decouplingColDollar}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decoupled.map((row) => {
                      const event = DECOUPLING_EVENTS[row.jy];
                      /* the rial's own move = minus the dollar's — a
                         falling rial renders red, a rising one green */
                      const rialRet = -row.dollarRet;
                      return (
                        <tr key={row.jy} className="border-t border-[var(--color-border)]">
                          <th scope="row" className="px-2.5 py-1.5 text-start align-top font-bold tabular-nums text-[var(--color-text-primary)]">
                            <bdi>{yearLabel(row.jy, locale)}</bdi>
                            {event !== undefined ? (
                              <span className="block text-[10.5px] font-semibold text-[var(--color-text-tertiary)]">{event[lan(locale)]}</span>
                            ) : null}
                          </th>
                          <td className="px-1.5 py-1.5 text-end">
                            <SignedDelta v={row.globalRet} fmt={fmt} />
                          </td>
                          <td className="px-1.5 py-1.5 text-end">
                            <SignedDelta v={row.iranRet} fmt={fmt} />
                          </td>
                          <td className="px-2.5 py-1.5 text-end align-top">
                            {row.dollarToman !== null && Number.isFinite(row.dollarToman) && row.dollarToman > 0 ? (
                              <span className="flex flex-col items-end gap-0 leading-tight">
                                <bdi className="font-bold tabular-nums text-[var(--color-text-primary)]">
                                  {tomanCell(row.dollarToman)}
                                  <span className="ms-1 font-semibold text-[var(--color-text-tertiary)]">{locale === "en" ? "toman" : "تومان"}</span>
                                </bdi>
                                <bdi
                                  dir="ltr"
                                  className="text-[10.5px] font-bold tabular-nums"
                                  style={{ color: rialRet < 0 ? "var(--color-return-down)" : "var(--color-return-up)" }}
                                  title={t.decouplingRialFall.replace("{v}", `${rialRet > 0 ? "+" : "−"}${fmt.num(Math.abs(rialRet), 0)}${locale === "fa" ? "٪" : "%"}`)}
                                >
                                  {rialRet > 0 ? "+" : "−"}{fmt.num(Math.abs(rialRet), 0)}{locale === "fa" ? "٪" : "%"}
                                </bdi>
                              </span>
                            ) : (
                              <SignedDelta v={row.dollarRet} fmt={fmt} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* zone 4.5b — the growth decomposition (batch M, the owner's
              ask): of gold's Iran growth since the picked year, how much
              was the rial's fall (Iran's inflation / the weakening
              currency — a weaker rial makes everything costlier in toman,
              gold included), how much the world's own gold move, how much
              the Tehran premium. The exact multiplicative identity, its
              logarithm split additively so the shares sum to 100% */}
          {decomp !== null ? (
            <div
              className="mt-2.5 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]"
              data-dollar-trend-decomp
            >
              <h3 className="m-0 text-[1.02rem] font-extrabold text-[var(--color-bridge-accent)]">{t.decompTitle}</h3>
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                <bdi>
                  {t.decompLine
                    .replace("{year}", yearLabel(decomp.startJy, locale))
                    .replace("{g}", fmt.num(decomp.goldX, 0))
                    .replace("{d}", fmt.num(decomp.dollarX, 0))
                    .replace("{w}", fmt.num(decomp.globalX, 0))
                    /* the premium leg lives near ×۱ — two decimals so a
                       ۱٫۰۴ never collapses into a clean ×۱ */
                    .replace("{p}", fmt.num(decomp.premiumX, 2))}
                </bdi>
              </p>
              {decomp.shares !== null ? (
                <>
                  {/* THE pie (the owner's ask): the growth split as a
                      donut — how much of gold's Iran rise was the rial's
                      fall (Iran's currency/economic troubles), how much
                      the world's own gold growth, how much Tehran's
                      premium — the shares labelled right on the ring,
                      the total multiple in the hole. Drawn only when
                      every share reads positive; a leg that subtracted
                      from the growth steps back to the numbers alone,
                      never a misleading pie */}
                  {decomp.shares.rialPct >= 0 && decomp.shares.globalPct >= 0 && decomp.shares.premiumPct >= 0 ? (
                    <DecompPie
                      shares={decomp.shares}
                      multiple={decomp.goldX}
                      fmt={fmt}
                      locale={locale}
                      ariaLabel={t.decompSharesLine
                        .replace("{r}", fmt.pct(decomp.shares.rialPct, 0))
                        .replace("{w}", fmt.pct(decomp.shares.globalPct, 0))
                        .replace("{p}", fmt.pct(decomp.shares.premiumPct, 0))}
                    />
                  ) : null}
                  {/* the traditional legend — [square]: name, one entry
                      per leg, the share beside it */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-[var(--color-text-tertiary)]">
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--color-currena-blue)", opacity: 0.55 }} />
                      {t.decompShareRial}
                      <bdi className="font-bold tabular-nums text-[var(--color-text-secondary)]">{fmt.pct(decomp.shares.rialPct, 0)}</bdi>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--color-accent-gold-strong)", opacity: 0.55 }} />
                      {t.decompShareGlobal}
                      <bdi className="font-bold tabular-nums text-[var(--color-text-secondary)]">{fmt.pct(decomp.shares.globalPct, 0)}</bdi>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span aria-hidden="true" className="inline-block h-3 w-3 rounded-[3px]" style={{ background: "var(--color-bridge-accent)", opacity: 0.55 }} />
                      {t.decompSharePremium}
                      {/* the premium's share is the smallest leg — one
                          decimal so a sub-percent share never reads as
                          a clean zero */}
                      <bdi className="font-bold tabular-nums text-[var(--color-text-secondary)]">{fmt.pct(decomp.shares.premiumPct, Math.abs(decomp.shares.premiumPct) < 0.95 ? 1 : 0)}</bdi>
                    </span>
                  </div>
                  <p className="m-0 type-caption font-semibold leading-relaxed text-[var(--color-text-primary)]">
                    <bdi>
                      {t.decompSharesLine
                        .replace("{r}", fmt.pct(decomp.shares.rialPct, 0))
                        .replace("{w}", fmt.pct(decomp.shares.globalPct, 0))
                        .replace("{p}", fmt.pct(decomp.shares.premiumPct, Math.abs(decomp.shares.premiumPct) < 0.95 ? 1 : 0))}
                    </bdi>
                  </p>
                </>
              ) : null}
              <p className="m-0 text-[10.5px] leading-relaxed text-[var(--color-text-tertiary)]/70">{t.decompNote}</p>
            </div>
          ) : null}

          {/* zone 4.5 — the premium arc, the حباب's long arc: the current
              value IS the bridge board's own live computation (one
              number, never two); the spark shows the complete years.
              Batch M: HIDDEN by default (the owner's ask) — the live
              value stays one tap away on the bridge board above; the
              arc opens on demand, never pushes itself on the reader */}
          {arc !== null && arc.points.length > 1 ? (
            <div className="mt-3">
              <button
                type="button"
                aria-expanded={arcOpen}
                aria-controls="gold-dollar-trend-arc"
                onClick={() => setArcOpen((o) => !o)}
                className="inline-flex min-h-[32px] items-center gap-1.5 rounded-full bg-[var(--color-bridge-accent)]/10 px-3 py-1 text-[12.5px] font-bold text-[var(--color-bridge-accent)] transition-transform hover:scale-[1.02] active:scale-95"
                data-dollar-trend-arc-toggle
              >
                {t.premiumTitle}
                {livePremiumPct !== null ? (
                  <bdi className="tabular-nums opacity-80">{fmt.pct(livePremiumPct, 1)}</bdi>
                ) : null}
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${arcOpen ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {arcOpen ? (
                <div id="gold-dollar-trend-arc" className="mt-2 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <h4 className="m-0 type-label font-bold text-[var(--color-bridge-accent)]">{t.premiumTitle}</h4>
                    {livePremiumPct !== null ? (
                      <p className="m-0 type-caption font-bold tabular-nums text-[var(--color-text-primary)]" data-dollar-trend-premium>
                        <bdi>{t.premiumNow.replace("{v}", fmt.pct(livePremiumPct, 1))}</bdi>
                      </p>
                    ) : null}
                  </div>
                  <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.premiumNote}</p>
                  <Sparkline values={arc.points.filter((p) => !p.running).map((p) => p.ratio)} height={44} color="var(--color-accent-gold-strong)" endDot aria-hidden="true" />
                  <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.premiumBridgeNote}</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* zone 6 — the method + sources line. Batch M: behind ONE
              button (the owner's ask) — the long basis note («مبنا
              نام‌گذاری‌شده…») and the sources stay one tap away, the
              section's face stays the verdicts */}
          <div className="mt-3 flex flex-col gap-1">
            <button
              type="button"
              aria-expanded={methodOpen}
              aria-controls="gold-dollar-trend-method"
              onClick={() => setMethodOpen((o) => !o)}
              className="inline-flex min-h-[32px] w-fit items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] transition-transform hover:scale-[1.02] active:scale-95"
              data-dollar-trend-method-toggle
            >
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              {t.methodOpenLabel}
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${methodOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            </button>
            {methodOpen ? (
              <div id="gold-dollar-trend-method" className="flex flex-col gap-1">
                <p className="m-0 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{t.methodLine}</p>
                <p className="m-0 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{t.sourceLine}</p>
              </div>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The decomposition pie — the growth split as a donut (the owner's
 * ask): the rial's fall (Iran's currency / economic troubles), the
 * world's own gold growth and Tehran's premium, each share labelled
 * right on the ring, the total multiple in the hole. LTR root like
 * every house chart; the pastel segment law of the old stacked bar
 * carries over, the legend below still names every leg.
 * ------------------------------------------------------------------ */

const PIE_R = 54;
const PIE_C = 2 * Math.PI * PIE_R;

function DecompPie({
  shares,
  multiple,
  fmt,
  locale,
  ariaLabel,
}: {
  shares: { rialPct: number; globalPct: number; premiumPct: number };
  multiple: number;
  fmt: Fmt;
  locale: Locale;
  ariaLabel: string;
}) {
  const segs = [
    { pct: Math.max(0, shares.rialPct), color: "var(--color-currena-blue)" },
    { pct: Math.max(0, shares.globalPct), color: "var(--color-accent-gold-strong)" },
    { pct: Math.max(0, shares.premiumPct), color: "var(--color-bridge-accent)" },
  ];
  /* the running dash offset — each segment starts where the last ended */
  let acc = 0;
  const arcs = segs.map((s) => {
    const dash = (s.pct / 100) * PIE_C;
    const arc = { ...s, dash, offset: acc, mid: acc + dash / 2 };
    acc += dash;
    return arc;
  });
  /* the label position: on the ring at the segment's mid-angle,
     12 o'clock start, clockwise (the rotate(-90) + dashoffset law) */
  const labelPos = (mid: number): { x: number; y: number } => {
    const theta = (mid / PIE_C) * 2 * Math.PI;
    return { x: 88 + (PIE_R + 1) * Math.sin(theta), y: 88 - (PIE_R + 1) * Math.cos(theta) };
  };
  const pctText = (v: number): string => `${fmt.num(v, 0)}${locale === "fa" ? "٪" : "%"}`;
  return (
    <div className="mt-1.5 flex justify-center">
      <svg dir="ltr" viewBox="0 0 176 176" className="h-[168px] w-[168px]" role="img" aria-label={ariaLabel}>
        <g transform="rotate(-90 88 88)">
          <circle cx={88} cy={88} r={PIE_R} fill="none" stroke="var(--color-border)" strokeWidth={22} opacity={0.3} />
          {arcs.map(
            (a, i) =>
              a.dash > 0.5 ? (
                <circle
                  key={i}
                  cx={88}
                  cy={88}
                  r={PIE_R}
                  fill="none"
                  stroke={a.color}
                  strokeWidth={22}
                  opacity={0.62}
                  strokeDasharray={`${a.dash} ${PIE_C - a.dash}`}
                  strokeDashoffset={-a.offset}
                />
              ) : null,
          )}
        </g>
        {arcs.map((a, i) => {
          if (a.pct < 9) return null; // too thin to label on the ring — the legend names it
          const { x, y } = labelPos(a.mid);
          return (
            <text key={`t${i}`} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={800} fill="var(--color-text-primary)">
              {pctText(a.pct)}
            </text>
          );
        })}
        <text x={88} y={88} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={800} fill="var(--color-text-primary)">
          ×{fmt.num(multiple, 0)}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The fetcher (fail-closed — null when it does not arrive)
 * ------------------------------------------------------------------ */

export async function fetchDollarTrend(): Promise<DollarTrendPayload | null> {
  try {
    const res = await fetch(`${deskBasePath}/api/gold/dollar-trend`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as DollarTrendPayload;
  } catch {
    return null;
  }
}
