/**
 * CardMeta — the shared bits of the ONE v3 card anatomy (UI_SPEC §6,
 * UI-20..UI-23, 2026-10-20): the change line and the meta row that both
 * faces (AlertCard + CompactRow) render in the same order.
 *
 *   1. Title            (the cards' own header rows)
 *   2. Value + unit     (tabular figures, LTR bdi; hidden when the reading
 *                        cannot be told — UI-17)
 *   3. Change line      (direction arrow, size, period label — ChangeText)
 *   4. Status chip      (the cards' StatusChip, end-aligned on its row)
 *   5. One-line meaning (the cards' own generated lines)
 *   6. Meta row         (CardMetaRow below)
 *   7. Details control  (the explicit "Details ›" button after the meta row)
 *
 * UI-20's meta row, in order: "Data for {period} · Published {date, if
 * relevant} · Updated {UTC time} · Source (link)".
 *
 * THE SOURCE IS BACK ON THE CARD FACE. The round-2 owner request "sources
 * off the cards" is REVERSED here by the v3 UI_SPEC's explicit authority
 * (UI-20 item 6 puts the source link on every face; "This file is the only
 * authority for visual changes"). The details panel footer keeps its full
 * attribution too.
 *
 * The row WRAPS (flex-wrap, no whitespace-nowrap anywhere) — the U-02
 * overflow at 360px was the old nowrap meta line pushing a stale card
 * 10px past the viewport; every segment here may break to its own line.
 *
 * UI-22: fetched-source cards also state their fetch time ("updated
 * {HH:mm} UTC", RULES §6: show the fetched time in UTC) — the same
 * updatedAt every reading carries, rendered by formatUtcHm.
 */

import type { ReactNode } from 'react';
import { Fragment } from 'react';
import type { IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import type { InsightsCopy } from '../../i18n/insights-copy-en';
import { formatAsOf } from './HistoryChart';
import {
  changeScaleOf,
  changeWindowLabel,
  dataPeriodText,
  definitionFor,
  formatChange,
  formatUtcHm,
} from './config';

/* ------------------------------------------------------------------ *
 * UI-20 item 3 — the change line: direction arrow, size, period label.
 * ONE primary window per card (30-day, or "since previous release" for
 * monthly/quarterly cadences — the existing changeWindowLabel rule). The
 * arrow is the direction glyph (never colour alone); the size follows the
 * unit rules (percentage points for rates, % for prices).
 * ------------------------------------------------------------------ */

export function ChangeText({
  reading,
  copy,
  numberLocale,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const def = definitionFor(reading.id);
  const change = reading.change30d;
  if (change === undefined || !Number.isFinite(change)) return null;
  const label =
    changeWindowLabel(reading.id) === 'since-previous' ? copy.ui.sincePreviousRelease : copy.ui.days30;
  return (
    <span className="inline-flex min-w-0 flex-wrap items-baseline gap-x-1">
      <bdi
        dir="ltr"
        className="font-semibold tabular-nums text-[var(--color-text-secondary)]"
        data-change={change > 0 ? 'up' : change < 0 ? 'down' : 'flat'}
      >
        <span aria-hidden="true" className="me-0.5">
          {change > 0 ? '↑' : change < 0 ? '↓' : '→'}
        </span>
        {formatChange(change, def.changeKind, numberLocale, copy.units, changeScaleOf(reading.id))}
      </bdi>
      <span aria-hidden="true" className="opacity-80">
        {label}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * UI-20 item 6 — the meta row (wraps; every segment may break its line).
 * ------------------------------------------------------------------ */

/** Whole UTC days between a YYYY-MM-DD asOf and today (never negative). */
function ageInDays(asOf: string): number {
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (!Number.isFinite(a)) return 0;
  return Math.max(0, Math.round((today - a) / 86_400_000));
}

/** The inter-segment dot — a real span (flex-wrap moves it with its text). */
const DOT = (
  <span aria-hidden="true" className="opacity-50 select-none">
    ·
  </span>
);

export function CardMetaRow({
  reading,
  copy,
  numberLocale,
}: {
  reading: IndicatorReading;
  copy: InsightsCopy;
  numberLocale: 'en-US' | 'fa-IR';
}) {
  const locale = numberLocale === 'fa-IR' ? 'fa' : 'en';
  // UI-20 item 6.1 + UI-21: the data PERIOD ("June quarter 2026" for
  // quarterly series via the stored periodEnd — never a bare month).
  const dataDate =
    reading.asOf !== null
      ? dataPeriodText(reading.id, reading.asOf, locale, numberLocale, reading.periodEnd)
      : null;
  // item 6.2: the published date where it matters (the CPI release day).
  const releaseText =
    reading.releaseDate !== undefined ? formatAsOf(reading.releaseDate, locale) : null;
  // GLOSSARY "Stale (8 days old)": the age rides the meta row on stale cards.
  const staleAge =
    reading.status === 'stale' && reading.asOf !== null
      ? formatNumber(ageInDays(reading.asOf), numberLocale, { maximumFractionDigits: 0 })
      : null;
  // item 6.3 + UI-22: the fetch time in UTC (same clock as the details).
  const updatedText = formatUtcHm(reading.updatedAt, numberLocale);

  const segments: ReactNode[] = [];
  if (dataDate !== null) segments.push(interpolate(copy.ui.dataFor, { date: dataDate }));
  if (releaseText !== null) segments.push(interpolate(copy.ui.releasedOn, { date: releaseText }));
  if (staleAge !== null) segments.push(interpolate(copy.ui.staleAgeDays, { n: staleAge }));
  if (updatedText !== '') segments.push(interpolate(copy.ui.updatedUtcTime, { time: updatedText }));
  // item 6.4: the source, named and linked (v3 reverses the round-2
  // "sources off the cards" — see the header note).
  segments.push(
    reading.sourceUrl ? (
      <a
        key="source"
        href={reading.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="insights-focusable rounded-sm font-semibold text-[var(--color-status-context)] underline decoration-[var(--color-accent-brand)]/40 underline-offset-2 transition-colors hover:decoration-[var(--color-accent-brand)]"
      >
        {reading.sourceName}
        <span className="sr-only">, {copy.ui.viewSource}</span>
      </a>
    ) : (
      <span key="source" className="font-semibold">
        {reading.sourceName}
      </span>
    ),
  );

  return (
    <p
      data-meta-row
      className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-[length:var(--type-caption)] leading-relaxed text-[var(--color-text-tertiary)]"
    >
      {segments.map((segment, i) => (
        <Fragment key={i}>
          {i > 0 ? DOT : null}
          {segment}
        </Fragment>
      ))}
    </p>
  );
}

/* ------------------------------------------------------------------ *
 * v3 §4 (UI-17): the one-line reason a reading's value cannot be shown,
 * or (no-history) the reason beside a kept value. The LAST GOOD VALUE
 * never rides the face for unavailable/check-pending — it lives inside
 * the details (the panel's chart carries it).
 * ------------------------------------------------------------------ */

export function faceReasonOf(reading: IndicatorReading, copy: InsightsCopy): string | null {
  switch (reading.status) {
    case 'unavailable':
      // The structured flag reason when the engine has one; the honest
      // generic line otherwise.
      return reading.flag?.reason ?? copy.ui.cantTellFaceUnavailable;
    case 'check-pending':
      // A-03/A-04: the validation test's reason, in plain words.
      return reading.flag?.reason ?? copy.ui.cantTellFaceUnavailable;
    case 'no-history':
      // v3 §4: no-history displays as Context — the value stays, this
      // line rides the face beside it.
      return copy.ui.noHistoryFace;
    default:
      return null;
  }
}
