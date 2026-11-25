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
import { ChevronDown, ChevronRight, DollarSign, Flame, Percent, Scale, ShieldAlert, Users } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { CONCEPT_NAMES, FORCE_FAMILIES, GOLD_RELATIONSHIPS, familyRecords } from "@/lib/gold-page/relationships";
import { CountryFlag } from "@/components/gold-page/flags";
import { deskBasePath } from "@/lib/utils";
import { type Fmt } from "@/components/gold-page/visuals";
import type { IfBoughtSnapshot } from "@/lib/gold-page/ifbought";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/* ------------------------------------------------------------------ *
 * The payloads (from the desk's own /api/gold/* routes)
 * ------------------------------------------------------------------ */

export interface TaFibonacci {
  window: { from: string; to: string; bars: number };
  high: number;
  highDate: string;
  low: number;
  lowDate: string;
  direction: "up" | "down";
  levels: ReadonlyArray<{ ratio: number; price: number }>;
}

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
  fibonacci: TaFibonacci | null;
  last: { date: string; close: number };
  /** The raw daily closes (the TA leg's own OHLC series) — the signals
   *  chart's range windows read this same series (one leg, two surfaces). */
  closes: Array<{ date: string; close: number }>;
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
  DEU: ["Germany", "آلمان"],
  MNG: ["Mongolia", "مغولستان"],
  TJK: ["Tajikistan", "تاجیکستان"],
  LKA: ["Sri Lanka", "سری‌لانکا"],
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
  /* the tables open on demand — the plain verdict and the nearest levels
     stay the always-visible summary; the Fibonacci correction levels sit
     behind their own modal (the owner's ask: only resistance and support
     stay in the open) */
  const [open, setOpen] = React.useState(false);
  const [fibOpen, setFibOpen] = React.useState(false);
  /* the three plain-language concept facts — behind their own expandable
     (the owner's ask: the reading keys hide until asked for) */
  const [factsOpen, setFactsOpen] = React.useState(false);
  const lastFibTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const dist = data.distance;
  const basisSpanDays = data.span.bars > 335
    ? t.spanYears.replace("{years}", fmt.num(Math.round((data.span.bars / 250) * 10) / 10, 1))
    : t.spanMonths.replace("{n}", fmt.num(Math.max(1, Math.round(data.span.bars / 20)), 0));

  /* THE plain verdict — one sentence anyone can read: where the price
     sits against its 200-day average, and what that plain means (the
     expensive/cheap stretch) — jargon stays in the tables, never here */
  const distSentence = dist
    ? String(t.distancePlain)
        .replace("{pct}", fmt.pct(Math.abs(dist.pct), 1).replace("+", ""))
        .replace("{dir}", dist.pct >= 0 ? t.distanceAbove : t.distanceBelow)
        .replace("{side}", dist.pct >= 0 ? t.verdictSideExpensive : t.verdictSideCheap)
    : null;
  const decileLine =
    dist && dist.decile !== null && dist.basis !== null
      ? String(t.distanceDecile)
          .replace("{pct}", fmt.num(dist.decile * 100, 0))
          .replace("{window}", basisSpanDays)
      : null;

  /* the nearest levels — every reference line above/below the last close:
     the daily & weekly pivots and the four moving averages, nearest first */
  const lastClose = data.last.close;
  const candidates: Array<{ value: number; tag: string; kind: "resistance" | "support" }> = [];
  for (const [pv, srcTag] of [
    [data.dailyPivots, t.pivotsDailyShort],
    [data.weeklyPivots, t.pivotsWeeklyShort],
  ] as Array<[TaPayload["dailyPivots"], string]>) {
    if (pv === null) continue;
    for (const [k, v] of [["R1", pv.r1], ["R2", pv.r2], ["R3", pv.r3], ["S1", pv.s1], ["S2", pv.s2], ["S3", pv.s3]] as Array<[string, number]>) {
      candidates.push({ value: v, tag: `${k} · ${srcTag}`, kind: k.startsWith("R") ? "resistance" : "support" });
    }
  }
  for (const row of data.sma) {
    candidates.push({ value: row.value, tag: `MA${row.window}`, kind: row.value > lastClose ? "resistance" : "support" });
  }
  const nearestResistance = candidates.filter((c) => c.value > lastClose).sort((a, b) => a.value - b.value)[0] ?? null;
  const nearestSupport = candidates.filter((c) => c.value < lastClose).sort((a, b) => b.value - a.value)[0] ?? null;
  const fib = data.fibonacci;

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

      {/* THE plain verdict — one readable sentence, its own loud gold box */}
      {distSentence ? (
        <div
          className="mt-2.5 rounded-[var(--cr-radius-md)] px-3.5 py-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 16%, transparent)",
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 45%, transparent)",
          }}
        >
          <p className="m-0 text-[1.02rem] font-black leading-snug text-[var(--color-accent-gold-deep)] sm:text-[1.1rem]">
            <bdi>{distSentence}</bdi>
          </p>
          {decileLine !== null ? (
            <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{decileLine}</p>
          ) : null}
        </div>
      ) : null}

      {/* the nearest levels — the price sandwiched between its closest
          reference lines: ONE row, three cells — support · now ·
          resistance (the owner's batch-H ask: never one-per-row, the
          grid reads as the sandwich it is, on a phone too).
          Batch M: the green/red GROUNDS are gone — three neutral cells
          and a ▲/▼ triangle per side carry the direction (the owner's
          ask; the ink on the label stays) */}
      {nearestSupport !== null || nearestResistance !== null ? (
        <div className="mt-2.5 grid grid-cols-3 gap-1.5">
          {nearestSupport !== null ? (
            <div className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2 ring-1 ring-[var(--color-border)]">
              <span className="m-0 truncate text-[10.5px] font-bold leading-tight text-[var(--color-return-up)]">
                <span aria-hidden="true" className="me-1">▲</span>
                {t.nearestSupport}
              </span>
              <span className="m-0 flex flex-wrap items-baseline gap-x-1">
                <bdi dir="ltr" className="type-caption font-extrabold tabular-nums text-[var(--color-text-primary)]">${fmt.num(nearestSupport.value, 0)}</bdi>
                <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{nearestSupport.tag}</span>
              </span>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2 ring-1 ring-[var(--color-border)]">
            <span className="m-0 truncate text-[10.5px] font-bold leading-tight text-[var(--color-text-primary)]">{t.priceNowWord}</span>
            <bdi dir="ltr" className="m-0 type-caption font-extrabold tabular-nums text-[var(--color-accent-gold-deep)]">${fmt.num(lastClose, 0)}</bdi>
          </div>
          {nearestResistance !== null ? (
            <div className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2 ring-1 ring-[var(--color-border)]">
              <span className="m-0 truncate text-[10.5px] font-bold leading-tight text-[var(--color-return-down)]">
                <span aria-hidden="true" className="me-1">▼</span>
                {t.nearestResistance}
              </span>
              <span className="m-0 flex flex-wrap items-baseline gap-x-1">
                <bdi dir="ltr" className="type-caption font-extrabold tabular-nums text-[var(--color-text-primary)]">${fmt.num(nearestResistance.value, 0)}</bdi>
                <span className="text-[10px] font-semibold text-[var(--color-text-tertiary)]">{nearestResistance.tag}</span>
              </span>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* the Fibonacci correction levels — behind their own modal now (the
          owner's ask): a compact open-button where the block used to sit,
          the three retracement prices + the swing + the note inside the
          dialog. Only the verdict + the resistance/support sandwich stay
          visible in the open */}
      {fib !== null ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={fibOpen}
            onClick={(e) => {
              lastFibTriggerRef.current = e.currentTarget;
              setFibOpen(true);
            }}
            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] transition-transform hover:scale-[1.02] active:scale-95"
          >
            <Percent className="h-3.5 w-3.5" aria-hidden="true" />
            {t.fibOpenLabel}
            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* the three concept facts — the plain-language reading keys, behind
          ONE expandable tap (the owner's ask: میانگین ۲۰۰ روزه…، تلاقی
          طلایی…، فیبوناچی… hide until asked for) */}
      <div className="mt-2.5">
        <button
          type="button"
          aria-expanded={factsOpen}
          aria-controls="gold-ta-facts"
          onClick={() => setFactsOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] transition-transform hover:scale-[1.02] active:scale-95"
        >
          {factsOpen ? t.factsClose : t.factsOpen}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${factsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {factsOpen ? (
          <div id="gold-ta-facts" className="mt-2 grid grid-cols-1 gap-2 lg:grid-cols-3">
            {[t.factSma, t.factCross, t.factFib].map((fact, i) => (
              <div key={i} className="flex items-start gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]">
                {/* neutral counters (the minimal-ink rule): the numbers
                    step back so the section's gold stays on the verdict
                    alone, support green and resistance red the only
                    other hues */}
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-currena-soft)] text-[11px] font-extrabold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]" aria-hidden="true">
                  {locale === "en" ? i + 1 : ["۱", "۲", "۳"][i]}
                </span>
                <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{fact}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>

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
                    <span className="type-caption font-bold text-[var(--color-text-secondary)]">{fmt.dateWords(c.date)}</span>
                    {/* the minimal-ink rule (the owner's batch-I ask): the
                        whole section carries three hues — gold for the
                        verdict, green for support, red for resistance; a
                        golden cross rides the section's own gold ink, the
                        death cross the neutral one */}
                    <span className={`type-caption font-bold ${c.kind === "golden" ? "text-[var(--color-accent-gold-deep)]" : "text-[var(--color-text-secondary)]"}`}>
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

      {/* the Fibonacci modal — the three classic retracement prices on the
          window's own swing, the swing's own dates and the reading note,
          all inside the dialog the open-button drives */}
      <Dialog
        open={fibOpen}
        onOpenChange={(o) => {
          if (!o) {
            setFibOpen(false);
            const trigger = lastFibTriggerRef.current;
            window.setTimeout(() => trigger?.focus(), 0);
          }
        }}
      >
        {fib !== null ? (
          <DialogContent className="rounded-[var(--cr-radius-lg)] border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-start ring-1 ring-[var(--color-border)] sm:p-5 sm:max-w-[480px]">
            <DialogHeader className="text-start pe-11">
              <DialogTitle className="type-label text-start text-[var(--color-text-primary)]">{t.fibTitle}</DialogTitle>
              <p className="type-caption m-0 text-[var(--color-text-tertiary)]">
                {t.fibSwing
                  .replace("{low}", `$${fmt.num(fib.low, 0)}`)
                  .replace("{lowDate}", fmt.dateWords(fib.lowDate))
                  .replace("{high}", `$${fmt.num(fib.high, 0)}`)
                  .replace("{highDate}", fmt.dateWords(fib.highDate))}
              </p>
            </DialogHeader>
            <DialogDescription asChild className="m-0 pe-11">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                  {fib.levels.map((lv) => (
                    <div key={lv.ratio} className="flex flex-col gap-0.5 rounded-[var(--cr-radius-sm)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]">
                      <span className="type-caption font-bold text-[var(--color-text-secondary)]">{t.fibRatio.replace("{pct}", `${fmt.num(lv.ratio * 100, 1)}%`)}</span>
                      <span className="type-label font-extrabold text-[var(--color-text-primary)]">
                        <bdi dir="ltr">${fmt.num(lv.price, 0)}</bdi>
                      </span>
                      <span className="type-caption text-[var(--color-text-tertiary)]">
                        {lv.price > lastClose ? "▲" : lv.price < lastClose ? "▼" : "•"} {fmt.pct((lv.price / lastClose - 1) * 100, 1)}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.fibNote}</p>
              </div>
            </DialogDescription>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The central-bank demand band — the tracker chart + the buyers table
 * ------------------------------------------------------------------ */

/** The curated net sellers — the reported quarterly reductions that
 *  mattered (IMF/WGC quarterly record through 2026-Q3; curated, dated,
 *  none of them a live meter input). Sellers are rarer and smaller than
 *  buyers — the world aggregate has been positive for years. */
const CB_SELLERS: ReadonlyArray<{ code: string; net12m: number; reserve: number }> = [
  // the reserve figures: the latest officially reported holdings, IMF
  // IFS via the WGC quarterly table (batch L, task 6 — the owner's
  // ask): Germany 3349.1 t and Turkey 532.1 t as of 2026-Q3; Mongolia
  // 7.9 t (2026-Q1); Tajikistan 7.4 t (its latest reported, 2024-Q1);
  // Sri Lanka 0.47 t (2025-Q2, the series' own floor) — the reporting
  // lag named in the note, never smoothed into a fake "now"
  { code: "DEU", net12m: -4.9, reserve: 3349.1 },
  { code: "TUR", net12m: -3.4, reserve: 532.1 },
  { code: "MNG", net12m: -2.7, reserve: 7.9 },
  { code: "TJK", net12m: -2.1, reserve: 7.4 },
  { code: "LKA", net12m: -1.8, reserve: 0.5 },
];


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
          <svg viewBox={`0 0 ${model.width} ${model.height}`} role="img" aria-label={`${t.chartTitle} · ${t.chartReportedWorld}`} className="h-auto w-full">
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

      {/* the buyers — the light-green box (خریداران طلا) */}
      <div
        className="mt-3 flex min-w-0 flex-col gap-1.5 rounded-[var(--cr-radius-md)] p-3"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-return-up) 7%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-return-up) 26%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
          <h4 className="m-0 type-label font-extrabold text-[var(--color-return-up)]">{t.buyersTitle}</h4>
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.buyersAsOf}</span>
        </div>
        <table className="m-0 hidden w-full border-collapse type-caption sm:table">
          <thead>
            <tr className="text-[var(--color-text-tertiary)]">
              <th scope="col" className="px-1.5 py-1 text-start font-semibold">{t.buyersHeadCountry}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadLatest}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHead12m}</th>
              {/* batch M: the year's buying measured against the pile it
                  already holds — "Poland bought ≈23% of its own holdings
                  this year" (weights, not values) */}
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadOfReserve}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadHoldings}</th>
              <th scope="col" className="px-1.5 py-1 text-end font-semibold">{t.buyersHeadShare}</th>
            </tr>
          </thead>
          <tbody>
            {data.buyers.map((b) => {
              const name = CB_COUNTRIES[b.code]?.[lan(locale)] ?? b.code;
              const share = buyerSharePct(b, spot, data.asOf);
              /* the 12-month net over the country's own current holdings
                  — the buying as a share of the reserve it already holds
                  (batch M, the owner's ask); negative nets stay signed */
              const ofHoldings = b.tonnes > 0 ? (b.sum12m / b.tonnes) * 100 : null;
              return (
                <tr key={b.code}>
                  <th scope="row" className="px-1.5 py-1.5 text-start font-semibold text-[var(--color-text-primary)]">
                    <span className="flex items-center gap-2">
                      <CountryFlag code={b.code} name={name} />
                      <span>{name}</span>
                    </span>
                  </th>
                  <td className="px-1.5 py-1.5 text-end text-[var(--color-text-secondary)]">
                    <span>{monthLabel(b.latestMonth, locale)}</span>{" "}
                    <span className={b.latestDelta >= 0 ? "text-[var(--color-return-up)]" : "text-[var(--color-return-down)]"}>
                      {b.latestDelta >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.latestDelta), 1)}
                    </span>
                  </td>
                  <td className="px-1.5 py-1.5 text-end font-bold text-[var(--color-text-primary)]">
                    {b.sum12m >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.sum12m), 1)}
                  </td>
                  <td className="px-1.5 py-1.5 text-end font-semibold tabular-nums text-[var(--color-text-secondary)]">
                    {ofHoldings !== null && Number.isFinite(ofHoldings)
                      ? `${ofHoldings >= 0 ? "+" : "−"}${fmt.num(Math.abs(ofHoldings), 0)}%`
                      : "·"}
                  </td>
                  <td className="px-1.5 py-1.5 text-end text-[var(--color-text-secondary)]">{t.holdingsNow.replace("{v}", fmt.num(b.tonnes, 0))}</td>
                  <td className="px-1.5 py-1.5 text-end font-semibold text-[var(--color-text-secondary)]">
                    {share !== null ? `${fmt.num(share, 1)}%` : "·"}
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
            const ofHoldings = b.tonnes > 0 ? (b.sum12m / b.tonnes) * 100 : null;
            return (
              <li key={b.code} className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]">
                <div className="flex min-w-0 items-baseline justify-between gap-2.5">
                  <span className="flex items-center gap-2 type-label font-bold text-[var(--color-text-primary)]">
                    <CountryFlag code={b.code} name={name} />
                    {name}
                  </span>
                  <span className="type-caption font-bold text-[var(--color-text-secondary)]">
                    {b.sum12m >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.sum12m), 1)}
                  </span>
                </div>
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 type-caption text-[var(--color-text-tertiary)]">
                  <span>{t.holdingsNow.replace("{v}", fmt.num(b.tonnes, 0))}</span>
                  {ofHoldings !== null && Number.isFinite(ofHoldings) ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="font-semibold text-[var(--color-return-up)]">
                        {t.buyPctLine.replace("{v}", `${fmt.num(Math.abs(ofHoldings), 0)}%`)}
                      </span>
                    </>
                  ) : null}
                  <span aria-hidden="true"> · </span>
                  <span>{monthLabel(b.latestMonth, locale)} {b.latestDelta >= 0 ? "+" : "−"}{fmt.num(Math.abs(b.latestDelta), 1)}</span>
                </p>
              </li>
            );
          })}
        </ul>
        {/* the valuation notes — small and low-opacity (the owner's
            batch-H ask): the methods stay, but whisper */}
        <p className="m-0 text-[10.5px] leading-relaxed text-[var(--color-text-tertiary)]/70">{t.shareNote}</p>
        <p className="m-0 text-[10.5px] leading-relaxed text-[var(--color-text-tertiary)]/70">{t.buyPctNote}</p>
      </div>

      {/* the sellers — the light-red box (فروشندگان طلا) */}
      <div
        className="mt-3 flex min-w-0 flex-col gap-1.5 rounded-[var(--cr-radius-md)] p-3"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-return-down) 7%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-return-down) 26%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
          <h4 className="m-0 type-label font-extrabold text-[var(--color-return-down)]">{t.sellersTitle}</h4>
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.sellersAsOf}</span>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {CB_SELLERS.map((r) => {
            const name = CB_COUNTRIES[r.code]?.[lan(locale)] ?? r.code;
            /* the year's selling against the pile it held (batch M):
              signed, the same weight-not-value measure the buyers carry */
            const ofReserve = r.reserve > 0 ? (Math.abs(r.net12m) / r.reserve) * 100 : null;
            return (
              <li key={r.code} className="flex min-w-0 flex-col gap-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-2.5 py-1.5 ring-1 ring-[var(--color-border)]">
                <div className="flex min-w-0 items-baseline justify-between gap-2.5">
                  <span className="flex items-center gap-2 type-label font-bold text-[var(--color-text-primary)]">
                    <CountryFlag code={r.code} name={name} />
                    {name}
                  </span>
                  <span className="type-caption font-bold text-[var(--color-return-down)]">
                    ▼ {t.tonnesShort.replace("{v}", fmt.num(Math.abs(r.net12m), 1))}
                  </span>
                </div>
                {/* the seller's own estimated reserve (batch L, task 6) —
                    the same quiet line the buyers' rows carry, now with
                    the sold share beside it (batch M) */}
                <p className="m-0 flex flex-wrap items-baseline gap-x-2 type-caption text-[var(--color-text-tertiary)]">
                  <span>{t.holdingsNow.replace("{v}", fmt.num(r.reserve, r.reserve < 100 ? 1 : 0))}</span>
                  {ofReserve !== null && Number.isFinite(ofReserve) ? (
                    <span className="font-semibold text-[var(--color-return-down)]">
                      {t.soldPctLine.replace("{v}", `${fmt.num(ofReserve, 1)}%`)}
                    </span>
                  ) : null}
                </p>
              </li>
            );
          })}
        </ul>
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.sellersNote}</p>
      </div>

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
  /* collapsed by default — institutional plumbing is noise for the daily
     reader; one tap opens the whole section */
  const [open, setOpen] = React.useState(false);
  return (
    /* a sub-block of the merged «سایر شاخص‌ها» section (batch H) — its own
       collapse behaviour, its own sub-heading, no section of its own */
    <div className="mt-4 border-t border-[var(--color-border)] pt-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.title}</h4>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          {open ? (locale === "en" ? "hide" : "بستن") : locale === "en" ? "show" : "نمایش"}
        </button>
      </div>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      {open ? (
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
            <svg viewBox="0 0 200 34" role="img" aria-label={`${t.vaultTopline} · ${monthLabel(data.vault.asOf, locale)}`} className="h-auto w-full">
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
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The correlation companion — the dual-axis chart (gold vs the real yield)
 * ------------------------------------------------------------------ */

const CORR_W = 640;
const CORR_H = 210;

export function CorrelationLeg({ data, t, fmt, locale }: { data: CorrelationPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
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
    return { goldPath, yieldPath, gMin, gMax, yMin, yMax, xOf };
  }, [data]);
  const spanText = `${fmt.dateWords(data.span.from)} → ${fmt.dateWords(data.span.to)}`;
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* the dual-axis chart (gold left, real yield right — NOT inverted) */}
      <figure className="m-0 flex min-w-0 flex-col gap-1">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
          <span className="type-label font-bold text-[var(--color-text-primary)]">{t.goldAxis}</span>
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.yieldAxis}</span>
        </figcaption>
        <div dir="ltr" className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${CORR_W} ${CORR_H}`} role="img" aria-label={`${t.title} · ${t.goldAxis} / ${t.yieldAxis}`} className="h-auto w-full">
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

      <details className="rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
        <summary className="cursor-pointer font-semibold text-[var(--color-currena-blue-deep)]">{t.methodTitle}</summary>
        <p className="m-0 pt-1.5">{t.methodLine}</p>
      </details>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The positions band — the CFTC cards with their own bar domains
 * ------------------------------------------------------------------ */

export function PositionsBand({ data, t, fmt, locale }: { data: PositionsPayload; t: AnyT; fmt: Fmt; locale: Locale }) {
  const nameOf = (id: string) => (id === "cftc-gold-positioning" ? t.cardTraderPositioning : t.cardGrossLong);
  /* THE ultimate verdict — the main card read short-to-long: LONG, SHORT,
     or no lean, stated big and bold with the scale marked where it sits */
  const main = data.cards.find((c) => c.id === "cftc-gold-positioning") ?? null;
  const verdictWord =
    main === null
      ? null
      : main.value > 20
        ? t.verdictLong
        : main.value < -20
          ? t.verdictShort
          : t.verdictNeutral;
  const verdictTone =
    main === null
      ? "var(--color-text-secondary)"
      : main.value > 20
        ? "var(--color-return-up)"
        : main.value < -20
          ? "var(--color-return-down)"
          : "var(--color-text-secondary)";
  const verdictPos = main === null ? 50 : Math.min(98, Math.max(2, ((main.value + 100) / 200) * 100));
  /* the plain-language verdict description (the owner's batch-H ask):
     what the side MEANS in words, with the bet's strength graded from
     the reading's own ratio — the deeper past ±60, the heavier */
  const strengthWord = (v: number): string => {
    const a = Math.abs(v);
    if (a > 60) return t.strengthHeavy;
    if (a > 40) return t.strengthStrong;
    return t.strengthModerate;
  };
  const verdictDesc =
    main === null
      ? null
      : main.value > 20
        ? String(t.verdictLongDesc).replace("{strength}", strengthWord(main.value))
        : main.value < -20
          ? String(t.verdictShortDesc).replace("{strength}", strengthWord(main.value))
          : t.verdictNeutralDesc;
  return (
    <section id="gold-positions" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      {verdictWord !== null && main !== null ? (
        <div className="mt-3 flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-3 py-3 ring-1 ring-[var(--color-border)]">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="type-caption font-bold uppercase tracking-wide text-[var(--color-text-secondary)]">{t.verdictEyebrow}</span>
            <span className="text-[1.15rem] font-black leading-none tracking-tight sm:text-[1.3rem]" style={{ color: verdictTone }}>
              {verdictWord}
            </span>
          </div>
          {/* the verdict in plain words — what the side means, with the
              bet's strength from the reading's own ratio (batch H) */}
          {verdictDesc !== null ? (
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-primary)]" data-positions-verdict-desc>
              {verdictDesc}
            </p>
          ) : null}

          {/* THE market thermometer — the full −100…+100 domain as a
              gradient track with zone ticks, a zero spine, and a labelled
              needle pinning today's reading (colour never alone: the words
              ride with it) */}
          <div dir="ltr" className="relative mt-2 flex flex-col gap-1 select-none" role="img" aria-label={`${t.verdictEyebrow}: ${verdictWord} (${fmt.num(main.value, 1)}%)`}>
            {/* the value bubble riding above the needle */}
            <div className="relative h-6">
              <span
                className="absolute bottom-0 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-black tabular-nums text-white shadow-sm"
                style={{ left: `${verdictPos}%`, background: verdictTone }}
              >
                {main.value > 0 ? "+" : ""}{fmt.num(main.value, 1)}%
              </span>
            </div>
            {/* the track itself — short-red through neutral through long-green */}
            <div className="relative h-5 w-full rounded-full ring-1 ring-[var(--color-border)]" style={{ background: "linear-gradient(90deg, color-mix(in srgb, var(--color-return-down) 62%, var(--color-surface)) 0%, color-mix(in srgb, var(--color-return-down) 14%, var(--color-surface)) 34%, var(--color-surface) 50%, color-mix(in srgb, var(--color-return-up) 14%, var(--color-surface)) 66%, color-mix(in srgb, var(--color-return-up) 62%, var(--color-surface)) 100%)" }}>
              {/* the ticks: −100 · −50 · 0 · +50 · +100 */}
              {[0, 25, 50, 75, 100].map((p) => (
                <span key={p} className="absolute inset-y-[3px] w-px" style={{ left: `${p}%`, background: "color-mix(in srgb, var(--color-text-secondary) 35%, transparent)" }} aria-hidden="true" />
              ))}
              {/* the zero spine — the domain's own centre, emphasised */}
              <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full" style={{ background: "color-mix(in srgb, var(--color-text-secondary) 55%, transparent)" }} aria-hidden="true" />
              {/* the needle — the reading's own pin */}
              <span
                className="absolute top-1/2 h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.25)]"
                style={{ left: `${verdictPos}%`, borderColor: verdictTone, background: "var(--color-surface)" }}
                aria-hidden="true"
              />
              <span
                className="absolute top-1/2 h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{ left: `${verdictPos}%`, background: verdictTone }}
                aria-hidden="true"
              />
            </div>
            {/* the scale words — the domain's ends and its middle */}
            <div dir="ltr" className="flex items-baseline justify-between">
              <span className="type-caption font-bold text-[var(--color-return-down)]">−100 · {t.scaleShort}</span>
              <span className="type-caption font-semibold text-[var(--color-text-tertiary)]">0</span>
              <span className="type-caption font-bold text-[var(--color-return-up)]">{t.scaleLong} · +100</span>
            </div>
          </div>
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.verdictNote}</p>
          {/* the reconciliation — the briefing counts positioning as
              pressure while this band reads LONG: the note says why both
              are true at once (the risk is the crowding, not the side) */}
          <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.crowdingNote}</p>
        </div>
      ) : null}
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
            ? "var(--color-return-up)"
            : toneLow
              ? "var(--color-return-down)"
              : "var(--color-text-secondary)";
          return (
            <article key={card.id} className="flex flex-col gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="m-0 type-label font-bold text-[var(--color-text-primary)]">{nameOf(card.id)}</h4>
                <bdi dir="ltr" className="type-label font-bold text-[var(--color-text-primary)]">
                  {signed && card.value > 0 ? "+" : ""}{fmt.num(card.value, 1)}%
                </bdi>
              </div>
              {/* the card's own gradient track — fill grows from zero (or
                  the left end), with ticks and a bright end-cap */}
              <div className="relative h-4 w-full overflow-hidden rounded-full ring-1 ring-[var(--color-border)]" style={{ background: "color-mix(in srgb, var(--color-border) 28%, var(--color-surface))" }} role="img" aria-label={`${nameOf(card.id)}: ${fmt.num(card.value, 1)}%`}>
                {[0, 25, 50, 75, 100].map((p) => (
                  <span key={p} className="absolute inset-y-[2px] w-px" style={{ left: `${p}%`, background: "color-mix(in srgb, var(--color-text-tertiary) 30%, transparent)" }} aria-hidden="true" />
                ))}
                {signed ? <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-[2px] bg-[var(--color-text-secondary)]/45" /> : null}
                <span
                  aria-hidden="true"
                  className="absolute inset-y-[2px] rounded-full"
                  style={
                    locale === "fa"
                      ? { right: `${100 - (fillStart + fillWidth)}%`, width: `${Math.max(fillWidth, 0.5)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${fillTone} 55%, transparent), ${fillTone})` }
                      : { left: `${fillStart}%`, width: `${Math.max(fillWidth, 0.5)}%`, background: `linear-gradient(90deg, color-mix(in srgb, ${fillTone} 55%, transparent), ${fillTone})` }
                  }
                />
                {/* the fill's own end-cap dot — the reading's tip */}
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 h-[8px] w-[8px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-[var(--color-surface)]"
                  style={{
                    ...(locale === "fa" ? { right: `${100 - (fillStart + fillWidth)}%` } : { left: `${fillStart + fillWidth}%` }),
                    background: fillTone,
                  }}
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
  /* collapsed by default — the premium rides INSIDE the Iran bridge as a
     sub-chapter, never an independent section; the summary line carries
     the live Emami number, one tap opens the history and the method */
  return (
    <details className="mt-3 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3 ring-1 ring-[var(--color-bridge-accent)]/30">
      <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-x-2.5 gap-y-0.5">
        <span className="type-label font-extrabold text-[var(--color-text-primary)]">{t.premiumTitle}</span>
        {emami && emami.premiumPct !== null ? (
          <span className="type-caption font-bold text-[var(--color-bridge-accent)]">
            {t.premiumNow}: <bdi dir="ltr">{fmt.pct(emami.premiumPct, 2)}</bdi>
          </span>
        ) : null}
      </summary>
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
    </details>
  );
}

/* ------------------------------------------------------------------ *
 * The relationship map — the owner's own redesign: the 25 documented
 * records read as SIX force families feeding one hub (gold). Every
 * family card carries its one-line effect and its records (each with
 * its evidence-class chip and its own words); a rail merges the
 * families into the gold hub — a map, not a list. The evidence-class
 * legend rides above; hue is never the sole carrier (the letter rides
 * with it); blocked edges stay labelled, never charted.
 * ------------------------------------------------------------------ */

const CLASS_INK: Record<string, string> = {
  M: "var(--color-currena-blue-deep)",
  C: "var(--color-accent-gold-deep)",
  X: "var(--color-chip-ink-attention)",
  K: "var(--color-return-up)",
};

const FAMILY_ICONS: Record<string, React.ComponentType<{ className?: string; "aria-hidden"?: true }>> = {
  money: Percent,
  dollar: DollarSign,
  fear: ShieldAlert,
  inflation: Flame,
  buyers: Users,
  ratios: Scale,
};

/** One record row inside its family — the class chip (letter + hue),
 *  the concepts in words, the one-liner clamped to two lines. */
function FamilyRecordRow({ r, t, locale }: { r: (typeof GOLD_RELATIONSHIPS)[number]; t: AnyT; locale: Locale }) {
  const from = CONCEPT_NAMES[r.from]?.[lan(locale)] ?? r.from;
  const to = CONCEPT_NAMES[r.to]?.[lan(locale)] ?? r.to;
  const intoGold = r.to === "gold";
  return (
    <li className="flex items-start gap-2 rounded-[var(--cr-radius-sm)] bg-[var(--color-surface)] px-2 py-1.5 ring-1 ring-[var(--color-border)]/50">
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold text-white"
        style={{ background: CLASS_INK[r.class] ?? "var(--color-currena-blue-deep)" }}
        aria-label={r.class}
        title={r.class === "M" ? t.legendM : r.class === "C" ? t.legendC : r.class === "X" ? t.legendX : t.legendK}
      >
        {r.class}
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5" dir={locale === "fa" ? "rtl" : "ltr"}>
          <span className="type-caption font-bold text-[var(--color-text-primary)]">
            {from}
            {!intoGold ? <span aria-hidden="true"> → {to}</span> : null}
          </span>
          {r.xFlag ? (
            <span className="text-[10.5px] italic text-[var(--color-text-tertiary)]">({t.xFlagNote})</span>
          ) : null}
          {r.blocked ? (
            <span className="text-[10.5px] italic text-[var(--color-text-tertiary)]">{t.legendBlocked}</span>
          ) : null}
        </span>
        <p className="m-0 line-clamp-2 text-[11.5px] leading-snug text-[var(--color-text-secondary)]" title={locale === "en" ? r.en : r.fa}>
          {locale === "en" ? r.en : r.fa}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ *
 * The relationship GRAPH (the owner's batch-H ask: a real visualization,
 * not a list) — six force family nodes around one gold hub, every edge
 * an arrow INTO gold (width = documented link count, ink = the family's
 * strongest evidence class), plus the two documented cross-links drawn
 * dashed: borrowing costs feed the dollar (R-14), and in a true panic
 * the dollar itself bids with gold (R-22). Tap a node to read its
 * records below. Responsive: a wide radial map, a twin-column map on
 * phones (the same graph, never a miniature).
 * ------------------------------------------------------------------ */

/** Measure a block's own width after mount (the responsive-canvas trick —
 *  the graph's viewBox follows the container, clamped 320–680). */
function useGraphWidth(): { ref: React.RefObject<HTMLDivElement | null>; w: number } {
  const ref = React.useRef<HTMLDivElement | null>(null);
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
  return { ref, w: w ?? 680 };
}

/** The family node's geometry: a pill that carries the title, the link
 *  count, and the strongest evidence-class letter. */
interface GraphNode {
  family: (typeof FORCE_FAMILIES)[number];
  x: number;
  y: number;
  w: number;
  h: number;
  ink: string;
  letter: string;
  count: number;
}

function RelationshipGraph({
  t,
  locale,
  selected,
  onSelect,
}: {
  t: AnyT;
  locale: Locale;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { ref, w } = useGraphWidth();
  const W = Math.max(320, Math.min(680, Math.round(w)));
  const narrow = W < 520;
  const H = narrow ? 560 : 470;
  const hub = { x: W / 2, y: H / 2 - (narrow ? 0 : 10) };
  const hubR = 30;

  /* the family nodes: dominant evidence class per family (the letter the
     node carries), positions radial on wide screens, twin columns on
     phones — [0,2,4] left, [1,3,5] right, so no two neighbours stack */
  const nodes: GraphNode[] = React.useMemo(() => {
    const layout = FORCE_FAMILIES.map((family, i) => {
      const records = familyRecords(family);
      const tally = new Map<string, number>();
      for (const r of records) tally.set(r.class, (tally.get(r.class) ?? 0) + 1);
      let letter = "M";
      let best = -1;
      for (const [c, n] of tally) {
        if (n > best) {
          best = n;
          letter = c;
        }
      }
      const ink = CLASS_INK[letter] ?? "var(--color-currena-blue-deep)";
      let x: number;
      let y: number;
      if (narrow) {
        const col = i % 2 === 0 ? 0 : 1;
        const row = Math.floor(i / 2);
        x = col === 0 ? 84 : W - 84;
        y = 92 + row * ((H - 184) / 2);
      } else {
        const a = (-90 + i * 60) * (Math.PI / 180);
        x = hub.x + Math.cos(a) * (W * 0.34);
        y = hub.y + Math.sin(a) * 150;
      }
      const width = narrow ? 124 : 136;
      return { family, x, y, w: width, h: 46, ink, letter, count: records.length } as GraphNode;
    });
    return layout;
  }, [narrow, W, H, hub.x, hub.y]);

  const nodeOf = (familyId: string): GraphNode | undefined => nodes.find((n) => n.family.id === familyId);
  const lan0 = locale === "en" ? 0 : 1;

  /* one family's arrow into gold: trimmed at the node's edge and the
     hub's rim, tipped with a hand-drawn triangle in the same ink */
  const edgeIntoHub = (n: GraphNode) => {
    const dx = hub.x - n.x;
    const dy = hub.y - n.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const trim = n.h / 2 + 10;
    const x1 = n.x + ux * trim;
    const y1 = n.y + uy * trim;
    const x2 = hub.x - ux * (hubR + 10);
    const y2 = hub.y - uy * (hubR + 10);
    const isSel = selected === n.family.id;
    const width = (1.4 + Math.min(2, n.count * 0.35)) * (isSel ? 1.5 : 1);
    return { x1, y1, x2, y2, ux, uy, width, isSel };
  };

  const arrowTip = (x: number, y: number, ux: number, uy: number) => {
    const bx = x - ux * 9;
    const by = y - uy * 9;
    const px = -uy;
    const py = ux;
    return `M${x},${y} L${bx + px * 4.5},${by + py * 4.5} L${bx - px * 4.5},${by - py * 4.5} Z`;
  };

  /* the two documented cross-links, dashed (R-14: costs → dollar; R-22:
     the dollar bids with gold in a panic) */
  const crossA = nodeOf("cost-of-money");
  const crossB = nodeOf("the-dollar");
  const crossPath =
    crossA !== undefined && crossB !== undefined
      ? `M${(crossA.x + crossB.x) / 2 + (crossB.y - crossA.y) * 0.12},${(crossA.y + crossB.y) / 2 - (crossB.x - crossA.x) * 0.12} Q${(crossA.x + crossB.x) / 2},${(crossA.y + crossB.y) / 2} ${(crossA.x + crossB.x) / 2 - (crossB.y - crossA.y) * 0.12},${(crossA.y + crossB.y) / 2 + (crossB.x - crossA.x) * 0.12}`
      : null;
  const dollarNode = nodeOf("the-dollar");

  const ariaLabel =
    locale === "en"
      ? `The map: ${FORCE_FAMILIES.map((f) => `${f.title[0]} (${f.records.length} links)`).join("; ")} — all arrows point into gold.`
      : `نقشه: ${FORCE_FAMILIES.map((f) => `${f.title[1]} (${f.records.length} پیوند)`).join("؛ ")} — همهٔ پیکان‌ها به طلا می‌روند.`;

  return (
    <div ref={ref} className="mt-3">
      <svg
        dir="ltr"
        viewBox={`0 0 ${W} ${H}`}
        className="block h-auto w-full"
        role="img"
        aria-label={ariaLabel}
      >
        {/* the family arrows into gold — width by link count, ink by the
            family's strongest evidence class, arrowheads into the hub */}
        {nodes.map((n) => {
          const e = edgeIntoHub(n);
          return (
            <g key={`edge-${n.family.id}`}>
              <line
                x1={e.x1}
                y1={e.y1}
                x2={e.x2}
                y2={e.y2}
                stroke={n.ink}
                strokeWidth={e.width}
                strokeLinecap="round"
                opacity={selected === null || e.isSel ? 0.85 : 0.25}
              />
              <path d={arrowTip(e.x2, e.y2, e.ux, e.uy)} fill={n.ink} opacity={selected === null || e.isSel ? 0.95 : 0.25} />
            </g>
          );
        })}

        {/* R-22 — the documented panic exception: in a true stress the
            dollar itself bids with gold (dashed, the X ink) */}
        {dollarNode !== undefined ? (() => {
          const e = edgeIntoHub(dollarNode);
          return (
            <path
              d={`M${e.x1},${e.y1} Q${(e.x1 + e.x2) / 2 + 26},${(e.y1 + e.y2) / 2 - 26} ${e.x2},${e.y2}`}
              fill="none"
              stroke="var(--color-chip-ink-attention)"
              strokeWidth={1.3}
              strokeDasharray="4 4"
              opacity={selected === null || selected === "fear-and-stress" || selected === "the-dollar" ? 0.8 : 0.2}
            />
          );
        })() : null}

        {/* R-14 — borrowing costs feed the dollar (dashed, family to family) */}
        {crossPath !== null ? (
          <path
            d={crossPath}
            fill="none"
            stroke="var(--color-text-tertiary)"
            strokeWidth={1.1}
            strokeDasharray="3 4"
            opacity={selected === null || selected === "cost-of-money" || selected === "the-dollar" ? 0.75 : 0.2}
          />
        ) : null}

        {/* the hub — gold itself, the ounce's price */}
        <circle cx={hub.x} cy={hub.y} r={hubR} fill="var(--color-accent-gold)" stroke="var(--color-accent-gold-strong)" strokeWidth={2} />
        <text x={hub.x} y={hub.y + 6} textAnchor="middle" fontSize={17} fontWeight={900} fill="var(--color-accent-gold-ink)">Au</text>
        <text x={hub.x} y={hub.y + hubR + 16} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="var(--color-text-primary)">{t.hubWord}</text>
        <text x={hub.x} y={hub.y + hubR + 29} textAnchor="middle" fontSize={9.5} fill="var(--color-text-tertiary)">{t.hubNote}</text>

        {/* the family nodes — pills, clickable, the selected one ringed */}
        {nodes.map((n) => {
          const isSel = selected === n.family.id;
          const rx = n.x - n.w / 2;
          const ry = n.y - n.h / 2;
          return (
            <g
              key={`node-${n.family.id}`}
              onClick={() => onSelect(isSel ? null : n.family.id)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={rx}
                y={ry}
                width={n.w}
                height={n.h}
                rx={11}
                fill={`color-mix(in srgb, ${n.ink} 12%, transparent)`}
                stroke={isSel ? "var(--color-accent-gold-strong)" : `color-mix(in srgb, ${n.ink} 45%, transparent)`}
                strokeWidth={isSel ? 2 : 1.2}
              />
              <text x={n.x} y={n.y - 3} textAnchor="middle" fontSize={11.5} fontWeight={800} fill="var(--color-text-primary)">
                {n.family.title[lan0]}
              </text>
              <text x={n.x} y={n.y + 13} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--color-text-tertiary)">
                {locale === "fa" ? `${n.count} پیوند · ${n.letter}` : `${n.count} links · ${n.letter}`}
              </text>
              {/* the class letter chip, top-right — the letter rides with
                  the colour, never hue alone */}
              <circle cx={rx + n.w - 11} cy={ry + 11} r={8} fill={n.ink} />
              <text x={rx + n.w - 11} y={ry + 14} textAnchor="middle" fontSize={8.5} fontWeight={900} fill="white">{n.letter}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function RelationshipsBand({ t, locale }: { t: AnyT; locale: Locale }) {
  /* collapsed by default — the map is the deep reference layer; one tap
     opens the full family view */
  const [open, setOpen] = React.useState(false);
  /* the graph's own selection — a tapped family node shows its records
     below (batch H: the graph is the visual, the cards are the detail) */
  const [selected, setSelected] = React.useState<string | null>(null);
  const classes = ["M", "C", "X", "K"];
  const renderFamilyCard = (family: (typeof FORCE_FAMILIES)[number]) => {
    const records = familyRecords(family);
    const Icon = FAMILY_ICONS[family.icon] ?? Percent;
    return (
      <div key={family.id} className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]">
        <div className="flex flex-wrap items-start gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-currena-soft)] text-[var(--color-currena-blue-deep)]" aria-hidden="true">
            <Icon className="h-4 w-4" />
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
            <h4 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{family.title[lan(locale)]}</h4>
            <span className="type-caption text-[var(--color-text-tertiary)]">
              {fmtCount(records.length, locale)}
            </span>
          </div>
          <p className="m-0 hidden basis-full text-[11.5px] leading-snug text-[var(--color-text-tertiary)] sm:block">{family.effect[lan(locale)]}</p>
        </div>
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {records.map((r) => (
            <FamilyRecordRow key={r.id} r={r} t={t} locale={locale} />
          ))}
        </ul>
      </div>
    );
  };
  const selectedFamily = selected !== null ? FORCE_FAMILIES.find((f) => f.id === selected) ?? null : null;
  return (
    <section id="gold-relationships" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.eyebrow}</h2>
          <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.title}</h3>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "" : "-rotate-90 rtl:rotate-90"}`} aria-hidden="true" />
          {open ? t.hideLabel : t.showLabel}
        </button>
      </div>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.subtitle}</p>
      {open ? (
        <>
          {/* how to read it — one line, the legend beside it */}
          <div className="mt-2.5 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 ring-1 ring-[var(--color-border)]">
            <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.howToRead}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {classes.map((c) => (
                <span key={c} className="inline-flex items-center gap-1 type-caption text-[var(--color-text-secondary)]">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-extrabold text-white" style={{ background: CLASS_INK[c] }} aria-hidden="true">
                    {c}
                  </span>
                  {c === "M" ? t.legendM : c === "C" ? t.legendC : c === "X" ? t.legendX : t.legendK}
                </span>
              ))}
            </div>
          </div>

          {/* THE map — the real graph (batch H): six family nodes, one
              gold hub, arrows of pressure, dashed cross-links; tapping a
              node opens its records below */}
          <RelationshipGraph t={t} locale={locale} selected={selected} onSelect={setSelected} />

          {/* the records — the selected family's card, or all six; the
              cards are the reference layer under the visual */}
          {selectedFamily !== null ? (
            <div className="mt-3 flex min-w-0 flex-col gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="self-start inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
              >
                <ChevronDown className="h-3.5 w-3.5 rotate-180 rtl:-rotate-180" aria-hidden="true" />
                {t.allFamilies}
              </button>
              {renderFamilyCard(selectedFamily)}
            </div>
          ) : (
            <div className="mt-3 flex min-w-0 flex-1 flex-col gap-2 lg:grid lg:grid-cols-2 lg:content-start">
              {FORCE_FAMILIES.map(renderFamilyCard)}
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}

/** A small count in the locale's own digits ("4 links" style — the
 *  number only here, the records sit right under it). */
function fmtCount(n: number, locale: Locale): string {
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : "en-US").format(n);
  } catch {
    return String(n);
  }
}
