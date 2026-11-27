"use client";

/**
 * "Gold in 30 seconds" + the ATH record watch — the approved item C
 * (docs/gold-page/SESSION-3-PROMPT.md): the whole page's read in four
 * verdict rows and one record watch, for the reader who wants the
 * answer before the education.
 *
 * Rides existing routes only — no new route:
 *
 *   - the verdict rows (day / week / month / 1 year, up-down-sideways
 *     with the honest % and the house colors) read the SAME trend
 *     payload the briefing's table uses, passed in from the page's own
 *     query — one fetch, one cache, always in agreement with the
 *     Market Brief; each row carries its own source label;
 *   - the ATH record watch computes the highest close in the payload's
 *     5-year window and labels it exactly "the highest level in our
 *     stored price history (from {date})" — never an unqualified
 *     "all-time high" — plus the distance from it; the futures
 *     market's own 52-week high rides beside it (labeled COMEX, its
 *     own stamp) when that leg is up;
 *   - the why-it-moved line quotes ONLY numbers already fetched (the
 *     trend windows; the projection's percentile and from-peak context
 *     when loaded) — when no single driver dominates, the honest
 *     neutral sentence; causality is never invented; the full story
 *     stays in the Market Brief, one link away;
 *   - the disclaimer inside the box: descriptive, never advice.
 *
 * Additive programme note: this band is a NEW section — the copy lives
 * here, self-contained (content.ts is existing code and stays
 * untouched). The only plug-in edits are the mount + the nav chip in
 * page.tsx.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, faDigits } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";
import type { ProjectionPayload } from "@/components/gold-page/context-cards";

/* ------------------------------------------------------------------ *
 * The payloads this band rides
 * ------------------------------------------------------------------ */

/** The trend windows' own shape, mirrored minimally from the page's. */
export interface TrendWindowLite {
  range: "1D" | "7D" | "30D" | "3M" | "6M" | "1Y" | "5Y" | "YTD";
  asOf: string;
  spot: number;
  points: Array<{ d: string; v: number }>;
  chgPct: number | null;
  source: string;
}

/** The futures leg's own shape for the 52-week line (shared query key). */
interface FuturesLite {
  front: { contract: string; price: number | null; marketTime: string | null; fiftyTwoWeekHigh: number | null } | null;
  fetchedAt: string;
}

async function fetchFuturesLite(): Promise<FuturesLite> {
  const res = await fetch(`${deskBasePath}/api/gold/futures`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The futures API responded with ${res.status}`);
  return res.json() as Promise<FuturesLite>;
}

/** "HH:MM" off an ISO stamp, UTC — the house's honest clock. */
function utcHm(iso: string | null | undefined): string | null {
  if (iso === null || iso === undefined) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }).format(d);
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * The band's own copy — EN + fa, plain words
 * ------------------------------------------------------------------ */

const T = {
  en: {
    title: "Gold in 30 seconds",
    subtitle:
      "The whole page's read in four rows and one record watch — every number live, every verdict earned, each row naming the series that served it.",
    windows: { day: "Day", week: "Week", month: "Month", year: "1 year" },
    up: "up",
    down: "down",
    sideways: "sideways",
    sources: {
      "comex-session": "Today's COMEX session · level-aligned to spot",
      "comex-session-fallback": "The latest stored daily closes",
      "spot-store": "The stored spot closes",
      "comex-anchored": "The stitched 5-year series",
    } as Record<string, string>,
    recordTitle: "The record watch",
    recordLine: "The highest level in our stored price history (from {date}):",
    recordAt: "gold now trades at this level.",
    recordBelow: "gold now sits {pct}% below it.",
    recordAbove: "gold now sits {pct}% above it.",
    recordUnavailable: "The stored price history could not be read for the record watch.",
    futuresHighLine: "The futures market's own 52-week high: ${v} (COMEX, updated {time} UTC).",
    whyLead: "Why it moved: ",
    whyBody:
      "no single number explains a move — today read {day}%, the month {month}%, the year {year}%",
    whyContext: ", and gold sits {fromPeak}% below its ten-year peak, in the {pctile}th percentile of its ten-year range",
    whyClose: ". The forces behind these numbers are counted live in the Market Brief.",
    whyNeutral:
      "The why of a move is not a single number — the Market Brief counts the forces behind it, live.",
    briefingLink: "the Market Brief",
    disclaimer:
      "This box describes what the numbers say — it is not advice, not a forecast, and not a recommendation. Past performance never guarantees the future.",
    loadingLine: "…",
    unavailableLine: "The trend windows could not be read right now — nothing is shown rather than a guess.",
  },
  fa: {
    title: "طلا در ۳۰ ثانیه",
    subtitle:
      "خواندنِ کل صفحه در چهار ردیف و یک دیده‌بانِ رکورد — هر عدد زنده، هر حکم مستند، و هر ردیف سری‌ای را که به آن پاسخ داده نام می‌برد.",
    windows: { day: "روز", week: "هفته", month: "ماه", year: "۱ سال" },
    up: "بالاتر",
    down: "پایین‌تر",
    sideways: "ثابت",
    sources: {
      "comex-session": "جلسهٔ امروز کامکس · هم‌تراز با اسپات",
      "comex-session-fallback": "آخرین کلوزهای ذخیره‌شدهٔ روزانه",
      "spot-store": "کلوزهای ذخیره‌شدهٔ اسپات",
      "comex-anchored": "سریِ پیوستهٔ ۵ ساله",
    } as Record<string, string>,
    recordTitle: "دیده‌بان رکورد",
    recordLine: "بالاترین سطحِ تاریخچهٔ ذخیره‌شدهٔ ما (از {date}):",
    recordAt: "طلا هم‌اکنون در همین سطح معامله می‌شود.",
    recordBelow: "طلا هم‌اکنون {pct}٪ پایین‌تر از آن می‌نشیند.",
    recordAbove: "طلا هم‌اکنون {pct}٪ بالاتر از آن است.",
    recordUnavailable: "تاریخچهٔ ذخیره‌شدهٔ قیمت برای دیده‌بان رکورد خوانده نشد.",
    futuresHighLine: "بالاترین ۵۲ هفته‌ایِ خودِ بازار آتی: ${v} دلار (کامکس، به‌روزرسانی {time} UTC).",
    whyLead: "چرا حرکت کرد: ",
    whyBody: "هیچ عددی به‌تنهایی یک حرکت را توضیح نمی‌دهد — امروز {day}٪ خوانده شد، ماه {month}٪، سال {year}٪",
    whyContext: "، و طلا {fromPeak}٪ پایین‌تر از اوج ده‌ساله‌اش می‌نشیند، در صدک {pctile} از دامنهٔ ده‌ساله",
    whyClose: ". نیروهای پشت این عددها را «مرور بازار» زنده می‌شمارد.",
    whyNeutral: "چراییِ یک حرکت یک عدد نیست — «مرور بازار» نیروهای پشتش را زنده می‌شمارد.",
    briefingLink: "مرور بازار",
    disclaimer:
      "این جعبه توصیفِ آن چیزی است که عددها می‌گویند — نه توصیه، نه پیش‌بینی و نه دعوت به خرید یا فروش. بازدهٔ گذشته تضمین آینده نیست.",
    loadingLine: "…",
    unavailableLine: "پنجره‌های روند در حال حاضر خوانده نشدند — به‌جای حدس، هیچ‌چیز نشان داده نمی‌شود.",
  },
} as const;

/** The flat verdict band — the house's own 0.15% line. */
const FLAT_BAND = 0.15;

interface VerdictCell {
  key: "day" | "week" | "month" | "year";
  range: "1D" | "7D" | "30D" | "1Y";
}

const VERDICT_CELLS: VerdictCell[] = [
  { key: "day", range: "1D" },
  { key: "week", range: "7D" },
  { key: "month", range: "30D" },
  { key: "year", range: "1Y" },
];

export function ThirtySecondsBand({
  trends,
  trendsLoading,
  projection,
  locale,
  fmt,
}: {
  trends: TrendWindowLite[] | null;
  trendsLoading: boolean;
  projection: ProjectionPayload | null;
  locale: Locale;
  fmt: Fmt;
}) {
  const t = T[locale];

  /* the futures leg — the SAME cache the futures band rides (the
     52-week high line only; absent honestly when the leg is down) */
  const futures = useQuery({
    queryKey: ["currena-gold-futures"],
    queryFn: fetchFuturesLite,
    staleTime: 90 * 1000,
    retry: 1,
  });

  const byRange = React.useMemo(() => {
    const m = new Map<string, TrendWindowLite>();
    if (trends !== null) for (const w of trends) m.set(w.range, w);
    return m;
  }, [trends]);

  /* the record watch — the highest close in the 5-year window, never
     an unqualified "all-time high" */
  const record = React.useMemo(() => {
    const w5y = byRange.get("5Y");
    if (w5y === undefined || w5y.points.length === 0) return null;
    let best = w5y.points[0]!;
    for (const p of w5y.points) if (p.v > best.v) best = p;
    if (!Number.isFinite(best.v) || best.v <= 0) return null;
    const spot = w5y.spot;
    const dist = (spot / best.v - 1) * 100;
    return { high: best.v, date: best.d, dist };
  }, [byRange]);

  /* the projection's own context — percentile and from-peak, only when
     the projection actually arrived */
  const context = React.useMemo(() => {
    if (projection === null) return null;
    const g = projection.readings.find((r) => r.id === "gold-usd");
    if (g === undefined) return null;
    const pctile = g.percentile10y;
    const fromPeak = g.fromPeak10y;
    if (pctile === null || fromPeak === null || !Number.isFinite(pctile) || !Number.isFinite(fromPeak)) return null;
    return { pctile: Math.round(pctile * 100), fromPeak };
  }, [projection]);

  const futures52 = futures.data?.front?.fiftyTwoWeekHigh ?? null;
  const futuresHm = utcHm(futures.data?.front?.marketTime ?? null);

  /* the verdict ink — the house's up/down/gold law */
  const inkOf = (v: number | null): string => {
    if (v === null || !Number.isFinite(v)) return "var(--color-accent-gold-strong)";
    if (v > FLAT_BAND) return "var(--color-return-up)";
    if (v < -FLAT_BAND) return "var(--color-return-down)";
    return "var(--color-accent-gold-strong)";
  };

  /* the verdict label — the house's own word order: EN "up 8.9%",
     fa «۸٫۹٪ بالاتر» (the percent leads in Persian) */
  const verdictLabel = (v: number | null): string => {
    if (v === null || !Number.isFinite(v)) return "·";
    const pct = `${fmt.num(Math.abs(v), 1)}${locale === "fa" ? "٪" : "%"}`;
    if (v > FLAT_BAND) return locale === "fa" ? `${pct} ${t.up}` : `${t.up} ${pct}`;
    if (v < -FLAT_BAND) return locale === "fa" ? `${pct} ${t.down}` : `${t.down} ${pct}`;
    return locale === "fa" ? `${t.sideways} (${pct})` : `${t.sideways} (${pct})`;
  };

  return (
    <section
      id="gold-thirty-seconds"
      className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5"
      aria-label={t.title}
    >
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold leading-tight text-[var(--color-text-primary)]">
        <PackIcon file="gold-thirty-seconds.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      {trendsLoading && (trends === null || trends.length === 0) ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]" aria-live="polite" data-thirty-loading>
          {t.loadingLine}
        </p>
      ) : trends === null || trends.length === 0 ? (
        <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-tertiary)]" data-thirty-unavailable>
          {t.unavailableLine}
        </p>
      ) : (
        <>
          {/* the four verdict rows — day · week · month · year */}
          <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {VERDICT_CELLS.map(({ key, range }) => {
              const w = byRange.get(range);
              const v = w?.chgPct ?? null;
              const src = w !== undefined ? (t.sources[w.source] ?? null) : null;
              return (
                <div
                  key={key}
                  className="flex flex-col gap-1 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]"
                  data-verdict={key}
                >
                  <span className="type-caption font-bold text-[var(--color-text-tertiary)]">{t.windows[key]}</span>
                  <span className="text-[1.15rem] font-extrabold leading-tight tabular-nums" style={{ color: inkOf(v) }}>
                    {verdictLabel(v)}
                  </span>
                  <span className="text-[11px] leading-snug text-[var(--color-text-tertiary)]">
                    {w === undefined ? "·" : (src ?? w.source)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* the record watch — the loud gold box, never an unqualified
              "all-time high" */}
          <div
            className="mt-3 rounded-[var(--cr-radius-md)] px-3.5 py-3"
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 16%, transparent)",
              boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 45%, transparent)",
            }}
            data-record-watch
          >
            <h3 className="m-0 type-label font-bold text-[var(--color-accent-gold-deep)]">{t.recordTitle}</h3>
            {record !== null ? (
              <>
                <p className="m-0 mt-1 text-[1.02rem] font-black leading-snug text-[var(--color-accent-gold-deep)]">
                  {t.recordLine.replace("{date}", fmt.dateWords(record.date))}
                </p>
                <p className="m-0 mt-0.5 type-caption font-semibold leading-relaxed text-[var(--color-text-primary)]">
                  <bdi dir="ltr" className="tabular-nums font-extrabold">${fmt.num(record.high, 0)}</bdi>
                  {" — "}
                  {Math.abs(record.dist) < 0.05
                    ? t.recordAt
                    : (record.dist < 0 ? t.recordBelow : t.recordAbove).replace("{pct}", fmt.num(Math.abs(record.dist), 1))}
                </p>
              </>
            ) : (
              <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.recordUnavailable}</p>
            )}
            {/* the futures market's own 52-week high — its own stamp,
                only when that leg is up */}
            {futures52 !== null && futures52 > 0 ? (
              <p className="m-0 mt-1.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
                <bdi dir={locale === "fa" ? "rtl" : "ltr"}>
                  {t.futuresHighLine
                    .replace("${v}", `${locale === "fa" ? "" : "$"}${fmt.num(futures52, 0)}`)
                    .replace("{time}", futuresHm !== null ? (locale === "fa" ? faDigits(futuresHm) : futuresHm) : "·")}
                </bdi>
              </p>
            ) : null}
          </div>

          {/* the why-it-moved line — only numbers already fetched; the
              honest neutral sentence when no single driver dominates */}
          <p className="m-0 mt-3 type-caption leading-relaxed text-[var(--color-text-secondary)]" data-why-line>
            {(() => {
              const day = byRange.get("1D")?.chgPct ?? null;
              const month = byRange.get("30D")?.chgPct ?? null;
              const year = byRange.get("1Y")?.chgPct ?? null;
              const parts = [day, month, year];
              if (parts.every((p) => p === null)) {
                return <>{t.whyNeutral}</>;
              }
              /* the copy carries its own percent sign ({day}% / {day}٪) —
                 the number itself stays bare */
              const pctOf = (v: number | null): string => (v === null ? "·" : fmt.num(Math.abs(v), 1));
              return (
                <>
                  {t.whyLead}
                  {t.whyBody
                    .replace("{day}", pctOf(day))
                    .replace("{month}", pctOf(month))
                    .replace("{year}", pctOf(year))}
                  {context !== null
                    ? t.whyContext
                        .replace("{fromPeak}", fmt.num(Math.abs(context.fromPeak), 1))
                        .replace("{pctile}", fmt.num(context.pctile, 0))
                    : ""}
                  {t.whyClose}
                </>
              );
            })()}{" "}
            <a
              href="#gold-briefing"
              className="font-bold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-currena-blue)]/40 underline-offset-2 hover:decoration-[var(--color-currena-blue)]"
            >
              {t.briefingLink}
            </a>
          </p>

          {/* the disclaimer — descriptive, never advice */}
          <p className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 type-caption leading-relaxed text-[var(--color-text-tertiary)]">
            {t.disclaimer}
          </p>
        </>
      )}
    </section>
  );
}
