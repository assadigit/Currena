"use client";

/**
 * The gold calculator — ONE tool at the page's foot, the consolidation of
 * the three calculation surfaces the page used to carry separately:
 *
 *   1. the what-if windows (if you'd bought gold: 1 week / 1 month /
 *      3 months / 6 months / 1 year / 5 years — the price then, the price
 *      now, the profit or loss), always visible;
 *   2. the wealth calculator (bought $x of gold since a window: what it
 *      is worth now), always visible;
 *   3. the assets head-to-head (gold vs S&P 500 vs Bitcoin vs silver
 *      since the year you pick — lump + the $100-a-month DCA), compact
 *      rows: name · change · bar · window · DCA, nothing else;
 *   4. any past day's meter reading (the old time machine's advanced
 *      leg) behind one tap.
 *
 * The compute is the pure engines ported verbatim (src/lib/gold-page/
 * ifbought.ts + the trend/daily/meter routes); the data rides the page's
 * own queries (fail-closed: a leg that does not arrive shows its honest
 * line, never a guess). Display-only, no advice.
 */

import * as React from "react";
import { CalendarClock, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Locale, LaneId } from "@/lib/gold-page/content";
import { LANE_CONTENT } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta } from "@/components/gold-page/visuals";
import {
  CALC_UNITS,
  calcAnswer,
  ifBoughtResult,
  unitSeries,
  yearOptions,
  type CalcUnit,
  type FxPayload,
  type IfBoughtAssetSeries,
  type IfBoughtSnapshot,
} from "@/lib/gold-page/ifbought";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/** The meter-era bound — the wire contract's own constant. */
const ERA_START = "2016-11-01";

/* the what-if windows — 1 week / 1 month / 3 months / 6 months / since the
   start of the Gregorian year / 1 year / 5 years, the table's own rows
   (the day never joins it; YTD sits between 6 months and 1 year) */
const IF_WINDOWS = ["7D", "30D", "3M", "6M", "YTD", "1Y", "5Y"] as const;
type IfWindow = (typeof IF_WINDOWS)[number];

/** The trend leg's own payload (from /api/gold/trend?range=all). */
interface TrendPoint {
  d: string;
  v: number;
}
interface TrendWindowPayload {
  range: string;
  asOf: string;
  spot: number;
  points: TrendPoint[];
  chgPct: number | null;
}

async function fetchTrendAll(): Promise<TrendWindowPayload[]> {
  const res = await fetch(`${deskBasePath}/api/gold/trend?range=all`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The trend API responded with ${res.status}`);
  return res.json() as Promise<TrendWindowPayload[]>;
}

type TmT = {
  eraNote: string;
  howTitle: string;
  how1: string;
  how2: string;
  how3: string;
  pickLabel: string;
  loading: string;
  asOfExact: string;
  asOfBefore: string;
  versionLine: string;
  provenanceBackfill: string;
  provenanceLive: string;
  noRow: string;
  unavailable: string;
  priceTitle: string;
  priceLine: string;
  priceNearest: string;
  priceVsToday: string;
  priceSourceSpot: string;
  priceSourceComex: string;
  priceUnavailable: string;
  ifTitle: string;
  ifNote: string;
  colWindow: string;
  colThen: string;
  colNow: string;
  colPl: string;
  calcTitle: string;
  calcAmountLabel: string;
  calcWorth: string;
  calcProfit: string;
  calcLoss: string;
  calcUncovered: string;
};

type CalcT = {
  eyebrow: string;
  title: string;
  subtitle: string;
  advancedLabel: string;
  modeOne: string;
  modeDca: string;
  modeOneNote: string;
  modeDcaNote: string;
  calcAssetLabel: string;
  calcUnitLabel: string;
  calcSinceLabel: string;
  calcAmountOne: string;
  calcAmountDca: string;
  calcInvestedWord: string;
  calcWorthWord: string;
  calcMonthsWord: string;
  calcFromLine: string;
  calcCostWord: string;
  gramUnitWord: string;
};

/** The if-you'd-bought row's own copy (the compact subset). */
type IbT = {
  pickLabel: string;
  firstYearNote: string;
  windowLine: string;
  noWindow: string;
  waiting: string;
  assets: { gold: string; sp500: string; btc: string; silver: string };
};

/** The balance copy's own verdict words (the hero's vocabulary). */
export interface CalcVerdictWords {
  verdictFor: string;
  verdictAgainst: string;
  verdictBalanced: string;
  verdictNone: string;
}

interface MeterLane {
  lane: string;
  side: "for" | "against" | "neutral" | "unread";
  split: boolean;
  readable: number;
  firing: number;
  supports: number;
  pressures: number;
}

interface MeterRow {
  date: string;
  source: "backfill" | "live" | string;
  tableVersion: string;
  state: "tipped-for" | "tipped-against" | "level" | "none" | string;
  beamAngle: number;
  fullyTipped: boolean;
  net: number;
  readable: number;
  counts: { for: number; against: number; neutral: number; unread: number };
  lanes: MeterLane[];
}

interface MeterResponse {
  v?: number;
  requestedDate?: string;
  row?: MeterRow | null;
}

/** The day-lookup leg's own payload (from /api/gold/daily). */
interface DailyPrice {
  date: string;
  price: number;
  source: "spot-store" | "comex-history";
  todaySpot: number;
  todayAsOf: string;
  span: { from: string; to: string };
}

type QueryState =
  | { kind: "idle" }
  | { kind: "loading"; date: string }
  | { kind: "ready"; response: MeterResponse }
  | { kind: "unavailable"; date: string };

type PriceState =
  | { kind: "idle" }
  | { kind: "loading"; date: string }
  | { kind: "ready"; price: DailyPrice }
  | { kind: "unavailable"; date: string };

const VERDICT_OF: Record<string, keyof CalcVerdictWords> = {
  "tipped-for": "verdictFor",
  "tipped-against": "verdictAgainst",
  level: "verdictBalanced",
  none: "verdictNone",
};

const LANES_IN_ORDER: ReadonlyArray<LaneId> = [
  "borrowing-costs",
  "dollar",
  "stress",
  "inflation",
  "flows",
];

/** A year, UNGROUPED (2026, never "2,026") — the locale digits still apply. */
function yearText(y: number, locale: Locale): string {
  try {
    return y.toLocaleString(locale === "fa" ? "fa-IR" : "en-US", { useGrouping: false });
  } catch {
    return String(y);
  }
}

/** A month-end's own label — "Jan 2017" / "۱/۲۰۱۷" (m/y, the fa convention). */
function monthText(ym: string, locale: Locale, fmt: Fmt): string {
  const [y, m] = ym.split("-");
  if (locale === "fa") return `${fmt.num(Number(m), 0)}/${yearText(Number(y), locale)}`;
  const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${names[Number(m) - 1] ?? m} ${y}`;
}

/* ------------------------------------------------------------------ *
 * The two-mode compute — the pure engine in the lib (calcAnswer):
 * ONE lump purchase in the picked year, or the same amount every
 * month since, over a month-end series priced in the picked unit —
 * dollars, any of the converter's currencies (its own FX month-ends),
 * the toman (TGJU's free-market dollar), or grams of metal.
 * ------------------------------------------------------------------ */

/** Each unit's own example default per mode (the owner's examples:
 * $100 / $10-a-month, 1 g, 1M toman a month). */
function unitDefault(u: CalcUnit, mode: "one" | "dca"): number {
  if (u.kind === "gram") return 1;
  if (u.id === "toman") return mode === "one" ? 100_000_000 : 1_000_000;
  if (u.id === "usd") return mode === "one" ? 100 : 10;
  return mode === "one" ? 100 : 50;
}

/** Normalize a raw keystroke string into calculator input text: Persian
 *  and Arabic-Indic digits become ASCII, anything but digits and ONE dot
 *  drops, and leading zeros collapse ("0100" → "100" — the reported
 *  artifact dies here, never stored, never shown). An empty string is
 *  legal while typing; the input's blur restores "0". */
function sanitizeAmountText(raw: string): string {
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const arDigits = "٠١٢٣٤٥٦٧٨٩";
  let s = "";
  for (const ch of raw) {
    const fi = faDigits.indexOf(ch);
    const ai = arDigits.indexOf(ch);
    s += fi >= 0 ? String(fi) : ai >= 0 ? String(ai) : ch;
  }
  s = s.replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot >= 0) s = `${s.slice(0, dot + 1)}${s.slice(dot + 1).replace(/\./g, "")}`;
  s = s.replace(/^0+(?=\d)/, "");
  return s;
}

/** Money in one unit — the toman carries the site's own M/bn toman
 *  convention; FA speaks the unit's word, EN its symbol. */
function unitMoney(v: number, u: CalcUnit, locale: Locale, fmt: Fmt): string {
  if (u.kind === "gram") return `${fmt.num(v, u.decimals)} ${u.symbol[lan(locale)]}`;
  if (u.id === "toman") {
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${fmt.num(v / 1e9, 1)} ${locale === "fa" ? "میلیارد تومان" : "bn toman"}`;
    if (abs >= 1e6) return `${fmt.num(v / 1e6, 1)} ${locale === "fa" ? "میلیون تومان" : "M toman"}`;
    return `${fmt.num(v, 0)} ${locale === "fa" ? "تومان" : "toman"}`;
  }
  if (locale === "fa") return `${fmt.num(v, u.decimals)} ${u.symbol[1]}`;
  return `${u.symbol[0]}${fmt.num(v, u.decimals)}`;
}

/* ------------------------------------------------------------------ *
 * The assets head-to-head — one compact row per asset (the name, the
 * lump change, one bar, the window, the DCA line; nothing else)
 * ------------------------------------------------------------------ */

const ASSET_ORDER: ReadonlyArray<keyof IfBoughtSnapshot["assets"]> = ["gold", "sp500", "btc", "silver"];

function AssetRow({
  name,
  result,
  ib,
  fmt,
  locale,
  maxAbs,
}: {
  name: string;
  result: ReturnType<typeof ifBoughtResult>;
  ib: IbT;
  fmt: Fmt;
  locale: Locale;
  maxAbs: number;
}) {
  if (result === null) {
    return (
      <li className="flex flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-2 ring-1 ring-[var(--color-border)]/50">
        <span className="type-label font-bold text-[var(--color-text-primary)]">{name}</span>
        <span className="type-caption text-[var(--color-text-tertiary)]">{ib.noWindow}</span>
      </li>
    );
  }
  const up = result.lumpPct >= 0;
  const barW = maxAbs > 0 ? Math.min(100, (Math.abs(result.lumpPct) / maxAbs) * 100) : 0;
  return (
    <li className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-2 ring-1 ring-[var(--color-border)]/50">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="type-label font-bold text-[var(--color-text-primary)]">{name}</span>
        <bdi dir="ltr" className={`type-label font-extrabold tabular-nums ${up ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}`}>
          {fmt.pct(result.lumpPct, 1)}
        </bdi>
      </div>
      {/* the lump bar — the same number, one glance wide */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" aria-hidden="true">
        <div
          className={`h-full rounded-full ${up ? "bg-[var(--color-return-up)]/55" : "bg-[var(--color-return-down)]/55"}`}
          style={{ width: `${barW}%` }}
        />
      </div>
      {/* the window, NAMED at point of use — the percent + the window, no
          DCA dollar defaults the reader never set (the owner's ask) */}
      <bdi className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">
        {ib.windowLine
          .replace("{from}", monthText(result.fromYm, locale, fmt))
          .replace("{to}", monthText(result.toYm, locale, fmt))
          .replace("{n}", fmt.num(result.months, 0))}
      </bdi>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * The band
 * ------------------------------------------------------------------ */

export function CalculatorBand({
  tm,
  ib,
  calc,
  locale,
  verdictWords,
  laneWord,
  windowNames,
  fmt,
  data,
}: {
  tm: TmT;
  ib: IbT;
  calc: CalcT;
  locale: Locale;
  verdictWords: CalcVerdictWords;
  laneWord: Record<LaneId, string>;
  windowNames: Record<IfWindow, string>;
  fmt: Fmt;
  data: IfBoughtSnapshot | null;
}) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [query, setQuery] = React.useState<QueryState>({ kind: "idle" });
  const [price, setPrice] = React.useState<PriceState>({ kind: "idle" });
  const [picked, setPicked] = React.useState<string | null>(null);

  // The picker's own honest bounds: the era start → today.
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  /* the what-if leg — every window's own trend (the price then, the
     price now, the gain or loss), plus the wealth calculator's state */
  const trends = useQuery({
    queryKey: ["currena-gold-trend-ifbought"],
    queryFn: fetchTrendAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const ifRows = React.useMemo(() => {
    if (trends.data === undefined) return [];
    return IF_WINDOWS.map((w) => {
      const row = trends.data.find((x) => x.range === w);
      if (row === undefined || row.points.length < 2) return null;
      const startPrice = row.points[0]!.v;
      if (!Number.isFinite(startPrice) || startPrice <= 0) return null;
      return { window: w, startPrice, spot: row.spot, chgPct: row.chgPct };
    }).filter((r) => r !== null) as Array<{ window: IfWindow; startPrice: number; spot: number; chgPct: number | null }>;
  }, [trends.data]);

  /* [2] the two-mode wealth calculator — one purchase in the picked
     year, or the same amount every month since; any of the four assets,
     in any of the converter's units (USD, AUD, NZD… the toman) or in
     grams of gold — the FX month-ends ride the desk's own /api/gold/fx
     leg, fail-closed per currency */
  const [mode, setMode] = React.useState<"one" | "dca">("one");
  const [calcAsset, setCalcAsset] = React.useState<keyof IfBoughtSnapshot["assets"]>("gold");
  const [unitId, setUnitId] = React.useState<string>("usd");
  const [calcYear, setCalcYear] = React.useState<number | null>(null);
  const [amount, setAmount] = React.useState<number>(100);
  /* the input's own text mirror (the owner's batch-H bug report:
     "typing 1000 gives 0100") — the root cause was a controlled
     type=number: the browser and React fight over the value, a cleared
     field snaps to "0" and prefixes the next digits, and select-all
     typing appends instead of replacing. The input is TEXT now, the
     mirror is the truth: fa/ar digits normalize, anything but digits
     and one dot drops, leading zeros collapse ("0100" → "100"), and
     the number commits underneath. */
  const [amountText, setAmountText] = React.useState<string>("100");
  const unit = CALC_UNITS.find((u) => u.id === unitId) ?? CALC_UNITS[0]!;
  const unitKind: "ccy" | "gram" = unit.kind;
  const switchMode = (m: "one" | "dca") => {
    setMode(m);
    setAmount(unitDefault(unit, m));
  };
  const switchUnit = (u: CalcUnit) => {
    setUnitId(u.id);
    setAmount(unitDefault(u, mode));
  };
  const switchAsset = (asset: keyof IfBoughtSnapshot["assets"]) => {
    setCalcAsset(asset);
    if (asset !== "gold" && unit.kind === "gram") {
      // grams of S&P or Bitcoin are not a thing — back to dollars
      const usd = CALC_UNITS[0]!;
      setUnitId(usd.id);
      setAmount(unitDefault(usd, mode));
    }
  };
  /* keep the mirror honest when the number changes from OUTSIDE the
     input (a unit / mode / asset switch re-defaults it) — while the
     user types, the mirror leads and the number follows */
  React.useEffect(() => {
    if (Number(amountText) === amount) return;
    setAmountText(String(amount));
  }, [amount, amountText]);

  /* the FX month-end leg — the converter's own currency set + the
     toman on the site's own TGJU free-market basis */
  const fx = useQuery({
    queryKey: ["currena-gold-fx-monthends"],
    queryFn: async (): Promise<FxPayload> => {
      const res = await fetch(`${deskBasePath}/api/gold/fx`, { cache: "no-store" });
      if (!res.ok) throw new Error(`The fx API responded with ${res.status}`);
      return res.json() as Promise<FxPayload>;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const fxTable = fx.data?.perUsd;
  const unitUsable = (u: CalcUnit): boolean =>
    u.id === "usd" || u.kind === "gram" ? true : fxTable?.[u.id] !== undefined;

  /* the assets head-to-head — since the picked year (the honest default:
     the second-to-last year with a full window) */
  const [sinceYear, setSinceYear] = React.useState<number | null>(null);
  const years = React.useMemo(() => (data !== null ? yearOptions(data) : []), [data]);
  const effectiveCalcYear = calcYear ?? years[0] ?? null;
  const series = React.useMemo(() => {
    if (data === null) return null;
    return unitSeries(data.assets[calcAsset] as IfBoughtAssetSeries, unitId, fx.data ?? null);
  }, [data, calcAsset, unitId, fx.data]);
  /* the two-mode answer itself — plain arithmetic over ~121 closes,
   * cheap enough to run every render, never memoized (the compiler's
   * own bail-out on the derived unit kind was the honest signal) */
  const calcResult =
    effectiveCalcYear === null ? null : calcAnswer(series, effectiveCalcYear, amount, unitKind, mode);
  const effectiveSince = sinceYear ?? years[years.length - 2] ?? years[0] ?? null;
  const rows = React.useMemo(() => {
    if (data === null || effectiveSince === null) return [];
    return ASSET_ORDER.map((asset) => ({
      asset,
      result: ifBoughtResult(data.assets[asset] as IfBoughtAssetSeries, effectiveSince),
    }));
  }, [data, effectiveSince]);
  const maxAbs = Math.max(
    1,
    ...rows.map((r) => (r.result !== null ? Math.abs(r.result.lumpPct) : 0)),
  );

  /* both legs of the picked day, in parallel: the meter reading AND the
     day's own gold price (≥ 10 years back — the store inside its window,
     the seam-anchored COMEX history before it). */
  const load = React.useCallback(async (date: string) => {
    setPicked(date);
    setQuery({ kind: "loading", date });
    setPrice({ kind: "loading", date });
    void (async () => {
      try {
        const res = await fetch(
          `${deskBasePath}/api/gold/daily?date=${encodeURIComponent(date)}`,
          { cache: "no-store" },
        );
        if (!res.ok) throw new Error(`the daily route responded with ${res.status}`);
        const p = (await res.json()) as DailyPrice;
        setPrice({ kind: "ready", price: p });
      } catch {
        setPrice({ kind: "unavailable", date });
      }
    })();
    try {
      const res = await fetch(
        `${deskBasePath}/api/gold/meter?date=${encodeURIComponent(date)}`,
        { cache: "no-store" },
      );
      if (!res.ok) throw new Error(`the meter route responded with ${res.status}`);
      const response = (await res.json()) as MeterResponse;
      setQuery({ kind: "ready", response });
    } catch {
      setQuery({ kind: "unavailable", date });
    }
  }, []);

  const row = query.kind === "ready" ? query.response.row ?? null : null;
  const verdictKey = VERDICT_OF[row?.state ?? ""] ?? null;

  return (
    <section
      id="gold-calculator"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={calc.title}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-currena-soft)] text-[var(--color-accent-gold-deep)]" aria-hidden="true">
          <Calculator className="h-4.5 w-4.5" />
        </span>
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{calc.eyebrow}</h2>
      </div>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{calc.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{calc.subtitle}</p>

      {/* [1] THE what-if table — if you'd bought gold: 1 week / 1 month /
          3 months / 6 months / 1 year / 5 years, always visible */}
      <div className="mt-3 flex min-w-0 flex-col gap-2">
        <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{tm.ifTitle}</h4>
        <div className="min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
          <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption" aria-label={tm.ifTitle}>
            <thead>
              <tr className="text-[var(--color-text-tertiary)]">
                <th scope="col" className="px-2.5 py-1.5 text-start font-bold">{tm.colWindow}</th>
                <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{tm.colThen}</th>
                <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{tm.colNow}</th>
                <th scope="col" className="px-2.5 py-1.5 text-end font-bold">{tm.colPl}</th>
              </tr>
            </thead>
            <tbody>
              {trends.isLoading || trends.data === undefined ? (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-[var(--color-text-tertiary)]" aria-live="polite">…</td>
                </tr>
              ) : ifRows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-[var(--color-text-tertiary)]">{tm.calcUncovered}</td>
                </tr>
              ) : (
                ifRows.map((r) => (
                  <tr key={r.window} className="border-t border-[var(--color-border)] first:border-t-0">
                    <th scope="row" className="px-2.5 py-1.5 text-start font-bold text-[var(--color-text-primary)]">
                      {windowNames[r.window]}
                    </th>
                    <td className="px-1.5 py-1.5 text-end tabular-nums text-[var(--color-text-secondary)]">
                      <bdi dir="ltr">${fmt.num(r.startPrice, 0)}</bdi>
                    </td>
                    <td className="px-1.5 py-1.5 text-end font-bold tabular-nums text-[var(--color-text-primary)]">
                      <bdi dir="ltr">${fmt.num(r.spot, 0)}</bdi>
                    </td>
                    <td className="px-2.5 py-1.5 text-end">
                      <SignedDelta v={r.chgPct} fmt={fmt} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* [2] THE two-mode wealth calculator — buy once in the picked
            year, or the same amount every month since: any of the four
            assets, both answers in the desk's own plain words */}
        <div className="flex flex-col gap-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
          <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{tm.calcTitle}</h4>

          {/* the mode toggle — the two ways to buy */}
          <div role="group" aria-label={locale === "en" ? "Purchase mode" : "حالت خرید"} className="flex flex-wrap gap-1.5">
            {([["one", calc.modeOne, calc.modeOneNote], ["dca", calc.modeDca, calc.modeDcaNote]] as const).map(([m, label, note]) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                title={note}
                onClick={() => switchMode(m)}
                className={`min-h-[36px] flex-1 basis-[46%] rounded-full px-3 py-1.5 text-[13px] font-extrabold transition-colors ${
                  mode === m
                    ? "bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            {mode === "one" ? calc.modeOneNote : calc.modeDcaNote}
          </p>

          {/* the asset chips — gold · S&P · Bitcoin · silver */}
          <div role="group" aria-label={calc.calcAssetLabel} className="flex flex-wrap gap-1.5">
            {ASSET_ORDER.map((asset) => (
              <button
                key={asset}
                type="button"
                aria-pressed={calcAsset === asset}
                onClick={() => switchAsset(asset)}
                className={`min-h-[32px] rounded-full px-3 py-1 text-[12.5px] font-bold transition-colors ${
                  calcAsset === asset
                    ? "bg-[var(--color-currena-blue)] text-white"
                    : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {ib.assets[asset as keyof IbT["assets"]]}
              </button>
            ))}
          </div>

          {/* the amount · the unit · the since-year — the unit is the
              owner's own ask: dollars, any of the converter's currencies
              (the toman included), or grams of gold */}
          <div className="flex flex-wrap items-end gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">
                {mode === "one" ? calc.calcAmountOne : calc.calcAmountDca}
              </span>
              <input
                type="text"
                inputMode="decimal"
                autoComplete="off"
                dir="ltr"
                value={amountText}
                onChange={(e) => {
                  const text = sanitizeAmountText(e.target.value);
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
              <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{calc.calcUnitLabel}</span>
              <select
                value={unitId}
                onChange={(e) => {
                  const next = CALC_UNITS.find((u) => u.id === e.currentTarget.value);
                  if (next !== undefined) switchUnit(next);
                }}
                className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                aria-label={calc.calcUnitLabel}
              >
                {CALC_UNITS.filter((u) => (u.kind === "gram" ? calcAsset === "gold" : true)).map((u) => (
                  <option key={u.id} value={u.id} disabled={!unitUsable(u)}>
                    {u.name[lan(locale)]}
                  </option>
                ))}
              </select>
            </label>
            {data !== null && years.length > 0 ? (
              <label className="flex flex-col gap-1">
                <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{calc.calcSinceLabel}</span>
                <select
                  value={effectiveCalcYear ?? undefined}
                  onChange={(e) => setCalcYear(Number(e.currentTarget.value))}
                  className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                  aria-label={calc.calcSinceLabel}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {yearText(y, locale)}
                      {y === years[0] ? ` (${ib.firstYearNote})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {/* THE answer — invested → worth today (on its own green ground
              when it gained, red when it lost) → the plain gain/loss */}
          {data === null ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{ib.waiting}</p>
          ) : calcResult === null ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{tm.calcUncovered}</p>
          ) : (() => {
            const up = calcResult.worth >= calcResult.invested;
            const gain = calcResult.worth - calcResult.invested;
            const tone = up ? "var(--color-return-up)" : "var(--color-return-down)";
            const gram = unit.kind === "gram";
            const fromLine = calc.calcFromLine.replace("{from}", monthText(calcResult.fromYm, locale, fmt));
            return (
              <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2.5 ring-1 ring-[var(--color-border)]">
                <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">
                  {calc.calcInvestedWord}:{" "}
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="font-bold tabular-nums text-[var(--color-text-primary)]">
                    {gram
                      ? mode === "one"
                        ? `${fmt.num(amount, 1)} ${calc.gramUnitWord} · ${calc.calcCostWord} ${fmt.usd(calcResult.invested)}`
                        : `${fmt.num(amount, 1)} ${calc.gramUnitWord} × ${fmt.num(calcResult.months, 0)} = ${fmt.num(calcResult.grams ?? 0, 1)} ${calc.gramUnitWord} · ${calc.calcCostWord} ${fmt.usd(calcResult.invested)}`
                      : mode === "one"
                        ? unitMoney(amount, unit, locale, fmt)
                        : `${unitMoney(amount, unit, locale, fmt)} × ${fmt.num(calcResult.months, 0)} = ${unitMoney(calcResult.invested, unit, locale, fmt)}`}
                  </bdi>
                  <span aria-hidden="true"> · </span>
                  <span>{fromLine}</span>
                </p>
                <p
                  className="m-0 inline-flex flex-wrap items-baseline gap-x-2 rounded-[var(--cr-radius-md)] px-3 py-2"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${tone} 15%, transparent)`,
                    boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${tone} 45%, transparent)`,
                  }}
                >
                  <span className="type-caption font-bold text-[var(--color-text-secondary)]">{calc.calcWorthWord}:</span>
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} className="text-[1.35rem] font-black leading-tight tabular-nums sm:text-[1.5rem]" style={{ color: tone }}>
                    {gram
                      ? `${fmt.num(calcResult.grams ?? 0, 1)} ${calc.gramUnitWord} ≈ ${fmt.usd(calcResult.worth)}`
                      : unitMoney(calcResult.worth, unit, locale, fmt)}
                  </bdi>
                </p>
                <p className="m-0 type-label font-black">
                  <bdi dir={locale === "en" ? "ltr" : "rtl"} style={{ color: tone }}>
                    {up ? tm.calcProfit : tm.calcLoss} {up ? "+" : "−"}
                    {gram ? fmt.usd(Math.abs(gain)) : unitMoney(Math.abs(gain), unit, locale, fmt)} ({up ? "+" : "−"}{fmt.num(Math.abs(calcResult.pct), 1)}%)
                  </bdi>
                </p>
              </div>
            );
          })()}
        </div>

        {/* [3] the assets head-to-head — gold vs S&P vs Bitcoin vs silver
            since the picked year, compact rows */}
        <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{locale === "en" ? "Gold vs the alternatives" : "طلا در برابر جایگزین‌ها"}</h4>
            {data !== null && years.length > 0 ? (
              <label className="flex items-center gap-2">
                <span className="type-caption font-semibold text-[var(--color-text-secondary)]">{ib.pickLabel}</span>
                <select
                  value={effectiveSince ?? undefined}
                  onChange={(e) => setSinceYear(Number(e.currentTarget.value))}
                  className="min-h-[38px] cursor-pointer rounded-[var(--cr-radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[length:var(--type-label)] font-bold tabular-nums text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
                  aria-label={ib.pickLabel}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {yearText(y, locale)}
                      {y === years[0] ? ` (${ib.firstYearNote})` : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {data === null ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{ib.waiting}</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
              {rows.map(({ asset, result }) => (
                <AssetRow
                  key={asset}
                  name={ib.assets[asset]}
                  result={result}
                  ib={ib}
                  fmt={fmt}
                  locale={locale}
                  maxAbs={maxAbs}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* [4] the advanced leg — any past day's meter reading + the day's
          own gold price, behind one tap */}
      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          aria-expanded={advancedOpen}
          aria-controls="gold-calculator-advanced"
          onClick={() => setAdvancedOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          <CalendarClock className="h-4 w-4 shrink-0" aria-hidden="true" />
          {advancedOpen ? (locale === "en" ? "hide the time machine" : "بستن ماشین زمان") : calc.advancedLabel}
        </button>

        {advancedOpen ? (
          <div id="gold-calculator-advanced" className="mt-3 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="gold-calculator-date" className="type-caption font-semibold text-[var(--color-text-secondary)]">
                {tm.pickLabel}
              </label>
              <input
                id="gold-calculator-date"
                type="date"
                min={ERA_START}
                max={today}
                defaultValue=""
                onChange={(e) => {
                  const v = e.target.value;
                  if (v !== "") void load(v);
                }}
                className="min-h-[36px] rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1 type-label text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]"
              />
            </div>

            {/* the explainer — the owner's own ask: what the machine
                actually does, three plain sentences, always visible */}
            <div className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              <p className="m-0 type-label font-bold text-[var(--color-text-primary)]">{tm.howTitle}</p>
              <ol className="m-0 flex list-none flex-col gap-1 p-0">
                {([tm.how1, tm.how2, tm.how3] as const).map((line, i) => (
                  <li key={i} className="flex gap-2 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                    <span className="shrink-0 font-black text-[var(--color-accent-gold-deep)]">{fmt.num(i + 1, 0)}.</span>
                    <bdi>{line}</bdi>
                  </li>
                ))}
              </ol>
            </div>

            {query.kind === "loading" ? <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{tm.loading}</p> : null}

            {/* the day's own gold price — THE headline answer, big and bold */}
            {price.kind === "loading" ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">…</p>
            ) : null}
            {price.kind === "unavailable" ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{tm.priceUnavailable}</p>
            ) : null}
            {price.kind === "ready" ? (
              <div className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2.5 ring-1 ring-[var(--color-accent-gold)]/40">
                <p className="m-0 text-[1.05rem] font-black leading-tight text-[var(--color-text-primary)] sm:text-[1.15rem]" data-timemachine-price>
                  {tm.priceTitle}:{" "}
                  <bdi dir="ltr" className="tabular-nums">
                    ${fmt.num(price.price.price, 0)}
                  </bdi>{" "}
                  <span className="type-caption font-bold text-[var(--color-text-secondary)]">/ oz</span>
                </p>
                <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                  <bdi>{tm.priceLine.replace("{price}", `$${fmt.num(price.price.price, 0)}`)}</bdi>
                  {picked !== null && price.price.date !== picked ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <bdi>{tm.priceNearest.replace("{date}", fmt.dateWords(picked))}</bdi>
                    </>
                  ) : null}
                </p>
                <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                  {price.price.todaySpot > 0 ? (
                    <bdi className="font-bold" style={{ color: price.price.todaySpot >= price.price.price ? "var(--color-return-down)" : "var(--color-return-up)" }}>
                      {tm.priceVsToday.replace("{pct}", fmt.pct((price.price.todaySpot / price.price.price - 1) * 100))}
                    </bdi>
                  ) : null}
                  <span aria-hidden="true"> · </span>
                  {price.price.source === "spot-store" ? tm.priceSourceSpot : tm.priceSourceComex}
                  <span aria-hidden="true"> · </span>
                  <span>
                    {fmt.dateWords(price.price.span.from)} → {fmt.dateWords(price.price.span.to)}
                  </span>
                </p>
              </div>
            ) : null}

            {query.kind === "unavailable" ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                {tm.unavailable.replace("{date}", fmt.dateWords(query.date))}
              </p>
            ) : null}

            {query.kind === "ready" ? (
              row === null ? (
                <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                  {tm.noRow.replace("{date}", fmt.dateWords(query.response.requestedDate ?? today))}
                </p>
              ) : (
                <div className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="m-0 type-label font-bold text-[var(--color-text-primary)]">
                      {query.response.requestedDate === row.date
                        ? tm.asOfExact.replace("{date}", fmt.dateWords(row.date))
                        : tm.asOfBefore
                            .replace("{row}", fmt.dateWords(row.date))
                            .replace("{picked}", fmt.dateWords(query.response.requestedDate ?? today))}
                    </p>
                    <p className="m-0 type-caption font-bold text-[var(--color-chip-ink-attention)]">
                      {verdictKey !== null ? verdictWords[verdictKey] : verdictWords.verdictNone}
                    </p>
                  </div>
                  <p className="m-0 type-caption text-[var(--color-text-secondary)]">
                    {tm.versionLine.replace("{version}", row.tableVersion)}
                    {" · "}
                    {locale === "en" ? "for" : "موافق"} {fmt.num(row.counts.for, 0)} ·{" "}
                    {locale === "en" ? "against" : "مخالف"} {fmt.num(row.counts.against, 0)} ·{" "}
                    {locale === "en" ? "not leaning" : "بی‌طرف"} {fmt.num(row.counts.neutral, 0)} ·{" "}
                    {locale === "en" ? "unread" : "ناخوانده"} {fmt.num(row.counts.unread, 0)}
                  </p>
                  {(() => {
                    /* the day's own count bar — for · against · neutral ·
                       unread in one glance, hue paired with the words above */
                    const total = Math.max(
                      1,
                      row.counts.for + row.counts.against + row.counts.neutral + row.counts.unread,
                    );
                    const segs = [
                      { n: row.counts.for, cls: "bg-[var(--color-currena-success)]" },
                      { n: row.counts.against, cls: "bg-[var(--color-status-alert)]" },
                      { n: row.counts.neutral, cls: "bg-[var(--color-border)]" },
                      { n: row.counts.unread, cls: "bg-[var(--color-border)]/40" },
                    ];
                    return (
                      <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden="true">
                        {segs.map((s, i) => (
                          <span key={i} className={s.cls} style={{ width: `${(s.n / total) * 100}%` }} />
                        ))}
                      </div>
                    );
                  })()}
                  <ul className="m-0 flex list-none flex-col gap-1 p-0">
                    {row.lanes.map((l) => {
                      const laneId = LANES_IN_ORDER.find((k) => k === l.lane) ?? null;
                      const word =
                        laneId !== null
                          ? l.split
                            ? locale === "en"
                              ? `split ${fmt.num(l.supports, 0)}·${fmt.num(l.pressures, 0)}`
                              : `دوپاره ${fmt.num(l.supports, 0)}·${fmt.num(l.pressures, 0)}`
                            : laneWord[laneId]
                          : l.side;
                      const tone =
                        l.side === "for"
                          ? "text-[var(--color-currena-success)]"
                          : l.side === "against"
                            ? "text-[var(--color-status-alert)]"
                            : "text-[var(--color-text-tertiary)]";
                      return (
                        <li key={l.lane} className="flex flex-col gap-1 rounded-[var(--cr-radius-sm)] bg-[var(--color-surface)] px-2 py-1.5 ring-1 ring-[var(--color-border)]/50">
                          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 type-caption">
                            <span className="font-semibold text-[var(--color-text-primary)]">
                              {laneId !== null ? LANE_CONTENT[laneId].label[lan(locale)] : l.lane}
                            </span>
                            <span className={`font-bold ${tone}`}>{word}</span>
                            <span className="text-[var(--color-text-tertiary)]">
                              {fmt.num(l.readable, 0)} {locale === "en" ? "readable" : "خوانا"}
                              {l.firing > 0 ? ` · ${fmt.num(l.firing, 0)} ${locale === "en" ? "firing" : "شلیک‌کننده"}` : ""}
                            </span>
                          </span>
                          {(() => {
                            /* the lane's own balance — supports vs pressures,
                               one mini bar; hue never alone, the counts above it */
                            const fire = l.supports + l.pressures;
                            if (fire <= 0) return null;
                            return (
                              <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" aria-hidden="true">
                                <span className="bg-[var(--color-currena-success)]/70" style={{ width: `${(l.supports / fire) * 100}%` }} />
                                <span className="bg-[var(--color-status-alert)]/70" style={{ width: `${(l.pressures / fire) * 100}%` }} />
                              </span>
                            );
                          })()}
                        </li>
                      );
                    })}
                  </ul>
                  <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
                    {row.source === "live" ? tm.provenanceLive : tm.provenanceBackfill}
                  </p>
                </div>
              )
            ) : null}

            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
              <bdi>{tm.eraNote}</bdi>
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
