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
import { Moon, Sun, Lightbulb, ArrowUpRight, ArrowDownRight, ChevronRight } from "lucide-react";
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
  LaneBar,
  BrassBalance,
  ForcesSpine,
  SeeSawDiagram,
  PriceTagDiagram,
  StressGauge,
  SplitBar,
  CrowdDiagram,
  ScenarioFan,
  SeatsGrid,
  IfBoughtChart,
  SignedDelta,
  STATE_INK,
} from "@/components/gold-page/visuals";

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
    bars: Point[];
  };
  silver: SeriesStat | null;
  realYield: SeriesStat | null;
  dxy: SeriesStat | null;
  usdjpy: SeriesStat | null;
  eurusd: SeriesStat | null;
  spx: SeriesStat | null;
  oil: SeriesStat | null;
}

async function fetchGold(): Promise<GoldPayload> {
  const res = await fetch("/api/gold", { cache: "no-store" });
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
  { id: "gold-forces", key: null, label: ["Forces", "نیروها"] },
  { id: "gold-signals", key: null, label: ["Signals", "سیگنال‌ها"] },
  { id: "gold-lanes", key: null, label: ["Lanes", "لاین‌ها"] },
  { id: "gold-outlook", key: null, label: ["Outlook", "چشم‌انداز"] },
  { id: "gold-dashboard", key: null, label: ["Dashboard", "داشبورد"] },
  { id: "gold-bridge", key: null, label: ["Iran", "پل ایران"] },
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
      className="chip-scroller sticky top-16 z-30 -mx-3 mt-2 border-y border-[var(--color-border)] bg-[var(--color-currena-bg-light)]/92 px-3 backdrop-blur sm:-mx-6 sm:px-6 lg:top-20"
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

function PriceCard({ data, t, fmt }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt> }) {
  const g = data.gold;
  const bars = g.bars;
  const from = bars.length > 0 ? bars[0].d : g.asOf;
  return (
    <section className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:p-5" aria-label={t.price.eyebrow}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0 text-[var(--color-text-primary)]">{t.price.eyebrow}</h2>
        <span className="live-dot h-2 w-2 rounded-full" style={{ background: "var(--color-currena-success)" }} aria-hidden="true" />
      </div>
      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <bdi dir="ltr" className="type-number text-[var(--color-text-primary)]">
          {fmt.usd(g.spot)}
        </bdi>
        <span className="flex items-center gap-1.5">
          <SignedDelta v={g.chg7d} fmt={fmt} />
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.price.windows.d7}</span>
        </span>
      </div>
      <div className="mt-3">
        <Sparkline values={bars.map((p) => p.v)} width={340} height={92} color="var(--color-accent-gold-strong)" fill ariaLabel={`${t.price.series}, 90-day trend`} />
      </div>
      <dl className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="type-caption text-[var(--color-text-secondary)]">{t.price.series}</dt>
          <dd className="flex items-center gap-2">
            <span className="type-caption text-[var(--color-text-secondary)]">{t.price.windows.d90}</span>
            <SignedDelta v={g.chg90d} fmt={fmt} />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="type-caption text-[var(--color-text-tertiary)]">
            {t.price.bars.replace("{n}", "90").replace("{from}", fmt.monthShort(from)).replace("{to}", fmt.monthShort(g.asOf))}
          </dt>
          <dd className="type-caption font-bold text-[var(--color-text-primary)]">
            {t.price.positionDecade.replace("{p}", fmt.num(g.pctileDecade * 100, 0))}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="type-caption text-[var(--color-text-tertiary)]">{t.price.positionYear}</dt>
          <dd className="type-caption font-semibold text-[var(--color-text-secondary)]">
            {g.pctileYear !== null ? `${fmt.num(g.pctileYear * 100, 0)}%` : "—"}
          </dd>
        </div>
      </dl>
      <p className="m-0 mt-3 border-t border-[var(--color-border)] pt-2.5 type-caption text-[var(--color-text-tertiary)]">
        {t.price.contextLine.replace("{change}", fmt.pct(g.chg30d))}
      </p>
    </section>
  );
}

function BriefingCard({ data, t, fmt, balance, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; balance: ReturnType<typeof balanceOf>; locale: Locale }) {
  const g = data.gold;
  const reasonSeats: ReadonlyArray<{ lane: LaneId; seatId: string }> = [
    { lane: "borrowing-costs", seatId: "real-yield-10y" },
    { lane: "dollar", seatId: "dollar-basket" },
    { lane: "stress", seatId: "stress-stlfsi" },
    { lane: "inflation", seatId: "us-cpi-yoy" },
    { lane: "flows", seatId: "cftc-gold-positioning" },
  ];
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
        <span className="font-semibold text-[var(--color-text-primary)]">
          {t.briefing.countsLine.replace("{for}", fmt.num(balance.counts.for)).replace("{against}", fmt.num(balance.counts.against)).replace("{neutral}", fmt.num(balance.counts.neutral))}
        </span>
        <span className="italic text-[var(--color-text-tertiary)]"> ({t.briefing.notForecast})</span>
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2" data-briefing-horizons>
        <span className="inline-flex flex-wrap items-baseline gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-label)] font-semibold leading-relaxed text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]">
          {t.briefing.chipMonths}
          <span className="font-bold text-[var(--color-chip-ink-attention)]">· {t.briefing.chipMonthsLean}</span>
        </span>
        <span className="inline-flex items-baseline rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.briefing.chipWeeks}
        </span>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-secondary)]">{t.briefing.assessmentLine}</p>
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.briefing.assessmentNote}</p>
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.briefing.mixedLine}</p>
        <p className="m-0 type-caption leading-relaxed text-[var(--color-text-tertiary)]">{t.briefing.cadenceLine}</p>
      </div>

      <div className="mt-4">
        <h4 className="type-label m-0 font-extrabold text-[var(--color-text-primary)]">{t.briefing.whyTitle}</h4>
        <div className="mt-2 flex flex-col gap-2">
          {reasonSeats.map(({ lane, seatId }) => {
            const content = SEAT_CONTENT[seatId];
            const seat = balance.lanes.find((l) => l.lane === lane);
            const state = seat ? (seat.side === "for" ? "supports" : seat.side === "against" ? "pressures" : "steady") : "steady";
            const ink = STATE_INK[state as "supports"];
            return (
              <div key={seatId} className="rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)]">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="type-caption font-bold" style={{ color: ink.ink }}>
                    {ink.glyph} {state === "supports" ? t.seats.seatSupports : state === "pressures" ? t.seats.seatPressures : t.seats.seatSteady}
                  </span>
                  <span className="type-label font-bold text-[var(--color-text-primary)]">{content[locale][0]}</span>
                </div>
                <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{content[locale][1]}</p>
                <div className="mt-2 flex gap-2">
                  <a href="#gold-lanes" className="rounded-full bg-[var(--color-surface)] px-3 py-1 text-[12.5px] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)] transition-colors hover:bg-[var(--color-currena-soft)]">
                    {t.briefing.evidence}
                  </a>
                  <a href="#gold-forces" className="rounded-full px-3 py-1 text-[12.5px] font-semibold text-[var(--color-currena-blue-deep)] transition-colors hover:underline">
                    {t.briefing.howItWorks}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="m-0 mt-3 type-caption italic leading-relaxed text-[var(--color-text-secondary)]">{t.briefing.couldChange}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The composition stack — the balance + the five lane bars
 * ------------------------------------------------------------------ */

function BalanceCard({ t, fmt, locale, balance }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; balance: ReturnType<typeof balanceOf> }) {
  const verdict = balance.net < 0 ? "against" : balance.net > 0 ? "for" : "balanced";
  return (
    <section id="gold-balance" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0" style={{ color: "var(--bal-brass-text)" }}>
          {t.balance.eyebrow}
        </h2>
        <span className="type-caption font-semibold text-[var(--color-text-tertiary)]">{t.recordNote}</span>
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
            noneFor: t.balance.sideFor,
            noneAgainst: t.balance.sideAgainst,
            // consumed by the component's aria/label shapes:
            ...(locale === "en" ? {} : {}),
          } as { for: string; against: string; noneFor: string; noneAgainst: string } & Record<string, string>}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--color-border)] pt-4">
        {balance.lanes.map((l) => (
          <LaneBar key={l.lane} lane={l.lane} reading={l} locale={locale} fmt={fmt} />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--color-border)] pt-3">
        <a href="#gold-lanes" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-currena-soft)] px-3.5 py-1.5 text-[13px] font-bold text-[var(--color-currena-blue-deep)]">
          {locale === "en" ? "Inspect the 37 voters" : "۳۷ رأی‌دهنده را ببین"}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
        </a>
        <p className="m-0 max-w-[46ch] type-caption text-[var(--color-text-tertiary)]">{t.balance.honesty}</p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Zone D — the narrative + the real-yield card
 * ------------------------------------------------------------------ */

function NarrativeBand({ data, t, fmt, locale, balance }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; balance: ReturnType<typeof balanceOf> }) {
  const ry = data.realYield;
  return (
    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:mt-5 lg:grid-cols-2 lg:gap-3">
      <section className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.narrative.eyebrow}</h2>
        <h3 className="m-0 mt-1 text-[1.05rem] font-extrabold text-[var(--color-text-primary)]">{t.narrative.title}</h3>
        <p className="m-0 mt-1.5 type-label leading-relaxed text-[var(--color-text-secondary)]">
          {t.narrative.priceFact.replace("{d30}", fmt.pct(data.gold.chg30d)).replace("{d90}", fmt.pct(data.gold.chg90d))}
        </p>
        <ul className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">
          {balance.lanes.map((l) => (
            <li key={l.lane} className="type-caption text-[var(--color-text-secondary)]">
              <span className="font-bold text-[var(--color-text-primary)]">{LANE_CONTENT[l.lane].label[lan(locale)]}</span>{" "}
              {t.narrative.familyLine
                .replace("{lane}", "")
                .replace("{word}", t.balance.laneWord[l.lane])
                .replace("{s}", fmt.num(l.supports))
                .replace("{p}", fmt.num(l.pressures))}
            </li>
          ))}
        </ul>
        <p className="m-0 mt-2 type-caption italic text-[var(--color-text-tertiary)]">{t.narrative.caveat}</p>
      </section>

      <section className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
        <h3 className="m-0 text-[1.05rem] font-extrabold text-[var(--color-text-primary)]">{t.yieldCard.title}</h3>
        <p className="m-0 mt-1.5 type-label font-bold text-[var(--color-text-primary)]">
          {t.yieldCard.identity
            .replace("{real}", fmt.num(ry?.last ?? 4.9, 2))
            .replace("{be}", locale === "en" ? "~2.4" : "۲٫۴")
            .replace("{nominal}", fmt.num((ry?.last ?? 4.9) + 2.4, 1))}
        </p>
        {ry ? (
          <div className="mt-2">
            <Sparkline values={ry.series.map((p) => p.v)} width={320} height={54} color="var(--color-status-context)" endDot ariaLabel="The 10-year real yield, recent path" />
          </div>
        ) : null}
        <p className="m-0 mt-2 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.yieldCard.note}</p>
        {ry ? (
          <p className="m-0 mt-1.5 flex items-center gap-2 type-caption text-[var(--color-text-tertiary)]">
            {t.yieldCard.asOf.replace("{date}", fmt.dateWords(ry.asOf))}
            <SignedDelta v={ry.chg30} fmt={fmt} />
          </p>
        ) : null}
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * The five forces — the spine + the explainer diagrams
 * ------------------------------------------------------------------ */

function ForcesBand({ data, t, fmt, locale, balance }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; balance: ReturnType<typeof balanceOf> }) {
  const ounceEur = data.eurusd && data.eurusd.last > 0 ? data.gold.spot / data.eurusd.last : null;
  const ounceJpy = data.usdjpy ? data.gold.spot * data.usdjpy.last : null;
  const ryLevel = data.realYield?.last ?? null;
  return (
    <section id="gold-forces" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.forces.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.forces.title}</h3>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.forces.subtitle}</p>

      <div className="mt-3">
        <ForcesSpine readings={balance.lanes} locale={locale} upLabel={t.forces.upLabel} downLabel={t.forces.downLabel} fmt={fmt} />
      </div>

      <h4 className="mt-5 type-label m-0 font-extrabold text-[var(--color-text-primary)]">{t.forces.explainerTitle}</h4>
      <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.forces.explainerSubtitle}</p>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {/* Borrowing costs — the see-saw */}
        <article className="flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)]">
          <h5 className="type-label m-0 font-bold text-[var(--color-text-primary)]">{LANE_CONTENT["borrowing-costs"].label[lan(locale)]}</h5>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{LANE_CONTENT["borrowing-costs"].intro[lan(locale)]}</p>
          <div className="mt-2.5">
            <SeeSawDiagram
              realYield={ryLevel}
              locale={locale}
              fmt={fmt}
              captions={{
                bond: locale === "en" ? "A bond earns" : "اوراق می‌پردازد",
                gold: locale === "en" ? "an ounce earns" : "اونس می‌پردازد",
                read: locale === "en" ? "the plank tips against gold" : "تخته علیه طلا کج می‌شود",
              }}
            />
          </div>
        </article>

        {/* The dollar — the foreign price tags */}
        <article className="flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)]">
          <h5 className="type-label m-0 font-bold text-[var(--color-text-primary)]">{LANE_CONTENT.dollar.label[lan(locale)]}</h5>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{LANE_CONTENT.dollar.intro[lan(locale)]}</p>
          {ounceEur && ounceJpy ? (
            <div className="mt-2.5">
              <PriceTagDiagram
                ounceEur={ounceEur}
                ounceJpy={ounceJpy}
                locale={locale}
                fmt={fmt}
                captions={{
                  eur: locale === "en" ? "EUR" : "یورو",
                  jpy: locale === "en" ? "JPY" : "ین",
                  note:
                    locale === "en"
                      ? "The same ounce through other currencies — a stronger dollar makes it pricier everywhere else."
                      : "همان اونس از دریچهٔ ارزهای دیگر — دلار قوی‌تر آن را همه‌جا گران‌تر می‌کند.",
                }}
              />
            </div>
          ) : null}
        </article>

        {/* Stress — the traffic-light gauge */}
        <article className="flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)]">
          <h5 className="type-label m-0 font-bold text-[var(--color-text-primary)]">{LANE_CONTENT.stress.label[lan(locale)]}</h5>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{LANE_CONTENT.stress.intro[lan(locale)]}</p>
          <div className="mt-2.5">
            <StressGauge
              locale={locale}
              level={0.62}
              word={t.balance.laneWord.stress}
              captions={{
                calm: locale === "en" ? "calm" : "آرام",
                watch: locale === "en" ? "watch" : "مراقب",
                elevated: locale === "en" ? "elevated" : "بالا",
                high: locale === "en" ? "high" : "شدید",
              }}
            />
          </div>
        </article>

        {/* Inflation — the split bar */}
        <article className="flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)]">
          <h5 className="type-label m-0 font-bold text-[var(--color-text-primary)]">{LANE_CONTENT.inflation.label[lan(locale)]}</h5>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{LANE_CONTENT.inflation.intro[lan(locale)]}</p>
          <div className="mt-2.5">
            <SplitBar
              locale={locale}
              fmt={fmt}
              captions={{
                left: locale === "en" ? "Realised CPI" : "تورم واقعی",
                right: locale === "en" ? "Market expectations" : "انتظار بازار",
                leftWord: locale === "en" ? "high" : "بالا",
                rightWord: locale === "en" ? "falling" : "نزولی",
                note:
                  locale === "en"
                    ? "Hot today, cooling in the forward curve — the family reads split."
                    : "امروز داغ، در منحنی آینده سردکننده — خانواده دوپاره می‌خواند.",
              }}
            />
          </div>
        </article>

        {/* Flows — the crowded room */}
        <article className="flex flex-col rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3.5 ring-1 ring-[var(--color-border)] lg:col-span-2">
          <h5 className="type-label m-0 font-bold text-[var(--color-text-primary)]">{LANE_CONTENT.flows.label[lan(locale)]}</h5>
          <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{LANE_CONTENT.flows.intro[lan(locale)]}</p>
          <div className="mt-2.5">
            <CrowdDiagram
              locale={locale}
              captions={{
                packed: locale === "en" ? "crowded longs" : "لانگ‌های ازدحام‌یافته",
                note:
                  locale === "en"
                    ? "The trade everyone already owns — the exit is narrow, extremes mark vulnerability either way."
                    : "معامله‌ای که همه از قبل دارند — خروجی باریک است، نقاط حدی به هر دو سمت شکنندگی می‌گذارند.",
              }}
            />
          </div>
        </article>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The signals strip — gold + silver
 * ------------------------------------------------------------------ */

function SignalsBand({ data, t, fmt, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale }) {
  const g = data.gold;
  const bars = g.bars;
  const ytd = React.useMemo(() => {
    if (bars.length === 0) return null;
    const year = g.asOf.slice(0, 4);
    const firstOfYear = bars.find((p) => p.d.startsWith(year)) ?? bars[0];
    return firstOfYear.v !== 0 ? (g.spot / firstOfYear.v - 1) * 100 : null;
  }, [bars, g.asOf, g.spot]);
  const silver = data.silver;
  const ratio = silver && silver.last > 0 ? g.spot / silver.last : null;
  return (
    <section id="gold-signals" className="gold-anchor-mt mt-3 sm:mt-5" aria-label={t.signals.title}>
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.signals.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.signals.title}</h3>
      <div className="mt-2.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        <div className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="type-label m-0 text-[1.1rem] font-extrabold text-[var(--color-text-primary)]">{t.signals.goldCard.name}</h4>
            <span className="type-caption font-bold text-[var(--color-chip-ink-attention)]">{t.signals.goldCard.outlook}</span>
          </div>
          <div className="mt-2">
            <Sparkline values={bars.map((p) => p.v)} width={520} height={130} color="var(--color-accent-gold-strong)" fill ariaLabel={t.signals.goldCard.trendLabel} />
          </div>
          <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-4">
            {[
              { l: t.price.windows.d7, v: g.chg7d },
              { l: t.price.windows.d30, v: g.chg30d },
              { l: t.price.windows.d90, v: g.chg90d },
              { l: t.signals.goldCard.ytd, v: ytd },
            ].map((row) => (
              <div key={row.l} className="flex items-baseline justify-between gap-1.5">
                <dt className="type-caption text-[var(--color-text-tertiary)]">{row.l}</dt>
                <dd>
                  <SignedDelta v={row.v} fmt={fmt} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)]">
          <div className="flex items-baseline justify-between gap-2">
            <h4 className="type-label m-0 text-[1.1rem] font-extrabold text-[var(--color-text-primary)]">{t.signals.silverCard.name}</h4>
            {ratio ? (
              <span className="type-caption font-bold text-[var(--color-text-primary)]">
                {t.signals.silverCard.ratio}: <bdi dir="ltr">{fmt.num(ratio, 1)}</bdi>
              </span>
            ) : null}
          </div>
          {silver ? (
            <>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <bdi dir="ltr" className="type-number text-[var(--color-text-primary)]">
                  ${fmt.num(silver.last, 2)}
                </bdi>
                <SignedDelta v={silver.chg30} fmt={fmt} />
                <span className="type-caption text-[var(--color-text-tertiary)]">{t.indicators.d30}</span>
              </div>
              <div className="mt-2">
                <Sparkline values={silver.series.map((p) => p.v)} width={520} height={110} color="var(--color-text-secondary)" ariaLabel={t.signals.silverCard.name} />
            </div>
          </>
        ) : null}
          <p className="m-0 mt-2 type-caption text-[var(--color-text-tertiary)]">
            {t.signals.silverCard.note} — {SEAT_CONTENT["gold-silver"][locale][1]}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The 37 seats — by lane
 * ------------------------------------------------------------------ */

function SeatsBand({ t, fmt, locale, balance }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale; balance: ReturnType<typeof balanceOf> }) {
  const [open, setOpen] = React.useState(true);
  return (
    <section id="gold-lanes" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.seats.eyebrow}</h2>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="rounded-full bg-[var(--color-currena-soft)] px-3 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)]"
        >
          {open ? (locale === "en" ? "Collapse the seats" : "بستن کرسی‌ها") : locale === "en" ? "Open the seats" : "باز کردن کرسی‌ها"}
        </button>
      </div>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.seats.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.seats.subtitle}</p>

      <div className="mt-3 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3 ring-1 ring-[var(--color-border)]">
        <SeatsGrid readings={balance.lanes} locale={locale} fmt={fmt} />
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 type-caption text-[var(--color-text-tertiary)]">
          <span>▲ {locale === "en" ? "supports" : "حمایت"}</span>
          <span>▼ {locale === "en" ? "pressures" : "فشار"}</span>
          <span>• {locale === "en" ? "steady" : "بی‌طرف"}</span>
          <span>◌ {locale === "en" ? "unread" : "ناخوانده"}</span>
        </div>
      </div>

      {open ? (
        <div className="mt-3 flex flex-col gap-4">
          {balance.lanes.map((l) => (
            <div key={l.lane} id={`lane-${l.lane}`} className="gold-anchor-mt">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="type-label m-0 font-extrabold text-[var(--color-text-primary)]">
                  {LANE_CONTENT[l.lane].label[lan(locale)]}
                </h4>
                <span className="type-caption text-[var(--color-text-tertiary)]">
                  {t.seats.tallyLine
                    .replace("{s}", fmt.num(l.supports))
                    .replace("{p}", fmt.num(l.pressures))
                    .replace("{st}", fmt.num(l.steady))
                    .replace("{u}", fmt.num(l.unread))}
                </span>
              </div>
              <div className="mt-1.5">
                <LaneBar lane={l.lane} reading={l} locale={locale} fmt={fmt} />
              </div>
              <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                {l.members.map((m) => {
                  const ink = STATE_INK[m.state];
                  const evidenceWord =
                    m.evidence === "rising"
                      ? t.seats.evidenceRising
                      : m.evidence === "falling"
                        ? t.seats.evidenceFalling
                        : m.evidence === "high"
                          ? t.seats.evidenceHigh
                          : m.evidence === "low"
                            ? t.seats.evidenceLow
                            : null;
                  const why = !m.whyUnread
                    ? null
                    : m.whyUnread === "upstream-stopped"
                      ? t.seats.whyUpstreamStopped
                      : m.whyUnread === "upstream-gap"
                        ? t.seats.whyUpstreamGap
                        : m.whyUnread === "pipeline-lag"
                          ? t.seats.whyPipelineLag
                          : t.seats.whyRuleDriven;
                  return (
                    <li key={m.id} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 rounded-md px-2 py-1 hover:bg-[var(--color-currena-bg-light)]">
                      <span className="w-[1.1rem] shrink-0 text-center text-[11px] font-bold" style={{ color: ink.chip }} aria-hidden="true">
                        {ink.glyph}
                      </span>
                      <span className="type-caption font-semibold text-[var(--color-text-primary)]">
                        {VOTER_NAMES[m.id][lan(locale)]}
                      </span>
                      {evidenceWord ? <span className="type-caption italic text-[var(--color-text-tertiary)]">({evidenceWord})</span> : null}
                      <span className="ms-auto type-caption font-bold" style={{ color: ink.ink }}>
                        {m.state === "supports" ? t.seats.seatSupports : m.state === "pressures" ? t.seats.seatPressures : m.state === "steady" ? t.seats.seatSteady : t.seats.seatUnread}
                      </span>
                      {why ? <span className="w-full ps-[1.6rem] type-caption text-[var(--color-text-tertiary)]">— {why}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The outlook band — horizons + the scenario fan
 * ------------------------------------------------------------------ */

function OutlookBand({ data, t, fmt, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale }) {
  return (
    <section id="gold-outlook" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.outlook.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.outlook.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.outlook.subtitle}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="inline-flex items-baseline gap-1.5 rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-label)] font-semibold text-[var(--color-text-primary)] ring-1 ring-[var(--color-border)]">
          {t.outlook.months} <span className="font-bold text-[var(--color-chip-ink-attention)]">· {t.briefing.chipMonthsLean}</span>
        </span>
        <span className="inline-flex items-baseline rounded-full bg-[var(--color-surface)] px-3 py-1 text-[length:var(--type-caption)] font-semibold text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.outlook.weeks}
        </span>
      </div>
      <div className="mt-3">
        <ScenarioFan
          spot={data.gold.spot}
          locale={locale}
          fmt={fmt}
          labels={{
            up: t.outlook.upside,
            base: t.outlook.base,
            down: t.outlook.downside,
            upNote: t.outlook.upsideNote,
            baseNote: t.outlook.baseNote,
            downNote: t.outlook.downsideNote,
          }}
        />
      </div>
      <p className="m-0 mt-2.5 type-caption italic text-[var(--color-text-tertiary)]">{t.outlook.notForecast}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The dashboard — the key indicators at a glance
 * ------------------------------------------------------------------ */

function DashboardBand({ data, t, fmt, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale }) {
  const ratio = data.silver && data.silver.last > 0 ? data.gold.spot / data.silver.last : null;
  const rows = [
    { name: t.indicators.realYield, stat: data.realYield, unit: "%" },
    { name: t.indicators.dxy, stat: data.dxy, unit: "" },
    { name: t.indicators.usdjpy, stat: data.usdjpy, unit: "" },
    { name: t.indicators.silver, stat: data.silver, unit: "$" },
    { name: t.indicators.spx, stat: data.spx, unit: "" },
    { name: t.indicators.oil, stat: data.oil, unit: "$" },
  ].filter((r) => r.stat !== null) as Array<{ name: string; stat: SeriesStat; unit: string }>;
  return (
    <section id="gold-dashboard" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.indicators.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.indicators.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.indicators.subtitle}</p>
      {ratio ? (
        <p className="m-0 mt-2 type-caption font-semibold text-[var(--color-text-primary)]">
          {t.indicators.goldSilver}: <bdi dir="ltr">{fmt.num(ratio, 1)}</bdi>
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
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The Iran bridge — the clearly regional chapter
 * ------------------------------------------------------------------ */

function BridgeBand({ t, locale }: { t: typeof UI.en; locale: Locale }) {
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

      <div className="mt-3 flex flex-col gap-1.5 rounded-[var(--cr-radius-md)] bg-[var(--color-bridge-accent)]/5 p-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white" style={{ background: "var(--color-bridge-accent)" }}>
              {locale === "en" ? i + 1 : ["۱", "۲", "۳", "۴", "۵"][i]}
            </span>
            <span className="type-caption font-semibold text-[var(--color-text-primary)]">{s}</span>
            {i < steps.length - 1 ? null : null}
          </div>
        ))}
      </div>

      <details className="mt-3 rounded-[var(--cr-radius-md)] ring-1 ring-[var(--color-border)]">
        <summary className="cursor-pointer px-3 py-2 type-caption font-bold text-[var(--color-bridge-accent)]">{t.bridge.methodTitle}</summary>
        <p className="px-3 pb-3 m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.bridge.method}</p>
      </details>
      <p className="m-0 mt-2 type-caption italic text-[var(--color-text-tertiary)]">{t.bridge.note}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The history tail — episodes + the if-you'd-bought calculator
 * ------------------------------------------------------------------ */

function HistoryBand({ data, t, fmt, locale }: { data: GoldPayload; t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; locale: Locale }) {
  return (
    <section id="gold-history" className="gold-anchor-mt mt-3 sm:mt-5">
      <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.history.eyebrow}</h2>
      <h3 className="m-0 mt-1 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">{t.history.title}</h3>
      <p className="m-0 mt-1 type-caption text-[var(--color-text-secondary)]">{t.history.subtitle}</p>
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
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * The takeaway + the footer
 * ------------------------------------------------------------------ */

function TakeawayBanner({ t, locale }: { t: typeof UI.en; locale: Locale }) {
  return (
    <section className="mt-4 flex flex-wrap items-center gap-3 rounded-[var(--cr-radius-lg)] bg-[var(--color-currena-soft)] p-4 sm:p-5" style={{ boxShadow: "var(--cr-shadow-card)" }}>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-gold)] text-[var(--color-accent-gold-ink)]" aria-hidden="true">
        <Lightbulb className="h-5 w-5" />
      </span>
      <div className="min-w-[240px] flex-1">
        <h3 className="m-0 type-label font-extrabold text-[var(--color-text-primary)]">{t.takeaway.title}</h3>
        <p className="m-0 mt-0.5 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.takeaway.body}</p>
      </div>
      <a href="#gold-forces" className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-text-primary)] px-4 py-2 text-[13px] font-bold text-[var(--color-surface)] transition-transform hover:scale-[1.02] active:scale-95">
        {t.takeaway.explore}
        <ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" />
      </a>
    </section>
  );
}

function Footer({ t, fmt, data }: { t: typeof UI.en; fmt: ReturnType<typeof makeFmt>; data: GoldPayload | null }) {
  return (
    <footer className="mt-8 border-t border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="mx-auto w-full max-w-[1080px] px-3 py-6 sm:px-6 lg:px-8">
        <h2 className="type-kicker m-0 text-[var(--color-text-tertiary)]">{t.footer.honestTitle}</h2>
        <p className="m-0 mt-1.5 max-w-prose type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.footer.honestBody}</p>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t border-[var(--color-border)] pt-3">
          <span className="type-caption text-[var(--color-text-tertiary)]">{t.footer.method}</span>
          <span className="type-caption text-[var(--color-text-tertiary)]">
            {t.dataAsOf.replace("{date}", data ? fmt.dateWords(data.asOf) : "—")} · {t.footer.rights} · {t.footer.langNote}
          </span>
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
  const t = UI[locale] as typeof UI.en;
  const fmt = React.useMemo(() => makeFmt(locale), [locale]);
  const balance = React.useMemo(() => balanceOf(), []);
  const { data, isLoading, isError } = useQuery({ queryKey: ["currena-gold"], queryFn: fetchGold });

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
          <h1 className="m-0 mt-1 text-2xl font-extrabold leading-tight text-[var(--color-text-primary)] sm:text-[1.75rem]">{t.title}</h1>
          <p className="m-0 mt-0.5 max-w-prose type-caption leading-snug text-[var(--color-text-secondary)] sm:text-[length:var(--type-label)]">{t.purpose}</p>
          <p className="m-0 mt-1.5 flex flex-wrap items-baseline gap-x-2.5 type-caption font-semibold text-[var(--color-text-tertiary)]">
            {t.dataAsOf.replace("{date}", data ? fmt.dateWords(data.asOf) : "—")} · {t.recordNote}
          </p>
        </header>

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
            {/* the hero: price block + the focal briefing card */}
            <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12 lg:gap-3">
              <div className="lg:col-span-5">
                <PriceCard data={data} t={t} fmt={fmt} />
              </div>
              <div className="lg:col-span-7">
                <BriefingCard data={data} t={t} fmt={fmt} balance={balance} locale={locale} />
              </div>
            </div>

            {/* the composition stack: the brass balance + the five lane bars */}
            <BalanceCard t={t} fmt={fmt} locale={locale} balance={balance} />

            {/* zone D: the narrative + the real-yield card */}
            <NarrativeBand data={data} t={t} fmt={fmt} locale={locale} balance={balance} />

            {/* the five forces: the spine + the explainer diagrams */}
            <ForcesBand data={data} t={t} fmt={fmt} locale={locale} balance={balance} />

            {/* the signals strip */}
            <SignalsBand data={data} t={t} fmt={fmt} locale={locale} />

            {/* the 37 seats */}
            <SeatsBand t={t} fmt={fmt} locale={locale} balance={balance} />

            {/* the outlook */}
            <OutlookBand data={data} t={t} fmt={fmt} locale={locale} />

            {/* the dashboard */}
            <DashboardBand data={data} t={t} fmt={fmt} locale={locale} />

            {/* the Iran bridge */}
            <BridgeBand t={t} locale={locale} />

            {/* the history tail */}
            <HistoryBand data={data} t={t} fmt={fmt} locale={locale} />

            {/* the key takeaway */}
            <TakeawayBanner t={t} locale={locale} />
          </>
        )}
      </main>

      <Footer t={t} fmt={fmt} data={data ?? null} />
    </div>
  );
}
