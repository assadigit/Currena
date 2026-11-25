"use client";

/**
 * The context cards — the Zone J section the previous gold page carried,
 * restored: the eight ratio cards (each with its own 10-year position
 * band + one plain meaning sentence), the five-currency gold grid (the
 * KGX validation sentence), the physical-market trio (SGE withdrawals,
 * the Swiss flow, the Shanghai premium), and the forecast-accuracy
 * retrospective (LBMA's own analyst-survey record beside Currena's own
 * no-edge posture).
 *
 * Serves from the desk's own routes (/api/gold/projection,
 * /api/gold/crosses — the server-side proxies over the still-live
 * currena-api legs) and renders fail-closed: a leg that did not arrive
 * renders its honest unavailable line, never a guess. All on Currena's
 * own tokens, bilingual EN + fa/RTL, display-only — nothing here joins
 * the 37-voter balance.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, SignedDelta } from "@/components/gold-page/visuals";
import {
  forecastRetrospective,
  LBMA_2026_MIDYEAR_REVISION,
  LBMA_FORECAST_EXTRACTED_AT,
  LBMA_FORECAST_SOURCE_URL,
} from "@/lib/gold-page/lbma-forecast";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/* ------------------------------------------------------------------ *
 * The payloads
 * ------------------------------------------------------------------ */

export interface ProjectionReading {
  id: string;
  value: number | null;
  asOf: string | null;
  change30d: number | null;
  change90d: number | null;
  percentile10y: number | null;
  status?: string;
}

export interface ProjectionPayload {
  generatedAt?: string;
  readings: ProjectionReading[];
  absentIds?: string[];
}

export interface CrossPoint {
  date: string;
  close: number;
}

export interface CrossesPayload {
  v?: number;
  asOf?: string;
  fetchedAt?: string;
  crosses: Array<{ id: string; kind: string; formula?: string; series: CrossPoint[] }>;
}

/* ------------------------------------------------------------------ *
 * The fetchers (fail-closed)
 * ------------------------------------------------------------------ */

async function leg<T>(path: string): Promise<T> {
  const res = await fetch(`${deskBasePath}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} responded with ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchProjection = () => leg<ProjectionPayload>("/api/gold/projection");
export const fetchCrosses = () => leg<CrossesPayload>("/api/gold/crosses");

/* ------------------------------------------------------------------ *
 * The pure derivations (ported verbatim from the upstream engine)
 * ------------------------------------------------------------------ */

/** The minimum points before a decile speaks (the R19 posture). */
const CROSS_DECILE_MIN_BASE = 30;

function percentileOf(base: readonly number[], x: number): number {
  return base.filter((v) => v <= x).length / base.length;
}

function pointAbout30dBack(series: readonly CrossPoint[]): CrossPoint | null {
  if (series.length === 0) return null;
  const lastDate = series[series.length - 1]!.date;
  const cutoff = Date.parse(`${lastDate}T00:00:00Z`) - 30 * 86_400_000;
  let out: CrossPoint | null = null;
  for (const p of series) {
    if (Date.parse(`${p.date}T00:00:00Z`) <= cutoff) out = p;
    else break;
  }
  return out;
}

export interface CrossStats {
  id: string;
  last: number;
  lastDate: string;
  change30d: number | null;
  decile: number | null;
  basis: { from: string; to: string; points: number } | null;
}

/** One cross's stats over its stored series (pure, verbatim). */
function crossStats(id: string, series: readonly CrossPoint[]): CrossStats | null {
  if (series.length < 2) return null;
  const last = series[series.length - 1]!;
  const ref = pointAbout30dBack(series);
  const change30d =
    ref !== null && ref.close > 0 ? ((last.close - ref.close) / ref.close) * 100 : null;
  const base = series.slice(0, -1).map((p) => p.close);
  const decile = base.length >= CROSS_DECILE_MIN_BASE ? percentileOf(base, last.close) : null;
  return {
    id,
    last: last.close,
    lastDate: last.date,
    change30d,
    decile,
    basis:
      decile !== null
        ? { from: series[0]!.date, to: series[series.length - 2]!.date, points: base.length }
        : null,
  };
}

/* ------------------------------------------------------------------ *
 * The card ids + names (the upstream placement's own set)
 * ------------------------------------------------------------------ */

const RATIO_IDS: ReadonlyArray<{ id: string; name: [string, string]; meaning: keyof CcT; unit: "x" | "$" | "%" }> = [
  { id: "gold-silver", name: ["Gold/silver", "طلا/نقره"], meaning: "meaningGoldSilver", unit: "x" },
  { id: "gold-btc", name: ["Gold/bitcoin", "طلا/بیت‌کوین"], meaning: "meaningGoldBtc", unit: "x" },
  { id: "gold-aud", name: ["Gold in AUD", "طلا به دلار استرالیا"], meaning: "meaningGoldAud", unit: "$" },
  { id: "gold-oil-ratio", name: ["Gold/oil", "طلا/نفت"], meaning: "meaningGoldOilRatio", unit: "x" },
  { id: "gold-platinum", name: ["Gold/platinum", "طلا/پلاتین"], meaning: "meaningGoldPlatinum", unit: "x" },
  { id: "real-gold-price", name: ["Real gold price", "قیمت واقعی طلا"], meaning: "meaningRealGoldPrice", unit: "$" },
  { id: "copper-gold", name: ["Gold/copper", "طلا/مس"], meaning: "meaningCopperGold", unit: "x" },
  { id: "gold-equities-ratio", name: ["Gold/S&P 500", "طلا/اس‌اند‌پی"], meaning: "meaningGoldEquitiesRatio", unit: "x" },
];
export { RATIO_IDS };

const PHYSICAL_IDS: ReadonlyArray<{ id: string; name: [string, string]; meaning: keyof CcT; unit: "%" | "t" | "$" }> = [
  { id: "sge-gold-withdrawals", name: ["SGE withdrawals", "برداشت شانگهای"], meaning: "meaningSgeWithdrawals", unit: "t" },
  { id: "swiss-gold-flow", name: ["Swiss gold flow", "جریان طلای سوئیس"], meaning: "meaningSwissFlow", unit: "t" },
  { id: "shanghai-gold-premium", name: ["Shanghai premium", "حق‌بهای شانگهای"], meaning: "meaningShanghaiPremium", unit: "%" },
];
export { PHYSICAL_IDS };

const CROSS_NAMES: Record<string, [string, string]> = {
  eur: ["Euro", "یورو"],
  jpy: ["Japanese yen", "یِن ژاپن"],
  gbp: ["Pound sterling", "پوند"],
  cny: ["Chinese yuan", "یوان چین"],
  aud: ["Australian dollar", "دلار استرالیا"],
};

const CROSS_DECIMALS: Record<string, number> = { eur: 2, jpy: 0, gbp: 2, cny: 2, aud: 2 };

type CcT = {
  ratiosTitle: string;
  physicalHeader: string;
  physicalLine: string;
  valueUnavailable: string;
  positionLine: string;
  bandTop: string;
  bandBottom: string;
  bandMid: string;
  change30d: string;
  change90d: string;
  asOf: string;
  unavailable: string;
  meaningGoldSilver: string;
  meaningGoldBtc: string;
  meaningGoldAud: string;
  meaningGoldOilRatio: string;
  meaningGoldPlatinum: string;
  meaningRealGoldPrice: string;
  meaningCopperGold: string;
  meaningGoldEquitiesRatio: string;
  meaningSgeWithdrawals: string;
  meaningSwissFlow: string;
  meaningShanghaiPremium: string;
};

type GridT = {
  title: string;
  tomanName: string;
  tomanMillion: string;
  tomanBillion: string;
  tomanNote: string;
  tomanLive: string;
  /** the band label's own quiet tail — its own row (batch L, task 8:
      «۱٪ پایینی» on one row, «از پنجرهٔ ذخیره‌شده» under it, never an
      arbitrary mid-word wrap) */
  positionTail: string;
  bandTop: string;
  bandBottom: string;
  bandMid: string;
  change30d: string;
  strongWeakLine: string;
  unavailable: string;
};

type FrT = {
  title: string;
  subtitle: string;
  /** the visible percentages list's own lead-in (batch L, task 9) */
  missListLabel: string;
  headline: string;
  y2025Line: string;
  colYear: string;
  colForecast: string;
  colActual: string;
  colMiss: string;
  pendingCell: string;
  missConvention: string;
  pendingLine: string;
  pairNote: string;
  sourceLine: string;
};

/** The band's own copy bundle. */
export interface ContextBandCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  cc: CcT;
  grid: GridT;
  fr: FrT;
}

/** The band word for a percentile (top/bottom/mid, the upstream's own). */
export function bandWord(pct: number | null, t: CcT, fmt: Fmt): string | null {
  if (pct === null) return null;
  if (pct > 0.8) return t.bandTop.replace("{p}", fmt.num(Math.round((1 - pct) * 100)));
  if (pct < 0.2) return t.bandBottom.replace("{p}", fmt.num(Math.round(pct * 100)));
  return t.bandMid;
}

/* ------------------------------------------------------------------ *
 * The compact context table — the tiny table the owner asked for:
 * every ratio/physical reading one dense row (name + one-line meaning,
 * value, position band, 30d/90d deltas); the full sentences ride the
 * name's own line, clamped to one row each.
 * ------------------------------------------------------------------ */

interface ContextRowDef {
  id: string;
  name: [string, string];
  meaning: string;
  unit: "x" | "$" | "%" | "t";
}
export type { ContextRowDef };

export function ContextTable({
  rows,
  byId,
  t,
  fmt,
  locale,
}: {
  rows: ReadonlyArray<ContextRowDef>;
  byId: Map<string, ProjectionReading>;
  t: CcT;
  fmt: Fmt;
  locale: Locale;
}) {
  return (
    <div className="min-w-0 overflow-x-auto rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
      <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption">
        <thead>
          <tr className="text-[var(--color-text-tertiary)]">
            <th scope="col" className="px-2 py-1.5 text-start font-bold">{t.ratiosTitle}</th>
            <th scope="col" className="px-1.5 py-1.5 text-end font-bold">·</th>
            <th scope="col" className="px-1.5 py-1.5 text-end font-bold">{t.change30d}</th>
            <th scope="col" className="hidden px-1.5 py-1.5 text-end font-bold sm:table-cell">{t.change90d}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((card) => {
            const reading = byId.get(card.id);
            const has = reading !== undefined && reading.value !== null && Number.isFinite(reading.value);
            const band = bandWord(reading?.percentile10y ?? null, t, fmt);
            const valueText = has
              ? card.unit === "$"
                ? `$${fmt.num(reading!.value!, 2)}`
                : card.unit === "t"
                  ? `${fmt.num(reading!.value!, 1)} t`
                  : card.unit === "%"
                    ? `${fmt.num(reading!.value!, 2)}%`
                    : fmt.num(reading!.value!, 2)
              : t.valueUnavailable;
            return (
              <tr key={card.id} className="border-t border-[var(--color-border)]">
                <th scope="row" className="max-w-[280px] px-2 py-1.5 text-start font-semibold">
                  <span className="flex flex-col gap-0">
                    <span className="font-bold text-[var(--color-text-primary)]">{card.name[lan(locale)]}</span>
                    <span className="line-clamp-1 text-[11.5px] leading-snug text-[var(--color-text-tertiary)]" title={card.meaning}>
                      {card.meaning}
                    </span>
                  </span>
                </th>
                <td className="px-1.5 py-1.5 text-end">
                  <span className="flex flex-col items-end gap-0.5">
                    {has ? (
                      <bdi dir="ltr" className="type-label font-bold tabular-nums text-[var(--color-text-primary)]">
                        {valueText}
                      </bdi>
                    ) : (
                      <span className="type-caption font-semibold text-[var(--color-text-tertiary)]">{t.valueUnavailable}</span>
                    )}
                    {band !== null ? (
                      <span className="text-[10.5px] font-semibold text-[var(--color-text-secondary)]">{t.positionLine.replace("{band}", band)}</span>
                    ) : null}
                  </span>
                </td>
                <td className="px-1.5 py-1.5 text-end">
                  {reading?.change30d != null ? <SignedDelta v={reading.change30d} fmt={fmt} /> : <span className="text-[var(--color-text-tertiary)]">·</span>}
                </td>
                <td className="hidden px-1.5 py-1.5 text-end sm:table-cell">
                  {reading?.change90d != null ? <SignedDelta v={reading.change90d} fmt={fmt} /> : <span className="text-[var(--color-text-tertiary)]">·</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The currency grid
 * ------------------------------------------------------------------ */

export function CurrencyGridCard({
  crosses,
  tomanPerOunce,
  t,
  fmt,
  locale,
}: {
  crosses: CrossesPayload | null;
  tomanPerOunce: number | null;
  t: GridT;
  fmt: Fmt;
  locale: Locale;
}) {
  /* open by default — the owner wants the grid expanded, never hidden */
  const [open, setOpen] = React.useState(true);
  const rows = React.useMemo(() => {
    if (crosses === null) return null;
    return crosses.crosses
      .map((c) => ({ cross: c, stats: crossStats(c.id, c.series) }))
      .filter((r) => r.stats !== null);
  }, [crosses]);

  /* the strongest / weakest verdict (the owner's batch-H ask): the cross
     that moved the most against its currency in 30 days is the one gold
     is strongest against (the ounce buys more of the fallen currency);
     the one that moved the least / fell is where gold is weakest */
  const strongWeak = React.useMemo(() => {
    if (rows === null || rows.length < 2) return null;
    const ranked = rows
      .map((r) => ({ id: r.stats!.id, chg: r.stats!.change30d }))
      .filter((r) => r.chg !== null && Number.isFinite(r.chg)) as Array<{ id: string; chg: number }>;
    if (ranked.length < 2) return null;
    const sorted = [...ranked].sort((a, b) => a.chg - b.chg);
    return { strong: sorted[sorted.length - 1]!, weak: sorted[0]! };
  }, [rows]);

  if (crosses === null) {
    return (
      <div className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
        <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.title}</h4>
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.title}</h4>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 type-caption font-bold text-[var(--color-currena-blue-deep)]"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`} aria-hidden="true" />
          {open ? (locale === "en" ? "hide" : "بستن") : locale === "en" ? "show" : "نمایش"}
        </button>
      </div>
      {/* the strongest/weakest verdict — which currency gold gained or
          lost the most against, and what it means (batch H); the card's
          one verdict line, everything else is the grid itself */}
      {strongWeak !== null ? (
        <p className="m-0 type-caption font-semibold text-[var(--color-text-primary)]" data-currency-verdict>
          <bdi>
            {t.strongWeakLine
              .replace("{strong}", CROSS_NAMES[strongWeak.strong.id]?.[lan(locale)] ?? strongWeak.strong.id)
              .replace("{spct}", fmt.pct(strongWeak.strong.chg, 1))
              .replace("{weak}", CROSS_NAMES[strongWeak.weak.id]?.[lan(locale)] ?? strongWeak.weak.id)
              .replace("{wpct}", fmt.pct(strongWeak.weak.chg, 1))}
          </bdi>
        </p>
      ) : null}
      {open ? (
        <div className="mt-1 flex flex-col gap-1.5">
          {rows?.map(({ cross, stats }) => {
            const dec = CROSS_DECIMALS[stats!.id] ?? 2;
            const band =
              stats!.decile === null
                ? null
                : stats!.decile > 0.8
                  ? t.bandTop.replace("{p}", fmt.num(Math.round((1 - stats!.decile) * 100)))
                  : stats!.decile < 0.2
                    ? t.bandBottom.replace("{p}", fmt.num(Math.round(stats!.decile * 100)))
                    : t.bandMid;
            return (
              <div
                key={stats!.id}
                className="grid grid-cols-[minmax(84px,auto)_1fr_auto] items-baseline gap-x-3 gap-y-1 rounded-[var(--cr-radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]"
              >
                <span className="type-caption font-bold text-[var(--color-text-primary)]">
                  {CROSS_NAMES[stats!.id]?.[lan(locale)] ?? stats!.id}
                </span>
                <bdi dir="ltr" className="type-label font-bold tabular-nums text-[var(--color-text-primary)]">
                  {fmt.num(stats!.last, dec)}
                </bdi>
                {/* the 30-day delta + the band: the delta's own icon and
                    number are ONE unbreakable unit (the batch-I catch —
                    the pair had been wrapping apart on narrow screens);
                    the band breaks only between its own words, never
                    inside the delta */}
                <span className="flex min-w-0 flex-wrap items-baseline justify-end gap-x-2 gap-y-0.5 type-caption text-[var(--color-text-tertiary)]">
                  <SignedDelta v={stats!.change30d} fmt={fmt} />
                  {band !== null ? (
                    <span className="flex flex-col items-end text-end leading-tight">
                      <span>{band}</span>
                      <span className="text-[10.5px]">{t.positionTail}</span>
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
          {/* the Iranian toman — the same row, the same surface, the
              site's own live basis (free-market dollar × the global
              ounce); live-only, so its third column carries the live
              tag instead of a stored 30-day window */}
          {tomanPerOunce !== null && Number.isFinite(tomanPerOunce) && tomanPerOunce > 0 ? (
            <div
              className="grid grid-cols-[minmax(84px,auto)_1fr_auto] items-baseline gap-x-3 gap-y-1 rounded-[var(--cr-radius-sm)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]"
              aria-label={t.tomanName}
              title={t.tomanNote}
            >
              <span className="type-caption font-bold text-[var(--color-text-primary)]">{t.tomanName}</span>
              <bdi dir="ltr" className="type-label font-bold tabular-nums text-[var(--color-text-primary)]">
                {/* the honest unit (the owner's batch-H catch): an ounce
                    over a billion toman reads in BILLIONS, never as
                    "1008 million" — the scale mistake is a unit mistake */}
                {tomanPerOunce >= 1_000_000_000
                  ? `${fmt.num(tomanPerOunce / 1_000_000_000, 2)} ${t.tomanBillion}`
                  : `${fmt.num(tomanPerOunce / 1_000_000, 1)} ${t.tomanMillion}`}
              </bdi>
              <span className="inline-flex items-center gap-1 type-caption text-[var(--color-text-tertiary)]">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-currena-success)]" aria-hidden="true" />
                {t.tomanLive}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The forecast-accuracy retrospective (the collapsed companion)
 * ------------------------------------------------------------------ */

export function ForecastRetroCard({ t, fmt, locale }: { t: FrT; fmt: Fmt; locale: Locale }) {
  const [open, setOpen] = React.useState(false);
  const retro = React.useMemo(() => forecastRetrospective(), []);
  const signed = (v: number): string => {
    const num = fmt.num(Math.abs(v), 1);
    return `${v > 0 ? "+" : v < 0 ? "−" : ""}${num}%`;
  };
  const y2025 = retro.scored.find((r) => r.year === 2025);
  return (
    <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{t.title}</h4>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 type-caption font-bold text-[var(--color-currena-blue-deep)]"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`} aria-hidden="true" />
          {open ? (locale === "en" ? "hide the 17-row record" : "بستن رکورد ۱۷ ردیفی") : locale === "en" ? "the 17-row record" : "رکورد ۱۷ ردیفی"}
        </button>
      </div>
      <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>
          {t.subtitle
            .replace("{under}", fmt.num(retro.underForecast.length, 0))
            .replace("{n}", fmt.num(retro.n, 0))
            .replace("{abs}", `${fmt.num(retro.meanAbsMissPct, 1)}%`)}
        </bdi>
      </p>

      {/* the percentages list, IN THE OPEN (batch L, task 9 — the
          owner's ask): the last five scored years' misses + the
          pending 2026, one chip each — the year and its error, the
          same numbers the full table carries, no tap needed */}
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-1 type-caption font-semibold">
        <span className="text-[var(--color-text-tertiary)]">{t.missListLabel}</span>
        {retro.scored.slice(-5).map((r) => (
          <span key={r.year} className="inline-flex items-baseline gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 ring-1 ring-[var(--color-border)]/60">
            <span className="text-[var(--color-text-primary)]">{locale === "fa" ? fmt.num(r.year, 0) : String(r.year)}</span>
            <bdi dir="ltr" className={`tabular-nums ${r.missPct < 0 ? "text-[var(--color-currena-success)]" : "text-[var(--color-status-alert)]"}`}>
              {signed(r.missPct)}
            </bdi>
          </span>
        ))}
        {retro.pending ? (
          <span className="inline-flex items-baseline gap-1 rounded-full bg-[var(--color-surface)] px-2 py-0.5 ring-1 ring-[var(--color-border)]/60">
            <span className="text-[var(--color-text-primary)]">{locale === "fa" ? fmt.num(retro.pending.year, 0) : String(retro.pending.year)}</span>
            <span className="italic text-[var(--color-text-tertiary)]">{t.pendingCell}</span>
          </span>
        ) : null}
      </p>

      {/* the verdict, IN THE OPEN: the aggregate headline, the 2025
          record miss, and how the specialists called 2026 so far */}
      <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>
          {t.headline
            .replace("{under}", fmt.num(retro.underForecast.length, 0))
            .replace("{n}", fmt.num(retro.n, 0))
            .replace("{mean}", `${signed(retro.meanMissPct)}`)
            .replace("{abs}", `${fmt.num(retro.meanAbsMissPct, 1)}%`)}
        </bdi>
      </p>
      {y2025 ? (
        <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">
          <bdi>
            {t.y2025Line
              .replace("{miss}", signed(y2025.missPct))
              .replace("{forecast}", fmt.num(y2025.forecast, 0))
              .replace("{actual}", fmt.num(y2025.actual, 1))}
          </bdi>
        </p>
      ) : null}
      {retro.pending ? (
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
          <bdi>
            {t.pendingLine
              .replace("{forecast}", fmt.num(retro.pending.forecast, 2))
              .replace("{revision}", fmt.num(LBMA_2026_MIDYEAR_REVISION, 0))}
          </bdi>
        </p>
      ) : null}
      {open ? (
        <div className="mt-1 flex flex-col gap-2">
          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            <bdi>{t.pairNote}</bdi>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse type-caption">
              <thead>
                <tr className="text-[var(--color-text-tertiary)]">
                  <th scope="col" className="px-1 py-1 text-start font-bold">{t.colYear}</th>
                  <th scope="col" className="px-1 py-1 text-end font-bold">{t.colForecast}</th>
                  <th scope="col" className="px-1 py-1 text-end font-bold">{t.colActual}</th>
                  <th scope="col" className="px-1 py-1 text-end font-bold">{t.colMiss}</th>
                </tr>
              </thead>
              <tbody>
                {retro.scored.map((r) => (
                  <tr key={r.year} className="border-t border-[var(--color-border)]">
                    <td className="px-1 py-1 font-bold text-[var(--color-text-primary)]">
                      <bdi>{locale === "fa" ? fmt.num(r.year, 0) : String(r.year)}</bdi>
                    </td>
                    <td className="px-1 py-1 text-end tabular-nums text-[var(--color-text-secondary)]">
                      <bdi dir="ltr">{fmt.num(r.forecast, r.forecast % 1 === 0 ? 0 : 2)}</bdi>
                    </td>
                    <td className="px-1 py-1 text-end tabular-nums text-[var(--color-text-secondary)]">
                      <bdi dir="ltr">{fmt.num(r.actual, r.actual % 1 === 0 ? 0 : 2)}</bdi>
                    </td>
                    <td className={`px-1 py-1 text-end font-bold tabular-nums ${r.missPct < 0 ? "text-[var(--color-currena-success)]" : "text-[var(--color-status-alert)]"}`}>
                      <bdi dir="ltr">{signed(r.missPct)}</bdi>
                    </td>
                  </tr>
                ))}
                {retro.pending ? (
                  <tr key="pending" className="border-t border-[var(--color-border)]">
                    <td className="px-1 py-1 font-bold text-[var(--color-text-primary)]">
                      <bdi>{locale === "fa" ? fmt.num(retro.pending.year, 0) : String(retro.pending.year)}</bdi>
                    </td>
                    <td className="px-1 py-1 text-end tabular-nums text-[var(--color-text-secondary)]">
                      <bdi dir="ltr">{fmt.num(retro.pending.forecast, 2)}</bdi>
                    </td>
                    <td className="px-1 py-1 text-end italic text-[var(--color-text-tertiary)]">{t.pendingCell}</td>
                    <td className="px-1 py-1 text-end italic text-[var(--color-text-tertiary)]">·</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.missConvention}</p>
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
            {t.sourceLine.replace("{date}", fmt.dateWords(LBMA_FORECAST_EXTRACTED_AT))}{" "}
            <a
              href={LBMA_FORECAST_SOURCE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[var(--color-currena-blue-deep)] underline-offset-2 hover:underline"
            >
              {locale === "en" ? "LBMA's survey pages" : "صفحه‌های نظرسنجی LBMA"}
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The band
 * ------------------------------------------------------------------ */

export function ContextCardsBand({
  projection,
  crosses,
  usdChange30d,
  copy,
  fmt,
  locale,
}: {
  projection: ProjectionPayload | null;
  crosses: CrossesPayload | null;
  usdChange30d: number | null;
  copy: ContextBandCopy;
  fmt: Fmt;
  locale: Locale;
}) {
  const byId = React.useMemo(() => {
    const m = new Map<string, ProjectionReading>();
    if (projection !== null) {
      for (const r of projection.readings) m.set(r.id, r);
    }
    return m;
  }, [projection]);

  const t = copy.cc;

  return (
    <section id="gold-context" className="gold-anchor-mt mt-3 flex flex-col gap-3.5 rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div>
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{copy.eyebrow}</h2>
        <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{copy.title}</h3>
        <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{copy.subtitle}</p>
      </div>

      {projection === null ? (
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.unavailable}</p>
      ) : (
        <>
          {/* The ratios — one compact table (the tiny table the owner asked for). */}
          <section className="flex min-w-0 flex-col gap-2">
            <ContextTable
              rows={RATIO_IDS.map((c) => ({ id: c.id, name: c.name, meaning: t[c.meaning] as string, unit: c.unit }))}
              byId={byId}
              t={t}
              fmt={fmt}
              locale={locale}
            />
            {/* The five-currency grid — the ratios group's compact sub-card. */}
            <CurrencyGridCard crosses={crosses} usdChange30d={usdChange30d} tomanPerOunce={null} t={copy.grid} fmt={fmt} locale={locale} />
          </section>

          {/* The physical trio — «بازار فیزیکی» in the same dense shape. */}
          <section className="flex min-w-0 flex-col gap-2">
            <h4 className="m-0 type-label font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{t.physicalHeader}</h4>
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.physicalLine}</p>
            <ContextTable
              rows={PHYSICAL_IDS.map((c) => ({ id: c.id, name: c.name, meaning: t[c.meaning] as string, unit: c.unit }))}
              byId={byId}
              t={t}
              fmt={fmt}
              locale={locale}
            />
          </section>
        </>
      )}

      {/* The forecast-accuracy retrospective — the honest-record companion. */}
      <ForecastRetroCard t={copy.fr} fmt={fmt} locale={locale} />
    </section>
  );
}
