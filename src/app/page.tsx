"use client";

/**
 * The Currena gold page — `/gold`, THE gold card.
 *
 * The previous page's style and overall, kept: the site chrome (the
 * navbar, the breadcrumbs, the sticky section nav), the hero (the price
 * block + the focal BriefingCard), the composition stack (the brass
 * balance + the five lane bars), the signals strip, the 37 seats, the
 * Iran bridge chapter, the history tail — all on Currena's own design
 * tokens, bilingual EN + fa/RTL with the light/dark themes.
 *
 * The visual explanation layer (the point of this build): every force
 * gets its own explanatory shape — the brass see-saw for real yields,
 * the ounce's foreign price tags for the dollar, the traffic-light
 * gauge for stress, the split bar for inflation, the crowded room for
 * positioning — plus the five-forces spine, the scenario fan, the seats
 * grid, the episodes timeline and the if-you'd-bought bars. The market
 * series are served live from the desk's own observation store through
 * /api/gold; the conditions meter is the record snapshot.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";
import { Moon, Sun, Lightbulb, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  UI,
  LANES,
  LANE_CONTENT,
  VOTER_NAMES,
  SEAT_CONTENT,
  EPISODES,
  balanceOf,
  type LaneId,
  type Locale,
} from "@/lib/gold-page/content";
import {
  makeFmt,
  Sparkline,
  MiniSpark,
  BrassBalance,
  IfBoughtChart,
  SignedDelta,
  PpDelta,
  STATE_INK,
  TraceChart,
} from "@/components/gold-page/visuals";
import {
  TaBand,
  CentralBanksBand,
  VaultBand,
  PositionsBand,
  PremiumHistoryCard,
  RelationshipsBand,
  fetchTa,
  fetchCb,
  fetchLbma,
  fetchPremium,
  fetchPositions,
  fetchCorrelation,
  fetchIfBought,
  type PremiumPayload,
} from "@/components/gold-page/record";
import { CalculatorBand } from "@/components/gold-page/calculator";
import { PackIcon } from "@/components/gold-page/pack-icon";
import {
  bandWord,
  ContextTable,
  CurrencyGridCard,
  ForecastRetroCard,
  RATIO_IDS,
  PHYSICAL_IDS,
  fetchProjection,
  fetchCrosses,
  type ProjectionPayload,
  type CrossesPayload,
  type ProjectionReading,
} from "@/components/gold-page/context-cards";
import { BridgeBoard, fetchRates, type RatesPayload } from "@/components/gold-page/bridge-board";
import { DollarTrendBand, fetchDollarTrend } from "@/components/gold-page/dollar-trend";
import { LongViewCard } from "@/components/gold-page/longview";
import { CoinBuyerBand } from "@/components/gold-page/coin-buyer";
import { WgcCard } from "@/components/gold-page/wgc-card";
import { TeCard } from "@/components/gold-page/te-card";
import { CalendarBand } from "@/components/gold-page/calendar";
import { ScenariosBand } from "@/components/gold-page/scenarios";
import { CompareBand } from "@/components/gold-page/compare";
import { dollarTomanOf } from "@/lib/gold-page/coin-premium";
import { deskBasePath } from "@/lib/utils";

/* ------------------------------------------------------------------ *
 * The live payload's shape (from /api/gold)
 * ------------------------------------------------------------------ */

interface Point {
  d: string;
  v: number;
}
interface SeriesStat {
  series: Point[];
  last: number;
  asOf: string;
  chg30: number | null;
  /** Yields only: the daily change in percentage points (last − previous close). */
  chg1d?: number | null;
}
/** The history echo — when the market last traded at today's level. */
interface HistoryEchoPayload {
  mode: "return" | "window-extreme" | "window-range";
  days?: number;
  anchorDate?: string;
  high?: boolean;
}
interface GoldPayload {
  asOf: string;
  gold: {
    asOf: string;
    spot: number;
    chg7d: number | null;
    chg30d: number | null;
    chg90d: number | null;
    pctileYear: number | null;
    pctileDecade: number;
    historyEcho: HistoryEchoPayload | null;
    bars: Point[];
  };
  silver: SeriesStat | null;
  realYield: SeriesStat | null;
  nominalYield: SeriesStat | null;
  dxy: SeriesStat | null;
  usdjpy: SeriesStat | null;
  eurusd: SeriesStat | null;
  spx: SeriesStat | null;
  oil: SeriesStat | null;
}

/* The price card's own windows, every one the API serves. */
type TrendRange = "1D" | "7D" | "30D" | "3M" | "6M" | "1Y" | "5Y" | "YTD";
/* the briefing table's own ladder — every window, one organized table; the
   YTD (since the start of the Gregorian year) sits between 6 months and 1 year */
const TREND_RANGES: TrendRange[] = ["1D", "7D", "30D", "3M", "6M", "YTD", "1Y", "5Y"];
/* The reader's priority ladder — five trend chips max (day · week ·
   month · year · five years); the 3M/6M/YTD windows still live in the
   briefing's own table and the compare band, just not as chips here. */
const CHIP_RANGES: TrendRange[] = ["1D", "7D", "30D", "1Y", "5Y"];
interface TrendPayload {
  range: TrendRange;
  asOf: string;
  spot: number;
  points: Point[];
  chgPct: number | null;
  source: "spot-store" | "comex-anchored" | "comex-partial" | "comex-session" | "comex-session-fallback";
}

async function fetchTrend(range: TrendRange): Promise<TrendPayload> {
  const res = await fetch(`${deskBasePath}/api/gold/trend?range=${range}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The trend API responded with ${res.status}`);
  return res.json() as Promise<TrendPayload>;
}

/** Every window at once — the briefing's at-a-glance trend row. */
async function fetchTrendAll(): Promise<TrendPayload[]> {
  const res = await fetch(`${deskBasePath}/api/gold/trend?range=all`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The trend API responded with ${res.status}`);
  return res.json() as Promise<TrendPayload[]>;
}

async function fetchGold(): Promise<GoldPayload> {
  const res = await fetch(`${deskBasePath}/api/gold`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The gold API responded with ${res.status}`);
  return res.json() as Promise<GoldPayload>;
}

const lan = (l: Locale) => (l === "en" ? 0 : 1);

/* ------------------------------------------------------------------ *
 * The site chrome
 * ------------------------------------------------------------------ */

function CurrenaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="crCoin" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--bal-brass-hi)" />
          <stop offset="0.55" stopColor="var(--bal-brass-mid)" />
          <stop offset="1" stopColor="var(--bal-brass-lo)" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill="url(#crCoin)" />
      <circle cx="20" cy="20" r="14" fill="none" stroke="var(--bal-brass-ink)" strokeWidth="1.2" opacity="0.5" />
      <circle cx="20" cy="20" r="10" fill="none" stroke="var(--bal-brass-ink)" strokeWidth="1" opacity="0.35" />
      <rect x="12" y="17" width="3.2" height="7" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="17.2" y="13" width="3.2" height="11" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="22.4" y="15.4" width="3.2" height="8.6" rx="1.2" fill="var(--bal-brass-ink)" />
      <rect x="27" y="18.6" width="3" height="5.4" rx="1.2" fill="var(--bal-brass-ink)" opacity="0.75" />
    </svg>
  );
}

function Header({ t, locale, onToggleLang }: { t: typeof UI.en; locale: Locale; onToggleLang: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/92 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-[1080px] items-center gap-3 px-3 sm:px-6 lg:h-20 lg:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <CurrenaMark className="h-9 w-9 lg:h-10 lg:w-10" />
          <span className="flex flex-col leading-none">
            <span className="text-[1.05rem] font-extrabold tracking-tight text-[var(--color-text-primary)] lg:text-[1.2rem]">
              {t.nav.site}
            </span>
            <span className="mt-0.5 text-[9.5px] font-semibold text-[var(--color-accent-gold-deep)]">{t.nav.tagline}</span>
          </span>
        </a>
        <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="Site">
          {Object.values(t.nav.links).map((link, i) =>
            i === 1 ? (
              <span key={link} className="rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-sm font-bold text-[var(--color-currena-blue-deep)]">
                {link}
              </span>
            ) : (
              <span key={link} className="rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
                {link}
              </span>
            ),
          )}
        </nav>
        <div className="ms-auto flex items-center gap-2 lg:ms-0">
          <span className="hidden items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-currena-blue-deep)] sm:flex">
            <span className="live-dot inline-block h-2 w-2 rounded-full bg-[var(--color-currena-success)]" aria-hidden="true" style={{ background: "var(--color-currena-success)" }} />
            {t.nav.liveTag}
          </span>
          <button
            type="button"
            onClick={onToggleLang}
            aria-label={locale === "en" ? "فارسی" : "English"}
            className="min-h-[40px] min-w-[40px] rounded-xl bg-[var(--color-currena-soft)] px-3 text-sm font-extrabold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            {t.nav.langToggle}
          </button>
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            aria-label={dark ? "Light mode" : "Dark mode"}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[var(--color-currena-soft)] text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-border)] transition-transform hover:scale-[1.03] active:scale-95"
          >
            {mounted ? dark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

const NAV_SECTIONS: ReadonlyArray<{ id: string; key: keyof typeof UI.en.nav | null; label: [string, string] }> = [
  { id: "gold-briefing", key: null, label: ["Briefing", "مرور"] },
  { id: "gold-balance", key: null, label: ["Balance", "ترازو"] },
  { id: "gold-scenarios", key: null, label: ["Scenarios", "سناریوها"] },
  { id: "gold-compare", key: null, label: ["Compare", "مقایسه"] },
  { id: "gold-ta", key: null, label: ["Levels", "سطوح"] },
  { id: "gold-cb", key: null, label: ["Central banks", "بانک‌ها"] },
  { id: "gold-positions", key: null, label: ["Positions", "پوزیشن"] },
  { id: "gold-other", key: null, label: ["Other", "سایر"] },
  { id: "gold-dashboard", key: null, label: ["Dashboard", "داشبورد"] },
  { id: "gold-bridge", key: null, label: ["Iran", "ایران"] },
  { id: "gold-dollar-trend", key: null, label: ["Gold vs USD", "طلا و دلار"] },
  { id: "gold-calculator", key: null, label: ["Calculator", "ماشین حساب"] },
  { id: "gold-relationships", key: null, label: ["Map", "نقشه"] },
  { id: "gold-history", key: null, label: ["History", "تاریخ"] },
];

function SectionNav({ locale }: { locale: Locale }) {
  const [active, setActive] = React.useState<string | null>(null);
  React.useEffect(() => {
    const targets = NAV_SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => el !== null);
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px" },
    );
    targets.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [locale]);
  return (
    <nav
      aria-label={locale === "en" ? "Sections" : "بخش‌ها"}
      className="chip-scroller sticky top-16 z-30 mt-2 border-y border-[var(--color-border)] bg-[var(--color-currena-bg-light)]/92 px-3 backdrop-blur sm:px-6 lg:top-20"
    >
      <div className="mx-auto flex w-full max-w-[1080px] gap-1.5 overflow-x-auto py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV_SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className={`flex h-9 shrink-0 items-center rounded-full px-3.5 text-[13px] font-bold transition-colors ${
              active === s.id
                ? "bg-[var(--color-currena-blue)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {s.label[lan(locale)]}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ------------------------------------------------------------------ *
 * The hero — the price block + the focal BriefingCard
 * ------------------------------------------------------------------ */

/** The troy ounce's metric weight, shown beside the big price. */
const TROY_OUNCE_GRAMS = 31.1;

/** "about {n} ago" — the humanized lookback phrase, word-numbers 1–10. */
function echoLookback(days: number, t: typeof UI.en, fmt: ReturnType<typeof makeFmt>): string {
  const words = t.price.echo.words as Record<number, string>;
  const count = (n: number): string => (n >= 1 && n <= 10 ? words[n] : fmt.num(n, 0));
  let phrase: string;
  if (days < 14) {
    phrase = `${count(days)} ${t.price.echo.units.day}${days > 1 && localeEN(t) ? "s" : ""}`;
  } else if (days < 70) {
    const w = Math.round(days / 7);
    phrase = `${count(w)} ${t.price.echo.units.week}${w > 1 && localeEN(t) ? "s" : ""}`;
  } else if (days < 730) {
    const m = Math.max(2, Math.round(days / 30.44));
    phrase = `${count(m)} ${t.price.echo.units.month}${m > 1 && localeEN(t) ? "s" : ""}`;
  } else {
    const y = Math.max(1, Math.round(days / 365.25));
    phrase = `${count(y)} ${t.price.echo.units.year}${y > 1 && localeEN(t) ? "s" : ""}`;
  }
  return phrase;
}

/** English words pluralize; Persian never does. */
function localeEN(t: typeof UI.en): boolean {
  return t.dir === "ltr";
}

/**
 * The chart's direction ink (the owner's batch-H ask): green when the
 * selected window rises, a red that DEEPENS with the fall's severity
 * (a mild −1% reads a muted brick, a −8% or worse reads the full
 * alert ink), and the house gold when the window is flat or unread.
 */
function directionInk(chgPct: number | null | undefined): string {
  if (chgPct === null || chgPct === undefined || !Number.isFinite(chgPct)) {
    return "var(--color-accent-gold-strong)";
  }
  if (chgPct > 0.15) return "var(--color-return-up)";
  if (chgPct < -0.15) {
    const severity = Math.min(1, Math.abs(chgPct) / 8); // −8% or worse = full severity
    const pct = Math.round(45 + severity * 55); // 45% → 100% of the red ink
    return `color-mix(in srgb, var(--color-return-down) ${pct}%, var(--color-text-tertiary))`;
  }
  return "var(--color-accent-gold-strong)";
}

/** The history-echo line — when the market last traded at today's level. */
function echoLine(
  echo: HistoryEchoPayload | null | undefined,
  t: typeof UI.en,
  fmt: ReturnType<typeof makeFmt>,
): string | null {
  if (!echo) return null;
  if (echo.mode === "window-range") return t.price.echo.range;
  if (echo.mode === "window-extreme") return echo.high ? t.price.echo.extremeHigh : t.price.echo.extremeLow;
  if (!echo.days || echo.days < 1) return null;
  return t.price.echo.line.replace("{n}", echoLookback(echo.days, t, fmt));
}

function PriceCard({ data, t, fmt, echo }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; echo: string | null }) {
  const g = data.gold;
  const [range, setRange] = React.useState<TrendRange>("30D");
  const trend = useQuery({
    queryKey: ["currena-gold-trend", range],
    queryFn: () => fetchTrend(range),
    placeholderData: (prev: TrendPayload | undefined) => prev,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const values = React.useMemo(
    () => (trend.data ? trend.data.points.map((p) => p.v) : []),
    [trend.data],
  );
  const sourceNote =
    trend.data && trend.data.source !== "spot-store"
      ? (t.price.sourceNotes as Record<string, string>)[trend.data.source] ?? null
      : null;
  /* the chart's direction ink — green when the window rises, a red
     that deepens with the fall's severity; the breathing dot beside
     the header carries the same ink (the live-graph mark) */
  const chartInk = directionInk(trend.data?.chgPct ?? null);
  /* the per-gram price — the gram every reader actually buys in */
  const perGram = g.spot / TROY_OUNCE_GRAMS;
  const gramText = t.dir === "ltr" ? `$${fmt.num(perGram, 2)}` : `${fmt.num(perGram, 2)} دلار`;
  return (
    <section className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:p-5" aria-label={t.price.eyebrow}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0 text-[var(--color-text-primary)]">{t.price.eyebrow}</h2>
        <span
          className="live-dot-breathe h-2 w-2 rounded-full"
          style={{ background: chartInk }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
        <bdi dir="ltr" className="type-number-hero m-0 text-[var(--color-text-primary)]">
          {fmt.usd(g.spot)}
        </bdi>
        <span className="flex items-center gap-1.5">
          <SignedDelta v={g.chg7d} fmt={fmt} />
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.price.windows.d7}</span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1">
          <span className="type-caption font-bold text-[var(--color-text-primary)]">{t.price.gramPrice}:</span>
          <bdi dir="ltr" className="type-label font-black tabular-nums text-[var(--color-text-primary)]">{gramText}</bdi>
        </span>
        <span className="type-caption text-[var(--color-text-tertiary)]">
          {t.price.gramLine.replace("{g}", fmt.num(TROY_OUNCE_GRAMS, 1))}
        </span>
      </div>

      {/* the trend range — the five priority chips: day · week · month · year · five years */}
      <div role="tablist" aria-label={t.price.trendLabel} className="mt-3 flex flex-wrap gap-1.5">
        {CHIP_RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={r === range}
            onClick={() => setRange(r)}
            className={`flex h-8 shrink-0 items-center rounded-full px-3 text-[12px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)] ${
              r === range
                ? "bg-[var(--color-currena-blue)] text-white"
                : "bg-[var(--color-surface)] text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {t.price.ranges[r]}
          </button>
        ))}
      </div>

      <div className={`mt-2.5 transition-opacity ${trend.isFetching ? "opacity-60" : "opacity-100"}`} aria-busy={trend.isFetching}>
        {trend.data !== undefined && trend.data.points.length >= 2 ? (
          <TraceChart
            series={[
              {
                label: t.price.eyebrow,
                color: chartInk,
                points: trend.data.points,
                fill: true,
                lineWidth: 2.6,
              },
            ]}
            height={300}
            yFormat={(v) => `$${fmt.num(v, 0)}`}
            fmt={fmt}
            ariaLabel={`${t.price.series}, ${t.price.ranges[range]} trend`}
            hoverNote={(_s, v, first) => (first > 0 ? fmt.pct((v / first - 1) * 100) : null)}
            pricePoints
          />
        ) : (
          <Sparkline
            values={values}
            width={340}
            height={92}
            color={chartInk}
            fill
            ariaLabel={`${t.price.series}, ${t.price.ranges[range]} trend`}
          />
        )}
      </div>
      <dl className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="type-caption text-[var(--color-text-secondary)]">{t.price.series}</dt>
          <dd className="flex items-center gap-2">
            <span className="type-caption text-[var(--color-text-secondary)]">{t.price.ranges[range]}</span>
            <SignedDelta v={trend.data?.chgPct ?? null} fmt={fmt} />
          </dd>
        </div>
      </dl>
      {sourceNote !== null ? (
        <p className="m-0 mt-1.5 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{sourceNote}</p>
      ) : null}

      {/* THE retracement sentence — mentioned exactly once on the page,
          bold and unmissable at the foot of the gold-price box */}
      {echo !== null ? (
        <p
          className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3.5 py-2.5 text-[1.02rem] font-black leading-snug text-[var(--color-text-primary)] ring-1 ring-[var(--color-accent-gold)]/50 sm:text-[1.1rem]"
          data-price-echo
        >
          <span aria-hidden="true" className="me-1.5 inline-block text-[var(--color-accent-gold-deep)]">↺</span>
          {echo}
        </p>
      ) : null}
    </section>
  );
}

function BriefingCard({ t, fmt, balance, locale }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; balance: ReturnType<typeof balanceOf>; locale: Locale }) {
  const reasonSeats: ReadonlyArray<{ lane: LaneId; seatId: string }> = [
    { lane: "borrowing-costs", seatId: "real-yield-10y" },
    { lane: "dollar", seatId: "dollar-basket" },
    { lane: "stress", seatId: "stress-stlfsi" },
    { lane: "inflation", seatId: "us-cpi-yoy" },
    { lane: "flows", seatId: "cftc-gold-positioning" },
  ];
  /* every trend window at once — no clicking, the list simply shows */
  const trends = useQuery({
    queryKey: ["currena-gold-trend-all"],
    queryFn: fetchTrendAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  /* the factor modal — one dialog, driven by the opened seat's id. */
  const [openSeat, setOpenSeat] = React.useState<string | null>(null);
  const lastTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const seatOf = (seatId: string | null) => {
    if (seatId === null) return null;
    const lane = reasonSeats.find((r) => r.seatId === seatId);
    if (!lane) return null;
    const content = SEAT_CONTENT[seatId];
    const seat = balance.lanes.find((l) => l.lane === lane.lane);
    const state = seat ? (seat.side === "for" ? "supports" : seat.side === "against" ? "pressures" : "steady") : "steady";
    const ink = STATE_INK[state as "supports"];
    const seatWord = state === "supports" ? t.seats.seatSupports : state === "pressures" ? t.seats.seatPressures : t.seats.seatSteady;
    return { seatId, content, ink, seatWord };
  };
  const openContent = seatOf(openSeat);
  return (
    <section id="gold-briefing" className="gold-focal-field flex flex-col rounded-[var(--cr-radius-lg)] p-4 ring-2 ring-[var(--color-accent-gold)]/40 sm:p-5" aria-label={t.briefing.eyebrow}>
      <h2 className="type-kicker m-0" style={{ color: "var(--bal-brass-text)" }}>
        {t.briefing.eyebrow}
      </h2>
      <h3 className="type-verdict m-0 mt-1.5 text-[var(--color-text-primary)]" data-briefing-headline>
        {t.briefing.headline}
      </h3>

      <p className="m-0 mt-2 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">
        <span className="font-bold text-[var(--color-chip-ink-attention)]">{t.briefing.assessment}</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2" data-briefing-horizons>
        <span className="inline-flex flex-wrap items-baseline gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]">
          {t.briefing.chipMonths}
          <span className="font-bold text-[var(--color-chip-ink-attention)]">· {t.briefing.chipMonthsLean}</span>
        </span>
      </div>

      {/* the trend table — every window's change in one organized table,
          visible without a click: day · week · month · 3m · 6m · 1y · 5y · YTD.
          The PERCENT is the number (big and bold — the owner's ask); the
          then→now price path beside it whispers (small, muted, still
          legible), and the rows breathe (the owner's ask). */}
      <div className="mt-3.5">
        <h4 className="type-label m-0 flex items-center gap-2 font-extrabold text-[var(--color-text-primary)]">
          <PackIcon file="gold-price-up-or-down.png" size={26} className="h-[26px] w-[26px]" />
          {t.briefing.trendTitle}
        </h4>
        <div className="mt-2 min-w-0 overflow-hidden rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
          <table className="m-0 w-full border-collapse bg-[var(--color-currena-bg-light)] type-caption" aria-label={t.briefing.trendTitle}>
            <tbody>
              {trends.isLoading || trends.data === undefined ? (
                <tr>
                  <td colSpan={2} className="px-3 py-2 text-[var(--color-text-tertiary)]" aria-live="polite">…</td>
                </tr>
              ) : (
                TREND_RANGES.filter((r) => trends.data.some((w) => w.range === r)).map((r) => {
                  const w = trends.data.find((x) => x.range === r);
                  if (w === undefined) return null;
                  /* the relative prices — the window's own start price → now,
                     whispering beside the percentage (never shouting) */
                  const startPrice = w.points.length >= 2 ? w.points[0]!.v : null;
                  const priceCell =
                    startPrice !== null ? (
                      <bdi dir="ltr" className="text-[11px] font-normal tabular-nums text-[var(--color-text-tertiary)] opacity-75">
                        ${fmt.num(startPrice, 0)} <span aria-hidden="true">→</span> ${fmt.num(w.spot, 0)}
                      </bdi>
                    ) : null;
                  return (
                    <tr key={r} className="border-t border-[var(--color-border)] first:border-t-0">
                      <th scope="row" className="px-3 py-2.5 text-start font-bold text-[var(--color-text-primary)]">
                        {t.price.windowNames[r]}
                      </th>
                      <td className="px-3 py-2.5 text-end">
                        <span className="flex flex-wrap items-baseline justify-end gap-x-2.5 gap-y-1">
                          {priceCell}
                          <SignedDelta v={w.chgPct} fmt={fmt} big />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="type-label m-0 flex items-center gap-2 font-extrabold text-[var(--color-text-primary)]">
          <PackIcon file="gold-price-influential-factors.png" size={26} className="h-[26px] w-[26px]" />
          {t.briefing.whyTitle}
        </h4>
        <div className="mt-2 flex flex-col gap-2">
          {reasonSeats.map(({ lane, seatId }) => {
            const content = SEAT_CONTENT[seatId];
            const seat = balance.lanes.find((l) => l.lane === lane);
            const state = seat ? (seat.side === "for" ? "supports" : seat.side === "against" ? "pressures" : "steady") : "steady";
            const ink = STATE_INK[state as "supports"];
            const seatWord = state === "supports" ? t.seats.seatSupports : state === "pressures" ? t.seats.seatPressures : t.seats.seatSteady;
            return (
              <button
                key={seatId}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={openSeat === seatId}
                aria-label={t.briefing.factorButton.replace("{name}", content[locale][0])}
                onClick={(e) => {
                  lastTriggerRef.current = e.currentTarget;
                  setOpenSeat(seatId);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 text-start ring-1 ring-[var(--color-border)] transition-colors hover:bg-[var(--color-currena-soft)] hover:ring-[var(--color-accent-gold)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-gold)]"
              >
                <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="type-caption font-bold" style={{ color: ink.ink }}>
                    {ink.glyph} {seatWord}
                  </span>
                  <span className="type-label font-bold text-[var(--color-text-primary)]">{content[locale][0]}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-tertiary)] rtl:rotate-180" aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </div>

      {/* the factor explanation modal */}
      <Dialog
        open={openSeat !== null}
        onOpenChange={(o) => {
          if (!o) {
            setOpenSeat(null);
            const trigger = lastTriggerRef.current;
            // Radix restores focus to its own (unknown) trigger after close —
            // hand the focus back to the pressed card right after that.
            window.setTimeout(() => trigger?.focus(), 0);
          }
        }}
      >
        {openContent !== null ? (
          <DialogContent className="rounded-[var(--cr-radius-lg)] border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-start ring-1 ring-[var(--color-border)] sm:p-5 sm:max-w-[440px]">
            <DialogHeader className="text-start pe-11">
              <p className="type-caption m-0 font-bold" style={{ color: openContent.ink.ink }}>
                {openContent.ink.glyph} {openContent.seatWord}
              </p>
              <DialogTitle className="type-label text-start text-[var(--color-text-primary)]">
                {openContent.content[locale][0]}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="m-0 type-label leading-relaxed text-[var(--color-text-secondary)] pe-11">
              {openContent.content[locale][1]}
            </DialogDescription>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The composition stack — the balance + the five lane bars
 * ------------------------------------------------------------------ */

function BalanceCard({ t, fmt, locale, balance }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; balance: ReturnType<typeof balanceOf> }) {
  const verdict = balance.net < 0 ? "against" : balance.net > 0 ? "for" : "balanced";
  /* the counted record's modal — one dialog, driven by the opened box */
  const [openBox, setOpenBox] = React.useState<"for" | "against" | null>(null);
  const lastTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  return (
    <section id="gold-balance" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0" style={{ color: "var(--bal-brass-text)" }}>
          {t.balance.eyebrow}
        </h2>
      </div>
      <h3 className="m-0 mt-1.5 text-[1.2rem] font-extrabold leading-tight text-[var(--color-text-primary)] sm:text-[1.35rem]">{t.balance.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.balance.subtitle}</p>

      <div className="mt-2">
        <BrassBalance
          readings={balance.lanes}
          verdict={verdict}
          locale={locale}
          trayTitle={t.balance.trayTitle}
          trayNote={t.balance.trayNote}
          fmt={fmt}
          sideLabels={{
            for: t.balance.verdictFor,
            against: t.balance.verdictAgainst,
            balanced: t.balance.verdictBalanced,
            noneFor: t.balance.sideFor,
            noneAgainst: t.balance.sideAgainst,
          }}
        />
      </div>

      {/* the two boxes — neutral containers; the TITLE rides its own
          red/green background wrapper (the contrast layer), each force
          rides a red/green chip with a bullet marker; the counted record
          (موافق/مخالف/بی‌طرف) opens only on click */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {([
          {
            key: "against" as const,
            title: t.balance.sideAgainst,
            lanes: balance.lanes.filter((l) => l.side === "against"),
            chip: "color-mix(in srgb, var(--color-return-down) 10%, transparent)",
            chipRing: "color-mix(in srgb, var(--color-return-down) 38%, transparent)",
            ink: "var(--color-return-down)",
            glyph: "▼",
            label: locale === "en" ? "Open the counted record" : "باز کردن شمارش",
          },
          {
            key: "for" as const,
            title: t.balance.sideFor,
            lanes: balance.lanes.filter((l) => l.side === "for"),
            chip: "color-mix(in srgb, var(--color-return-up) 10%, transparent)",
            chipRing: "color-mix(in srgb, var(--color-return-up) 38%, transparent)",
            ink: "var(--color-return-up)",
            glyph: "▲",
            label: locale === "en" ? "Open the counted record" : "باز کردن شمارش",
          },
        ]).map((b) => (
          <button
            key={b.key}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={openBox === b.key}
            onClick={(e) => {
              lastTriggerRef.current = e.currentTarget;
              setOpenBox(b.key);
            }}
            className="flex min-h-[44px] flex-col items-start gap-2 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3.5 text-start ring-1 ring-[var(--color-border)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-gold)] hover:bg-[var(--color-currena-soft)]"
          >
            <span
              className="inline-flex min-h-[36px] items-center gap-2 self-start rounded-full px-3 py-1.5 type-label font-extrabold"
              style={{
                backgroundColor: `color-mix(in srgb, ${b.key === "against" ? "var(--color-return-down)" : "var(--color-return-up)"} 16%, transparent)`,
                color: b.ink,
                boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${b.key === "against" ? "var(--color-return-down)" : "var(--color-return-up)"} 45%, transparent)`,
              }}
            >
              <span aria-hidden="true" className="text-[0.8em] leading-none">{b.glyph}</span>
              {b.title}
            </span>
            {b.lanes.length > 0 ? (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {b.lanes.map((l) => (
                  <li key={l.lane}>
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 type-caption font-bold"
                      style={{ backgroundColor: b.chip, color: b.ink, boxShadow: `inset 0 0 0 1px ${b.chipRing}` }}
                    >
                      <span aria-hidden="true" className="text-[0.85em] leading-none">•</span>
                      {LANE_CONTENT[l.lane].label[lan(locale)]}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="type-caption text-[var(--color-text-tertiary)]">
                {locale === "en" ? "nothing on this side today" : "امروز چیزی در این سمت نیست"}
              </span>
            )}
            <span className="mt-auto inline-flex items-center gap-1 type-caption font-bold text-[var(--color-text-tertiary)]">
              {b.label}
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      <p className="m-0 mt-2 text-center type-caption text-[var(--color-text-tertiary)]">{t.balance.countHint}</p>

      <div className="mt-3 border-t border-[var(--color-border)] pt-3">
        <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.balance.honesty}</p>
      </div>

      {/* the counted record — the modal (the موافق/مخالف/بی‌طرف numbers,
          only ever shown here, behind the click) */}
      <Dialog
        open={openBox !== null}
        onOpenChange={(o) => {
          if (!o) {
            setOpenBox(null);
            const trigger = lastTriggerRef.current;
            window.setTimeout(() => trigger?.focus(), 0);
          }
        }}
      >
        {openBox !== null ? (
          <DialogContent className="rounded-[var(--cr-radius-lg)] border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-start ring-1 ring-[var(--color-border)] sm:p-5 sm:max-w-[480px]">
            <DialogHeader className="text-start pe-11">
              <DialogTitle className="type-label text-start text-[var(--color-text-primary)]">
                {openBox === "against" ? t.balance.sideAgainst : t.balance.sideFor}
              </DialogTitle>
              <DialogDescription className="sr-only">
                {locale === "en" ? "The counted record behind this side of the balance." : "رکورد شمارش‌شدهٔ پشت این سمتِ ترازو."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto scroll-slim pe-11">
              {(openBox === "against" ? balance.lanes.filter((l) => l.side === "against") : balance.lanes.filter((l) => l.side === "for")).map((l) => (
                <div key={l.lane} className="flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <span className="type-label font-bold text-[var(--color-text-primary)]">
                      {LANE_CONTENT[l.lane].label[lan(locale)]}
                    </span>
                    <span className="type-caption text-[var(--color-text-tertiary)]">
                      {t.balance.tally
                        .replace("{s}", fmt.num(l.supports, 0))
                        .replace("{p}", fmt.num(l.pressures, 0))
                        .replace("{st}", fmt.num(l.steady, 0))
                        .replace("{u}", fmt.num(l.unread, 0))}
                    </span>
                  </div>
                  <ul className="m-0 flex list-none flex-col gap-0.5 p-0">
                    {l.members.map((m) => {
                      const ink = STATE_INK[m.state];
                      return (
                        <li key={m.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="w-[1.1rem] shrink-0 text-center text-[11px] font-bold" style={{ color: ink.chip }} aria-hidden="true">
                            {ink.glyph}
                          </span>
                          <span className="type-caption font-semibold text-[var(--color-text-primary)]">
                            {VOTER_NAMES[m.id][lan(locale)]}
                          </span>
                          <span className="ms-auto type-caption font-bold" style={{ color: ink.ink }}>
                            {m.state === "supports"
                              ? t.seats.seatSupports
                              : m.state === "pressures"
                                ? t.seats.seatPressures
                                : m.state === "steady"
                                  ? t.seats.seatSteady
                                  : t.seats.seatUnread}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The dashboard — the key indicators at a glance
 * ------------------------------------------------------------------ */

/* One yield card — the true series (FRED daily close) under its honest
 * name, with the daily change in percentage points, its own as-of date
 * and the FRED provenance line. Fail-closed: no stored series, no card
 * (the block degrades to the remaining indicators, never a guess). */
function YieldCard({ name, stat, fmt, t }: { name: string; stat: SeriesStat | null; fmt: ReturnType<typeof makeFmt>; t: typeof UI.en.indicators }) {
  if (stat === null) return null;
  return (
    <div className="flex items-center gap-3 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2 ring-1 ring-[var(--color-border)]">
      <div className="min-w-0 flex-1">
        <p className="m-0 type-caption font-semibold text-[var(--color-text-primary)]">{name}</p>
        <p className="m-0 mt-0.5 flex flex-wrap items-baseline gap-2">
          <bdi dir="ltr" className="type-label font-bold text-[var(--color-text-primary)]">
            {fmt.num(stat.last, 2)}%
          </bdi>
          <PpDelta v={stat.chg1d ?? null} fmt={fmt} unit={t.unitPp} />
        </p>
        <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.fredDaily.replace("{date}", fmt.dateWords(stat.asOf))}</p>
      </div>
      <MiniSpark values={stat.series.map((p) => p.v)} />
    </div>
  );
}

function DashboardBand({
  data,
  t,
  fmt,
  locale,
  projection,
  crosses,
  tomanPerOunce,
}: {
  data: GoldPayload;
  t: typeof UI.en;
  fmt: ReturnType<typeof makeFmt>;
  locale: Locale;
  projection: ProjectionPayload | null;
  crosses: CrossesPayload | null;
  tomanPerOunce: number | null;
}) {
  const yieldsAligned =
    data.realYield !== null &&
    data.nominalYield !== null &&
    data.realYield.asOf === data.nominalYield.asOf;
  const breakeven =
    data.realYield !== null && data.nominalYield !== null
      ? data.nominalYield.last - data.realYield.last
      : null;
  const rows = [
    { name: t.indicators.dxy, stat: data.dxy, unit: "" },
    { name: t.indicators.usdjpy, stat: data.usdjpy, unit: "" },
    { name: t.indicators.silver, stat: data.silver, unit: "$" },
    { name: t.indicators.spx, stat: data.spx, unit: "" },
    { name: t.indicators.oil, stat: data.oil, unit: "$" },
  ].filter((r) => r.stat !== null) as Array<{ name: string; stat: SeriesStat; unit: string }>;
  /* the merged context layer — the top ratios + the currency grid live
     HERE; the rest of the ratios sit behind one expand; the physical
     market has its own section now; the forecast retrospective stays */
  const byId = React.useMemo(() => {
    const m = new Map<string, ProjectionReading>();
    if (projection !== null) {
      for (const r of projection.readings) m.set(r.id, r);
    }
    return m;
  }, [projection]);
  /* the top ratios — the classic trio the gold crowd actually watches,
     now MERGED into the indicator grid as first-class cards (the
     owner's batch-H consolidation: the dashboard and the ratios are
     one block, no top-set preview duplicated below) */
  /* batch L (task 7): the top ratio trio (gold/silver, gold/oil, the
     real gold price) carried no mini graphs — the projection leg has no
     series to draw them from — so per the owner's own alternative every
     ratio rides the expandable table below the indicator grid, whose
     rows DO carry their sparks */
  const restRatios = RATIO_IDS;
  const [allRatios, setAllRatios] = React.useState(false);
  return (
    <section id="gold-dashboard" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.indicators.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.indicators.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.indicators.subtitle}</p>
      {/* the two yields — side by side (the real-yield re-sourcing: the
          true 10-year TIPS real yield and the 10-year nominal, FRED
          daily closes, each card carrying its source, its as-of and its
          daily change in pp); the derived breakeven rides beneath,
          only when the pair shares the same FRED calendar day */}
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2" data-yield-pair>
        <YieldCard name={t.indicators.realYield} stat={data.realYield} fmt={fmt} t={t.indicators} />
        <YieldCard name={t.indicators.nominalYield} stat={data.nominalYield} fmt={fmt} t={t.indicators} />
      </div>
      {yieldsAligned && breakeven !== null && Number.isFinite(breakeven) ? (
        <p className="m-0 mt-1.5 type-caption text-[var(--color-text-secondary)]" data-yield-breakeven>
          {t.indicators.breakeven.replace("{v}", fmt.num(breakeven, 2))}
        </p>
      ) : null}
      <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] px-3 py-2 ring-1 ring-[var(--color-border)]">
            <div className="min-w-0 flex-1">
              <p className="m-0 type-caption font-semibold text-[var(--color-text-primary)]">{r.name}</p>
              <p className="m-0 mt-0.5 flex items-baseline gap-2">
                <bdi dir="ltr" className="type-label font-bold text-[var(--color-text-primary)]">
                  {r.unit === "$" ? "$" : r.unit === "%" ? "" : ""}
                  {fmt.num(r.stat.last, r.unit === "%" ? 2 : r.unit === "$" ? 2 : 1)}
                  {r.unit === "%" ? "%" : ""}
                </bdi>
                <SignedDelta v={r.stat.chg30} fmt={fmt} />
                <span className="type-caption text-[var(--color-text-tertiary)]">{t.indicators.d30}</span>
              </p>
            </div>
            <MiniSpark values={r.stat.series.map((p) => p.v)} />
          </div>
        ))}
      </div>

      {/* the remaining ratios — behind one expand (the top trio now lives
          in the indicator grid above); the currency grid + the forecast
          retrospective ride in the open, as before */}
      {projection !== null ? (
        <div className="mt-4 flex min-w-0 flex-col gap-2.5">
          <button
            type="button"
            aria-expanded={allRatios}
            onClick={() => setAllRatios((o) => !o)}
            className="self-start inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
          >
            {allRatios
              ? locale === "en" ? "hide the other ratios" : "بستن بقیهٔ نسبت‌ها"
              : locale === "en" ? `show the other ${restRatios.length} ratios` : `بقیهٔ ${fmt.num(restRatios.length, 0)} نسبت‌ها`}
            <span aria-hidden="true" className={`text-[10px] transition-transform ${allRatios ? "rotate-180" : ""}`}>▾</span>
          </button>
          {allRatios ? (
            <ContextTable
              rows={restRatios.map((c) => ({ id: c.id, name: c.name, meaning: t.contextCards[c.meaning] as string, unit: c.unit }))}
              byId={byId}
              t={t.contextCards}
              fmt={fmt}
              locale={locale}
            />
          ) : null}
          {/* the currency grid — the ratios group's sub-card, open by default */}
          <CurrencyGridCard crosses={crosses} tomanPerOunce={tomanPerOunce} t={t.currencyGrid} fmt={fmt} locale={locale} />
        </div>
      ) : (
        <p className="m-0 mt-4 type-caption text-[var(--color-text-tertiary)]">{t.contextCards.unavailable}</p>
      )}

      {/* the forecast retrospective — the compact, retitled card */}
      <div className="mt-4">
        <ForecastRetroCard t={t.forecastRetro} fmt={fmt} locale={locale} />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Other indicators — سایر شاخص‌ها (the owner's batch-H consolidation):
 * the physical market and the London vault, one section at the page's
 * foot — the supporting numbers, one card, two sub-blocks
 * ------------------------------------------------------------------ */

function PhysicalBand({ t, fmt, locale, projection, vault }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; projection: ProjectionPayload | null; vault: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const byId = React.useMemo(() => {
    const m = new Map<string, ProjectionReading>();
    if (projection !== null) {
      for (const r of projection.readings) m.set(r.id, r);
    }
    return m;
  }, [projection]);
  /* the verdict — the Shanghai premium is the market's own sensor for
     where the physical buyer is; it carries the whole one-line verdict */
  const premiumReading = byId.get("shanghai-gold-premium") ?? null;
  const premiumValue = premiumReading !== null ? premiumReading.value : null;
  const verdict =
    premiumValue === null || !Number.isFinite(premiumValue)
      ? t.contextCards.physicalVerdictNone
      : premiumValue > 1
        ? t.contextCards.physicalVerdictStrong
        : premiumValue > 0
          ? t.contextCards.physicalVerdictMild
          : premiumValue > -1
            ? t.contextCards.physicalVerdictFlat
            : t.contextCards.physicalVerdictDiscount;
  return (
    <section id="gold-other" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.other.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.other.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.other.subtitle}</p>
      <h4 className="m-0 mt-3 type-label font-extrabold text-[var(--color-text-primary)]">{t.physical.title}</h4>

      {/* THE verdict — the TA verdict's own loud gold box, one readable sentence */}
      <div
        className="mt-2.5 rounded-[var(--cr-radius-md)] px-3.5 py-3"
        style={{
          backgroundColor: "color-mix(in srgb, var(--color-accent-gold) 16%, transparent)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 45%, transparent)",
        }}
      >
        <p className="m-0 text-[1.02rem] font-black leading-snug text-[var(--color-accent-gold-deep)] sm:text-[1.1rem]">
          <bdi>{verdict}</bdi>
        </p>
      </div>

      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="self-start inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90 rtl:-rotate-90" : ""}`} aria-hidden="true" />
        {open ? (locale === "en" ? "hide the numbers" : "بستن اعداد") : locale === "en" ? "show the numbers" : "نمایش اعداد"}
      </button>
      {open ? (
        <div className="flex min-w-0 flex-col gap-2">
          <p className="m-0 type-caption text-[var(--color-text-tertiary)]">{t.contextCards.physicalLine}</p>
          <ContextTable
            rows={PHYSICAL_IDS.map((c) => ({ id: c.id, name: c.name, meaning: t.contextCards[c.meaning] as string, unit: c.unit }))}
            byId={byId}
            t={t.contextCards}
            fmt={fmt}
            locale={locale}
          />
        </div>
      ) : null}

      {/* the London vault + clearing — the merged section's second half
          (its own sub-block, its own collapse, as before) */}
      {vault}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The Iran bridge — the clearly regional chapter
 * ------------------------------------------------------------------ */

function BridgeBand({ t, locale, premium, fmt, rates }: { t: typeof UI.en; locale: Locale; premium: PremiumPayload | null; fmt: ReturnType<typeof makeFmt>; rates: RatesPayload | null }) {
  const steps = [t.bridge.step1, t.bridge.step2, t.bridge.step3, t.bridge.step4, t.bridge.step5];
  return (
    <section id="gold-bridge" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-bridge-accent)]/30 sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="type-kicker m-0 text-[var(--color-bridge-accent)]">{t.bridge.eyebrow}</h2>
        <span className="rounded-full bg-[var(--color-bridge-accent)]/10 px-2.5 py-0.5 type-caption font-bold text-[var(--color-bridge-accent)]">
          {t.bridge.regionChip}
        </span>
      </div>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.bridge.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.bridge.subtitle}</p>

      {/* the parity ladder — collapsed by default (the board's own numbers
          name the formula at point of use); one tap opens the five steps */}
      <details className="mt-3 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3">
        <summary className="cursor-pointer type-caption font-bold text-[var(--color-bridge-accent)]">
          {locale === "en" ? "How the Tehran price is built · the 5 steps" : "قیمت تهران چگونه ساخته می‌شود؟ · ۵ گام"}
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: "var(--color-bridge-accent)" }}>
                {locale === "en" ? i + 1 : ["۱", "۲", "۳", "۴", "۵"][i]}
              </span>
              <span className="type-caption font-semibold text-[var(--color-text-primary)]">{s}</span>
            </div>
          ))}
        </div>
      </details>

      {/* the live Tehran board — every instrument's market price beside its computed حباب premium */}
      <BridgeBoard rates={rates} t={t.bridge} fmt={fmt} locale={locale} />

      {/* the live premium history — the previous page's bridge companion */}
      {premium ? <PremiumHistoryCard data={premium} t={t.bridge} fmt={fmt} locale={locale} /> : null}

      {/* the coin budget machine — the owner's own ask: how many full
          Emami coins a foreign-currency sum buys on the Tehran market,
          the melt-value comparison riding beside it */}
      <CoinBuyerBand rates={rates} t={t.bridge.coinBuyer} fmt={fmt} locale={locale} />

      <details className="mt-3 rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
        <summary className="cursor-pointer px-3 py-2 type-caption font-bold text-[var(--color-bridge-accent)]">{t.bridge.methodTitle}</summary>
        <p className="px-3 pb-3 m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.bridge.method}</p>
      </details>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The history tail — episodes + the if-you'd-bought calculator
 * ------------------------------------------------------------------ */

function HistoryBand({ data, t, fmt, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale }) {
  /* the big episodes + the if-you'd-bought chart, collapsed by default —
     one tap opens the era record, the daily read stays light */
  const [open, setOpen] = React.useState(false);
  return (
    <section id="gold-history" className="gold-anchor-mt mt-3 sm:mt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <div>
          <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.history.eyebrow}</h2>
          <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.history.title}</h3>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90 rtl:-rotate-90" : ""}`} aria-hidden="true" />
          {open ? t.history.hideLabel : t.history.showLabel}
        </button>
      </div>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.history.subtitle}</p>

      {/* THE long view — the two-century chart, the purchasing-power
          machine, and the 20-year table behind its modal: the historical
          perspective itself, always visible (the episodes below it stay
          behind the tap) */}
      <LongViewCard liveSpot={data.gold.spot} t={t.longview} locale={locale} fmt={fmt} />

      {open ? (
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <div className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
          <div className="relative flex flex-col ps-6">
            <span className="absolute inset-y-1 start-[11px] w-[3px] rounded-full bg-[var(--color-accent-gold)]/60" aria-hidden="true" />
            {EPISODES.map((e) => (
              <div key={e.period} className="relative py-2">
                <span className="absolute -start-6 top-3 h-[13px] w-[13px] rounded-full border-[3px] border-[var(--color-accent-gold)] bg-[var(--color-surface)]" aria-hidden="true" />
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="type-caption font-bold text-[var(--color-accent-gold-deep)]">{e.period}</span>
                  <span className="type-label font-bold text-[var(--color-text-primary)]">{e.title[lan(locale)]}</span>
                  {e.price ? <span className="type-caption text-[var(--color-text-tertiary)]">{e.price[lan(locale)]}</span> : null}
                </div>
                <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{e.annotation[lan(locale)]}</p>
                <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">
                  {locale === "en" ? "family:" : "خانواده:"} {LANE_CONTENT[e.family].label[lan(locale)]}
                </p>
              </div>
            ))}
            <p className="m-0 mt-1 ps-0 type-caption italic text-[var(--color-text-tertiary)]">{t.history.living}: 2024–26</p>
          </div>
        </div>
        <div className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
          <h4 className="m-0 text-[1.05rem] font-extrabold text-[var(--color-text-primary)]">{t.history.ifBought.title}</h4>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.history.ifBought.subtitle}</p>
          <div className="mt-3">
            <IfBoughtChart bars={data.gold.bars} spot={data.gold.spot} locale={locale} fmt={fmt} labels={{ title: "", subtitle: "", ago: () => "", worth: "" }} />
          </div>
        </div>
      </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The takeaway + the footer
 * ------------------------------------------------------------------ */

function Footer({ t }: { t: typeof UI.en }) {
  return (
    <footer className="mt-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-[1080px] px-3 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.footer.rights}</span>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ *
 * The page
 * ------------------------------------------------------------------ */

export default function GoldPage() {
  const [locale, setLocale] = React.useState<Locale>("en");
  // The reader's chosen language survives a reload (SSR still renders en/lt
  // first so hydration matches; the stored locale applies right after mount).
  React.useEffect(() => {
    const saved = window.localStorage.getItem("currena-gold-locale");
    if (saved === "fa" || saved === "en") setLocale(saved);
  }, []);
  React.useEffect(() => {
    try {
      window.localStorage.setItem("currena-gold-locale", locale);
    } catch {
      /* private mode — the toggle still works for the session */
    }
  }, [locale]);
  const t = UI[locale] as typeof UI.en;
  const fmt = React.useMemo(() => makeFmt(locale), [locale]);
  const balance = React.useMemo(() => balanceOf(), []);
  const { data, isLoading, isError } = useQuery({ queryKey: ["currena-gold"], queryFn: fetchGold });
  /* the history echo — THE retracement sentence, bold in the header and
     the briefing both: where gold's price has come back to. */
  const echo = echoLine(data?.gold.historyEcho ?? null, t, fmt);
  /* the record legs — every section fail-closed: a leg that does not
     arrive simply does not render its section (the honest line rides
     inside the sections that partially arrive). */
  const ta = useQuery({ queryKey: ["currena-gold-ta"], queryFn: fetchTa, retry: 1 });
  /* every trend window at once — the SAME query the briefing card runs
     (one cache, one fetch); the Market Brief reads the YTD / 1Y windows
     from it */
  const trends = useQuery({
    queryKey: ["currena-gold-trend-all"],
    queryFn: fetchTrendAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const cb = useQuery({ queryKey: ["currena-gold-cb"], queryFn: fetchCb, retry: 1 });
  const lbma = useQuery({ queryKey: ["currena-gold-lbma"], queryFn: fetchLbma, retry: 1 });
  const premium = useQuery({ queryKey: ["currena-gold-premium"], queryFn: fetchPremium, retry: 1 });
  const positions = useQuery({ queryKey: ["currena-gold-positions"], queryFn: fetchPositions, retry: 1 });
  const correlation = useQuery({ queryKey: ["currena-gold-correlation"], queryFn: fetchCorrelation, retry: 1 });
  const ifbought = useQuery({ queryKey: ["currena-gold-ifbought"], queryFn: fetchIfBought, retry: 1 });
  /* the third audit's legs — the projection (the context cards + the
     outlook's own position input), the five-currency crosses, and the
     live Tehran rates (the bridge board); all fail-closed. */
  const projection = useQuery({ queryKey: ["currena-gold-projection"], queryFn: fetchProjection, retry: 1 });
  const crosses = useQuery({ queryKey: ["currena-gold-crosses"], queryFn: fetchCrosses, retry: 1 });
  const rates = useQuery({ queryKey: ["currena-gold-rates"], queryFn: fetchRates, retry: 1 });
  /* the dollar-vs-gold trend — «روند نرخ طلا در برابر دلار», the 47-year
     Iran race (the cited static layer + the TGJU evergreen legs); the
     static layer always serves, so the band renders through its own
     honest states even before the live legs arrive */
  const dollarTrend = useQuery({
    queryKey: ["currena-gold-dollar-trend"],
    queryFn: fetchDollarTrend,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  /* THE complete Market Brief — the owner's ask: the brief carries the
     page's own verdicts, more of them. The conditions sentence and the
     balance close stay the reviewed copy; the price-position line composes
     live from the page's own readings — the history echo (where the price
     has come back to, e.g. "about 15 months ago"), the 200-day distance
     and the YTD / 1-year windows — each clause present only when its leg
     actually arrived, never a guess. */
  const priceLine = React.useMemo(() => {
    const clauses: string[] = [];
    const echoPayload = data?.gold.historyEcho ?? null;
    if (echoPayload && echoPayload.mode === "return" && echoPayload.days !== undefined && echoPayload.days >= 1) {
      clauses.push(t.takeaway.echo.replace("{n}", echoLookback(echoPayload.days, t, fmt)));
    }
    const sma = ta.data?.distance ?? null;
    if (sma !== null && Number.isFinite(sma.pct)) {
      const pctText = `${fmt.num(Math.abs(sma.pct), 1)}${locale === "fa" ? "٪" : "%"}`;
      clauses.push((sma.pct >= 0 ? t.takeaway.smaAbove : t.takeaway.smaBelow).replace("{pct}", pctText));
    }
    /* the trend pair — one clause group: YTD and 1-year, joined with a
       single "و"/"and" */
    const pctWords = (v: number): string =>
      locale === "fa"
        ? `${fmt.num(Math.abs(v), 1)}٪ ${v < 0 ? "پایین‌تر" : "بالاتر"}`
        : `${v < 0 ? "down" : "up"} ${fmt.num(Math.abs(v), 1)}%`;
    const ytd = trends.data?.find((w) => w.range === "YTD")?.chgPct ?? null;
    const yearPct = trends.data?.find((w) => w.range === "1Y")?.chgPct ?? null;
    const trendGroup: string[] = [];
    if (ytd !== null && ytd !== undefined && Number.isFinite(ytd)) trendGroup.push(t.takeaway.ytd.replace("{v}", pctWords(ytd)));
    if (yearPct !== null && yearPct !== undefined && Number.isFinite(yearPct)) trendGroup.push(t.takeaway.year.replace("{v}", pctWords(yearPct)));
    const endsOnTrend = trendGroup.length > 0;
    if (trendGroup.length > 0) clauses.push(trendGroup.join(locale === "fa" ? " و " : " and "));
    if (clauses.length === 0) return null;
    const joined = clauses.join(locale === "fa" ? "؛ " : "; ");
    /* fa wants the verb on the trailing fragment pair; EN reads fine as is */
    return endsOnTrend && locale === "fa" ? `${joined} است.` : `${joined}.`;
  }, [data, ta.data, trends.data, t, fmt, locale]);

  /* the Iranian-toman gold cross — the live free-market dollar (the
     Tehran snapshot) × the global ounce; rides the currency grid */
  const tomanPerOunce = React.useMemo(() => {
    if (!data) return null;
    const usd = rates.data?.rates?.find((r) => r.code === "USD");
    const perUsd = dollarTomanOf(usd?.rate);
    return perUsd !== null && Number.isFinite(perUsd) ? perUsd * data.gold.spot : null;
  }, [data, rates.data]);

  React.useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = t.dir;
  }, [locale, t.dir]);

  return (
    <div dir={t.dir} lang={locale} className="flex min-h-screen flex-col bg-[var(--color-currena-bg-light)]">
      <span id="top" />
      <Header t={t} locale={locale} onToggleLang={() => setLocale((l) => (l === "en" ? "fa" : "en"))} />
      <SectionNav locale={locale} />

      <main className="mx-auto w-full max-w-[560px] flex-1 px-3 py-4 sm:max-w-[680px] sm:px-6 sm:py-5 lg:max-w-[1080px] lg:px-8">
        {/* the heading block */}
        <header className="mb-3 sm:mb-4">
          <nav className="flex items-center gap-1.5 type-caption text-[var(--color-text-tertiary)]" aria-label="Breadcrumb">
            <span className="font-bold text-[var(--color-currena-blue-deep)]">{t.breadcrumb.home}</span>
            <ChevronRight className="h-3 w-3 rtl:rotate-180" aria-hidden="true" />
            <span aria-current="page">{t.breadcrumb.current}</span>
          </nav>

          {/* the gold identity — the coin BESIDE the name on one line
              (the owner's batch-M ask: [logo][title], never stacked);
              the heading carries the name, the coin never repeats it */}
          <div className="mt-2 flex items-center gap-3">
            <span
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full"
              style={{ boxShadow: "inset 0 0 0 2px color-mix(in srgb, var(--color-accent-gold) 42%, transparent)" }}
              aria-hidden="true"
            >
              <img src={`${deskBasePath}/gold-coin.png`} alt="" width={44} height={44} className="h-[44px] w-[44px] rounded-full object-cover" loading="lazy" decoding="async" />
            </span>
            <h1 className="m-0 text-2xl font-extrabold leading-tight text-[var(--color-text-primary)] sm:text-[1.75rem]">{t.title}</h1>
          </div>

          <p className="m-0 mt-1.5 flex flex-wrap items-baseline gap-x-2.5 type-caption font-semibold text-[var(--color-text-tertiary)]">
            {t.dataAsOf.replace("{date}", data ? fmt.dateWords(data.asOf) : "·")}
          </p>
        </header>

        {/* THE ultimate compact verdict — پیام کلیدی, one paragraph, at the
            top of the page: how gold is right now */}
        <section
          className="mb-3 flex items-start gap-3 rounded-[var(--cr-radius-lg)] bg-[var(--color-currena-soft)] p-3.5 sm:p-4"
          style={{ boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold) 35%, transparent)" }}
          aria-label={t.takeaway.title}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]" aria-hidden="true">
            <Lightbulb className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.takeaway.title}</h2>
            <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t.takeaway.body}
            </p>
            {priceLine !== null ? (
              <p className="m-0 mt-1.5 type-caption font-semibold leading-relaxed text-[var(--color-text-primary)]" data-takeaway-price-line>
                {priceLine}
              </p>
            ) : null}
          </div>
        </section>

        {isLoading ? (
          <div className="mx-auto flex w-full max-w-[560px] flex-col items-center px-5 py-16" role="status">
            <p className="m-0 text-[length:var(--type-label)] font-semibold text-[var(--color-text-secondary)]">{t.loadingLine}</p>
            <span className="mt-4 flex justify-center gap-2.5" aria-hidden="true">
              <span className="loader-dot" />
              <span className="loader-dot" />
              <span className="loader-dot" />
            </span>
          </div>
        ) : isError || !data ? (
          <div className="mx-auto w-full max-w-[560px] py-16">
            <h2 className="mb-2 text-2xl font-extrabold text-[var(--color-text-primary)]">{locale === "en" ? "The gold page is unavailable right now" : "صفحهٔ طلا الان در دسترس نیست"}</h2>
            <p className="mb-5 type-label leading-relaxed text-[var(--color-text-secondary)]">
              {locale === "en" ? "The data did not arrive. Nothing is shown rather than a guess." : "داده‌ها نرسیدند. به‌جای حدس، هیچ‌چیز نشان داده نمی‌شود."}
            </p>
          </div>
        ) : (
          <>
            {/* the hero: the price block full-width on top (the chart rides
                the page's whole width — the 2–3× the owner asked for, PC
                and mobile alike), the focal briefing card under it */}
            <div className="flex flex-col gap-2.5 lg:gap-3">
              <PriceCard data={data} t={t} fmt={fmt} echo={echo} />
              <BriefingCard t={t} fmt={fmt} balance={balance} locale={locale} />
              {/* the TE daily briefing — Trading Economics' own daily take
                  directly under the Market Brief (the daily voices sit
                  together, the owner's §11 Q5 answer), the WGC monthly
                  card following it: the page's today/this-month pair of
                  attributed market commentary. The briefing box verbatim
                  in an LTR block, the fresh Persian under the honest
                  «ترجمهٔ ماشینی» label, the waiting/fetch-failed/alert
                  states riding the same card */}
              <TeCard t={t.te} locale={locale} fmt={fmt} />
              {/* the WGC monthly commentary — the World Gold Council's own
                  monthly one-glance under the daily pair: the
                  Highlights box verbatim in an LTR block, the honest
                  waiting/missed/alert states riding the same card */}
              <WgcCard t={t.wgc} locale={locale} fmt={fmt} />
            </div>

            {/* the composition stack: the brass balance + the five lane bars */}
            <BalanceCard t={t} fmt={fmt} locale={locale} balance={balance} />

            {/* the price-change scenarios — merged with the economic
                calendar (batch H): the notable, possible bends above,
                the dated events below, one card, one framing */}
            <ScenariosBand t={t.scenarios} locale={locale} fmt={fmt} calendar={<CalendarBand t={t.calendar} locale={locale} fmt={fmt} />} />

            {/* the comparison — gold against the real yield, silver, Bitcoin and the S&P; the correlation lesson (the old standalone section) merged in here behind one tap */}
            <CompareBand t={t.compare} locale={locale} fmt={fmt} correlation={correlation.data ?? null} corrT={t.correlation} />

            {/* the reference levels — the previous page's Zone H (the 200-day average etc.) */}
            {ta.data ? <TaBand data={ta.data} t={t.ta} fmt={fmt} locale={locale} /> : null}

            {/* the central-bank demand — the previous page's Zone K (the vault plumbing moved to the page's foot) */}
            {cb.data ? <CentralBanksBand data={cb.data} t={t.centralBanks} fmt={fmt} locale={locale} spot={data.gold.spot} /> : null}

            {/* the trader positioning — the previous page's CFTC cards */}
            {positions.data ? <PositionsBand data={positions.data} t={t.positions} fmt={fmt} locale={locale} /> : null}

            {/* the dashboard — the key indicators, the top ratios, the currency grid (with the Iranian toman) and the forecast retrospective */}
            <DashboardBand
              data={data}
              t={t}
              fmt={fmt}
              locale={locale}
              projection={projection.data ?? null}
              crosses={crosses.data ?? null}
              tomanPerOunce={tomanPerOunce}
            />

            {/* the Iran bridge — now with the live Tehran board + the premium history */}
            <BridgeBand t={t} locale={locale} premium={premium.data ?? null} fmt={fmt} rates={rates.data ?? null} />

            {/* the dollar-vs-gold trend — «روند نرخ طلا در برابر دلار»:
                the 47-year race, immediately after the bridge (the
                reader who just learned the حباب decomposition gets its
                long payoff), before the calculator */}
            <DollarTrendBand
              t={t.dollarTrend}
              locale={locale}
              fmt={fmt}
              data={dollarTrend.data ?? null}
              pending={dollarTrend.isLoading}
              rates={rates.data ?? null}
            />

            {/* the calculator — ONE tool at the page's foot: the what-if
                windows, the wealth calculator, the assets head-to-head,
                and any past day's meter behind a tap */}
            <CalculatorBand
              tm={t.timeMachine}
              ib={t.ifBought}
              calc={t.calculator}
              locale={locale}
              windowNames={t.price.windowNames}
              verdictWords={{ verdictFor: t.balance.verdictFor, verdictAgainst: t.balance.verdictAgainst, verdictBalanced: t.balance.verdictBalanced, verdictNone: t.balance.verdictNoneWord }}
              fmt={fmt}
              data={ifbought.data ?? null}
            />

            {/* other indicators — سایر شاخص‌ها (batch H): the physical
                market and the London vault + clearing, one merged section
                at the page's foot; the map, the page's last word */}
            <PhysicalBand
              t={t}
              fmt={fmt}
              locale={locale}
              projection={projection.data ?? null}
              vault={lbma.data ? <VaultBand data={lbma.data} t={t.vault} fmt={fmt} locale={locale} /> : null}
            />

            {/* the relationship map — the forces, the page's closing
                view: six force families feeding one hub */}
            <RelationshipsBand t={t.relationships} locale={locale} />

            {/* the history — the most important events of gold's history,
                the page's very last section (the owner's ask) */}
            <HistoryBand data={data} t={t} fmt={fmt} locale={locale} />
          </>
        )}
      </main>

      <Footer t={t} />
    </div>
  );
}
