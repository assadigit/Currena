"use client";

/**
 * The economic calendar — the events that can bend gold, coming up.
 *
 * The owner's ask: a calendar of the most upcoming events that can
 * change gold's path (Fed rate decisions and the rest). Deterministic
 * and self-contained: the FOMC dates are the Fed's own published
 * calendar; the recurring US releases ride their standard slots and
 * carry an ≈ until the agency's exact date lands. The gold-relevant
 * calendar the expectations leg used to carry (the ABS/RBA and the
 * rest of the insights snapshot's own schedule) is merged in here,
 * deduplicated against the locally computed events — one calendar,
 * no second section. Computed from the reader's own clock after
 * mount (never a server/client mismatch): the three next events show
 * at once, everything after rides the expandable list. A schedule,
 * not a forecast — the desk marks when the market re-weighs its
 * odds, never what it will print.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Info } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt } from "@/components/gold-page/visuals";
import { CountryFlag } from "@/components/gold-page/flags";
import { PackIcon } from "@/components/gold-page/pack-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

type CalT = {
  /** The one lead line over the events list — the merged section's own
   *  closing half (no second head, no second subtitle, no method block:
   *  one card, one framing, the events ARE the scenarios' dates). */
  eventsLead: string;
  impactHigh: string;
  impactMed: string;
  daysAway: string;
  todayWord: string;
  tomorrowWord: string;
  whyLabel: string;
  /** the row's own one-tap affordance — a words-first chip that says the
   *  modal carries the why (the owner's 2026-11-26 ask: the bare «؟»
   *  retired; the affordance names what it opens) */
  whyChip: string;
  moreLabel: string;
  fewerLabel: string;
  unavailable: string;
};

/* ------------------------------------------------------------------ *
 * The schedule's own data (bilingual)
 * ------------------------------------------------------------------ */

export interface EventDef {
  id: string;
  country: string;
  flagCode: string;
  name: [string, string];
  /** The chip's own compact label (the header pill's kind list). */
  short: [string, string];
  why: [string, string];
  impact: "high" | "med" | null;
}

/** The Fed's own published FOMC decision dates (2026–2027). */
const FOMC_DATES: ReadonlyArray<string> = [
  "2026-12-09",
  "2027-01-27",
  "2027-03-17",
  "2027-04-28",
  "2027-06-16",
  "2027-07-28",
  "2027-09-15",
  "2027-10-27",
  "2027-12-08",
];

const FOMC_DEF: EventDef = {
  id: "fomc",
  country: "US",
  flagCode: "USA",
  name: ["Fed rate decision (FOMC)", "تصمیم نرخ فدرال رزرو (FOMC)"],
  short: ["Fed", "فدرال رزرو"],
  why: [
    "Sets the cost of the dollar, the single biggest scheduled re-weighing of gold's zero-yield rival: cash.",
    "هزینهٔ دلار را تعیین می‌کند؛ بزرگ‌ترین بازسنجی زمان‌بندی‌شدهٔ رقیب بدون‌بازدهی طلا، یعنی پول نقد.",
  ],
  impact: "high",
};

const FIXED_EVENTS: ReadonlyArray<{ date: string; def: EventDef }> = [
  ...FOMC_DATES.map((date) => ({ date, def: FOMC_DEF })),
  { date: "2026-12-17", def: {
    id: "ecb",
    country: "EU",
    flagCode: "EURO",
    name: ["ECB rate decision", "تصمیم نرخ بانک مرکزی اروپا"] as [string, string],
    short: ["ECB", "بانک مرکزی اروپا"] as [string, string],
    why: [
      "The euro side of the dollar: a dovish ECB weakens the dollar's rival and lifts gold's wind.",
      "سمت یوروییِ دلار؛ بانک مرکزی اروپای انبساطی، رقیب دلار را ضعیف و باد طلا را قوی می‌کند.",
    ],
    impact: "med" as const,
  } },
  { date: "2026-12-17", def: {
    id: "boe",
    country: "GB",
    flagCode: "GBR",
    name: ["Bank of England rate decision", "تصمیم نرخ بانک انگلستان"] as [string, string],
    short: ["BoE", "بانک انگلستان"] as [string, string],
    why: [
      "Sterling's own rate path: a sideshow for gold, but it moves the dollar crosses.",
      "مسیر نرخ پوند؛ برای طلا برنامهٔ فرعی است، اما کراس‌های دلار را تکان می‌دهد.",
    ],
    impact: "med" as const,
  } },
  { date: "2026-12-18", def: {
    id: "boj",
    country: "JP",
    flagCode: "JPN",
    name: ["Bank of Japan rate decision", "تصمیم نرخ بانک ژاپن"] as [string, string],
    short: ["BoJ", "بانک ژاپن"] as [string, string],
    why: [
      "The low-rate anchor of the world: a BoJ normalisation moves every yield, gold's included.",
      "لنگر کم‌نرخِ جهان؛ نرمال‌سازی بانک ژاپن همهٔ بازدهی‌ها را تکان می‌دهد، از جمله بازدهیِ رقیب طلا.",
    ],
    impact: "med" as const,
  } },
];

/** The recurring US releases — their standard slots, ≈ until dated. */
const RULE_EVENTS: ReadonlyArray<{
  id: string;
  approximate: boolean;
  def: EventDef;
  /** The next occurrence (UTC date) at or after `from`. */
  next: (from: Date) => Date;
}> = [
  {
    id: "nfp",
    approximate: false,
    def: {
      id: "nfp",
      country: "US",
      flagCode: "USA",
      name: ["US jobs report (NFP)", "گزارش اشتغال آمریکا (NFP)"] as [string, string],
      short: ["jobs", "اشتغال"] as [string, string],
      why: [
        "The Fed's other mandate: strong jobs keep policy tight; a shock number moves gold within seconds.",
        "مأموریت دیگر فدرال رزرو؛ اشتغال قوی سیاست را سخت نگه می‌دارد و عدد شوکی طلا را در چند ثانیه تکان می‌دهد.",
      ],
      impact: "high",
    },
    next: (from: Date): Date => {
      // the first Friday of the month
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
      while (d.getUTCDay() !== 5 || d.getTime() < from.getTime()) {
        if (d.getUTCDay() === 5 && d.getTime() >= from.getTime()) break;
        d.setUTCDate(d.getUTCDate() + 1);
        if (d.getUTCDate() === 1) d.setUTCDate(d.getUTCDate() + 1);
      }
      return d;
    },
  },
  {
    id: "cpi",
    approximate: true,
    def: {
      id: "cpi",
      country: "US",
      flagCode: "USA",
      name: ["US CPI (inflation)", "تورم آمریکا (CPI)"] as [string, string],
      short: ["CPI", "تورم"] as [string, string],
      why: [
        "Hot prints push the Fed path higher, real yields up and gold down; soft prints do the reverse.",
        "اعداد داغ مسیر فدرال رزرو را بالا می‌برند؛ بازدهی واقعی بالا، طلا پایین و اعداد ملایم برعکس.",
      ],
      impact: "high",
    },
    next: (from: Date): Date => {
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 12));
      if (d.getTime() < from.getTime()) d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    },
  },
  {
    id: "pce",
    approximate: true,
    def: {
      id: "pce",
      country: "US",
      flagCode: "USA",
      name: ["US PCE (the Fed's gauge)", "شاخص PCE (سنجهٔ خود فدرال رزرو)"] as [string, string],
      short: ["PCE", "PCE"] as [string, string],
      why: [
        "The inflation measure the FOMC actually targets, the one that dates the pivot.",
        "سنجهٔ تورمی که FOMC واقعاً هدف می‌گیرد؛ همان که تاریخِ چرخش را می‌نهد.",
      ],
      impact: "high",
    },
    next: (from: Date): Date => {
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 27));
      if (d.getTime() < from.getTime()) d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    },
  },
  {
    id: "claims",
    approximate: false,
    def: {
      id: "claims",
      country: "US",
      flagCode: "USA",
      name: ["Jobless claims", "ادعای بیکاری"] as [string, string],
      short: ["claims", "ادعای بیکاری"] as [string, string],
      why: [
        "The weekly pulse of the labour market: small alone, but it nudges the odds.",
        "نبض هفتگی بازار کار؛ به‌تنهایی کوچک، اما شانس‌ها را کمی تکان می‌دهد.",
      ],
      impact: "med",
    },
    next: (from: Date): Date => {
      const d = new Date(from);
      const add = (4 - d.getUTCDay() + 7) % 7 || 7;
      d.setUTCDate(d.getUTCDate() + add);
      return d;
    },
  },
  {
    id: "gdp",
    approximate: true,
    def: {
      id: "gdp",
      country: "US",
      flagCode: "USA",
      name: ["US GDP (advance)", "رشد اقتصادی آمریکا (برآورد اولیه)"] as [string, string],
      short: ["GDP", "رشد"] as [string, string],
      why: [
        "Growth sets the rate path's ceiling: strong growth keeps the Fed patient.",
        "رشد سقف مسیر نرخ را می‌سازد؛ رشد قوی فدرال رزرو را صبور نگه می‌دارد.",
      ],
      impact: "med",
    },
    next: (from: Date): Date => {
      const quarterEndMonths = [2, 5, 8, 11]; // the quarter's last month
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 25));
      if (d.getTime() < from.getTime()) d.setUTCMonth(d.getUTCMonth() + 1);
      while (!quarterEndMonths.includes(d.getUTCMonth())) {
        d.setUTCMonth(d.getUTCMonth() + 1);
        d.setUTCDate(25);
      }
      return d;
    },
  },
  {
    id: "pmi",
    approximate: true,
    def: {
      id: "pmi",
      country: "US",
      flagCode: "USA",
      name: ["Flash PMI", "شاخص PMI (سریع)"] as [string, string],
      short: ["PMI", "PMI"] as [string, string],
      why: [
        "The month's first growth read: risk appetite's early dial.",
        "اولین قرائت رشدِ ماه؛ عقربهٔ زودهنگامِ اشتها به ریسک.",
      ],
      impact: "med",
    },
    next: (from: Date): Date => {
      const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 22));
      if (d.getTime() < from.getTime()) d.setUTCMonth(d.getUTCMonth() + 1);
      return d;
    },
  },
];

export interface UpcomingEvent {
  key: string;
  date: string;
  approximate: boolean;
  def: EventDef;
}

/** The next `n` events from `now` (the honest generator — fixed + rules).
 *  Exported so the scenarios band can read the very same schedule (one
 *  calendar, one source of truth — the scenarios quote its live dates). */
export function upcomingEvents(now: Date, n = 14): UpcomingEvent[] {
  const nowT = now.getTime();
  const pool: UpcomingEvent[] = [];
  for (const e of FIXED_EVENTS) {
    if (Date.parse(`${e.date}T00:00:00Z`) >= nowT - 86_400_000) {
      pool.push({ key: `${e.def.id}-${e.date}`, date: e.date, approximate: false, def: e.def });
    }
  }
  for (const rule of RULE_EVENTS) {
    // two occurrences of each recurring release ahead of us
    let cursor = new Date(nowT);
    for (let k = 0; k < 2; k++) {
      const next = rule.next(cursor);
      const iso = next.toISOString().slice(0, 10);
      pool.push({ key: `${rule.id}-${iso}`, date: iso, approximate: rule.approximate, def: rule.def });
      cursor = new Date(next.getTime() + 86_400_000);
    }
  }
  pool.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.key < b.key ? -1 : 1));
  // dedupe (an exact-dated FOMC may coincide with a rule's slot key etc.)
  const seen = new Set<string>();
  const out: UpcomingEvent[] = [];
  for (const e of pool) {
    if (seen.has(e.key)) continue;
    seen.add(e.key);
    out.push(e);
    if (out.length >= n) break;
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * The merged leg — the expectations snapshot's gold-relevant calendar
 * (the section the expectations band used to carry, folded in here)
 * ------------------------------------------------------------------ */

interface ExpectationsCalendarPayload {
  calendar: ReadonlyArray<{ id: string; date: string; titleEn: string; titleFa: string; kind: string }>;
}

async function fetchExpectationsCalendar(): Promise<ExpectationsCalendarPayload> {
  const res = await fetch(`${deskBasePath}/api/gold/expectations`, { cache: "no-store" });
  if (!res.ok) throw new Error(`The expectations calendar leg responded with ${res.status}`);
  return res.json() as Promise<ExpectationsCalendarPayload>;
}

/** The insights calendar's kinds that the local schedule already covers. */
const KIND_TO_LOCAL_ID: Record<string, string> = {
  fed: "fomc",
  "us-jobs": "nfp",
  "us-cpi": "cpi",
  "us-pce": "pce",
  "us-claims": "claims",
  "us-gdp": "gdp",
  "us-pmi": "pmi",
  ecb: "ecb",
  boe: "boe",
  boj: "boj",
};

/** The jurisdiction a merged entry rides (flag + country name). */
const KIND_JURISDICTION: Record<string, { country: string; flagCode: string }> = {
  fed: { country: "US", flagCode: "USA" },
  us: { country: "US", flagCode: "USA" },
  ecb: { country: "EU", flagCode: "EURO" },
  boe: { country: "GB", flagCode: "GBR" },
  boj: { country: "JP", flagCode: "JPN" },
};

/* Domestic-only releases (ABS prints, RBA board minutes and the rest
   of the Australian schedule) never join the global gold calendar: they
   move the Aussie dollar's own home crowd, not the ounce. */
const DOMESTIC_ONLY_KINDS: ReadonlyArray<string> = ["abs", "rba"];
const isDomesticOnly = (kind: string): boolean =>
  DOMESTIC_ONLY_KINDS.some((k) => kind === k || kind.startsWith(`${k}-`));

/* ------------------------------------------------------------------ *
 * The band
 * ------------------------------------------------------------------ */

export function CalendarBand({ t, locale, fmt }: { t: CalT; locale: Locale; fmt: Fmt }) {
  /* mounted gate — the schedule reads the reader's own clock, never the
     server's, so the list is computed after mount (hydration-safe) */
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
  }, []);
  /* the merged leg — the gold-relevant calendar the expectations section
     used to carry; fail-closed (its absence simply keeps the local list) */
  const merged = useQuery({
    queryKey: ["currena-gold-expectations-calendar"],
    queryFn: fetchExpectationsCalendar,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const events = React.useMemo(() => {
    if (now === null) return [];
    const local = upcomingEvents(now, 14);
    const extra = merged.data?.calendar ?? [];
    const out = [...local];
    for (const c of extra) {
      if (typeof c.date !== "string" || !c.date) continue;
      // domestic-only releases (the Australian home crowd) never ride the
      // global gold calendar — irrelevant to the ounce
      if (isDomesticOnly(c.kind ?? "")) continue;
      // dedupe against the locally computed schedule (same date + same event)
      const localId = KIND_TO_LOCAL_ID[c.kind ?? ""];
      if (localId !== undefined && out.some((e) => e.date === c.date && e.def.id === localId)) continue;
      if (out.some((e) => e.key === `x-${c.id}`)) continue;
      const juris = KIND_JURISDICTION[(c.kind ?? "").split("-")[0] ?? ""];
      out.push({
        key: `x-${c.id}`,
        date: c.date,
        approximate: false,
        def: {
          id: c.id,
          country: juris?.country ?? "",
          flagCode: juris?.flagCode ?? "",
          name: [c.titleEn || c.id, c.titleFa || c.titleEn || c.id],
          short: [c.titleEn || c.id, c.titleFa || c.titleEn || c.id],
          why: ["", ""],
          impact: null,
        },
      });
    }
    out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.key < b.key ? -1 : 1));
    return out;
  }, [now, merged.data]);

  /* the three next events show at once; the rest ride the expandable */
  const [open, setOpen] = React.useState(false);
  const VISIBLE = 3;

  /* the why-modal — one dialog, driven by the opened event's key; the row
     itself shows only the day and the days-until, the "why it moves gold"
     explanation sits behind the ? tap (the owner's own ask) */
  const [openWhy, setOpenWhy] = React.useState<string | null>(null);
  const lastWhyTriggerRef = React.useRef<HTMLButtonElement | null>(null);
  const whyEvent = React.useMemo(
    () => events.find((e) => e.key === openWhy) ?? null,
    [events, openWhy],
  );

  const daysWord = (days: number): string => {
    if (days === 0) return t.todayWord;
    if (days === 1) return t.tomorrowWord;
    return t.daysAway.replace("{n}", fmt.num(days, 0));
  };

  const renderItem = (e: UpcomingEvent) => {
    const days = now === null ? 0 : Math.max(0, Math.round((Date.parse(`${e.date}T00:00:00Z`) - now.getTime()) / 86_400_000));
    const soon = days <= 7;
    const hasWhy = e.def.why[lan(locale)] !== "";
    return (
      <li
        key={e.key}
        className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-2.5 gap-y-0.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] px-2.5 py-2 ring-1 ring-[var(--color-border)]"
      >
        <span className="flex items-center gap-2">
          <CountryFlag code={e.def.flagCode} name={e.def.country} />
          <span className="type-caption font-bold text-[var(--color-accent-gold-deep)]">{fmt.dateWords(e.date)}</span>
        </span>
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2">
          <span className="type-caption font-bold text-[var(--color-text-primary)]">
            {e.def.name[lan(locale)]}
            {e.approximate ? <span title={locale === "en" ? "near its usual slot" : "نزدیک جایگاه همیشگی"}> ≈</span> : null}
          </span>
          {e.def.impact !== null ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                e.def.impact === "high"
                  ? "bg-[var(--color-status-alert)]/10 text-[var(--color-chip-ink-attention)]"
                  : "bg-[var(--color-chip-ink-context)]/10 text-[var(--color-chip-ink-context)]"
              }`}
            >
              {e.def.impact === "high" ? t.impactHigh : t.impactMed}
            </span>
          ) : null}
          {hasWhy ? (
            /* the why-chip (the owner's 2026-11-26 ask): the bare «؟» icon
               retired — the affordance is a words-first chip that names
               what the tap opens, so the reader knows it is clickable and
               what they will get (the event's effect on gold) */
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={openWhy === e.key}
              aria-label={`${t.whyLabel}: ${e.def.name[lan(locale)]}`}
              onClick={(ev) => {
                lastWhyTriggerRef.current = ev.currentTarget;
                setOpenWhy(e.key);
              }}
              className="inline-flex min-h-[24px] shrink-0 items-center gap-1 rounded-full bg-[var(--color-currena-soft)] px-2.5 type-caption font-bold text-[var(--color-currena-blue-deep)] transition-colors hover:bg-[var(--color-accent-gold)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-currena-blue)]"
            >
              <Info className="h-3 w-3" aria-hidden="true" />
              {t.whyChip}
            </button>
          ) : null}
        </span>
        <span className={`type-caption font-bold whitespace-nowrap ${soon ? "text-[var(--color-chip-ink-attention)]" : "text-[var(--color-text-tertiary)]"}`}>
          {daysWord(days)}
        </span>
      </li>
    );
  };

  return (
    <div className="mt-4 border-t border-[var(--color-border)] pt-3.5">
      {/* THE one lead line (the owner's batch-I ask: the merged card has
          one framing — the scenarios' own; the events below are simply
          their dates, no second head, no second subtitle, no method
          block — the user faces the upcoming events, nothing else).
          The owner's pack icon (batch N) carries the calendar's
          identity — the gold desk-calendar render in place of the old
          little lucide clock — riding the lead line at the owner's
          batch-O 128px floor, with the lead words + count wrapping
          INSIDE their own column beside it (never dropping under the
          icon). The lead is a HEADING now (the owner's ask): the
          events' own title, «رویدادهای پیش‌روی طلا». */}
      <h3 className="m-0 flex items-center gap-3 text-[1.02rem] font-extrabold text-[var(--color-text-primary)]">
        <PackIcon file="gold-events-calendar.png" size={128} className="h-32 w-32" />
        <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
          {t.eventsLead}
          <span className="type-caption font-semibold text-[var(--color-text-tertiary)]">
            {events.length > 0 ? `· ${fmt.num(events.length, 0)} ${locale === "en" ? "events" : "رویداد"}` : ""}
          </span>
        </span>
      </h3>

      {now === null ? (
        <p className="m-0 mt-3 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">
          …
        </p>
      ) : (
        <>
          {/* the three next events — visible without a click */}
          <ol className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">{events.slice(0, VISIBLE).map(renderItem)}</ol>

          {/* everything after — one tap away */}
          {events.length > VISIBLE ? (
            <div className="mt-2">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full bg-transparent px-3.5 py-1 text-[12.5px] font-bold text-[var(--color-currena-blue-deep)] ring-1 ring-[var(--color-currena-blue)]/60 transition-transform hover:scale-[1.02] active:scale-95"
              >
                {open ? t.fewerLabel : t.moreLabel.replace("{n}", fmt.num(events.length - VISIBLE, 0))}
                <span aria-hidden="true" className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>
              {open ? (
                <ol className="m-0 mt-2 flex list-none flex-col gap-1.5 p-0">{events.slice(VISIBLE).map(renderItem)}</ol>
              ) : null}
            </div>
          ) : null}
        </>
      )}

      {/* the why-modal — the event's own explanation, behind the ? tap */}
      <Dialog
        open={openWhy !== null}
        onOpenChange={(o) => {
          if (!o) {
            setOpenWhy(null);
            const trigger = lastWhyTriggerRef.current;
            window.setTimeout(() => trigger?.focus(), 0);
          }
        }}
      >
        {whyEvent !== null ? (
          <DialogContent className="rounded-[var(--cr-radius-lg)] border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-start ring-1 ring-[var(--color-border)] sm:p-5 sm:max-w-[440px]">
            <DialogHeader className="text-start pe-11">
              <p className="type-caption m-0 font-bold text-[var(--color-accent-gold-deep)]">
                {fmt.dateWords(whyEvent.date)} · {daysWord(Math.max(0, Math.round((Date.parse(`${whyEvent.date}T00:00:00Z`) - (now?.getTime() ?? 0)) / 86_400_000)))}
              </p>
              <DialogTitle className="type-label text-start text-[var(--color-text-primary)]">
                {whyEvent.def.name[lan(locale)]}
              </DialogTitle>
            </DialogHeader>
            <DialogDescription className="m-0 type-label leading-relaxed text-[var(--color-text-secondary)] pe-11">
              <span className="font-bold">{t.whyLabel}:</span> {whyEvent.def.why[lan(locale)]}
            </DialogDescription>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
