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
import { Scale } from "lucide-react";
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
  gold18ParityToman,
  premiumArc,
  race,
  syncScore,
  trendYearRows,
  winCounts,
  type DollarTrendPayload,
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

/** A 5-year window's name: «۱۳۸۳–۸۷» / "2004–08". */
function windowLabel(fromJy: number, toJy: number, locale: Locale): string {
  const from = yearLabel(fromJy, locale);
  const to = yearLabel(toJy, locale);
  const tail = to.slice(-2);
  return `${from}–${tail}`;
}

/** A window around a rolling point (its last year): jy−4 … jy. */
function windowOf(jy: number): { fromJy: number; toJy: number } {
  return { fromJy: jy - 4, toJy: jy };
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
  const sync = React.useMemo(() => (data !== null ? syncScore(data) : null), [data]);
  const arc = React.useMemo(() => (data !== null ? premiumArc(data) : null), [data]);
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
      {/* zone 1 — the header + the headline verdict chip */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bridge-accent)]/12 text-[var(--color-bridge-accent)]" aria-hidden="true">
          <Scale className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="m-0 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
          <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>
        </div>
      </div>
      <span className="mt-2 inline-flex w-fit rounded-full bg-[var(--color-bridge-accent)]/10 px-2.5 py-0.5 type-caption font-bold text-[var(--color-bridge-accent)]">
        {t.eyebrow}
      </span>

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
              <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.tableTitle}</h4>
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

          {/* zone 4 — the decoupling list, the section's signature */}
          <div className="mt-3">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-bridge-accent)]">{t.decouplingTitle}</h4>
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
                          <td className="px-2.5 py-1.5 text-end">
                            <SignedDelta v={row.dollarRet} fmt={fmt} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* zone 5 — the sync verdict words + the rolling strip */}
          {sync !== null && sync.bothKnown > 0 ? (
            <div className="mt-3">
              <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.syncTitle}</h4>
              <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                <bdi>{t.syncBothUp.replace("{n}", fmt.num(sync.bothUp, 0)).replace("{m}", fmt.num(sync.bothKnown, 0))}</bdi>
              </p>
              {sync.rolling.length > 1 ? (
                <div className="mt-1.5" data-dollar-trend-sync>
                  <RollingStrip rolling={sync.rolling} locale={locale} maxSync={sync.maxSync} maxDiverge={sync.maxDiverge} />
                </div>
              ) : null}
              <p className="m-0 mt-1.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 type-caption text-[var(--color-text-secondary)]">
                {sync.maxSync !== null ? (
                  <bdi className="font-semibold">
                    {t.syncMax.replace("{years}", windowLabel(windowOf(sync.maxSync.jy).fromJy, windowOf(sync.maxSync.jy).toJy, locale))}
                  </bdi>
                ) : null}
                {sync.maxSync !== null && sync.maxDiverge !== null ? <span aria-hidden="true">·</span> : null}
                {sync.maxDiverge !== null ? (
                  <bdi className="font-semibold">
                    {t.syncMin.replace("{years}", windowLabel(windowOf(sync.maxDiverge.jy).fromJy, windowOf(sync.maxDiverge.jy).toJy, locale))}
                  </bdi>
                ) : null}
              </p>
              <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.syncNote}</p>
            </div>
          ) : null}

          {/* zone 4.5 — the premium arc, the حباب's long arc: the current
              value IS the bridge board's own live computation (one
              number, never two); the spark shows the complete years */}
          {arc !== null && arc.points.length > 1 ? (
            <div className="mt-3 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
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

          {/* zone 6 — the method + sources line */}
          <p className="m-0 mt-3 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{t.methodLine}</p>
          <p className="m-0 mt-1 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">{t.sourceLine}</p>
        </>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The rolling-correlation strip — a thin SVG: the 5-year correlation
 * of the two annual-return series per window, the zero line, the
 * max-sync and max-divergence windows dotted and named below.
 * ------------------------------------------------------------------ */

const STRIP_W = 640;
const STRIP_H = 54;
const STRIP_PAD = { l: 8, r: 34, t: 7, b: 13 };

function RollingStrip({
  rolling,
  locale,
  maxSync,
  maxDiverge,
}: {
  rolling: { jy: number; r: number | null }[];
  locale: Locale;
  maxSync: { jy: number; r: number | null } | null;
  maxDiverge: { jy: number; r: number | null } | null;
}) {
  const model = React.useMemo(() => {
    const pts = rolling.map((w, i) => ({ i, jy: w.jy, r: w.r }));
    const n = pts.length;
    if (n < 2) return null;
    const xOf = (i: number): number => STRIP_PAD.l + (i / (n - 1)) * (STRIP_W - STRIP_PAD.l - STRIP_PAD.r);
    const yOf = (r: number): number =>
      STRIP_PAD.t + (1 - (r + 1) / 2) * (STRIP_H - STRIP_PAD.t - STRIP_PAD.b);
    let d = "";
    let pen = false;
    for (const p of pts) {
      if (p.r === null || !Number.isFinite(p.r)) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${xOf(p.i).toFixed(1)},${yOf(p.r).toFixed(1)} `;
      pen = true;
    }
    const idxOf = (jy: number): number => {
      const i = pts.findIndex((p) => p.jy === jy);
      return i >= 0 ? i : -1;
    };
    return { pts, n, xOf, yOf, d: d.trim(), idxOf };
  }, [rolling]);

  if (model === null) return null;
  const { n, xOf, yOf, d, idxOf } = model;
  const zeroY = yOf(0);

  const dot = (w: { jy: number; r: number | null } | null, color: string): React.ReactNode => {
    if (w === null || w.r === null) return null;
    const i = idxOf(w.jy);
    if (i < 0) return null;
    return <circle key={`d${w.jy}`} cx={xOf(i)} cy={yOf(w.r)} r={3} fill={color} stroke="var(--color-surface)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />;
  };

  return (
    <svg
      dir="ltr"
      viewBox={`0 0 ${STRIP_W} ${STRIP_H}`}
      className="block h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      {/* the +1 / 0 / −1 guides */}
      {[1, 0, -1].map((v) => (
        <g key={`g${v}`}>
          <line
            x1={STRIP_PAD.l}
            x2={STRIP_W - STRIP_PAD.r}
            y1={yOf(v)}
            y2={yOf(v)}
            stroke="var(--color-border)"
            strokeOpacity={v === 0 ? 0.7 : 0.35}
            strokeDasharray={v === 0 ? "3 4" : "1 4"}
            vectorEffect="non-scaling-stroke"
          />
          <text x={STRIP_W - STRIP_PAD.r + 5} y={yOf(v) + 3.5} fontSize={9} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
            {v > 0 ? "+1" : v === 0 ? "0" : "−1"}
          </text>
        </g>
      ))}
      {/* the correlation path */}
      <path d={d} fill="none" stroke="var(--color-currena-blue)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {dot(maxSync, "var(--color-currena-blue)")}
      {dot(maxDiverge, "var(--color-accent-gold-strong)")}
      {/* the first/last window years at the ends */}
      <text x={STRIP_PAD.l} y={STRIP_H - 3} fontSize={9} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
        {yearLabel(rolling[0]!.jy - 4, locale)}
      </text>
      <text x={STRIP_W - STRIP_PAD.r} y={STRIP_H - 3} fontSize={9} fill="var(--color-text-tertiary)" textAnchor="end" style={{ direction: "ltr" }}>
        {yearLabel(rolling[n - 1]!.jy, locale)}
      </text>
      {/* the zero line's tick at the middle of the x-axis */}
      <line x1={xOf(Math.floor(n / 2))} x2={xOf(Math.floor(n / 2))} y1={zeroY - 2} y2={zeroY + 2} stroke="var(--color-text-tertiary)" strokeOpacity={0.5} vectorEffect="non-scaling-stroke" />
    </svg>
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
