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
 * Layout rules (owner spec):
 *   - Row cells in fixed order: flag · currency name · current · high · low.
 *   - The flag+name cell aligns to the row's leading edge via
 *     padding-inline-start (names are Persian; the row must stay RTL-safe).
 *   - The three value cells keep PHYSICAL right alignment (digits are LTR
 *     runs — a stable numeric column edge in both directions).
 *
 * A11y (WCAG 2.3.1 photosensitivity): the update-flash fires ONCE per
 * value change (a 260ms brightness surge of the whole module), rows carry
 * a 0–210ms stagger, so the board never flashes in sync and stays far
 * below 3 flashes/second. The clock colon dims at 0.5Hz with 0.45–1.0
 * amplitude. Everything motion-based is disabled under
 * prefers-reduced-motion (index.css). LED glyph layers are aria-hidden;
 * comma-grouped labels expose the values to screen readers.
 */

import { Fragment, memo, useEffect, useMemo, useState } from 'react';
import { convert } from '@currena/core';
import type { CurrencyCode, Snapshot } from '@currena/core';
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

/**
 * LED digit rendering — plain ASCII digits, space-separated groups, exactly
 * like a multi-module board (no commas: DSEG7 has none, and real boards
 * never show them). Numbers are canonical until this render-time boundary.
 */
function formatLedNumber(value: number): string {
  const int = Math.round(value).toString();
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** 2-digit zero-pad — LED clock segments are always fixed-width. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Locale-aware LED date: fa → Jalali (1405.06.27), en → Gregorian
 *  (2026.09.18). '.' is the real-board separator; both calendars render in
 *  Latin digits (DSEG7 has no Persian glyphs). The Intl formatter is cached
 *  (core's format.ts measures 100–40,000× construction-vs-format cost). */
const ledJalaliFormatter = new Intl.DateTimeFormat('en-u-nu-latn-ca-persian', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatLedDate(date: Date, locale: 'en' | 'fa'): string {
  if (locale === 'fa') {
    const parts = ledJalaliFormatter.formatToParts(date);
    const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}.${get('month')}.${get('day')}`;
  }
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

/* ----------------------------- digits ------------------------------- */

/**
 * One physical LED module: a recessed well (.led-cell) carrying three
 * stacked layers — ghost, glow, lit (index.css).
 *
 *   ghost — the FULL unlit seven-segment shape: every digit position is
 *           replaced by '8' (all segments on) and painted in dim bulbs,
 *           so "off" segments stay faintly visible behind the value.
 *   glow  — the value in transparent fill + text-shadow only: the bloom
 *           halo, which bleeds slightly into neighboring ghost segments
 *           like real light bleed.
 *   lit   — the value itself, filled with bright dot-matrix bulbs.
 *
 * All layers share identical font metrics, so the absolute stacking is
 * pixel-perfect. `value` must be a pure ASCII run (digits, spaces, ':',
 * '.', '-'); the parent supplies the accessible label (role="img").
 */
function LedDigits({
  value,
  className = '',
  flash = false,
  idle = false,
  staggerMs = 0,
}: {
  value: string;
  className?: string;
  /** Replay the 260ms module-brightness surge (value just changed). */
  flash?: boolean;
  /** Boot state: module at half power. */
  idle?: boolean;
  /** Per-row stagger for the flash (WCAG 2.3.1). */
  staggerMs?: number;
}) {
  const ghost = value.replace(/[0-9]/g, '8');
  return (
    <span
      className={`led-cell ${flash ? 'led-flash' : ''} ${idle ? 'led-idle' : ''} ${className}`}
      style={flash && staggerMs > 0 ? { animationDelay: `${staggerMs}ms` } : undefined}
      dir="ltr"
    >
      <span className="led-digits led-ghost" aria-hidden="true">
        {ghost}
      </span>
      <span className="led-digits led-glow" aria-hidden="true">
        {value}
      </span>
      <span className="led-digits led-lit" aria-hidden="true">
        {value}
      </span>
    </span>
  );
}

/* ------------------------------ clock ------------------------------- */

/** Ticking board clock: HH:MM:SS as three recessed digit modules with
 *  softly dimming colons (the DSEG7 colon glyph is two segment dots). */
function LedClock({ now }: { now: Date }) {
  const groups = [pad2(now.getHours()), pad2(now.getMinutes()), pad2(now.getSeconds())];
  return (
    <span className="flex items-center gap-[3px] sm:gap-1.5" dir="ltr" aria-hidden="true">
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="led-digits led-colon text-base sm:text-xl">:</span>
          ) : null}
          <LedDigits value={group} className="text-base sm:text-xl" />
        </Fragment>
      ))}
    </span>
  );
}

/* ------------------------------ status ------------------------------ */

/** Header status LED: LIVE (red heartbeat) / CACHED (amber) / OFFLINE (gray). */
function LedStatus({ state, label }: { state: 'live' | 'cached' | 'offline'; label: string }) {
  const color =
    state === 'live' ? '#ff1e1e' : state === 'cached' ? '#ffb020' : '#8a8f98';
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`led-status inline-block h-[7px] w-[7px] rounded-full ${state === 'live' ? 'led-status-live' : ''}`}
        style={{ backgroundColor: color, color }}
        aria-hidden="true"
      />
      <span
        className="text-[0.6rem] font-bold uppercase tracking-[0.14em]"
        style={{ color }}
        dir="ltr"
      >
        {label}
      </span>
    </span>
  );
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

/** One LED value cell — a recessed module + its accessible label. The
 *  `key` on LedDigits carries the formatted value: a change remounts the
 *  module, replaying the 260ms brightness surge (staggered by row) — the
 *  electronic-refresh flash. LED glyph layers are hidden from AT and
 *  replaced by a comma-grouped aria-label so screen readers hear
 *  "2,279,000 Toman", not space-split digit runs. */
function LedValueCell({
  code,
  stat,
  value,
  ok,
  staggerMs,
  label,
  unitLabel,
  size,
  dim,
}: {
  code: string;
  stat: 'cur' | 'high' | 'low';
  value: number;
  ok: boolean;
  staggerMs: number;
  label: string;
  unitLabel: string;
  size: string;
  dim: boolean;
}) {
  const text = ok && Number.isFinite(value) ? formatLedNumber(value) : '-------';
  return (
    <div className="text-right">
      <span
        role="img"
        aria-label={`${label} ${ok && Number.isFinite(value) ? `${text.replace(/ /g, ',')} ${unitLabel}` : '—'}`}
      >
        <LedDigits
          key={`${code}-${stat}-${text}`}
          value={text}
          flash={ok}
          idle={!ok}
          staggerMs={staggerMs}
          className={`${size} ${dim ? 'opacity-75' : ''}`}
        />
      </span>
    </div>
  );
}

/** One board row — flag · name · current · high · low (fixed order, logical
 *  flow so RTL mirrors the reading order naturally). Memoized: the clock
 *  ticks every second and must not re-render (nor re-flash) the modules. */
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
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-[3px] border-b border-white/[0.04] py-2.5 last:border-b-0 sm:gap-x-5 sm:py-3 lg:gap-x-6">
      {/* Leading cell: flag + name, aligned via padding-inline-start so the
          Persian names (RTL) keep the row's leading edge in both directions.
          Mobile: compact flag + tighter gaps so the wide DSEG7 glyphs and
          the recessed module wells still leave the name real room. */}
      <div className="flex min-w-0 items-center gap-2 ps-1 sm:gap-2.5 sm:ps-2.5">
        <img
          src={`/images/flags/${quote.code.toLowerCase()}.png`}
          alt=""
          className="h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-white/15 sm:h-[21px] sm:w-[32px]"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[0.75rem] font-semibold text-white/90 sm:text-[0.92rem]">{name}</p>
          {/* Currency code — a dot-matrix LED label (tight pitch). */}
          <p
            className="led-label led-label-red-dim text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#ff1e1e]/60 sm:text-[0.58rem]"
            dir="ltr"
          >
            {quote.code}
          </p>
        </div>
      </div>

      {/* Current — the primary module: full-power bulbs, slightly larger. */}
      <LedValueCell
        code={quote.code}
        stat="cur"
        value={quote.current}
        ok={quote.ok}
        staggerMs={stagger}
        label={currentLabel}
        unitLabel={unitLabel}
        size="text-[0.8rem] sm:text-[1.12rem] lg:text-[1.28rem]"
        dim={false}
      />

      {/* Day high / day low — TGJU stats, secondary modules at 75% power. */}
      <LedValueCell
        code={quote.code}
        stat="high"
        value={quote.high}
        ok={quote.ok}
        staggerMs={stagger}
        label={highLabel}
        unitLabel={unitLabel}
        size="text-[0.72rem] sm:text-[1rem] lg:text-[1.14rem]"
        dim
      />
      <LedValueCell
        code={quote.code}
        stat="low"
        value={quote.low}
        ok={quote.ok}
        staggerMs={stagger}
        label={lowLabel}
        unitLabel={unitLabel}
        size="text-[0.72rem] sm:text-[1rem] lg:text-[1.14rem]"
        dim
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

      {/* Column headers — silkscreen labels on the housing, dot-matrix LED
          fill at a tight pitch (Tailwind text colors stay as fallback):
          currency · current · day high · day low. PHYSICAL right alignment
          so the labels sit exactly over the digit modules in both LTR and
          RTL. Long Persian high/low labels collapse to the short form
          below sm so headers never dictate column width on phones. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-[3px] px-1 pb-2 sm:gap-x-5 sm:ps-2.5 lg:gap-x-6">
        <p className="led-label led-label-white-dim text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">
          {t('liveRates.boardCurrency')}
        </p>
        <p className="led-label led-label-red whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/80">
          {currentLabel}
        </p>
        <p className="led-label led-label-red-dim whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55">
          <span className="sm:hidden">{t('liveRates.boardHighShort')}</span>
          <span className="hidden sm:inline">{highLabel}</span>
        </p>
        <p className="led-label led-label-red-dim whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55">
          <span className="sm:hidden">{t('liveRates.boardLowShort')}</span>
          <span className="hidden sm:inline">{lowLabel}</span>
        </p>
      </div>

      {/* Currency rows. */}
      <ul>
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

      {/* Footnote — the honesty line: three REAL TGJU daily stats. */}
      <footer className="mt-3 border-t border-white/[0.06] pt-2.5">
        <p className="text-[0.62rem] font-medium text-white/35">{t('liveRates.boardFootnote')}</p>
      </footer>
    </section>
  );
}
