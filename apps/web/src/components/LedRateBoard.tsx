/**
 * LedRateBoard — the shopfront LED rate board (2026-09-18; columns reworked
 * 2026-09-26 to TGJU's real daily stats; rebuilt 2026-09-26 as a physical
 * dot-matrix panel).
 *
 * Recreates the physical experience of walking past a currency-exchange
 * shopfront — built as real hardware layers, not a flat graphic:
 *
 *   Housing  — near-black body (#0d0d0d) with a raised outer bevel and a
 *              faint perforated-module grid (index.css .led-board).
 *   Modules  — every value sits in a recessed dark well (inset shadow,
 *              .led-cell) so the digits sit INTO the panel.
 *   Digits   — real seven-segment glyphs (DSEG7 Bold) painted as THREE
 *              stacked layers per module (see LedDigits): a ghost "8888…"
 *              of dim unlit bulbs behind the value, a bloom-halo layer,
 *              and the lit value filled with bright dot-matrix bulbs.
 *   Labels   — headers, currency codes and the wordmark reuse the same
 *              bulb fill at a tighter pitch (.led-label).
 *
 * The three columns are TGJU's OWN published daily statistics — the same
 * «مقادیر» table the profile pages show:
 *   1. نرخ فعلی — current open-market price (ajax.json `p`)
 *   2. بالاترین قیمت روز — day high (ajax.json `h`)
 *   3. پایین ترین قیمت روز — day low (ajax.json `l`)
 * Real data, never a derived spread; stats ride the snapshot rate entries
 * (core schemas.ts) and render as dashes when unavailable.
 *
 * Layout rules (owner spec, grid rework 2026-09-27; mobile single-column
 * 2026-09-19):
 *   - Row cells in fixed order: flag · currency name · current · high · low.
 *   - Below md (phones) the table carries ONE price column — CURRENT only
 *     (owner request 2026-09-19: in mobile view only show the current
 *     price, and make it bigger) — the day-high/day-low cells and headers
 *     are display:none and rejoin at md, exactly like the gold board; the
 *     CURRENT module grows to 1.25rem on phones (+56%) since it no
 *     longer shares the width with two more columns.
 *   - The flag+name cell aligns to the row's leading edge via
 *     padding-inline-start (names are Persian; the row must stay RTL-safe).
 *   - The currency NAME is the bold identity label (2026-09-27 owner spec:
 *     +40–50% size, weight 700 — "reads clearly at a glance"), with the
 *     currency CODE kept as a small secondary LED label beneath it. Below
 *     md the name owns its own line (flag+code become a quiet caption line)
 *     so the bigger name still fits untruncated; at md+ the flag sits
 *     beside the name/code stack, and rows grow a little taller to breathe.
 *   - ONE SHARED COLUMN GRID: .led-table (the wrapper) owns the single
 *     grid-template-columns definition; the header row, the list and
 *     every value row subgrid it (index.css .led-table/.led-row), so
 *     each header label sits directly above its own column of numbers
 *     at any digit size — track widths come from the widest module per
 *     column across ALL rows, never eyeballed per row.
 *   - The three value columns keep PHYSICAL right alignment, headers
 *     and digits alike (labels pad their right edge by the module-well
 *     padding so they sit exactly over the digits); digits are LTR
 *     runs — a stable numeric column edge in both directions.
 *   - The CURRENT column is the primary module: ~20-25% larger digits
 *     at sm+/lg+, hotter bulbs + stronger bloom (.led-cell-hot) and
 *     full power — vs the secondary high/low modules at 75% power.
 *
 * A11y (WCAG 2.3.1 photosensitivity): the update-flash fires ONCE per
 * value change (a 260ms brightness surge of the whole module), rows carry
 * a 0–210ms stagger, so the board never flashes in sync and stays far
 * below 3 flashes/second. The clock colon dims at 0.5Hz with 0.45–1.0
 * amplitude. Everything motion-based is disabled under
 * prefers-reduced-motion (index.css). LED glyph layers are aria-hidden;
 * comma-grouped labels expose the values to screen readers.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { convert } from '@currena/core';
import type { CurrencyCode, Snapshot } from '@currena/core';
import { LedClock, LedDigits, LedStatus, LedValueCell, formatLedDate } from './led/LedParts';
import { useI18n } from '../lib/locale';
import { useSnapshotStore } from '../lib/snapshot-store';
import type { TranslationKey } from '../lib/locale';

/** Board currencies — owner-priority five first, then the legacy rest
 *  (order shared with the LiveRates detail cards below the board). */
export const BOARD: readonly CurrencyCode[] = ['USD', 'AUD', 'EUR', 'TRY', 'AED', 'GBP', 'CAD', 'CNY'];

/** Per-row flash stagger step — 8 rows × 30ms = 0–210ms (WCAG 2.3.1). */
const FLASH_STAGGER_MS = 30;

/** One LED row: TGJU's three daily stats for a currency, Toman per unit. */
export interface BoardQuote {
  code: CurrencyCode;
  /** Current open-market price, Toman per 1 unit (TGJU `p`). */
  current: number;
  /** Day high, Toman per 1 unit (TGJU `h`); NaN when not published. */
  high: number;
  /** Day low, Toman per 1 unit (TGJU `l`); NaN when not published. */
  low: number;
  ok: boolean;
}

/** Quotes for every board currency off one snapshot (local math only —
 *  current via convert(), day stats read straight off the rate entry). */
export function boardQuotes(snapshot: Snapshot | null): BoardQuote[] | null {
  if (!snapshot) return null;
  return BOARD.map((code) => {
    try {
      const { rate: tomanPerUnit } = convert(snapshot, code, 'IRR', 1);
      const entry = snapshot.rates.find((r) => r.code === code);
      return {
        code,
        current: tomanPerUnit,
        high: entry?.dayHigh ?? Number.NaN,
        low: entry?.dayLow ?? Number.NaN,
        ok: true as const,
      };
    } catch {
      return { code, current: Number.NaN, high: Number.NaN, low: Number.NaN, ok: false as const };
    }
  });
}

/* ------------------------------- row -------------------------------- */

interface LedRowProps {
  quote: BoardQuote;
  index: number;
  currentLabel: string;
  highLabel: string;
  lowLabel: string;
  unitLabel: string;
  name: string;
}

/** One board row — flag · name · current · high · low (fixed order, logical
 *  flow so RTL mirrors the reading order naturally). The row SUBGRIDS the
 *  shared .led-table column grid (index.css), so its value modules land in
 *  the very tracks the header labels sit in. Memoized: the clock ticks
 *  every second and must not re-render (nor re-flash) the modules. */
const LedRow = memo(function LedRow({
  quote,
  index,
  currentLabel,
  highLabel,
  lowLabel,
  unitLabel,
  name,
}: LedRowProps) {
  const stagger = index * FLASH_STAGGER_MS;
  return (
    <li className="led-row border-b border-white/[0.04] py-3 last:border-b-0 sm:py-4">
      {/* Leading cell — flag · name · code, aligned to the row's leading edge
          via padding-inline-start so the Persian names (RTL) keep the row's
          leading edge in both directions. The NAME is the big bold identity
          label (2026-09-27 owner spec: +40–50% size, weight 700) with the
          code kept as a small secondary label — two responsive shapes:
            <md  the name owns its line, with the flag + code as a quiet
                 caption line beneath — the name gets the WHOLE track width
                 (the flag no longer shares its line), so the +40% name still
                 renders "US Dollar" untruncated at 375px and through the
                 narrow-tablet zone (640–767px) where the horizontal shape
                 would not have room for the enlarged name.
            md+  the classic board row: flag beside the name/code stack —
                 only from 768px up, where the name track (≥252px) actually
                 fits the flag plus the full +41% name without truncation.
          Both shapes paint the same cached flag PNG (two <img>s). */}
      <div className="min-w-0 ps-1 md:ps-2.5">
        <div className="flex min-w-0 flex-col gap-[3px] md:flex-row md:items-center md:gap-2.5">
          <img
            src={`/images/flags/${quote.code.toLowerCase()}.png`}
            alt=""
            className="hidden h-[21px] w-[32px] shrink-0 rounded-[3px] object-cover ring-1 ring-white/15 md:block"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[1.05rem] font-bold text-white/90 sm:text-[1.3rem] lg:text-[1.35rem]">
              {name}
            </p>
            {/* Currency code — a dot-matrix LED label (tight pitch); below
                md it rides beside a compact flag on the caption line
                (dir-aware flex: flag at the row's leading edge in RTL too). */}
            <p className="flex items-center gap-1.5">
              <img
                src={`/images/flags/${quote.code.toLowerCase()}.png`}
                alt=""
                className="h-3.5 w-[21px] shrink-0 rounded-[2px] object-cover ring-1 ring-white/15 md:hidden"
              />
              <span
                className="led-label led-label-red-dim text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#ff1e1e]/60 sm:text-[0.58rem]"
                dir="ltr"
              >
                {quote.code}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Current — the PRIMARY module: ~20-25% larger digits at sm+/lg+,
          hotter bulbs + stronger bloom (.led-cell-hot), full power. On
          phones it is the ONLY value column, so it also grows there
          (0.8 → 1.25rem — the 7-glyph Toman runs leave ample room). */}
      <LedValueCell
        keyId={quote.code}
        stat="cur"
        value={quote.current}
        ok={quote.ok}
        staggerMs={stagger}
        label={currentLabel}
        unitLabel={unitLabel}
        size="text-[1.25rem] sm:text-[1.35rem] lg:text-[1.6rem]"
        emphasis="primary"
      />

      {/* Day high / day low — TGJU stats, secondary modules at 75% power;
          hidden below md (single-column mobile, owner request 2026-09-19). */}
      <LedValueCell
        keyId={quote.code}
        stat="high"
        value={quote.high}
        ok={quote.ok}
        staggerMs={stagger}
        label={highLabel}
        unitLabel={unitLabel}
        size="text-[0.72rem] sm:text-[1.14rem] lg:text-[1.38rem]"
        emphasis="secondary"
        wrapperClass="hidden text-right md:block"
      />
      <LedValueCell
        keyId={quote.code}
        stat="low"
        value={quote.low}
        ok={quote.ok}
        staggerMs={stagger}
        label={lowLabel}
        unitLabel={unitLabel}
        size="text-[0.72rem] sm:text-[1.14rem] lg:text-[1.38rem]"
        emphasis="secondary"
        wrapperClass="hidden text-right md:block"
      />
    </li>
  );
});

/* ------------------------------- board ------------------------------ */

export function LedRateBoard() {
  const { t, locale } = useI18n();
  const store = useSnapshotStore();
  const state = store.tgju;
  const snapshot = state.snapshot;

  // Live clock — ticks every second; the board feels alive between updates.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const quotes = useMemo(() => boardQuotes(snapshot), [snapshot]);

  const status: 'live' | 'cached' | 'offline' = !store.online
    ? 'offline'
    : state.stale || state.degraded
      ? 'cached'
      : 'live';

  const currentLabel = t('liveRates.boardCurrent');
  const highLabel = t('liveRates.boardHigh');
  const lowLabel = t('liveRates.boardLow');
  const unitLabel = t('liveRates.boardUnitToman');

  return (
    <section
      className="led-board overflow-hidden px-3 py-3.5 sm:px-6 sm:py-5"
      role="region"
      aria-label={t('liveRates.boardAriaLabel')}
    >
      {/* Header strip — live clock (three recessed modules) + date module,
          plus the board's status LED and dot-matrix wordmark. */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#ff1e1e]/15 pb-3">
        <LedClock now={now} />
        <LedDigits value={formatLedDate(now, locale)} className="text-[0.8rem] sm:text-[0.95rem]" />
        <div className="flex items-center gap-3">
          {/* Wordmark — a tight-pitch white dot-matrix label. */}
          <span
            className="led-label led-label-white-dim text-[0.6rem] font-extrabold uppercase tracking-[0.3em] text-[#ff1e1e]/55"
            dir="ltr"
          >
            CURRENA
          </span>
          <LedStatus
            state={status}
            label={
              status === 'live'
                ? t('liveRates.boardLive')
                : status === 'cached'
                  ? t('liveRates.boardCached')
                  : t('liveRates.boardOffline')
            }
          />
        </div>
      </header>

      {/* THE shared column grid — .led-table owns the single track
          definition; header row, list and every row subgrid it
          (index.css), locking each label above its own column of
          numbers. Column headers are silkscreen labels on the housing,
          dot-matrix LED fill at a tight pitch (Tailwind text colors stay
          as fallback): currency · current · day high · day low — with
          high/low hidden below md together with their columns (mobile is
          single-column, owner request 2026-09-19). The CURRENCY label
          pads its inline start like the name cells; the value labels pad
          their PHYSICAL right edge by the module-well padding (4/9px) so
          each sits exactly over its digits' right edge, and keep physical
          right alignment with the value modules below in both LTR and
          RTL. */}
      <div className="led-table">
        <div className="led-row pb-2.5">
          <p className="led-label led-label-white-dim ps-1 text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35 sm:ps-2.5">
            {t('liveRates.boardCurrency')}
          </p>
          <p className="led-label led-label-red whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/80 sm:pr-[9px]">
            {currentLabel}
          </p>
          <p className="led-label led-label-red-dim hidden whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55 md:block md:pr-[9px]">
            {highLabel}
          </p>
          <p className="led-label led-label-red-dim hidden whitespace-nowrap pr-1 text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55 md:block md:pr-[9px]">
            {lowLabel}
          </p>
        </div>

        {/* Currency rows — each <li> subgrids the same tracks. */}
        <ul className="led-table-body">
        {quotes
          ? quotes.map((quote, index) => (
              <LedRow
                key={quote.code}
                quote={quote}
                index={index}
                currentLabel={currentLabel}
                highLabel={highLabel}
                lowLabel={lowLabel}
                unitLabel={unitLabel}
                name={t(`currencies.${quote.code}` as TranslationKey)}
              />
            ))
          : // No snapshot yet: boot rows of dashes, like powering-on modules.
            BOARD.map((code, index) => (
              <LedRow
                key={code}
                quote={{ code, current: Number.NaN, high: Number.NaN, low: Number.NaN, ok: false }}
                index={index}
                currentLabel={currentLabel}
                highLabel={highLabel}
                lowLabel={lowLabel}
                unitLabel={unitLabel}
                name={t(`currencies.${code}` as TranslationKey)}
              />
            ))}
        </ul>
      </div>

      {/* Footnote — the honesty line: three REAL TGJU daily stats. */}
      <footer className="mt-3 border-t border-white/[0.06] pt-2.5">
        <p className="text-[0.62rem] font-medium text-white/35">{t('liveRates.boardFootnote')}</p>
      </footer>
    </section>
  );
}
