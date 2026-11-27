"use client";

/**
 * The WGC monthly commentary card — the World Gold Council's monthly
 * Gold Market Commentary Highlights on the Persian gold page
 * (docs/wgc-monthly-commentary-spec.md §6), placed directly under the
 * Market Brief: the WGC's monthly one-glance beside the desk's own.
 *
 * What it shows, honestly:
 *  - The header: one language, one title — «نگارش ماهانهٔ شورای جهانی
 *    طلا» in fa (the h2 the owner asked for, never a second language
 *    beside it), the English title in EN — on the house card patterns.
 *  - fa mode, when a fresh Persian translation is stored (spec §8,
 *    implemented 2026-11-25): the Farsi segments render as the PRIMARY
 *    RTL text — the ONLY text (the owner's batch-K ask: one language
 *    per page, the English original dropped, "in Farsi show Farsi, in
 *    English show English") — with the attribution as the quiet
 *    "AI-translated" corner badge on the header row (the engine + date
 *    ride its tooltip), replacing the old in-body «ترجمهٔ ماشینی» label.
 *  - fa mode with NO stored Farsi (the 17 pre-feature issues, an AI
 *    failure): today's behavior exactly — the English verbatim, primary,
 *    with no badge and no fake translation. EN mode always renders the
 *    English verbatim (the fa layer is the Persian page's own).
 *  - The 11px whisper meta line: the published date, the fetched date,
 *    and «منبع: World Gold Council» with the canonical gold.org link.
 *  - The honest states riding the same card: waiting (the window named,
 *    the attempt count), missed (the window closed — a stated fact),
 *    structure_alert (the template changed; the last known good serves),
 *    and the June/November skip fact.
 *
 * Served by the desk's own read-only route /api/gold/wgc-commentary
 * (D1 only); fail-closed like every house leg.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import { type Fmt, faDigits } from "@/components/gold-page/visuals";
import { faGlossary } from "@/lib/gold-page/fa-glossary";

/* ------------------------------------------------------------------ *
 * The payload (the route's contract)
 * ------------------------------------------------------------------ */

export interface WgcSegment {
  heading: string;
  body: string;
}

/** The stored Persian translation of one issue — the route's additive fa field. */
export interface WgcFa {
  headline: string | null;
  segments: WgcSegment[];
  sourceModel?: string; // the engine recorded at translation time (the bake-off's selection)
  translatedAt?: string;
}

export interface WgcIssue {
  month: string; // the REVIEWED month, "YYYY-MM"
  headline: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sourceUrl: string;
  blockVariant: string;
  segments: WgcSegment[];
  fa?: WgcFa; // present iff the route found a fresh stored translation
}

export interface WgcLatest {
  status: "ok" | "waiting" | "missed" | "structure_alert";
  month: string;
  attempts?: number;
  windowClosesDay?: number;
  skipTarget?: string;
  lastKnownGood?: WgcIssue | null;
  // the flat issue fields when status is "ok":
  headline?: string | null;
  publishedAt?: string | null;
  fetchedAt?: string;
  sourceUrl?: string;
  blockVariant?: string;
  segments?: WgcSegment[];
  fa?: WgcFa;
}

async function fetchWgc(): Promise<WgcLatest> {
  const res = await fetch(`${deskBasePath}/api/gold/wgc-commentary`, { cache: "no-store" });
  if (!res.ok) throw new Error(`/api/gold/wgc-commentary responded with ${res.status}`);
  return (await res.json()) as WgcLatest;
}

/* ------------------------------------------------------------------ *
 * The copy bundle (content.ts owns the words; this types them)
 * ------------------------------------------------------------------ */

export interface WgcCardCopy {
  title: string;
  issueLabel: string;
  publishedLabel: string;
  fetchedLabel: string;
  /** The single stamp when published and fetched are the same day (batch L). */
  updatedLabel: string;
  stateWaiting: string;
  stateMissed: string;
  stateAlert: string;
  stateSkip: string;
  unavailable: string;
}

/* ------------------------------------------------------------------ *
 * The helpers
 * ------------------------------------------------------------------ */

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_FA = [
  "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
  "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
];

/** "2026-10" → "October 2026" / «اکتبر ۲۰۲۶» — the REVIEWED month, named. */
function monthLabel(monthKey: string, locale: Locale): string {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  const name = (locale === "fa" ? MONTHS_FA : MONTHS_EN)[month - 1] ?? monthKey;
  // the year never carries a grouping separator ("2026", never "2,026");
  // fa renders it in Persian digits
  const yearText =
    locale === "fa" ? String(year).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!) : String(year);
  return `${name} ${yearText}`;
}

/** The reviewed Gregorian month's Jalali equivalent, «آبان»-style (the
 *  owner's 2026-11-27 ask: the title reads «مرور ماه اکتبر (آبان)» — the
 *  month NAME alone in the parenthesis, both years retired as redundant).
 *  The month's LAST day names the Jalali month — the issue lands at the
 *  month's close, so its Persian-calendar address is where it ends. */
function jalaliMonthLabel(monthKey: string): string | null {
  const year = Number(monthKey.slice(0, 4));
  const month = Number(monthKey.slice(5, 7));
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)); // day 0 of next month = this month's last day
  try {
    /* the Jalali month name alone («آبان»), its year dropped — the
       title's own year pair was retired as redundant */
    const m = new Intl.DateTimeFormat("fa-IR-u-ca-persian", { month: "long" }).format(lastDay);
    return m.replace(/\u200f/g, ""); // the RTL mark the formatters inject
  } catch {
    return null;
  }
}

/** The date part of an ISO stamp, formatted in the reader's calendar. */
function dateWordsOf(iso: string | null | undefined, fmt: Fmt): string | null {
  if (!iso) return null;
  const d = iso.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? fmt.dateWords(d) : null;
}

/* ------------------------------------------------------------------ *
 * The card
 * ------------------------------------------------------------------ */

export function WgcCard({
  t,
  locale,
  fmt,
}: {
  t: WgcCardCopy;
  locale: Locale;
  fmt: Fmt;
}) {
  const q = useQuery({
    queryKey: ["currena-gold-wgc"],
    queryFn: fetchWgc,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const d = q.data;

  /* the served issue: the response itself when ok, else the last known good */
  const issue: WgcIssue | null = d
    ? d.status === "ok" && d.segments !== undefined
      ? {
          month: d.month,
          headline: d.headline ?? null,
          publishedAt: d.publishedAt ?? null,
          fetchedAt: d.fetchedAt ?? "",
          sourceUrl: d.sourceUrl ?? "",
          blockVariant: d.blockVariant ?? "",
          segments: d.segments,
          fa: d.fa,
        }
      : (d.lastKnownGood ?? null)
    : null;

  /* the Persian layer serves only the fa page, only when actually stored */
  const fa = locale === "fa" && issue?.fa && issue.fa.segments.length > 0 ? issue.fa : null;

  const published = dateWordsOf(issue?.publishedAt, fmt);
  const fetched = dateWordsOf(issue?.fetchedAt, fmt);

  /* the fa issue title (the owner's 2026-11-27 ask):
     «مرور ماه اکتبر (آبان)» — the month word, no year pair, the
     Jalali month alone in the parenthesis; EN keeps its own
     month-and-year label */
  const issueTitle =
    issue !== null
      ? (() => {
          const gregorian = monthLabel(issue.month, locale);
          const monthNameOnly = (() => {
            const month = Number(issue.month.slice(5, 7));
            return MONTHS_FA[month - 1] ?? issue.month;
          })();
          const jalali = locale === "fa" ? jalaliMonthLabel(issue.month) : null;
          return t.issueLabel
            .replace("{month}", locale === "fa" ? monthNameOnly : gregorian)
            .replace("{jalali}", jalali !== null ? ` (${jalali})` : "");
        })()
      : null;

  return (
    <section
      id="gold-wgc"
      aria-label={t.title}
      className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-currena-bg-light)] p-4 ring-1 ring-[var(--color-border)] sm:p-5"
    >
      {/* the header — one language, one title: the fa h2 in fa mode, the
          EN h2 in EN mode, never both (the owner's ask). The World Gold
          Council's OWN official logo (the owner's upload) carries the
          card's identity; the quiet AI-translated badge sits BELOW the
          title (the owner's ask — the corner position retired), the
          engine + date on its tooltip */}
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 flex items-center gap-4 text-[1.25rem] font-extrabold text-[var(--color-text-primary)]">
          {/* the official World Gold Council mark — the owner's own file,
              the WGC's wordmark-and-coin device in its house gold */}
          <img
            src={`${deskBasePath}/images/wgc-logo.svg`}
            alt=""
            width={132}
            height={49}
            className="h-[49px] w-[132px] shrink-0 object-contain"
            loading="lazy"
            decoding="async"
            aria-hidden="true"
          />
          {t.title}
        </h2>
      </div>

      {/* the honest states — riding the same card, each a stated fact */}
      {q.isError ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption font-semibold leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.unavailable}
        </p>
      ) : null}
      {q.isLoading ? (
        <p className="m-0 mt-2.5 type-caption text-[var(--color-text-tertiary)]" aria-live="polite">
          …
        </p>
      ) : null}
      {d?.status === "waiting" ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.stateWaiting.replace("{n}", fmt.num(d.attempts ?? 0, 0))}
        </p>
      ) : null}
      {d?.status === "missed" ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption font-semibold leading-relaxed text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border)]">
          {t.stateMissed}
        </p>
      ) : null}
      {d?.status === "structure_alert" ? (
        <p className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-currena-soft)] px-3 py-2 type-caption font-semibold leading-relaxed text-[var(--color-chip-ink-attention)] ring-1 ring-[var(--color-accent-gold)]/50">
          {t.stateAlert}
        </p>
      ) : null}
      {d?.skipTarget ? (
        <p className="m-0 mt-2 type-caption text-[var(--color-text-tertiary)]">{t.stateSkip}</p>
      ) : null}

      {/* the served issue — the Farsi translation primary and ALONE
          (fa mode, stored: the owner's batch-K ask — one language per
          page, the English original no longer rides below), or the
          English verbatim in an LTR block (every other case) */}
      {issue ? (
        <>
          <h3 className="type-label m-0 mt-3 font-extrabold text-[var(--color-text-primary)]">
            {issueTitle}
          </h3>

          {fa ? (
            <>
              {fa.headline ? (
                <p className="m-0 mt-2 text-[13px] font-semibold leading-snug text-[var(--color-text-secondary)]">
                  {faDigits(faGlossary(fa.headline))}
                </p>
              ) : null}
              <div
                dir="rtl"
                className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 ring-1 ring-[var(--color-border)] sm:p-3.5"
              >
                {fa.segments.map((seg, i) => (
                  <React.Fragment key={`${seg.heading}-${i}`}>
                    {i > 0 ? <div className="my-3 border-t border-[var(--color-border)]" aria-hidden="true" /> : null}
                    <h4 className="type-label m-0 font-extrabold text-[var(--color-text-primary)]">{faDigits(faGlossary(seg.heading))}</h4>
                    <p className="m-0 mt-1 text-[13.5px] leading-[1.9] text-[var(--color-text-secondary)]">{faDigits(faGlossary(seg.body))}</p>
                  </React.Fragment>
                ))}
              </div>
            </>
          ) : (
            <>
              {issue.headline ? (
                <p dir="ltr" className="m-0 mt-1 text-start text-[13px] font-semibold leading-snug text-[var(--color-text-secondary)]">
                  {issue.headline}
                </p>
              ) : null}
              <blockquote
                cite={issue.sourceUrl}
                dir="ltr"
                className="m-0 mt-2.5 rounded-[var(--cr-radius-md)] bg-[var(--color-surface)] p-3 text-start ring-1 ring-[var(--color-border)] sm:p-3.5"
              >
                {issue.segments.map((s, i) => (
                  <React.Fragment key={`${s.heading}-${i}`}>
                    {i > 0 ? <div className="my-3 border-t border-[var(--color-border)]" aria-hidden="true" /> : null}
                    <h4 className="type-label m-0 font-extrabold text-[var(--color-text-primary)]">{s.heading}</h4>
                    <p className="m-0 mt-1 text-[13.5px] leading-relaxed text-[var(--color-text-secondary)]">{s.body}</p>
                  </React.Fragment>
                ))}
              </blockquote>
            </>
          )}

          {/* the 11px whisper meta line — the dates only (batch L: the
              source line retired, all sources live elsewhere on the
              page); when published and fetched are the same day one
              "updated" stamp says it once instead of twice */}
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
            {published !== null && fetched !== null && published === fetched ? (
              <span>{t.updatedLabel.replace("{date}", published)}</span>
            ) : (
              <>
                {published ? <span>{t.publishedLabel.replace("{date}", published)}</span> : null}
                {published && fetched ? <span aria-hidden="true">·</span> : null}
                {fetched ? <span>{t.fetchedLabel.replace("{date}", fetched)}</span> : null}
              </>
            )}
          </p>
        </>
      ) : null}
    </section>
  );
}
