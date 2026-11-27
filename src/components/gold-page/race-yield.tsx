"use client";

/**
 * race-yield.tsx — «طلا یا دلار؟» the Iran investor's own yield
 * question (the owner's 2026-11-27 ask): a sum of toman, invested in
 * any year since ۱۳۵۷, split between gold and the free-market dollar —
 * both legs marked at today's prices, the verdict in one line, the
 * worth path in one chart.
 *
 * THE SECTION'S OWN LAWS:
 *  - one data leg: the SAME /api/gold/dollar-trend payload the 47-year
 *    race above rides — one cache, one set of numbers, never two
 *    engines disagreeing on one history;
 *  - the chart is the section's face: two paths (what the sum became,
 *    year by year, both in toman), log scale by default (decades of
 *    multiples — linear would be a cliff);
 *  - the input is a TEXT mirror (the calculator's own law: fa/ar digits
 *    normalize, the mirror is the truth, never a controlled number
 *    fighting the browser);
 *  - the year picker offers only years the payload can honestly answer
 *    for (both legs present, a real span below);
 *  - fail-closed: no answer renders an honest line, never a guess;
 *  - display-only, never advice.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { UI, type Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { fetchDollarTrend } from "@/components/gold-page/dollar-trend";
import type { Fmt } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";
import {
  raceYield,
  raceYieldSeries,
  raceYieldYearOptions,
  type RaceYield,
} from "@/lib/gold-page/race-yield";
import type { DollarTrendPayload } from "@/lib/gold-page/dollar-trend";

type RyT = (typeof UI)["en"]["raceYield"];

/* ------------------------------------------------------------------ *
 * The chart — the house grammar (a bespoke stretched SVG, LTR root,
 * tokens only): both legs' worth-in-toman paths, log Y by default,
 * the start year's own basis seams quiet, the end dots + labels.
 * ------------------------------------------------------------------ */

const CHART_W = 640;
const CHART_H = 240;
const PAD = { l: 12, r: 64, t: 18, b: 26 };

const GOLD_STROKE = "var(--color-accent-gold-strong)";
const DOLLAR_STROKE = "var(--color-currena-blue)";

/** A path over possibly-null points — nulls split the line (a missing
 *  year is a gap, never a bridge across the unknown). */
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

/** A Jalali year label: fa reads the Jalali year, EN the Gregorian year
 *  the Jalali year starts in (the race table's own convention). */
function yearLabel(jy: number, locale: Locale): string {
  try {
    return (locale === "fa" ? jy : jy + 621).toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
  } catch {
    return String(jy);
  }
}

function WorthChart({
  points,
  amountToman,
  scale,
  locale,
  fmt,
  t,
}: {
  points: ReturnType<typeof raceYieldSeries>;
  amountToman: number;
  scale: "log" | "linear";
  locale: Locale;
  fmt: Fmt;
  t: RyT;
}) {
  const model = React.useMemo(() => {
    if (points.length < 2) return null;
    const n = points.length;
    const all: number[] = [];
    for (const p of points) {
      for (const v of [p.goldWorth, p.dollarWorth]) {
        if (v !== null && Number.isFinite(v) && v > 0) all.push(v);
      }
    }
    if (all.length < 2) return null;
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (scale === "log") {
      lo = lo / 1.5;
      hi = hi * 1.5;
    } else {
      const pad = (hi - lo) * 0.05;
      lo = Math.max(0, lo - pad);
      hi = hi + pad;
    }
    if (!(hi > lo)) return null;
    const xOf = (i: number): number => PAD.l + (i / (n - 1)) * (CHART_W - PAD.l - PAD.r);
    const yOf =
      scale === "log"
        ? (v: number): number => PAD.t + (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (CHART_H - PAD.t - PAD.b)
        : (v: number): number => PAD.t + (1 - (v - lo) / (hi - lo)) * (CHART_H - PAD.t - PAD.b);
    const gold = buildPath(points.map((p) => p.goldWorth), xOf, yOf);
    const dollar = buildPath(points.map((p) => p.dollarWorth), xOf, yOf);
    /* the y grid: log decades (or four clean linear ticks), labelled on
       the right — compact toman (M/bn), the readout's own convention */
    const compact = (v: number): string =>
      v >= 1_000_000_000
        ? `${fmt.num(v / 1_000_000_000, 1)}${locale === "fa" ? " میلیارد" : "bn"}`
        : v >= 1_000_000
          ? `${fmt.num(v / 1_000_000, 1)}${locale === "fa" ? " م" : "M"}`
          : fmt.num(v, 0);
    const yGrid: { v: number; label: string }[] =
      scale === "log"
        ? [1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12]
            .filter((v) => v > lo && v < hi)
            .map((v) => ({ v, label: compact(v) }))
        : (() => {
            const out: { v: number; label: string }[] = [];
            for (let i = 0; i <= 3; i++) {
              const v = lo + (i / 3) * (hi - lo);
              out.push({ v, label: compact(v) });
            }
            return out;
          })();
    /* the x ticks: the Jalali decades within the span (EN reads the
       Gregorian twin), plus the last year when the tail is long */
    const firstJy = points[0]!.jy;
    const lastJy = points[n - 1]!.jy;
    const xTicks: { jy: number; label: string }[] = [];
    const step = Math.max(1, Math.ceil((lastJy - firstJy) / 6));
    for (let jy = firstJy; jy <= lastJy; jy += step) {
      xTicks.push({ jy, label: yearLabel(jy, locale) });
    }
    if (xTicks.length === 0 || xTicks[xTicks.length - 1]!.jy < lastJy - 1) {
      xTicks.push({ jy: lastJy, label: yearLabel(lastJy, locale) });
    }
    const xOfJy = (jy: number): number => {
      const idx = points.findIndex((p) => p.jy === jy);
      if (idx >= 0) return xOf(idx);
      const frac = (jy - firstJy) / Math.max(1, lastJy - firstJy);
      return PAD.l + Math.min(1, Math.max(0, frac)) * (CHART_W - PAD.l - PAD.r);
    };
    return { n, firstJy, lastJy, xOf, yOf, gold, dollar, yGrid, xTicks, xOfJy };
  }, [points, scale, locale, fmt]);

  if (model === null) return null;
  const { n, firstJy, lastJy, xOf, yOf, gold, dollar, yGrid, xTicks, xOfJy } = model;

  /** one line's end label — above the endpoint, unless it crowds the top */
  const endLabel = (idx: number, v: number | null, text: string, color: string): React.ReactNode => {
    if (idx < 0 || v === null) return null;
    const x = xOf(idx);
    const y = yOf(v);
    const above = y > PAD.t + 16;
    return (
      <text x={x - 5} y={above ? y - 7 : y + 13} fontSize={9.5} fontWeight={700} fill={color} textAnchor="end" style={{ direction: "ltr" }}>
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
    >
      {/* the invested line — the flat zero-return reference both paths are read against */}
      {amountToman > 0 && amountToman > 0 ? (
        (() => {
          const y = scale === "log" && amountToman > 0 ? yOf(Math.max(amountToman, 1)) : null;
          return y !== null && y > PAD.t && y < CHART_H - PAD.b ? (
            <line x1={PAD.l} x2={CHART_W - PAD.r} y1={y} y2={y} stroke="var(--color-text-tertiary)" strokeOpacity={0.55} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          ) : null;
        })()
      ) : null}
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
        <text key={`x${tk.jy}`} x={xOfJy(tk.jy)} y={CHART_H - 8} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="middle" style={{ direction: "ltr" }}>
          {tk.label}
        </text>
      ))}
      {/* the two paths — gold and the dollar */}
      <path d={dollar.d} fill="none" stroke={DOLLAR_STROKE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <path d={gold.d} fill="none" stroke={GOLD_STROKE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* the end dots + the on-chart line labels */}
      {gold.lastIndex >= 0 && gold.lastV !== null ? (
        <circle cx={xOf(gold.lastIndex)} cy={yOf(gold.lastV)} r={3} fill={GOLD_STROKE} />
      ) : null}
      {dollar.lastIndex >= 0 && dollar.lastV !== null ? (
        <circle cx={xOf(dollar.lastIndex)} cy={yOf(dollar.lastV)} r={3} fill={DOLLAR_STROKE} />
      ) : null}
      {endLabel(gold.lastIndex, gold.lastV, t.chartGold, GOLD_STROKE)}
      {endLabel(dollar.lastIndex, dollar.lastV, t.chartDollar, DOLLAR_STROKE)}
      {/* the first-year markers — where both paths leave the same sum */}
      {n > 0 ? (
        <line x1={xOf(0)} x2={xOf(0)} y1={PAD.t} y2={CHART_H - PAD.b} stroke="var(--color-border)" strokeOpacity={0.45} strokeDasharray="1 4" vectorEffect="non-scaling-stroke" />
      ) : null}
      <title>{`${t.chartGold} · ${t.chartDollar}`}</title>
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The money formatters — compact toman, the readout's own convention
 * ------------------------------------------------------------------ */

function tomanCompact(v: number, locale: Locale, fmt: Fmt, t: RyT): string {
  if (v >= 1_000_000_000) return `${fmt.num(v / 1_000_000_000, 1)} ${t.unitBillion}`;
  if (v >= 1_000_000) return `${fmt.num(v / 1_000_000, 1)} ${t.unitMillion}`;
  return fmt.num(v, 0);
}

/** The input's own normalizer (the calculator's law): fa/ar digits →
 *  latin, anything but digits and one dot drops, leading zeros
 *  collapse — returns the clean text + the committed number. */
function normalizeAmountText(raw: string): { text: string; value: number } {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  let s = raw.replace(/[۰-۹]/g, (d) => String(faDigits.indexOf(d)));
  s = s.replace(/[٠-٩]/g, (d) => String(arDigits.indexOf(d)));
  s = s.replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot >= 0) s = `${s.slice(0, firstDot + 1)}${s.slice(firstDot + 1).replace(/\./g, "")}`;
  s = s.replace(/^0+(?=\d)/, "");
  const value = Number(s);
  return { text: s, value: Number.isFinite(value) ? value : 0 };
}

/** The default sum — the owner's own example, 10 million toman. */
const DEFAULT_AMOUNT = 10_000_000;

/* ------------------------------------------------------------------ *
 * The band itself
 * ------------------------------------------------------------------ */

export function RaceYieldBand({
  t,
  locale,
  fmt,
}: {
  t: RyT;
  locale: Locale;
  fmt: Fmt;
}) {
  /* the one data leg — the SAME query the race section rides (one
     cache, one fetch, one set of numbers) */
  const q = useQuery({
    queryKey: ["currena-gold-dollar-trend"],
    queryFn: fetchDollarTrend,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const data: DollarTrendPayload | null = q.data ?? null;

  /* the picker's own options — only years the payload can answer for */
  const yearOptions = React.useMemo(() => (data !== null ? raceYieldYearOptions(data) : []), [data]);

  /* the machine's own state: the picked year (default: 15 years back —
     the owner's own example), the sum (default 10M toman), the scale */
  const [startJy, setStartJy] = React.useState<number | null>(null);
  React.useEffect(() => {
    if (startJy !== null || yearOptions.length === 0) return;
    /* the owner's example: «15 years ago» — the last option 15 Jalali
       years back that the payload honestly carries, else the first */
    const runningJy = data?.running.jy ?? yearOptions[yearOptions.length - 1]! + 1;
    const want = runningJy - 15;
    const pick = [...yearOptions].reverse().find((jy) => jy <= want) ?? yearOptions[0]!;
    setStartJy(pick);
  }, [startJy, yearOptions, data]);
  React.useEffect(() => {
    if (startJy !== null && yearOptions.length > 0 && !yearOptions.includes(startJy)) {
      setStartJy(yearOptions[yearOptions.length - 1]!);
    }
  }, [startJy, yearOptions]);
  const [amountText, setAmountText] = React.useState<string>(String(DEFAULT_AMOUNT));
  const amount = React.useMemo(() => normalizeAmountText(amountText).value, [amountText]);
  const [scale, setScale] = React.useState<"log" | "linear">("log");
  const [methodOpen, setMethodOpen] = React.useState(false);

  /* the answer + the chart series — pure over the payload */
  const answer: RaceYield | null = React.useMemo(
    () => (data !== null && startJy !== null && amount > 0 ? raceYield(data, startJy, amount) : null),
    [data, startJy, amount],
  );
  const series = React.useMemo(
    () => (data !== null && startJy !== null && amount > 0 ? raceYieldSeries(data, startJy, amount) : []),
    [data, startJy, amount],
  );

  const onAmountInput = (raw: string): void => {
    setAmountText(normalizeAmountText(raw).text);
  };

  const pending = q.isLoading;

  return (
    <section
      id="gold-race-yield"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-bridge-accent)]/30 sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      {/* the header — the pack render at the row's start (the second
          pack, 2026-11-27): the owner's commissioned gold-vs-dollar
          icon carries the «طلا یا دلار؟» identity in place of the
          generic chevron badge (the badge was decorative, the method
          toggle keeps its own chevron below), riding the batch-O
          128px floor, the title + subtitle column beside it, RTL
          flipping it to the start-side for free */}
      <div className="flex flex-wrap items-center gap-3">
        <PackIcon file="gold-dollar-comparison-iran-inflation-hedge.png" size={128} className="h-32 w-32" />
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
          {/* the controls — the sum (a text mirror) + the year + the scale */}
          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.amountLabel}</span>
              <input
                type="text"
                inputMode="decimal"
                dir="ltr"
                value={amountText}
                onChange={(e) => onAmountInput(e.currentTarget.value)}
                className="min-h-[38px] w-[9.5rem] rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                aria-label={t.amountLabel}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">
                {locale === "fa" ? t.yearLabel : t.yearLabelGregorian}
              </span>
              <select
                value={startJy ?? ""}
                onChange={(e) => setStartJy(Number(e.currentTarget.value))}
                className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                aria-label={locale === "fa" ? t.yearLabel : t.yearLabelGregorian}
              >
                {yearOptions.length === 0 ? <option value="">{yearLabel(data.running.jy, locale)}</option> : null}
                {[...yearOptions].reverse().map((jy) => (
                  <option key={jy} value={jy}>
                    {yearLabel(jy, locale)}
                  </option>
                ))}
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

          {/* the answer — two cards side by side, the verdict line under */}
          {answer === null ? (
            <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.yearNoAnswer}</p>
          ) : (
            <>
              <div className="mt-2.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2" data-race-yield-cards>
                {([["gold", answer.gold, t.goldCardTitle, t.goldUnitsThen, GOLD_STROKE], ["dollar", answer.dollar, t.dollarCardTitle, t.dollarUnitsThen, DOLLAR_STROKE]] as const).map(
                  ([kind, leg, title, unitsThenTpl, stroke]) => (
                    <div
                      key={kind}
                      className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]"
                    >
                      <span className="type-caption font-bold" style={{ color: stroke }}>
                        {title}
                      </span>
                      {/* what the sum bought then — the physical fact */}
                      <bdi className="type-caption leading-relaxed text-[var(--color-text-secondary)]">
                        {unitsThenTpl.replace(
                          "{v}",
                          kind === "gold" ? fmt.num(leg.unitsThen, 1) : fmt.num(leg.unitsThen, 0),
                        )}
                      </bdi>
                      {/* worth today — the big number */}
                      <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <bdi dir="ltr" className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-text-primary)]">
                          {tomanCompact(leg.worth, locale, fmt, t)}
                        </bdi>
                        <span className="text-[10.5px] font-semibold text-[var(--color-text-tertiary)]">
                          {t.worthToday}
                        </span>
                      </span>
                      {/* the total return — the multiple + the percent */}
                      <bdi dir="ltr" className="type-caption font-bold tabular-nums text-[var(--color-text-primary)]">
                        {t.multipleWord.replace("{v}", fmt.num(leg.worth / leg.invested, 1))} · {fmt.pct(leg.pct, 0)}
                      </bdi>
                    </div>
                  ),
                )}
              </div>

              {/* the verdict — one line, the winner ink */}
              <p
                className="m-0 mt-2 rounded-[var(--cr-radius-md)] px-3 py-2 type-caption font-bold leading-relaxed"
                style={{
                  backgroundColor: `color-mix(in srgb, ${answer.winner === "gold" ? "var(--color-accent-gold)" : "var(--color-currena-blue)"} 10%, transparent)`,
                  color: answer.winner === "gold" ? "var(--color-accent-gold-deep)" : "var(--color-currena-blue-deep)",
                }}
                data-race-yield-verdict
              >
                <bdi>
                  {answer.ratio === 1
                    ? t.verdictTie
                    : (answer.winner === "gold" ? t.verdictGoldWon : t.verdictDollarWon)
                        .replace("{years}", fmt.num(answer.years, 0))
                        .replace("{ratio}", fmt.num(answer.winner === "gold" ? answer.ratio : 1 / answer.ratio, 1))
                        .replace("{gold}", tomanCompact(answer.gold.worth, locale, fmt, t))
                        .replace("{dollar}", tomanCompact(answer.dollar.worth, locale, fmt, t))}
                </bdi>
              </p>
              <p className="m-0 mt-1 type-caption text-[var(--color-text-tertiary)]" data-race-yield-end-note>
                {answer.endLive ? t.liveEndNote : t.historyEndNote}
              </p>
            </>
          )}

          {/* the chart — the worth path, the section's own face */}
          {series.length >= 2 ? (
            <div className="mt-2.5">
              <WorthChart points={series} amountToman={amount} scale={scale} locale={locale} fmt={fmt} t={t} />
            </div>
          ) : null}

          {/* the method — one inline expand, the house pattern */}
          <button
            type="button"
            aria-expanded={methodOpen}
            aria-controls="gold-race-yield-method"
            onClick={() => setMethodOpen((o) => !o)}
            className="mt-3 inline-flex min-h-[36px] w-fit items-center gap-1.5 rounded-full bg-transparent px-3.5 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
            data-race-yield-method-toggle
          >
            {t.methodOpenLabel}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${methodOpen ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {methodOpen ? (
            <div id="gold-race-yield-method" className="mt-2 flex flex-col gap-1.5">
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.methodLine}</p>
              <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.sourceNote}</p>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
