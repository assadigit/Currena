"use client";

/**
 * The record sections — the parts of the previous gold page (the
 * upstream Currena site) that the visualized rebuild had dropped:
 * the technical-analysis reference levels, the central-bank demand
 * tracker, the London vault + clearing riders, the gold/yield
 * correlation companion, the CFTC positioning cards, the market
 * expectations strip, the live Iran-premium history, and the
 * relationship map.
 *
 * Each section serves from the desk's own API routes (the server-side
 * proxies over the still-live currena-api legs — see
 * src/app/api/gold/*) and renders fail-closed: a leg that did not
 * arrive renders its honest unavailable line, never a guess. All on
 * Currena's own tokens, bilingual EN + fa/RTL, display-only — nothing
 * here joins the 37-voter balance.
 */

import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { GOLD_RELATIONSHIPS } from "@/lib/gold-page/relationships";
import { deskBasePath } from "@/lib/utils";
import { type Fmt } from "@/components/gold-page/visuals";
import type { IfBoughtSnapshot } from "@/lib/gold-page/ifbought";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/* ------------------------------------------------------------------ *
 * The payloads (from the desk's own /api/gold/* routes)
 * ------------------------------------------------------------------ */

export interface TaPayload {
  asOf: string;
  span: { from: string; to: string; bars: number };
  sma: Array<{ window: number; date: string; value: number }>;
  distance: {
    pct: number;
    sma200: number;
    date: string;
    decile: number | null;
    basis: { from: string; to: string; points: number } | null;
  } | null;
  crosses: Array<{ date: string; kind: "golden" | "death"; followedBy20d: number | null }>;
  dailyPivots: {
    date: string; high: number; low: number; close: number;
    pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number;
  } | null;
  weeklyPivots: {
    date: string; high: number; low: number; close: number;
    pp: number; r1: number; r2: number; r3: number; s1: number; s2: number; s3: number;
  } | null;
  last: { date: string; close: number };
}

export interface CbBuyer {
  code: string;
  tonnes: number;
  latestMonth: string;
  latestDelta: number;
  sum12m: number;
  goldUsd?: number;
  totalUsd?: number;
  valuePeriod?: string;
}

export interface CbPayload {
  asOf: string;
  fetchedAt?: string;
  series: Array<{ month: string; tonnes: number }>;
  buyers: CbBuyer[];
  reportedWorld: { tonnes: number; reporters: number; month: string };
}

export interface LbmaPayload {
  vault: { asOf: string; goldTonnes: number; silverTonnes: number | null; momPct: number | null; months: Array<{ month: string; goldKoz: number }> };
  clearing: { asOf: string; goldMoz: number; goldValueBn: number | null; goldTransfers: number | null };
}

export interface PremiumPayload {
  asOf: string;
  series: Array<{ date: string; premiumPct: number | null; ounceUsd: number | null; dollarToman: number | null }>;
  latest: {
    date: string;
    ounceUsd: number | null;
    dollarToman: number | null;
    tomanPerOunce: number | null;
    coins: Array<{ id: string; premiumPct: number | null }>;
  };
}

export interface PositionsPayload {
  cards: Array<{ id: string; value: number; change30d: number | null }>;
}

export interface ExpectationsPayload {
  fetchedAt: string | null;
  event: { slug?: string; title?: string; endDate?: string; url?: string } | null;
  markets: Array<{ move: string; question: string; probPct: number | null }>;
  calendar: Array<{ id: string; date: string; titleEn: string; titleFa: string; kind: string }>;
}

export interface CorrelationPayload {
  daily: Array<[string, number, number]>;
  strip: Array<{ friday: string; r: number }>;
  span: { from: string; to: string; days: number; weeks: number };
  rotation: { date: string; inWindow: boolean };
  stale: boolean;
}

/* ------------------------------------------------------------------ *
 * The fetchers (one per leg; fail-closed — a failed leg renders its
 * honest unavailable line, never a spinner forever, never a guess)
 * ------------------------------------------------------------------ */

async function leg<T>(path: string): Promise<T> {
  const res = await fetch(`${deskBasePath}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} responded with ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchTa = () => leg<TaPayload>("/api/gold/ta");
export const fetchCb = () => leg<CbPayload>("/api/gold/cb");
export const fetchLbma = () => leg<LbmaPayload>("/api/gold/lbma");
export const fetchPremium = () => leg<PremiumPayload>("/api/gold/premium");
export const fetchPositions = () => leg<PositionsPayload>("/api/gold/positions");
export const fetchExpectations = () => leg<ExpectationsPayload>("/api/gold/expectations");
export const fetchCorrelation = () => leg<CorrelationPayload>("/api/gold/correlation");
export const fetchIfBought = () => leg<IfBoughtSnapshot>("/api/gold/ifbought");

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** The month label ("2026-10" → "Oct 2026" / the fa short form). */
function monthLabel(month: string, locale: Locale): string {
  try {
    return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB", {
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${month}-01T00:00:00Z`));
  } catch {
    return month;
  }
}

/** The CB buyers' country names (the IMF codes the cast can print). */
const CB_COUNTRIES: Record<string, [string, string]> = {
  POL: ["Poland", "لهستان"],
  CHN: ["China", "چین"],
  UZB: ["Uzbekistan", "ازبکستان"],
  KAZ: ["Kazakhstan", "قزاقستان"],
  CZE: ["Czechia", "چک"],
  BRA: ["Brazil", "برزیل"],
  MYS: ["Malaysia", "مالزی"],
  JOR: ["Jordan", "اردن"],
  AUS: ["Australia", "استرالیا"],
  KGZ: ["Kyrgyz Republic", "قرقیزستان"],
  SRB: ["Serbia", "صربستان"],
  KHM: ["Cambodia", "کامبوج"],
  IDN: ["Indonesia", "اندونزی"],
  EZB: ["Azerbaijan", "جمهوری آذربایجان"],
  GEO: ["Georgia", "گرجستان"],
  GTM: ["Guatemala", "گواتمالا"],
  PHL: ["Philippines", "فیلیپین"],
  EGY: ["Egypt", "مصر"],
  IRQ: ["Iraq", "عراق"],
  IND: ["India", "هند"],
  TUR: ["Türkiye", "ترکیه"],
  QAT: ["Qatar", "قطر"],
  RUS: ["Russia", "روسیه"],
  ARE: ["United Arab Emirates", "امارات"],
  ARM: ["Armenia", "ارمنستان"],
  SGP: ["Singapore", "سنگاپور"],
  IRL: ["Ireland", "ایرلند"],
};

/** The dated CB episodes (the data-true set from the upstream record). */
const CB_EPISODES: ReadonlyArray<{ month: string; label: [string, string] }> = [
  { month: "2009-06", label: ["GFC wave", "موجِ بحران مالی"] },
  { month: "2015-07", label: ["China catch-up", "جبرانِ چین"] },
  { month: "2022-03", label: ["the rotation", "چرخش"] },
];

/* The copy blocks ride their own shapes (typed at the call site through
 * content.ts); the record sections read them as string-keyed copy. */
type AnyT = { [key: string]: any };

/* ------------------------------------------------------------------ *
 * The TA band — reference levels (Zone H: between the seats and the
 * ratios; every level a descriptive reference, tables one tap away on
 * phones, expanded on desktop)
 * ------------------------------------------------------------------ */

export function TaBand({ data, t, fmt, locale }: { data: TaPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  const [open, setOpen] = React.useState(true);
  const dist = data.distance;
  const basisSpanDays = data.span.bars > 335
    ? t.spanYears.replace("{years}", fmt.num(Math.round((data.span.bars / 250) * 10) / 10, 1))
    : t.spanMonths.replace("{n}", fmt.num(Math.max(1, Math.round(data.span.bars / 20)), 0));
  const distSentence = dist
    ? (dist.decile !== null && dist.basis !== null
        ? String(t.distanceDecile)
            .replace("{pct}", fmt.pct(dist.pct, 1))
            .replace("{dir}", dist.pct >= 0 ? t.distanceAbove : t.distanceBelow)
            .replace("{decile}", fmt.num(dist.decile * 100, 0))
            .replace("{window}", basisSpanDays)
        : String(t.distanceNoDecile)
            .replace("{pct}", fmt.pct(dist.pct, 1))
            .replace("{dir}", dist.pct >= 0 ? t.distanceAbove : t.distanceBelow))
    : null;
  return (
    <section id="gold-ta" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          {open ? t.hideLabel : t.showLabel}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
      </div>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {distSentence ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2 type-label font-semibold text-[var(--color-text-primary)]">
          <bdi>{distSentence}</bdi>
        </p>
      ) : null}

      {open ? (
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {/* the four standard moving averages */}
          <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.smaTitle}</h4>
            {data.sma.length === 0 ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.smaNone}</p>
            ) : (
              <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1">
                {data.sma.map((row) => (
                  <div key={row.window} className="flex items-baseline justify-between gap-2 rounded-md px-2 py-1">
                    <dt className="type-caption font-semibold text-[var(--color-text-secondary)]">{t.smaRow.replace("{n}", fmt.num(row.window, 0))}</dt>
                    <dd className="type-label font-bold text-[var(--color-text-primary)]">
                      <bdi dir="ltr">${fmt.num(row.value, 0)}</bdi>
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </div>

          {/* the dated 50/200 crosses */}
          <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.crossTitle}</h4>
            {data.crosses.length === 0 ? (
              <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.crossNone}</p>
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {data.crosses.map((c) => (
                  <li key={c.date} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1">
                    <span className="type-caption font-bold text-[var(--color-accent-gold-deep)]">{fmt.dateWords(c.date)}</span>
                    <span className={`type-caption font-bold ${c.kind === "golden" ? "text-[var(--color-chip-ink-attention)]" : "text-[var(--color-text-secondary)]"}`}>
                      {c.kind === "golden" ? t.crossGolden : t.crossDeath}
                    </span>
                    <span className="ms-auto type-caption text-[var(--color-text-tertiary)]">
                      {c.followedBy20d === null
                        ? `(${t.crossTruncated})`
                        : t.crossFollow.replace("{v}", fmt.pct(c.followedBy20d, 1))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* the classic pivots */}
          {[data.dailyPivots, data.weeklyPivots].map((pv, i) => (
            <div key={i} className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">
                {i === 0 ? t.pivotsDailyTitle : t.pivotsWeeklyTitle}
              </h4>
              {pv === null ? (
                <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.pivotNone}</p>
              ) : (
                <>
                  <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.pivotFrom.replace("{date}", fmt.dateWords(pv.date))}</p>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {[["R3", pv.r3], ["R2", pv.r2], ["R1", pv.r1], ["P", pv.pp], ["S1", pv.s1], ["S2", pv.s2], ["S3", pv.s3]].map(([k, v]) => (
                      <div key={k as string} className="flex items-baseline justify-between gap-2 rounded-md px-2 py-0.5">
                        <span className="type-caption font-bold text-[var(--color-text-tertiary)]">
                          {String(k).startsWith("R") ? t.pivotResistance : String(k).startsWith("S") ? t.pivotSupport : "P"} {k as string}
                        </span>
                        <span className="type-caption font-bold text-[var(--color-text-primary)]">
                          <bdi dir="ltr">${fmt.num(v as number, 0)}</bdi>
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : null}

      <p className="m-0 mt-2 type-caption italic text-[var(--color-text-tertiary)]">{t.descriptive}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The central-bank demand band — the tracker chart + the buyers table
 * ------------------------------------------------------------------ */

function buildCbModel(series: ReadonlyArray<{ month: string; tonnes: number }>) {
  const width = 640;
  const height = 190;
  const padL = 8;
  const padR = 62;
  const padT = 26;
  const padB = 18;
  const monthIndex = (m: string) => (Number(m.slice(0, 4)) - 2000) * 12 + Number(m.slice(5, 7));
  const first = monthIndex(series[0]!.month);
  const last = monthIndex(series[series.length - 1]!.month);
  const values = series.map((p) => p.tonnes);
  const rawMin = Math.min(...values, 0);
  const rawMax = Math.max(...values);
  const yMin = rawMin - (rawMax - rawMin) * 0.08;
  const yMax = rawMax + (rawMax - rawMin) * 0.14;
  const xOf = (m: string) => padL + ((monthIndex(m) - first) / Math.max(1, last - first)) * (width - padL - padR);
  const yOf = (v: number) => padT + (1 - (v - yMin) / (yMax - yMin)) * (height - padT - padB);
  const points = series.map((p) => ({ x: xOf(p.month), y: yOf(p.tonnes), month: p.month, tonnes: p.tonnes }));
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const yZero = yOf(0);
  const firstP = points[0]!;
  const lastP = points[points.length - 1]!;
  const areaPath = `${path} L${lastP.x.toFixed(1)},${yZero.toFixed(1)} L${firstP.x.toFixed(1)},${yZero.toFixed(1)} Z`;
  return { width, height, path, areaPath, points, yZero, xOf };
}

/** The S12-D1 share: gold at the live price over total reserves with
 * gold re-valued at the same price; fail-closed on missing inputs and
 * stale value vintages (> 6 quarters behind the data month). */
function buyerSharePct(buyer: CbBuyer, goldPriceUsd: number | null, asOf: string): number | null {
  if (goldPriceUsd === null || goldPriceUsd <= 0) return null;
  if (buyer.goldUsd === undefined || buyer.totalUsd === undefined || buyer.valuePeriod === undefined) return null;
  const [vy, vq] = [Number(buyer.valuePeriod.slice(0, 4)), Number(buyer.valuePeriod.slice(6, 7))];
  const [ay, am] = [Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7))];
  const valueQuarterEnd = vy * 4 + vq;
  const dataQuarter = ay * 4 + Math.ceil(am / 3);
  if (Number.isNaN(valueQuarterEnd) || Number.isNaN(dataQuarter)) return null;
  if (dataQuarter - valueQuarterEnd > 6) return null;
  if (buyer.totalUsd <= buyer.goldUsd) return null;
  const ozt = (buyer.tonnes * 1e6) / 31.1034768;
  const goldAtMarket = ozt * goldPriceUsd;
  const denominator = buyer.totalUsd - buyer.goldUsd + goldAtMarket;
  if (denominator <= 0) return null;
  return (goldAtMarket / denominator) * 100;
}

export function CentralBanksBand({ data, t, fmt, locale, spot }: { data: CbPayload; t: AnyT; fmt: Fmt; locale: Locale; spot: number | null }) {
  const model = React.useMemo(() => buildCbModel(data.series), [data.series]);
  const last = data.series[data.series.length - 1]!;
  const num = (n: number) => fmt.num(n, 0);
  return (
    <section id="gold-cb" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the tracker chart */}
      <figure className="m-0 mt-3 flex min-w-0 flex-col gap-1">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
          <span className="type-label font-bold text-[var(--color-text-primary)]">{t.chartTitle}</span>
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.chartReportedWorld}</span>
        </figcaption>
        <div dir="ltr" className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${model.width} ${model.height}`} role="img" aria-label={`${t.chartTitle} — ${t.chartReportedWorld}`} className="h-auto w-full">
            <line x1={4} y1={model.yZero} x2={model.width - 56} y2={model.yZero} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 4" />
            <text x={model.width - 54} y={model.yZero + 3.5} fontSize={10} fill="var(--color-text-tertiary)">0</text>
            <path d={model.areaPath} fill="var(--color-accent-gold)" opacity={0.13} />
            <path d={model.path} fill="none" stroke="var(--color-accent-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {CB_EPISODES.map((ep, i) => {
              const x = model.xOf(ep.month);
              if (x <= 4 || x >= model.width - 56) return null;
              const y = i % 2 === 0 ? 10 : 22;
              return (
                <g key={ep.month}>
                  <line x1={x} y1={y + 3} x2={x} y2={model.height - 12} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.5} />
                  <text x={x + 3} y={y} fontSize={9.5} fill="var(--color-text-tertiary)">{ep.label[lan(locale)]}</text>
                </g>
              );
            })}
            <circle cx={model.points[model.points.length - 1]!.x} cy={model.points[model.points.length - 1]!.y} r={3.2} fill="var(--color-accent-gold)" stroke="var(--color-surface)" strokeWidth={1.2} />
            <text
              x={Math.min(model.points[model.points.length - 1]!.x + 6, model.width - 52)}
              y={model.points[model.points.length - 1]!.y + 3.5}
              fontSize={11}
              fontWeight={700}
              fill="var(--color-text-primary)"
            >
              {num(last.tonnes)}
            </text>
            <text x={4} y={model.height - 4} fontSize={10} fill="var(--color-text-tertiary)">{data.series[0]!.month.slice(0, 4)}</text>
            <text x={model.width - 56} y={model.height - 4} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="end">{last.month.slice(0, 4)}</text>
          </svg>
        </div>
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
          <bdi>{t.asOf.replace("{month}", monthLabel(data.asOf, locale))}</bdi>
          <span aria-hidden="true"> · </span>
          <span>{t.chartUnit}</span>
        </p>
      </figure>

      {/* the buyers table */}
      <div className="mt-3 flex min-w-0 flex-col gap-1.5">
        <h4 className="m-0 type-label font-bold text-[var(--color-text-secondary)]">{t.buyersTitle}</h4>
        <table className="m-0 hidden w-full border-collapse type-caption sm:table">
          <thead>
            <tr className="text-[var(--color-text-tertiary)]">
              <th scope="col" className="px-1.5 py-1 text-start font-semibold">{t.buyersHeadCountry}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadLatest}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHead12m}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadHoldings}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadShare}</th>
            </tr>
          </thead>
          <tbody>
            {data.buyers.map((b) => {
              const name = CB_COUNTRIES[b.code]?.[lan(locale)] ?? b.code;
              const share = buyerSharePct(b, spot, data.asOf);
              return (
                <tr key={b.code}>
                  <th scope="row" className="px-1.5 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">{name}</th>
                  <td className="px-1.5 py-1.5 text-end text-[var(--color-text-secondary)]">
                    <span>{monthLabel(b.latestMonth, locale)}</span>{" "}
                    <span className={b.latestDelta >= 0 ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}>
                      {b.latestDelta >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.latestDelta), 1)}
                    </span>
                  </td>
                  <td className="px-1.5 py-1.5 text-end font-bold text-[var(--color-text-primary)]">
                    {b.sum12m >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.sum12m), 1)}
                  </td>
                  <td className="px-1.5 py-1.5 text-end text-[var(--color-text-secondary)]">{fmt.num(b.tonnes, 0)}</td>
                  <td className="px-1.5 py-1.5 text-end font-semibold text-[var(--color-text-secondary)]">
                    {share !== null ? `${fmt.num(share, 1)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {/* the mobile stacked rows */}
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0 sm:hidden">
          {data.buyers.slice(0, 5).map((b) => {
            const name = CB_COUNTRIES[b.code]?.[lan(locale)] ?? b.code;
            return (
              <li key={b.code} className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]">
                <div className="flex min-w-0 items-baseline justify-between gap-2.5">
                  <span className="type-label font-bold text-[var(--color-text-primary)]">{name}</span>
                  <span className="type-caption font-bold text-[var(--color-text-secondary)]">
                    {b.sum12m >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.sum12m), 1)}
                  </span>
                </div>
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 type-caption text-[var(--color-text-tertiary)]">
                  <span>{t.tonnesShort.replace("{v}", fmt.num(b.tonnes, 0))}</span>
                  <span aria-hidden="true"> · </span>
                  <span>{monthLabel(b.latestMonth, locale)} {b.latestDelta >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.latestDelta), 1)}</span>
                </p>
              </li>
            );
          })}
        </ul>
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.shareNote}</p>
      </div>

      {/* the honest exceptions */}
      <p className="m-0 mt-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 type-caption font-semibold leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t.caveat}</bdi>
      </p>
      <p className="m-0 mt-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t.reportedWorldLine.replace("{tonnes}", num(data.reportedWorld.tonnes)).replace("{n}", num(data.reportedWorld.reporters))}</bdi>
      </p>
      <details className="mt-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <summary className="cursor-pointer font-semibold text-[var(--color-currena-blue-deep)]">{t.methodTitle}</summary>
        <div className="flex flex-col gap-1 pt-1.5">
          <p className="m-0">{t.methodLine}</p>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t.revisionNote}</p>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t.chinaNote}</p>
          <p className="m-0 text-[var(--color-text-tertiary)]">{t.sourceLabel}</p>
        </div>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The London vault + clearing band
 * ------------------------------------------------------------------ */

function vaultSparkPath(rows: ReadonlyArray<{ month: string; goldKoz: number }>): string {
  if (rows.length < 2) return "";
  const values = rows.map((r) => r.goldKoz);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const w = 200;
  const h = 34;
  return rows
    .map((r, i) => {
      const x = (i / (rows.length - 1)) * w;
      const y = h - 3 - ((r.goldKoz - min) / span) * (h - 6);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function VaultBand({ data, t, fmt, locale }: { data: LbmaPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  return (
    <section id="gold-vault" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
          <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.vaultTitle}</h4>
          <p className="m-0 type-label font-semibold text-[var(--color-text-secondary)]">
            <bdi>{t.vaultTopline.replace("{tonnes}", fmt.num(data.vault.goldTonnes, 0))}</bdi>
            <span aria-hidden="true"> · </span>
            <span className="text-[var(--color-text-tertiary)]">{t.asOf.replace("{month}", monthLabel(data.vault.asOf, locale))}</span>
          </p>
          {data.vault.momPct !== null ? (
            <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">
              <bdi>{t.vaultMom.replace("{pct}", fmt.pct(data.vault.momPct, 2))}</bdi>
            </p>
          ) : null}
          <div dir="ltr" className="w-full overflow-hidden">
            <svg viewBox="0 0 200 34" role="img" aria-label={`${t.vaultTopline} — ${monthLabel(data.vault.asOf, locale)}`} className="h-auto w-full">
              <path d={vaultSparkPath(data.vault.months)} fill="none" stroke="var(--color-accent-gold)" strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
          {data.vault.silverTonnes !== null ? (
            <p className="m-0 type-caption text-[var(--color-text-tertiary)]">
              <bdi>{t.vaultSilver.replace("{tonnes}", fmt.num(data.vault.silverTonnes, 0))}</bdi>
            </p>
          ) : null}
          <details className="type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            <summary className="cursor-pointer font-semibold text-[var(--color-currena-blue-deep)]">{t.methodTitle}</summary>
            <p className="m-0 pt-1.5">{t.methodVault}</p>
          </details>
        </div>
        <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
          <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.clearingTitle}</h4>
          <p className="m-0 type-label font-semibold text-[var(--color-text-secondary)]">
            <bdi>{t.clearingTopline.replace("{moz}", fmt.num(data.clearing.goldMoz, 1)).replace("{month}", monthLabel(data.clearing.asOf, locale))}</bdi>
          </p>
          {data.clearing.goldValueBn !== null && data.clearing.goldTransfers !== null ? (
            <p className="m-0 type-caption font-semibold text-[var(--color-text-secondary)]">
              <bdi>{t.clearingRow.replace("{moz}", fmt.num(data.clearing.goldMoz, 1)).replace("{bn}", fmt.num(data.clearing.goldValueBn, 1)).replace("{transfers}", fmt.num(data.clearing.goldTransfers, 0))}</bdi>
            </p>
          ) : null}
          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
            <bdi>{t.clearingContext}</bdi>
          </p>
          <details className="type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            <summary className="cursor-pointer font-semibold text-[var(--color-currena-blue-deep)]">{t.methodTitle}</summary>
            <p className="m-0 pt-1.5">{t.methodClearing}</p>
          </details>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The correlation companion — the dual-axis chart + the rolling strip
 * ------------------------------------------------------------------ */

const CORR_W = 640;
const CORR_H = 210;
const CORR_STRIP_H = 96;

export function CorrelationBand({ data, t, fmt, locale }: { data: CorrelationPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  const model = React.useMemo(() => {
    const golds = data.daily.map((p) => p[1]!);
    const yields = data.daily.map((p) => p[2]!);
    const gMin = Math.min(...golds);
    const gMax = Math.max(...golds);
    const yMin = Math.min(...yields);
    const yMax = Math.max(...yields);
    const padL = 8;
    const padR = 56;
    const padT = 24;
    const padB = 20;
    const xOf = (i: number) => padL + (i / Math.max(1, data.daily.length - 1)) * (CORR_W - padL - padR);
    const yGold = (v: number) => padT + (1 - (v - gMin) / Math.max(1e-9, gMax - gMin)) * (CORR_H - padT - padB);
    const yYield = (v: number) => padT + (1 - (v - yMin) / Math.max(1e-9, yMax - yMin)) * (CORR_H - padT - padB);
    const goldPath = data.daily.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yGold(p[1]!).toFixed(1)}`).join(" ");
    const yieldPath = data.daily.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yYield(p[2]!).toFixed(1)}`).join(" ");
    // the strip: r on [-1, 1]
    const sxOf = (i: number) => padL + (i / Math.max(1, data.strip.length - 1)) * (CORR_W - padL - padR);
    const syR = (r: number) => 10 + (1 - (r + 1) / 2) * (CORR_STRIP_H - 24);
    const stripPath = data.strip.map((p, i) => `${i === 0 ? "M" : "L"}${sxOf(i).toFixed(1)},${syR(p.r).toFixed(1)}`).join(" ");
    const yZeroStrip = syR(0);
    return { goldPath, yieldPath, stripPath, sxOf, syR, yZeroStrip, gMin, gMax, yMin, yMax, xOf };
  }, [data]);
  const spanText = `${fmt.dateWords(data.span.from)} → ${fmt.dateWords(data.span.to)}`;
  return (
    <section id="gold-correlation" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {/* the dual-axis chart (gold left, real yield right — NOT inverted) */}
      <figure className="m-0 mt-3 flex min-w-0 flex-col gap-1">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
          <span className="type-label font-bold text-[var(--color-text-primary)]">{t.goldAxis}</span>
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.yieldAxis}</span>
        </figcaption>
        <div dir="ltr" className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${CORR_W} ${CORR_H}`} role="img" aria-label={`${t.title} — ${t.goldAxis} / ${t.yieldAxis}`} className="h-auto w-full">
            <path d={model.goldPath} fill="none" stroke="var(--color-accent-gold)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <path d={model.yieldPath} fill="none" stroke="var(--color-text-secondary)" strokeWidth={1.6} strokeDasharray="1 0" strokeLinejoin="round" strokeLinecap="round" />
            {data.rotation.inWindow ? (
              (() => {
                const idx = data.daily.findIndex((p) => p[0]! >= data.rotation.date);
                if (idx < 0) return null;
                const x = model.xOf(idx);
                return (
                  <g>
                    <line x1={x} y1={6} x2={x} y2={CORR_H - 12} stroke="var(--color-text-tertiary)" strokeWidth={1} opacity={0.6} strokeDasharray="2 3" />
                    <text x={x + 3} y={11} fontSize={9.5} fill="var(--color-text-tertiary)">{t.rotationLabel}</text>
                  </g>
                );
              })()
            ) : null}
            <text x={4} y={CORR_H - 4} fontSize={10} fill="var(--color-text-tertiary)">{data.daily[0]![0]!.slice(0, 4)}</text>
            <text x={CORR_W - 56} y={CORR_H - 4} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="end">{data.daily[data.daily.length - 1]![0]!.slice(0, 4)}</text>
          </svg>
        </div>
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.spanLine.replace("{span}", spanText)}</p>
      </figure>

      {/* the 52-week rolling strip */}
      {data.strip.length > 0 ? (
        <figure className="m-0 mt-2.5 flex min-w-0 flex-col gap-1">
          <figcaption className="type-label font-bold text-[var(--color-text-primary)]">{t.stripTitle}</figcaption>
          <div dir="ltr" className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${CORR_W} ${CORR_STRIP_H}`} role="img" aria-label={t.stripTitle} className="h-auto w-full">
              <rect x={8} y={model.syR(1)} width={CORR_W - 64} height={Math.max(0, model.syR(-1) - model.syR(1))} fill="var(--color-currena-bg-light)" />
              <line x1={8} y1={model.yZeroStrip} x2={CORR_W - 56} y2={model.yZeroStrip} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 4" />
              <text x={CORR_W - 54} y={model.yZeroStrip + 3.5} fontSize={10} fill="var(--color-text-tertiary)">0</text>
              <text x={CORR_W - 54} y={model.syR(1) + 8} fontSize={10} fill="var(--color-text-tertiary)">+1</text>
              <text x={CORR_W - 54} y={model.syR(-1)} fontSize={10} fill="var(--color-text-tertiary)">−1</text>
              <path d={model.stripPath} fill="none" stroke="var(--color-currena-blue)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </svg>
          </div>
        </figure>
      ) : null}

      <p className="m-0 mt-2 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <bdi>{t.rotationLine}</bdi>
      </p>
      <details className="mt-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <summary className="cursor-pointer font-semibold text-[var(--color-currena-blue-deep)]">{t.methodTitle}</summary>
        <p className="m-0 pt-1.5">{t.methodLine}</p>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The positions band — the CFTC cards with their own bar domains
 * ------------------------------------------------------------------ */

export function PositionsBand({ data, t, fmt, locale }: { data: PositionsPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  const nameOf = (id: string) => (id === "cftc-gold-positioning" ? t.cardTraderPositioning : t.cardGrossLong);
  return (
    <section id="gold-positions" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {data.cards.map((card) => {
          const signed = card.id === "cftc-gold-positioning";
          const domain = signed ? { min: -100, max: 100 } : { min: 0, max: 100 };
          const pct = Math.round((((card.value - domain.min) / (domain.max - domain.min)) * 100) * 100) / 100;
          const zeroPct = signed ? 50 : 0;
          const fillStart = signed ? Math.min(zeroPct, pct) : 0;
          const fillWidth = signed ? Math.abs(pct - zeroPct) : Math.max(pct, 0);
          const toneHigh = signed ? card.value > 20 : pct > 60;
          const toneLow = signed ? card.value < -20 : pct < 40;
          const fillTone = toneHigh
            ? "bg-[var(--color-return-up)]"
            : toneLow
              ? "bg-[var(--color-return-down)]"
              : "bg-[var(--color-text-secondary)]";
          return (
            <article key={card.id} className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{nameOf(card.id)}</h4>
                <bdi dir="ltr" className="type-label font-bold text-[var(--color-text-primary)]">
                  {signed && card.value > 0 ? "+" : ""}{fmt.num(card.value, 1)}%
                </bdi>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-border)]/30" role="img" aria-label={`${nameOf(card.id)}: ${fmt.num(card.value, 1)}%`}>
                {signed ? <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px bg-[var(--color-border)]" /> : null}
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 ${fillTone}`}
                  style={locale === "fa" ? { right: `${100 - (fillStart + fillWidth)}%`, width: `${fillWidth}%` } : { left: `${fillStart}%`, width: `${fillWidth}%` }}
                />
              </div>
              <p className="m-0 flex flex-wrap items-baseline justify-between gap-x-2 type-caption text-[var(--color-text-tertiary)]">
                <span>{signed ? `−100 · ${t.netShort} · ${t.netLong} · +100` : `0 · ${t.grossShare} · 100`}</span>
                {card.change30d !== null ? (
                  <span>
                    {t.changeWindow}: <span className={card.change30d >= 0 ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}>{fmt.pct(card.change30d, 1)}</span>
                  </span>
                ) : null}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The expectations band — the market's own prices + the calendar
 * ------------------------------------------------------------------ */

export function ExpectationsBand({ data, t, fmt, locale }: { data: ExpectationsPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  return (
    <section id="gold-expectations" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* the event the market is pricing */}
        {data.event && data.event.title ? (
          <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.eventLabel}</h4>
            <p className="m-0 type-label font-semibold text-[var(--color-text-primary)]">{data.event.title}</p>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {data.markets.map((m) => (
                <li key={m.move} className="flex flex-wrap items-baseline justify-between gap-x-2 rounded-md px-2 py-0.5">
                  <span className="type-caption text-[var(--color-text-secondary)]">{m.question}</span>
                  <span className="type-caption font-bold text-[var(--color-chip-ink-attention)]">
                    {m.probPct !== null ? `${fmt.num(m.probPct, 0)}%` : "—"}
                  </span>
                </li>
              ))}
            </ul>
            {data.event.url ? (
              <a href={data.event.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex w-fit items-center gap-1 type-caption font-bold text-[var(--color-currena-blue-deep)]">
                {t.viewLabel} ↗
              </a>
            ) : null}
            <p className="m-0 type-caption italic text-[var(--color-text-tertiary)]">{t.notOurView}</p>
          </div>
        ) : null}
        {/* the gold-relevant calendar */}
        {data.calendar.length > 0 ? (
          <div className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.calendarTitle}</h4>
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {data.calendar.map((c) => (
                <li key={c.id} className="flex flex-wrap items-baseline gap-x-2 rounded-md px-2 py-0.5">
                  <span className="type-caption font-bold text-[var(--color-accent-gold-deep)]">{fmt.dateWords(c.date)}</span>
                  <span className="type-caption text-[var(--color-text-secondary)]">{locale === "en" ? c.titleEn : c.titleFa}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The Iran-bridge premium card — the live حباب history
 * ------------------------------------------------------------------ */

export function PremiumHistoryCard({ data, t, fmt, locale }: { data: PremiumPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  const model = React.useMemo(() => {
    const pts = data.series.filter((p) => p.premiumPct !== null) as Array<{ date: string; premiumPct: number }>;
    if (pts.length < 2) return null;
    const w = 640;
    const h = 150;
    const padL = 8;
    const padR = 50;
    const padT = 14;
    const padB = 18;
    const values = pts.map((p) => p.premiumPct);
    const rawMin = Math.min(...values, 0);
    const rawMax = Math.max(...values);
    const yMin = rawMin - (rawMax - rawMin) * 0.1;
    const yMax = rawMax + (rawMax - rawMin) * 0.15;
    const xOf = (i: number) => padL + (i / (pts.length - 1)) * (w - padL - padR);
    const yOf = (v: number) => padT + (1 - (v - yMin) / Math.max(1e-9, yMax - yMin)) * (h - padT - padB);
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(p.premiumPct).toFixed(1)}`).join(" ");
    const yZero = yOf(0);
    const areaPath = `${path} L${xOf(pts.length - 1).toFixed(1)},${yZero.toFixed(1)} L${xOf(0).toFixed(1)},${yZero.toFixed(1)} Z`;
    return { w, h, path, areaPath, yZero, pts, yOf, xOf, yMax };
  }, [data]);
  const emami = data.latest.coins.find((c) => c.id === "coin-emami");
  return (
    <div className="mt-3 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
        <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.premiumTitle}</h4>
        {emami && emami.premiumPct !== null ? (
          <span className="type-caption font-bold text-[var(--color-bridge-accent)]">
            {t.premiumNow}: <bdi dir="ltr">{fmt.pct(emami.premiumPct, 2)}</bdi>
          </span>
        ) : null}
      </div>
      {model ? (
        <figure className="m-0 flex min-w-0 flex-col gap-1">
          <figcaption className="type-caption text-[var(--color-text-secondary)]">{t.premiumHistoryTitle}</figcaption>
          <div dir="ltr" className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${model.w} ${model.h}`} role="img" aria-label={t.premiumHistoryTitle} className="h-auto w-full">
              <line x1={4} y1={model.yZero} x2={model.w - 40} y2={model.yZero} stroke="var(--color-border)" strokeWidth={1} strokeDasharray="3 4" />
              <text x={model.w - 38} y={model.yZero + 3.5} fontSize={10} fill="var(--color-text-tertiary)">0%</text>
              <path d={model.areaPath} fill="var(--color-bridge-accent)" opacity={0.12} />
              <path d={model.path} fill="none" stroke="var(--color-bridge-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              <text x={4} y={model.h - 4} fontSize={10} fill="var(--color-text-tertiary)">{model.pts[0]!.date.slice(0, 7)}</text>
              <text x={model.w - 40} y={model.h - 4} fontSize={10} fill="var(--color-text-tertiary)" textAnchor="end">{model.pts[model.pts.length - 1]!.date.slice(0, 7)}</text>
            </svg>
          </div>
        </figure>
      ) : null}
      <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        {data.latest.ounceUsd !== null && data.latest.dollarToman !== null ? (
          <>
            <bdi dir="ltr">${fmt.num(data.latest.ounceUsd, 0)}</bdi> {t.premiumOunce} · <bdi dir="ltr">{fmt.num(data.latest.dollarToman, 0)}</bdi> {t.premiumDollar} ·{" "}
          </>
        ) : null}
        <bdi>{t.premiumAsOf.replace("{date}", fmt.dateWords(data.asOf))}</bdi>
      </p>
      <p className="m-0 type-caption italic text-[var(--color-text-tertiary)]">{t.premiumNote}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The relationship map — the 24 documented records, list-first
 * ------------------------------------------------------------------ */

const CLASS_INK: Record<string, string> = {
  M: "var(--color-currena-blue-deep)",
  C: "var(--color-accent-gold-deep)",
  X: "var(--color-chip-ink-attention)",
  K: "var(--color-return-up)",
};

export function RelationshipsBand({ t, locale }: { t: AnyT; locale: Locale }) {
  const [filter, setFilter] = React.useState<string | null>(null);
  const classes = ["M", "C", "X", "K"];
  const shown = filter === null ? GOLD_RELATIONSHIPS : GOLD_RELATIONSHIPS.filter((r) => r.class === filter);
  return (
    <section id="gold-relationships" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setFilter(null)}
          className={`rounded-full px-3 py-1 type-caption font-bold ring-1 ring-[var(--color-border)] transition-colors ${filter === null ? "bg-[var(--color-currena-blue)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"}`}
        >
          {locale === "en" ? `all ${GOLD_RELATIONSHIPS.length}` : `همه ${new Intl.NumberFormat("fa-IR").format(GOLD_RELATIONSHIPS.length)}`}
        </button>
        {classes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(filter === c ? null : c)}
            className={`rounded-full px-3 py-1 type-caption font-bold ring-1 ring-[var(--color-border)] transition-colors ${filter === c ? "text-white" : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"}`}
            style={filter === c ? { background: CLASS_INK[c] } : undefined}
          >
            {c === "M" ? t.legendM : c === "C" ? t.legendC : c === "X" ? t.legendX : t.legendK}
          </button>
        ))}
      </div>
      <ul className="m-0 mt-3 flex max-h-96 list-none flex-col gap-1.5 overflow-y-auto p-0 scroll-slim">
        {shown.map((r) => (
          <li key={r.id} className="flex flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-2 ring-1 ring-[var(--color-border)]">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="type-caption font-bold text-[var(--color-text-tertiary)]">{r.id}</span>
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white" style={{ background: CLASS_INK[r.class] }} aria-label={r.class}>
                {r.class}
              </span>
              <span className="type-caption font-bold text-[var(--color-text-primary)]" dir={locale === "fa" ? "rtl" : "ltr"}>
                {r.from} → {r.to}
              </span>
              {r.xFlag ? <span className="type-caption italic text-[var(--color-text-tertiary)]">({t.xFlagNote})</span> : null}
              {r.blocked ? <span className="ms-auto type-caption italic text-[var(--color-text-tertiary)]">{t.legendBlocked}</span> : null}
            </div>
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{locale === "en" ? r.en : r.fa}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
