"use client";

/**
 * The scenarios band — سناریوهای تغییر قیمت, merged with the calendar
 * (the owner's batch-H consolidation: one section, no redundancy — the
 * scenarios above, the dated events below, one construction note).
 *
 * The owner's ask: what replaced the old "what could change it" line — a
 * dedicated section: the 3–5 most relevant, notable, possible things that
 * can bend the gold price up or down, each tied to the economic calendar
 * when the calendar actually dates it (the next Fed decision, the next
 * inflation print…) and honestly un-dated when it does not (a stress
 * spike walks in unannounced). Not a forecast — a list of the bends the
 * market itself watches, never the desk's own odds. The calendar rides
 * inside the same card: the events ARE the scenarios' own dates.
 */

import * as React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import type { Locale } from "@/lib/gold-page/content";
import type { Fmt } from "@/components/gold-page/visuals";
import { PackIcon } from "@/components/gold-page/pack-icon";
import { upcomingEvents } from "@/components/gold-page/calendar";

const lan = (l: Locale) => (l === "en" ? 0 : 1);

export interface ScenarioT {
  title: string;
  subtitle: string;
  upLabel: string;
  downLabel: string;
  nextLabel: string;
  noSchedule: string;
  /** the un-dated fifth force's own disclaimer (the owner's ask): the
 *   stress spike is not certain, so it is not a card — hedged words
 *   under the grid instead. */
  unscheduledNote: string;
}

/* ------------------------------------------------------------------ *
 * The scenario definitions (bilingual) — each links to a calendar
 * event id when the schedule actually dates it, else rides un-dated.
 * ------------------------------------------------------------------ */

interface ScenarioDef {
  id: string;
  /** The calendar event id this scenario is dated by (null = unscheduled). */
  calendarId: string | null;
  name: [string, string];
  upCase: [string, string];
  downCase: [string, string];
}

const SCENARIOS: ReadonlyArray<ScenarioDef> = [
  {
    id: "fed-rates",
    calendarId: "fomc",
    name: ["A change in the Fed's policy rate", "تغییر میزان نرخ بهرهٔ فدرال رزرو"],
    upCase: [
      "A cut, or a dovish hold — cash earns less, and gold's zero-yield rival weakens.",
      "کاهش نرخ یا نگه‌داشتن با لحن انبساطی — پول نقد کم‌سودتر می‌شود و رقیبِ بدون‌بازدهیِ طلا ضعیف می‌شود.",
    ],
    downCase: [
      "A hawkish hold, or a hike — richer cash re-arms the rival and pulls money out of gold.",
      "نگه‌داشتن با لحن انقباضی یا افزایش نرخ — پول نقدِ پرسود رقیب را مسلح می‌کند و پول را از طلا بیرون می‌کشد.",
    ],
  },
  {
    id: "us-inflation",
    calendarId: "cpi",
    name: ["The US inflation print (CPI)", "انتشار تورم آمریکا (CPI)"],
    upCase: [
      "A hotter-than-expected print — inflation-hedging demand for gold picks up.",
      "عددِ بالاتر از انتظار — تقاضای پناه‌گرفتن به طلا در برابر تورم بالا می‌رود.",
    ],
    downCase: [
      "A cooler print — the hedge bid fades and the cut hopes thin.",
      "عددِ خنک‌تر — تقاضای پناه طلا کم می‌شود و انتظارِ کاهش نرخ لاغر می‌شود.",
    ],
  },
  {
    id: "us-jobs",
    calendarId: "nfp",
    name: ["The US jobs report (NFP)", "گزارش اشتغال آمریکا (NFP)"],
    upCase: [
      "Weak jobs — recession worry and rate-cut bets rise together.",
      "اشتغال ضعیف — نگرانی رکود و شرط‌بندی روی کاهش نرخ، با هم بالا می‌روند.",
    ],
    downCase: [
      "A blowout report — the cut hopes fade and cash gets bid.",
      "گزارش قوی — امیدِ کاهش نرخ محو می‌شود و پول نقد خواستار می‌شود.",
    ],
  },
  {
    id: "us-pce",
    calendarId: "pce",
    name: ["The Fed's own inflation gauge (PCE)", "سنجهٔ تورمِ خودِ فدرال رزرو (PCE)"],
    upCase: [
      "A hot PCE — the inflation-hedge bid deepens, the gauge the Fed actually watches.",
      "PCE داغ — سنجه‌ای که فدرال رزرو واقعاً می‌نگرد؛ تقاضای پناهِ تورمی عمیق‌تر می‌شود.",
    ],
    downCase: [
      "A cool PCE — the Fed's guard drops and gold's inflation story thins.",
      "PCE خنک — گاردِ فدرال رزرو پایین می‌آید و روایتِ تورمیِ طلا لاغر می‌شود.",
    ],
  },
  /* the stress spike is retired from the cards (the owner's ask): it
     is not a dated, certain event — it walks in unannounced, so it
     rides as the hedged disclaimer under the grid instead */
];

/* ------------------------------------------------------------------ *
 * The band
 * ------------------------------------------------------------------ */

export function ScenariosBand({
  t,
  locale,
  fmt,
  calendar,
}: {
  t: ScenarioT;
  locale: Locale;
  fmt: Fmt;
  /** The calendar list (the merged section's second half — the events ARE the scenarios' dates). */
  calendar: React.ReactNode;
}) {
  /* mounted gate — the schedule reads the reader's own clock, after mount
     (hydration-safe, the same convention the calendar band itself uses) */
  const [now, setNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setNow(new Date());
  }, []);

  /* every scenario's next dated occurrence, straight from the very same
     schedule generator the calendar band renders (one calendar, one truth) */
  const nextOf = React.useMemo(() => {
    if (now === null) return new Map<string, { date: string; approximate: boolean }>();
    const m = new Map<string, { date: string; approximate: boolean }>();
    for (const e of upcomingEvents(now, 60)) {
      if (!m.has(e.def.id)) m.set(e.def.id, { date: e.date, approximate: e.approximate });
    }
    return m;
  }, [now]);

  /* the owner's ask: the cards sort by their next date — the most
     upcoming first (every scenario carries a calendar date now, the
     un-dated stress spike retired to the disclaimer below) */
  const ordered = React.useMemo(() => {
    const withDate = SCENARIOS.filter((s) => s.calendarId !== null && nextOf.has(s.calendarId!));
    const rest = SCENARIOS.filter((s) => !(s.calendarId !== null && nextOf.has(s.calendarId!)));
    withDate.sort((a, b) => {
      const da = nextOf.get(a.calendarId!)!.date;
      const db = nextOf.get(b.calendarId!)!.date;
      return da < db ? -1 : da > db ? 1 : 0;
    });
    return [...withDate, ...rest];
  }, [nextOf]);

  return (
    <section id="gold-scenarios" className="gold-anchor-mt mt-3 flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-surface)] p-4 shadow-[var(--cr-shadow-card)] ring-1 ring-[var(--color-border)] sm:mt-5 sm:p-5">
      <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">
        <PackIcon file="gold-price-speculation-scenarios.png" size={128} className="h-32 w-32" />
        {t.title}
      </h2>
      <p className="m-0 mt-1 type-caption leading-relaxed text-[var(--color-text-secondary)]">{t.subtitle}</p>

      <div className="mt-3.5 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {ordered.map((s, i) => {
          const next = s.calendarId !== null ? nextOf.get(s.calendarId) ?? null : null;
          return (
            <article
              key={s.id}
              className="flex flex-col gap-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-3.5 ring-1 ring-[var(--color-border)]"
            >
              {/* the header — [date] over [title] (the owner's ask): the
                  next occurrence leads, the scenario's name under it */}
              <div className="flex items-start gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px] font-extrabold text-white"
                  style={{
                    /* pastel gold (the owner's ask — the harsh ink retired),
                       white numerals riding a soft ring for definition */
                    background: "color-mix(in srgb, var(--color-accent-gold) 68%, white)",
                    boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-accent-gold-deep) 40%, transparent)",
                  }}
                  aria-hidden="true"
                >
                  {locale === "en" ? i + 1 : ["۱", "۲", "۳", "۴", "۵"][i] ?? fmt.num(i + 1, 0)}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  {next !== null ? (
                    <bdi className="type-caption font-bold text-[var(--color-currena-blue-deep)]">
                      {fmt.dateWords(next.date)}
                      {next.approximate ? " ≈" : ""}
                    </bdi>
                  ) : (
                    <span className="type-caption italic text-[var(--color-text-tertiary)]">{t.noSchedule}</span>
                  )}
                  <h3 className="m-0 type-label font-extrabold leading-snug text-[var(--color-text-primary)]">{s.name[lan(locale)]}</h3>
                </div>
              </div>

              {/* the two directions — up first, down second, never alone;
                  the colour rides ONLY on the chip (رشد طلا / افت طلا),
                  the outcome sentence itself stays neutral (the owner's
                  ask) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-start gap-2 rounded-[var(--cr-radius-sm)] p-2">
                  <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 type-caption font-bold" style={{ color: "var(--color-return-up)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-return-up) 35%, transparent)" }}>
                    <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    {t.upLabel}
                  </span>
                  <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{s.upCase[lan(locale)]}</p>
                </div>
                <div className="flex items-start gap-2 rounded-[var(--cr-radius-sm)] p-2">
                  <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 type-caption font-bold" style={{ color: "var(--color-return-down)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--color-return-down) 35%, transparent)" }}>
                    <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    {t.downLabel}
                  </span>
                  <p className="m-0 type-caption leading-relaxed text-[var(--color-text-secondary)]">{s.downCase[lan(locale)]}</p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* the un-dated fifth force as a disclaimer (the owner's ask): the
          stress spike is NOT certain — no card, no equal weight, hedged
          words under the grid; the cards above stay the dated, scheduled
          bends only */}
      <p
        className="m-0 mt-3 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-bg-light)] p-2.5 text-[12px] italic leading-relaxed text-[var(--color-text-tertiary)] ring-1 ring-[var(--color-border)]/60"
        data-scenarios-unscheduled
      >
        {t.unscheduledNote}
      </p>

      {/* the merged calendar — the section's own second half (the events
          ARE the scenarios' dates; one card, no second section, no
          repeated framing) */}
      {calendar}
    </section>
  );
}
