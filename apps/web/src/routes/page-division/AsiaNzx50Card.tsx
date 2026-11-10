/**
 * AsiaNzx50Card — the Pacific—New Zealand section's NZX 50 card
 * (page-division S21, 2026-11-12 — spec §9 item 5's NZX50 leg, the
 * BD-S8b commitment wired at last: "S14/S16 wire that page section —
 * recorded, never silently faked").
 *
 * WHAT THIS IS: the S21 spec-vs-implementation audit found the §9 item 5
 * NZX50 surface missing from /asia-pacific — and the section's intro
 * copy claiming it "rides the Asia zoom map above" while the zoom (the
 * world board's Asia cut, BD-S8a's one drawing) carries only the six
 * world-board Asian indices. NZX50 is NOT a world-board index: it lives
 * on the AU Markets board (the markets worker's 4th cron, S6-M6.1's
 * NZD rider), whose home is /australia. This card is the honest
 * display-layer fix: the Pacific—New Zealand section renders NZX50 as
 * a MIRROR of the AU board's own row — the SAME payload (the cached
 * GET /api/insights/markets-au route through lib/markets-au.ts, zero
 * new fetches beyond it, zero engine change), the SAME formatting
 * helpers the board's own table reads (au-markets/shared — one board,
 * one vocabulary, D-48), and a REAL link to the board's home page
 * (spec §3.2: mirrors are links).
 *
 * WHAT THIS IS NOT: not a registry indicator card (NZX50 has no
 * registry id — it is a board row, like the zoom's callout cards), so
 * there is no §21 trio over an engine reading; the card shows the
 * board row's own facts — the close, the day change (window-tagged,
 * never a bare percent), the 52-week range position (the corpus's own
 * rangeSr sentence), the as-of date + the stale word when the row is
 * stale, and the wayfinding link.
 *
 * STATES (the M-17 / AU-board discipline): the boot paint reads the
 * last-good localStorage snapshot (instant, flagged); a dead refresh
 * keeps the last good copy on screen; only with no cache at all does
 * the honest "being prepared" line answer (fail-closed, Agent Rule 5 —
 * never a fake value, never zeros).
 *
 * Platform: browser only — this module lives in the lazy Asia route
 * chunk, never the entry graph.
 */

import { useEffect, useState } from 'react';
import type { AuMarketEntry } from '@currena/core';
import { formatDateWords, formatJalaliDate, formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import { navigate } from '../../router';
import { fetchAuMarketsSnapshot, readCachedAuMarkets } from '../../lib/markets-au';
import { auFmtClose, auReturnToneClass, auSignedPct } from '../../components/insights/au-markets/shared';

/** The card's load state — the M-17 keep-flagged discipline. */
type NzxState =
  | { kind: 'loading' }
  | { kind: 'empty' }
  | { kind: 'ready'; entry: AuMarketEntry; fromCache: boolean };

export function AsiaNzx50Card(): React.JSX.Element {
  const { t, locale, numberLocale } = useI18n();

  const [state, setState] = useState<NzxState>(() => {
    try {
      const cached = readCachedAuMarkets();
      const entry = cached?.markets.find((m) => m.id === 'nz50');
      return entry ? { kind: 'ready', entry, fromCache: true } : { kind: 'loading' };
    } catch {
      return { kind: 'loading' };
    }
  });

  useEffect(() => {
    const controller = new AbortController();
    void fetchAuMarketsSnapshot(controller.signal).then((snapshot) => {
      if (controller.signal.aborted) return;
      // M-17: a failed refresh keeps the LAST GOOD copy on screen,
      // flagged with its stored generation; no cache at all → empty.
      setState((prev) => {
        const entry = snapshot?.markets.find((m) => m.id === 'nz50');
        if (entry !== undefined) return { kind: 'ready', entry, fromCache: false };
        if (prev.kind === 'ready') return prev;
        return { kind: 'empty' };
      });
    });
    return () => controller.abort();
  }, []);

  // The honest not-ready answer (the AU board's own loading/empty
  // wording discipline — one calm sentence, never zeros).
  if (state.kind !== 'ready') {
    return (
      <article
        data-asia-nzx50
        data-asia-nzx50-status={state.kind}
        className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
      >
        <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
          {t('pd.australia.boardCopy.entries.nz50')}
        </h4>
        <p className="m-0 text-[length:var(--type-label)] leading-relaxed text-[var(--color-text-tertiary)]">
          {t('pd.asiaPacific.nzxPreparing')}
        </p>
      </article>
    );
  }

  const entry = state.entry;
  const closeText = auFmtClose(entry.close, locale);
  const asOfText =
    locale === 'fa' ? formatJalaliDate(entry.asOf, 'fa-IR') : formatDateWords(entry.asOf, 'en-US');
  const rangeLine = interpolate(t('pd.worldMarkets.rangeSr'), {
    p: formatNumber(Math.round(entry.rangePos), numberLocale),
  });

  return (
    <article
      data-asia-nzx50
      data-asia-nzx50-status={state.fromCache ? 'cached' : 'ready'}
      className="flex min-w-0 flex-col gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-2.5 ring-1 ring-[var(--color-border)] shadow-[0_2px_10px_rgba(15,23,42,0.05)] sm:p-3"
    >
      <h4 className="m-0 min-w-0 text-[length:var(--type-label)] font-bold leading-tight text-[var(--color-text-primary)]">
        {t('pd.australia.boardCopy.entries.nz50')}
      </h4>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <bdi dir={locale === 'fa' ? 'rtl' : 'ltr'} className="text-lg font-extrabold leading-tight tabular-nums text-[var(--color-text-primary)]" data-asia-nzx50-close>
          {closeText}
        </bdi>
        <bdi dir="ltr" className={`text-[length:var(--type-caption)] font-bold leading-none tabular-nums ${auReturnToneClass(entry.chg1d)}`}>
          {auSignedPct(entry.chg1d, locale)}
          {/* The VISIBLE window tag (the ribbon's D-48 discipline: a bare
           * percent never rides without its window) — aria-hidden because
           * the full words for screen readers follow. */}
          <span className="ms-0.5 font-semibold text-[var(--color-text-tertiary)]" aria-hidden="true">
            {interpolate(t('pd.global.ribbonWindowTag'), { days: formatNumber(1, numberLocale, { maximumFractionDigits: 0 }) })}
          </span>
          <span className="sr-only"> {t('pd.global.changeOver1d')}</span>
        </bdi>
      </span>
      <p className="m-0 text-[length:var(--type-caption)] font-semibold leading-tight text-[var(--color-text-secondary)]">
        <bdi>{rangeLine}</bdi>
      </p>
      <p className="m-0 flex flex-wrap items-baseline gap-x-1.5 gap-y-0 text-[length:var(--type-caption)] leading-tight text-[var(--color-text-tertiary)]">
        <bdi>{interpolate(t('pd.global.dataAsOf'), { date: asOfText })}</bdi>
        {entry.stale ? <span data-asia-nzx50-stale>{t('pd.asiaPacific.statusStale')}</span> : null}
      </p>
      {/* The wayfinding link — the mirror points at the board's home
       * (spec §3.2: "mirrors are links"; the AU Markets board's home is
       * /australia, BD-S8c's zoom-card precedent for board rows). */}
      <a
        href="/australia"
        data-asia-nzx50-board-link
        onClick={(e) => {
          e.preventDefault();
          navigate('/australia');
        }}
        className="insights-focusable mt-0.5 self-start rounded-[var(--radius-sm)] text-[length:var(--type-caption)] font-semibold leading-tight text-currena-blue underline-offset-2 hover:underline"
      >
        {t('pd.asiaPacific.nzxBoardLink')}
      </a>
    </article>
  );
}
