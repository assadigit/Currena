"use client";

/**
 * The WGC monthly commentary card — the World Gold Council's monthly
 * Gold Market Commentary Highlights on the Persian gold page
 * (docs/wgc-monthly-commentary-spec.md §6), placed directly under the
 * Market Brief: the WGC's monthly one-glance beside the desk's own.
 *
 * What it shows, honestly:
 *  - The bilingual chrome: the fa title «نگارش ماهانهٔ شورای جهانی طلا»
 *    with the EN subtitle (mirrored in EN), on the house card patterns.
 *  - The two English segments VERBATIM inside a dir="ltr" block — the
 *    quoted excerpt, never translated (translation is a later phase,
 *    never v1), never normalized ("October in review" stays as WGC
 *    wrote it).
 *  - The 11px whisper meta line: the published date, the fetched date,
 *    and «منبع: World Gold Council» with the canonical gold.org link.
 *  - The honest states riding the same card: waiting (the window named,
 *    the attempt count), missed (the window closed — a stated fact),
 *    structure_alert (the template changed; the last known good serves),
 *    and the June/November skip fact.
 *  - The record-basis note: the box exists only since the March 2025
 *    issue; the 22 earlier issues are not backfilled — stated, never
 *    hidden.
 *
 * Served by the desk's own read-only route /api/gold/wgc-commentary
 * (D1 only); fail-closed like every house leg.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import type { Locale } from "@/lib/gold-page/content";
import { deskBasePath } from "@/lib/utils";
import type { Fmt } from "@/components/gold-page/visuals";

/* ------------------------------------------------------------------ *
 * The payload (the route's contract)
 * ------------------------------------------------------------------ */

export interface WgcSegment {
  heading: string;
  body: string;
}

export interface WgcIssue {
  month: string; // the REVIEWED month, "YYYY-MM"
  headline: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  sourceUrl: string;
  blockVariant: string;
  segments: WgcSegment[];
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
  subtitle: string;
  seriesLine: string;
  issueLabel: string;
  publishedLabel: string;
  fetchedLabel: string;
  source: string;
  stateWaiting: string;
  stateMissed: string;
  stateAlert: string;
  stateSkip: string;
  preBox: string;
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
        }
      : (d.lastKnownGood ?? null)
    : null;

  const published = dateWordsOf(issue?.publishedAt, fmt);
  const fetched = dateWordsOf(issue?.fetchedAt, fmt);

  return (
    <section
      id="gold-wgc"
      aria-label={t.title}
      className="flex flex-col rounded-[var(--cr-radius-lg)] bg-[var(--color-currena-bg-light)] p-4 ring-1 ring-[var(--color-border)] sm:p-5"
    >
      {/* the bilingual header — the fa title with the EN subtitle (mirrored in EN) */}
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <h2 className="type-kicker m-0" style={{ color: "var(--bal-brass-text)" }}>
          {t.title}
        </h2>
        <span dir={locale === "fa" ? "ltr" : "rtl"} className="type-caption text-[var(--color-text-tertiary)]">
          {t.subtitle}
        </span>
      </div>
      <p className="m-0 mt-0.5 type-caption text-[var(--color-text-tertiary)]">{t.seriesLine}</p>

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

      {/* the served issue — the two English segments, verbatim, in an LTR block */}
      {issue ? (
        <>
          <h3 className="type-label m-0 mt-3 font-extrabold text-[var(--color-text-primary)]">
            {t.issueLabel.replace("{month}", monthLabel(issue.month, locale))}
          </h3>
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

          {/* the 11px whisper meta line — provenance, always visible */}
          <p className="m-0 mt-2 flex flex-wrap items-baseline gap-x-1.5 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
            {published ? <span>{t.publishedLabel.replace("{date}", published)}</span> : null}
            {published && fetched ? <span aria-hidden="true">·</span> : null}
            {fetched ? <span>{t.fetchedLabel.replace("{date}", fetched)}</span> : null}
            {published || fetched ? <span aria-hidden="true">·</span> : null}
            <span>
              {t.source.replace("World Gold Council", "")}
              <a
                href={issue.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[var(--color-currena-blue-deep)] underline decoration-[var(--color-border)] underline-offset-2 hover:text-[var(--color-currena-blue)]"
              >
                World Gold Council
              </a>
            </span>
          </p>
        </>
      ) : null}

      {/* the record-basis note — the pre-box era stated, never hidden */}
      <p className="m-0 mt-2.5 border-t border-[var(--color-border)] pt-2 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
        {t.preBox}
      </p>
    </section>
  );
}
