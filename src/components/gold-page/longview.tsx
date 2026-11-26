"use client";

/**
 * The long view — the historical perspective the owner asked for: ONE
 * chart of gold's price across the longest reliable series (the annual
 * London market average since 1833 — the gold standard's fixed $20.67,
 * the $35 era, the free market after 1971, the live spot as the running
 * year's own last point), the last-20-years table IN THE OPEN on the
 * card (batch L: the owner's law — «طلا در بیست سال اخیر» visibly, not
 * behind a toggle), and the purchasing-power
 * machine — "with $12,000 in 2020, how many grams or ounces of gold
 * could I buy?" — the year's own average price against the same money's
 * buying power today.
 *
 * The series is the embedded annual table (src/lib/gold-page/longview.ts,
 * validated against LBMA annual averages within 1% for the post-1968
 * era); the running year rides the page's own live spot — one number
 * with the desk, never two. The chart follows the house grammar: LTR
 * root, stretched SVG, tokens only, the trace reads by pointer or by
 * the default last-point line. Every window and basis named at point of
 * use; display-only, never advice.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Hourglass } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta, faDigits } from "@/components/gold-page/visuals";
import { sanitizeAmountText } from "@/components/gold-page/calculator";
import { fetchDollarTrend } from "@/components/gold-page/dollar-trend";
import type { FxPayload } from "@/lib/gold-page/ifbought";
import {
  cagrPercent,
  chartPoints,
  isRunningYear,
  lastYearsTable,
  purchasingPower,
  purchasingPowerCcy,
  purchasingPowerToman,
  yearOptionsCcy,
  yearOptionsLong,
  yearOptionsToman,
  type GoldYearRow,
  type PurchasingPowerResult,
  type PurchasingPowerTomanResult,
  type TomanMachineLegs,
} from "@/lib/gold-page/longview";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/** Persian and Arabic-Indic digits → ASCII (the fa amount box's own
 *  input path: Farsi text carries Farsi numerals, the machine reads
 *  ASCII underneath — typed or displayed, never a guess). */
function toAsciiDigits(s: string): string {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return s.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = fa.indexOf(d);
    if (i >= 0) return String(i);
    const j = ar.indexOf(d);
    return j >= 0 ? String(j) : d;
  });
}

/** A year, UNGROUPED (2026, never "2,026") — the locale digits still apply. */
function yearText(y: number, locale: Locale): string {
  try {
    return y.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
  } catch {
    return String(y);
  }
}

type LongviewT = {
  eyebrow: string;
  title: string;
  subtitle: string;
  chartAria: string;
  scaleLog: string;
  scaleLinear: string;
  viewAll: string;
  view100: string;
  eraGoldStandard: string;
  era35: string;
  eraFree: string;
  liveWord: string;
  avgWord: string;
  /** the visible 20-year table's own title + caption (batch L: in the open) */
  modalTitle: string;
  modalNote: string;
  /** the 20-year verdict container (the owner's ask): the average
 *   per-year growth over the table's own span, compound, live-tailed. */
  verdictTitle: string;
  verdictLine: string;
  verdictEndLive: string;
  verdictEndAvg: string;
  colYear: string;
  colAvg: string;
  colChange: string;
  runningCell: string;
  ppTitle: string;
  ppNote: string;
  ppAmountLabel: string;
  ppYearLabel: string;
  ppBoughtWord: string;
  ppOzWord: string;
  ppGramWord: string;
  ppWorthWord: string;
  ppSameTodayWord: string;
  ppLessWord: string;
  ppMoreWord: string;
  ppRunningNote: string;
  ppUncovered: string;
  /** the multi-currency layer (the owner's ask): the toman, the euro,
 *   the pound, the Canadian and the Australian dollars beside the
 *   dollar — each leg's own basis named in the note. */
  ppYearJalali: string;
  ppCcyLabel: string;
  ppCcyNames: Record<string, string>;
  ppBasisParity: string;
  ppBasisMarket: string;
  ppBasisFx: string;
  ppTomanGramWord: string;
  ppMillionToman: string;
  ppBillionToman: string;
  basisLine: string;
  sourceLine: string;
};

/* ------------------------------------------------------------------ *
 * The chart — a bespoke stretched SVG (the house grammar): the whole
 * series, log or linear Y, the era seams as dashed verticals, the two
 * fixed-price eras as dashed horizontals, the live point as the last
 * dot. Hover traces the nearest year in the HTML readout above (the
 * default readout is the last point — the running year, live).
 * ------------------------------------------------------------------ */

const CHART_W = 640;
const CHART_H = 250;
const PAD = { l: 10, r: 60, t: 16, b: 24 };

/** The two seams of the series: the Gold Reserve Act's 1934 revaluation
 *  and the 1971 Nixon shock that opened the free market. */
const ERA_SEAMS = [1934, 1971] as const;

/** The log-scale decade ticks that read clean over 18.93 → ~4,000. */
const LOG_TICKS = [10, 100, 1000] as const;

function LongViewChart({
  points,
  scale,
  locale,
  fmt,
  onHover,
  ariaLabel,
}: {
  points: { y: number; p: number; live: boolean }[];
  scale: "log" | "linear";
  locale: Locale;
  fmt: Fmt;
  onHover: (year: number | null) => void;
  ariaLabel: string;
}) {
  const model = React.useMemo(() => {
    const H = CHART_H;
    const { l, r, t, b } = PAD;
    if (points.length < 2) return null;
    const y0 = points[0]!.y;
    const y1 = points[points.length - 1]!.y;
    const prices = points.map((p) => p.p).filter((v) => Number.isFinite(v) && v > 0);
    if (prices.length < 2) return null;
    let lo = Math.min(...prices);
    let hi = Math.max(...prices);
    if (scale === "log") {
      // pad one clean log step each way so the flat eras breathe
      lo = lo / 1.35;
      hi = hi * 1.5;
    } else {
      const pad = (hi - lo) * 0.05;
      lo = Math.max(0, lo - pad);
      hi = hi + pad;
    }
    const xOf = (yr: number): number => l + ((yr - y0) / Math.max(1, y1 - y0)) * (CHART_W - l - r);
    const yOf =
      scale === "log"
        ? (v: number): number => t + (1 - (Math.log(v) - Math.log(lo)) / (Math.log(hi) - Math.log(lo))) * (H - t - b)
        : (v: number): number => t + (1 - (v - lo) / Math.max(1e-9, hi - lo)) * (H - t - b);
    const path = points
      .map((pt, i) => `${i === 0 ? "M" : "L"}${xOf(pt.y).toFixed(1)},${yOf(pt.p).toFixed(1)}`)
      .join(" ");
    const area = `${path}L${xOf(y1).toFixed(1)},${H - b}L${xOf(y0).toFixed(1)},${H - b}Z`;
    // the y grid: the log decades (or four clean linear ticks), always
    // inside the domain, labelled on the right
    const yGrid: { v: number; label: string }[] =
      scale === "log"
        ? LOG_TICKS.filter((v) => v > lo && v < hi).map((v) => ({ v, label: `$${v}` }))
        : (() => {
            const rows: { v: number; label: string }[] = [];
            for (let i = 0; i <= 3; i++) {
              const v = lo + (i / 3) * (hi - lo);
              rows.push({ v, label: `$${fmt.num(Math.round(v), 0)}` });
            }
            return rows;
          })();
    // the x ticks: round half-century (all view) or quarter-century (100y)
    const span = y1 - y0;
    const step = span > 120 ? 50 : 25;
    const xTicks: { v: number; label: string }[] = [];
    const firstTick = Math.ceil(y0 / step) * step;
    for (let yr = firstTick; yr <= y1; yr += step) {
      xTicks.push({ v: yr, label: yearText(yr, locale) });
    }
    return { y0, y1, xOf, yOf, path, area, yGrid, xTicks };
  }, [points, scale, locale, fmt]);

  if (model === null) return null;
  const { y0, y1, xOf, yOf, path, area, yGrid, xTicks } = model;
  const last = points[points.length - 1]!;

  return (
    <svg
      dir="ltr"
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="block h-auto w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={ariaLabel}
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        // the viewBox's x maps 0→CHART_W; invert to a year, then snap to
        // the nearest series point (the readout never invents a year)
        const svgX = frac * CHART_W;
        const yr = y0 + ((svgX - PAD.l) / (CHART_W - PAD.l - PAD.r)) * (y1 - y0);
        let best = points[0]!;
        for (const pt of points) {
          if (Math.abs(pt.y - yr) < Math.abs(best.y - yr)) best = pt;
        }
        onHover(best.y);
      }}
      onPointerLeave={() => onHover(null)}
    >
      {/* the y grid + labels (right, the house convention) */}
      {yGrid.map((g) => (
        <g key={`y${g.v}`}>
          <line x1={PAD.l} x2={CHART_W - PAD.r} y1={yOf(g.v)} y2={yOf(g.v)} stroke="var(--color-border)" strokeOpacity={0.5} strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
          <text x={CHART_W - PAD.r + 6} y={yOf(g.v) + 3.5} fontSize={10} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
            {g.label}
          </text>
        </g>
      ))}
      {/* the x ticks */}
      {xTicks.map((tk) => (
        <text key={`x${tk.v}`} x={xOf(tk.v)} y={CHART_H - 8} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="middle" style={{ direction: "ltr" }}>
          {tk.label}
        </text>
      ))}
      {/* the two fixed-price horizontals — the eras in their own ink */}
      <g>
        <line x1={PAD.l} x2={CHART_W - PAD.r} y1={yOf(20.67)} y2={yOf(20.67)} stroke="var(--color-text-tertiary)" strokeOpacity={0.65} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <text x={PAD.l + 4} y={yOf(20.67) - 3} fontSize={9.5} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
          $20.67
        </text>
        <line x1={PAD.l} x2={CHART_W - PAD.r} y1={yOf(35)} y2={yOf(35)} stroke="var(--color-text-tertiary)" strokeOpacity={0.65} strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
        <text x={PAD.l + 4} y={yOf(35) - 3} fontSize={9.5} fill="var(--color-text-tertiary)" style={{ direction: "ltr" }}>
          $35
        </text>
      </g>
      {/* the era seams — 1934 and 1971 */}
      {ERA_SEAMS.filter((yr) => yr > y0 && yr < y1).map((yr) => (
        <line key={`era${yr}`} x1={xOf(yr)} x2={xOf(yr)} y1={PAD.t} y2={CHART_H - PAD.b} stroke="var(--color-border)" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
      ))}
      {/* the series itself — the house gold, softly filled under */}
      <path d={area} fill="var(--color-accent-gold)" fillOpacity={0.12} />
      <path d={path} fill="none" stroke="var(--color-accent-gold-strong)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      {/* the live point — the running year's own last dot */}
      {last.live ? (
        <>
          <circle cx={xOf(last.y)} cy={yOf(last.p)} r={4} fill="var(--color-accent-gold-strong)" stroke="var(--color-surface)" strokeWidth={2} />
          <circle cx={xOf(last.y)} cy={yOf(last.p)} r={7} fill="none" stroke="var(--color-accent-gold-strong)" strokeOpacity={0.45} vectorEffect="non-scaling-stroke" />
        </>
      ) : (
        <circle cx={xOf(last.y)} cy={yOf(last.p)} r={3.5} fill="var(--color-accent-gold-strong)" />
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ *
 * The 20-year table — the modal's own rows
 * ------------------------------------------------------------------ */

function YearRowCells({ row, t, fmt, locale }: { row: GoldYearRow; t: LongviewT; fmt: Fmt; locale: Locale }) {
  return (
    <>
      <th scope="row" className="px-2.5 py-1.5 text-start font-bold tabular-nums text-[var(--color-text-primary)]">
        {yearText(row.year, locale)}
        {row.running ? (
          <span className="ms-1.5 rounded-full bg-[var(--color-currena-soft)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-currena-blue-deep)]">
            {t.runningCell}
          </span>
        ) : null}
      </th>
      <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
        <bdi dir="ltr">${fmt.num(row.price, 0)}</bdi>
      </td>
      <td className="px-2.5 py-1.5 text-end">
        <SignedDelta v={row.yoyPct} fmt={fmt} />
      </td>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The card itself
 * ------------------------------------------------------------------ */

export function LongViewCard({
  liveSpot,
  t,
  locale,
  fmt,
}: {
  liveSpot: number | null;
  t: LongviewT;
  locale: Locale;
  fmt: Fmt;
}) {
  /* the chart's own state — the view (all / 100 years) and the Y scale */
  const [view, setView] = React.useState<"all" | "100y">("all");
  const [scale, setScale] = React.useState<"log" | "linear">("log");

  const points = React.useMemo(() => chartPoints(liveSpot), [liveSpot]);
  const visible = React.useMemo(
    () => (view === "100y" ? points.filter((p) => p.y > points[points.length - 1]!.y - 100) : points),
    [points, view],
  );

  /* the hover trace — the readout row above the chart; null falls back
     to the last point (the running year, live) */
  const [hoverYear, setHoverYear] = React.useState<number | null>(null);
  const readout = React.useMemo(() => {
    const base = hoverYear === null ? visible[visible.length - 1]! : visible.find((p) => p.y === hoverYear);
    if (base === undefined) return null;
    return { y: base.y, p: base.p, live: base.live };
  }, [visible, hoverYear]);

  /* the purchasing-power machine, now multi-currency (the owner's ask):
     USD on the London annual average; the toman on Tehran's own 18k
     gram and the free-market dollar (the very same leg the race section
     rides); EUR · GBP · CAD · AUD on the London average crossed with
     the desk's own month-end FX table. Each leg's own default rides the
     switch; the owner's original example ($12,000 in 2020) stays the
     USD default. */
  const CCY_IDS = ["usd", "toman", "aud", "cad", "gbp", "eur"] as const;
  type MachineCcyId = (typeof CCY_IDS)[number];
  const CCY_DEFAULT_AMOUNT: Record<MachineCcyId, number> = {
    usd: 12000,
    toman: 100000000,
    aud: 15000,
    cad: 15000,
    gbp: 8000,
    eur: 10000,
  };
  const CCY_DEFAULT_YEAR: Record<MachineCcyId, number> = {
    usd: 2020,
    toman: 1400,
    aud: 2020,
    cad: 2020,
    gbp: 2020,
    eur: 2020,
  };
  const CCY_SYMBOL_EN: Record<MachineCcyId, string> = {
    usd: "US$",
    toman: "",
    aud: "A$",
    cad: "C$",
    gbp: "£",
    eur: "€",
  };
  const [ccy, setCcy] = React.useState<MachineCcyId>("usd");
  const [ppYear, setPpYear] = React.useState<number>(2020);
  const [amount, setAmount] = React.useState<number>(12000);
  const [amountText, setAmountText] = React.useState<string>("12000");
  React.useEffect(() => {
    if (Number(amountText) === amount) return;
    setAmountText(String(amount));
  }, [amount, amountText]);

  /* the machine's own legs — the desk's month-end FX table (the very
     same query the wealth calculator rides, one cache) and the race
     payload (the toman's gold18 series + its running leg) */
  const fx = useQuery({
    queryKey: ["currena-gold-fx-monthends"],
    queryFn: async (): Promise<FxPayload> => {
      const res = await fetch(`${deskBasePath}/api/gold/fx`, { cache: "no-store" });
      if (!res.ok) throw new Error(`The fx API responded with ${res.status}`);
      return res.json() as Promise<FxPayload>;
    },
    retry: 1,
  });
  const dollarTrend = useQuery({
    queryKey: ["currena-gold-dollar-trend"],
    queryFn: fetchDollarTrend,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const fxTable = fx.data?.perUsd ?? null;
  const tomanLegs = React.useMemo<TomanMachineLegs | null>(() => {
    const p = dollarTrend.data ?? null;
    if (p === null) return null;
    return { gold18: p.gold18, running: p.running };
  }, [dollarTrend.data]);

  /* the year picker's own options per currency — Gregorian for USD and
     the four crosses, Jalali for the toman (EN reads the Gregorian year
     the Jalali year starts in, the race table's own convention) */
  const yearOptions =
    ccy === "usd"
      ? yearOptionsLong(liveSpot)
      : ccy === "toman"
        ? tomanLegs === null
          ? []
          : yearOptionsToman(tomanLegs)
        : yearOptionsCcy(fxTable !== null ? (fxTable[ccy] ?? undefined) : undefined, liveSpot);
  const pickedYear = yearOptions.includes(ppYear) ? ppYear : (yearOptions[0] ?? ppYear);
  const runningToman =
    tomanLegs !== null && tomanLegs.running !== null && tomanLegs.running.gold18Toman !== null
      ? tomanLegs.running
      : null;
  const machineYearLabel = (y: number): string => {
    if (ccy !== "toman") return yearText(y, locale);
    const shown = locale === "fa" ? y : y + 621;
    try {
      return shown.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
    } catch {
      return String(shown);
    }
  };
  const isRunningPick = (y: number): boolean => {
    if (ccy === "toman") return runningToman !== null && runningToman.jy === y;
    return isRunningYear(y);
  };

  /* the answer, normalized per leg kind — pure engines, fail-closed */
  type MachineAnswer =
    | { kind: "oz"; a: PurchasingPowerResult }
    | { kind: "toman"; a: PurchasingPowerTomanResult }
    | null;
  /* the answer, normalized per leg kind — pure engines, fail-closed;
     plain inline arithmetic (no manual memo: the compiler owns it) */
  const answer: MachineAnswer = (() => {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (ccy === "usd") {
      const a = purchasingPower(amount, pickedYear, liveSpot);
      return a === null ? null : { kind: "oz", a };
    }
    if (ccy === "toman") {
      if (tomanLegs === null) return null;
      const a = purchasingPowerToman(amount, pickedYear, tomanLegs);
      return a === null ? null : { kind: "toman", a };
    }
    const a = purchasingPowerCcy(amount, pickedYear, liveSpot, fxTable !== null ? (fxTable[ccy] ?? undefined) : undefined);
    return a === null ? null : { kind: "oz", a };
  })();

  /* the money words, currency-aware (fa: the word rides the number;
     the toman compacts to millions/billions — the bridge board's own
     convention for the big figures) */
  const pctSign = locale === "fa" ? "٪" : "%";
  const ccyName = t.ppCcyNames[ccy] ?? ccy;
  const moneyText = (v: number): string => {
    if (ccy === "toman") {
      if (v >= 1e9) return t.ppBillionToman.replace("{v}", fmt.num(v / 1e9, 2));
      if (v >= 1e6) return t.ppMillionToman.replace("{v}", fmt.num(v / 1e6, 1));
      return locale === "fa" ? `${fmt.num(v, 0)} ${ccyName}` : `${fmt.num(v, 0)} toman`;
    }
    return locale === "fa" ? `${fmt.num(v, 0)} ${ccyName}` : `${CCY_SYMBOL_EN[ccy]}${fmt.num(v, 0)}`;
  };

  const tableRows = React.useMemo(() => lastYearsTable(liveSpot), [liveSpot]);

  /* the 20-year verdict (the owner's ask): the average per-year growth
     over the table's own span — compound, computed live from the same
     rows the table shows, the end named as its own case */
  const verdict = React.useMemo(() => {
    if (tableRows.length < 2) return null;
    const first = tableRows[0]!;
    const last = tableRows[tableRows.length - 1]!;
    const years = last.year - first.year;
    if (years <= 0) return null;
    const pct = cagrPercent(first.price, last.price, years);
    if (pct === null) return null;
    const endWord = last.running
      ? t.verdictEndLive
      : t.verdictEndAvg.replace("{y}", yearText(last.year, locale));
    return t.verdictLine
      .replace("{pct}", fmt.num(pct, 1))
      .replace("{a}", locale === "fa" ? fmt.num(first.price, 0) : `$${fmt.num(first.price, 0)}`)
      .replace("{y0}", yearText(first.year, locale))
      .replace("{end}", endWord);
  }, [tableRows, t, fmt, locale]);

  return (
    <div className="mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-currena-soft)] text-[var(--color-accent-gold-deep)]" aria-hidden="true">
          <Hourglass className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <h4 className="m-0 text-[1.05rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h4>
          <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>
        </div>
      </div>

      {/* the toggles — the view (all / 100 years) and the Y scale */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="group" aria-label={t.viewAll} className="flex gap-1.5">
          {([["all", t.viewAll], ["100y", t.view100]] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`min-h-[32px] rounded-full px-3 py-1 text-[12.5px] font-bold transition-colors ${
                view === v
                  ? "bg-[var(--color-currena-blue)] text-white"
                  : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div role="group" aria-label={t.scaleLog} className="flex gap-1.5">
          {([["log", t.scaleLog], ["linear", t.scaleLinear]] as const).map(([s, label]) => (
            <button
              key={s}
              type="button"
              aria-pressed={scale === s}
              onClick={() => setScale(s)}
              className={`min-h-[32px] rounded-full px-3 py-1 text-[12.5px] font-bold transition-colors ${
                scale === s
                  ? "bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]"
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
        <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5 type-caption font-semibold text-[var(--color-text-secondary)]">
          <bdi className="font-black tabular-nums text-[var(--color-accent-gold-deep)]">{yearText(readout.y, locale)}</bdi>
          <bdi dir="ltr" className="tabular-nums font-bold text-[var(--color-text-primary)]">${fmt.num(readout.p, readout.p < 100 ? 2 : 0)}</bdi>
          <span className="text-[var(--color-text-tertiary)]">{readout.live ? t.liveWord : t.avgWord}</span>
        </p>
      ) : null}

      {/* the chart itself */}
      <div className="mt-1">
        <LongViewChart points={visible} scale={scale} locale={locale} fmt={fmt} onHover={setHoverYear} ariaLabel={t.chartAria} />
      </div>

      {/* the era chips — the three regimes, the seams named at point of use */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {view === "all" ? (
          <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
            {t.eraGoldStandard}
          </span>
        ) : null}
        <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
          {t.era35}
        </span>
        <span className="rounded-full bg-[var(--color-currena-bg-light)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]/60">
          {t.eraFree}
        </span>
      </div>

      {/* the last 20 years, year by year — IN THE OPEN (batch L: the
          owner's law, «طلا در بیست سال اخیر» visible, never behind a
          toggle); the running year rides its own live spot. The verdict
          container (the owner's ask) leads: the average per-year growth
          over the table's own span, computed live from these same rows */}
      <div className="mt-3">
        <h5 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.modalTitle}</h5>
        <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.modalNote}</p>
        {verdict !== null ? (
          <div
            className="mt-2 rounded-[var(--cr-radius-md)] px-3.5 py-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 16%, transparent)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 45%, transparent)",
            }}
            data-longview-verdict
          >
            <p className="m-0 type-caption font-bold text-[var(--color-accent-gold-deep)]">{t.verdictTitle}</p>
            <p className="m-0 mt-0.5 text-[1.02rem] font-black leading-snug text-[var(--color-accent-gold-deep)] sm:text-[1.1rem]">
              <bdi>{verdict}</bdi>
            </p>
          </div>
        ) : null}
        <div className="mt-1.5 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
          <table className="m-0 w-full border-collapse type-caption">
            <thead>
              <tr className="text-[var(--color-text-tertiary)]">
                <th scope="col" className="px-2.5 py-1.5 text-start font-bold">{t.colYear}</th>
                <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.colAvg}</th>
                <th scope="col" className="px-2.5 py-1.5 text-end font-bold">{t.colChange}</th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.year} className={`border-t border-[var(--color-border)] ${row.running ? "bg-[var(--color-currena-soft)]/50" : ""}`}>
                  <YearRowCells row={row} t={t} fmt={fmt} locale={locale} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* the purchasing-power machine — the owner's own ask, now
          multi-currency (the owner's batch): the currency select leads,
          the amount box rides Persian digits in fa (the owner's law:
          Farsi text carries Farsi numerals — typed or displayed), and
          the year select speaks Jalali for the toman */}
      <div className="mt-3 flex flex-col gap-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
        <div>
          <h5 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.ppTitle}</h5>
          <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.ppNote}</p>
        </div>

        <div className="flex flex-wrap items-end gap-2.5">
          <label className="flex flex-col gap-1">
            <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.ppCcyLabel}</span>
            <select
              value={ccy}
              onChange={(e) => {
                const next = e.currentTarget.value as MachineCcyId;
                setCcy(next);
                setAmount(CCY_DEFAULT_AMOUNT[next]);
                setAmountText(String(CCY_DEFAULT_AMOUNT[next]));
                setPpYear(CCY_DEFAULT_YEAR[next]);
              }}
              className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
              aria-label={t.ppCcyLabel}
            >
              {CCY_IDS.map((c) => (
                <option key={c} value={c}>
                  {t.ppCcyNames[c] ?? c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="type-caption font-semibold text-[var(--color-text-secondary)]">
              {t.ppAmountLabel.replace("{c}", ccyName)}
            </span>
            <input
              type="text"
              inputMode="decimal"
              autoComplete="off"
              dir="ltr"
              value={locale === "fa" ? faDigits(amountText) : amountText}
              onChange={(e) => {
                const text = sanitizeAmountText(toAsciiDigits(e.target.value));
                setAmountText(text);
                const v = Number(text);
                setAmount(text === "" || !Number.isFinite(v) ? 0 : Math.max(0, v));
              }}
              onBlur={() => {
                if (amountText === "") {
                  setAmountText("0");
                  setAmount(0);
                }
              }}
              className="w-[9rem] min-h-[38px] rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-1.5 type-label tabular-nums text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="type-caption font-semibold text-[var(--color-text-secondary)]">
              {ccy === "toman" ? t.ppYearJalali : t.ppYearLabel}
            </span>
            <select
              value={pickedYear}
              onChange={(e) => setPpYear(Number(e.currentTarget.value))}
              className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
              aria-label={ccy === "toman" ? t.ppYearJalali : t.ppYearLabel}
            >
              {[...yearOptions].reverse().map((y) => (
                <option key={y} value={y}>
                  {machineYearLabel(y)}
                  {isRunningPick(y) ? ` · ${t.liveWord}` : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* the answer — the weight the money bought, its worth today, and
            the same money's buying power now; the toman leg speaks grams
            of 18k Tehran gold only (the ounce is not that market's unit) */}
        {answer === null ? (
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.ppUncovered}</p>
        ) : answer.kind === "toman" ? (
          (() => {
            const a = answer.a;
            const less = a.gramsPct < 0;
            const tone = less ? "var(--color-return-down)" : "var(--color-return-up)";
            const basisWord =
              a.basisThen === "live" ? t.ppRunningNote : a.basisThen === "parity" ? t.ppBasisParity : t.ppBasisMarket;
            return (
              <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
                <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">{t.ppBoughtWord}:</p>
                <p className="m-0 inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-accent-gold-deep)] sm:text-[1.5rem]">
                    {fmt.num(a.gramsThen, 1)} {t.ppTomanGramWord}
                  </bdi>
                  <bdi className="type-caption text-[var(--color-text-tertiary)]">{basisWord}</bdi>
                </p>
                <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                  <span className="font-semibold">{t.ppWorthWord}:</span>{" "}
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="font-bold tabular-nums text-[var(--color-text-primary)]">
                    {moneyText(a.worthTodayToman)}
                  </bdi>
                </p>
                <p
                  className="m-0 inline-flex flex-wrap items-baseline gap-x-2 rounded-[var(--cr-radius-md)] px-3 py-2 type-caption"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tone} 12%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent)`,
                  }}
                >
                  <span className="font-semibold text-[var(--color-text-secondary)]">{t.ppSameTodayWord}:</span>
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="font-black tabular-nums" style={{ color: tone }}>
                    {fmt.num(a.gramsToday, 1)} {t.ppTomanGramWord} — {fmt.num(Math.abs(a.gramsPct), 1)}
                    {pctSign} {less ? t.ppLessWord : t.ppMoreWord}
                  </bdi>
                </p>
              </div>
            );
          })()
        ) : (
          (() => {
            const a = answer.a;
            const less = a.gramsPct < 0;
            const tone = less ? "var(--color-return-down)" : "var(--color-return-up)";
            const priceThenNote =
              ccy === "usd"
                ? isRunningYear(pickedYear)
                  ? t.ppRunningNote
                  : `${t.avgWord} $${fmt.num(a.priceThen, a.priceThen < 100 ? 2 : 0)}`
                : isRunningYear(pickedYear)
                  ? t.ppRunningNote
                  : t.ppBasisFx;
            return (
              <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
                <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">{t.ppBoughtWord}:</p>
                <p className="m-0 inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="text-[1.35rem] font-black leading-tight tabular-nums text-[var(--color-accent-gold-deep)] sm:text-[1.5rem]">
                    {fmt.num(a.ozThen, 2)} {t.ppOzWord} ≈ {fmt.num(a.gramsThen, 1)} {t.ppGramWord}
                  </bdi>
                  <bdi className="type-caption text-[var(--color-text-tertiary)]">{priceThenNote}</bdi>
                </p>
                <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                  <span className="font-semibold">{t.ppWorthWord}:</span>{" "}
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="font-bold tabular-nums text-[var(--color-text-primary)]">
                    {ccy === "usd" ? fmt.usd(a.worthToday) : moneyText(a.worthToday)}
                  </bdi>
                </p>
                <p
                  className="m-0 inline-flex flex-wrap items-baseline gap-x-2 rounded-[var(--cr-radius-md)] px-3 py-2 type-caption"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tone} 12%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 40%, transparent)`,
                  }}
                >
                  <span className="font-semibold text-[var(--color-text-secondary)]">{t.ppSameTodayWord}:</span>
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="font-black tabular-nums" style={{ color: tone }}>
                    {fmt.num(a.ozToday, 2)} {t.ppOzWord} ≈ {fmt.num(a.gramsToday, 1)} {t.ppGramWord} — {fmt.num(Math.abs(a.gramsPct), 1)}
                    {pctSign} {less ? t.ppLessWord : t.ppMoreWord}
                  </bdi>
                </p>
              </div>
            );
          })()
        )}
      </div>

      {/* the basis line as a P.S. (the owner's ask): quieter, smaller,
          one step down from the caption register — a footnote, not a
          claim */}
      <p className="m-0 mt-2.5 text-[11px] italic leading-relaxed text-[var(--color-text-tertiary)] opacity-80">{t.basisLine}</p>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.sourceLine}</p>

    </div>
  );
}
