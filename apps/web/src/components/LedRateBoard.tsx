/**
 * LedRateBoard — the shopfront LED rate board (2026-09-18; columns reworked
 * 2026-09-26 to TGJU's real daily stats).
 *
 * Recreates the physical experience of walking past a currency-exchange
 * shopfront: a near-black housing (#0d0d0d) with a live time/date header
 * and one row per currency — flag, name, and THREE quote-side values in
 * Toman — rendered as red seven-segment digits (DSEG7 Classic, OFL-1.1)
 * with a soft glow bloom. When a value updates, that digit briefly
 * intensifies its glow (~260ms, staggered per row) so the change reads as
 * an electronic refresh, the way real tickers signal "this value just
 * changed" — NOT an instant swap.
 *
 * The three columns are TGJU's OWN published daily statistics — the same
 * «مقادیر» table the profile pages show:
 *   1. نرخ فعلی — current open-market price (ajax.json `p`)
 *   2. بالاترین قیمت روز — day high (ajax.json `h`)
 *   3. پایین ترین قیمت روز — day low (ajax.json `l`)
 * Real data, not a derived dealer spread (the earlier ±0.25% sell/buy
 * estimate was retired: it was decorative, not information). Values ride
 * on each snapshot rate entry as `dayHigh`/`dayLow` (quote-side Toman,
 * see packages/core schemas.ts); unavailable stats render as dashes.
 *
 * Layout rules (owner spec):
 *   - Row cells in fixed order: flag · currency name · current · high · low.
 *   - The flag+name cell aligns to the row's leading edge via
 *     padding-inline-start (names are Persian; the row must stay RTL-safe).
 *   - The three value cells keep PHYSICAL right alignment (digits are LTR
 *     runs — a stable numeric column edge in both directions).
 *   - Every number — values, clock, date — is DSEG7; all other text stays
 *     in the site font (Vazirmatn renders the Persian names).
 *
 * A11y (WCAG 2.3.1 photosensitivity): the update-flash fires ONCE per
 * value change (changes arrive at most once per refresh window), lasts
 * 260ms and carries a 0–210ms per-row stagger, so the board never flashes
 * in sync and stays far below the 3-flashes/second threshold. The clock
 * colon dims at 0.5Hz with 0.45–1.0 amplitude (soft dim, never a hard
 * blink). Everything motion-based is disabled under prefers-reduced-motion
 * (see index.css).
 */

import { memo, useEffect, useMemo, useState } from 'react';
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

/* ------------------------------ clock ------------------------------- */

/** Ticking board clock: HH:MM:SS, colons dim once per second. */
function LedClock({ now }: { now: Date }) {
  const h = pad2(now.getHours());
  const m = pad2(now.getMinutes());
  const s = pad2(now.getSeconds());
  return (
    <span className="led-digits text-base sm:text-xl" dir="ltr" aria-hidden="true">
      {h}
      <span className="led-colon">:</span>
      {m}
      <span className="led-colon">:</span>
      {s}
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

/** One LED value cell — physically right-aligned seven-segment run.
 *  `key` carries the formatted value: a change remounts the span, which
 *  replays the 260ms glow pulse (staggered by row) — the electronic-
 *  refresh flash. The LED glyph span is hidden from AT and replaced by a
 *  comma-grouped aria-label so screen readers hear "2,279,000 Toman",
 *  not space-split digit runs. */
function LedValueCell({
  code,
  stat,
  value,
  ok,
  stagger,
  label,
  unitLabel,
  size,
  dim,
}: {
  code: string;
  stat: 'cur' | 'high' | 'low';
  value: number;
  ok: boolean;
  stagger: string;
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
        <span
          key={`${code}-${stat}-${text}`}
          className={`led-digits led-flash whitespace-nowrap ${size} ${ok && Number.isFinite(value) ? '' : 'led-idle'} ${dim ? 'opacity-75' : ''}`}
          style={{ animationDelay: stagger }}
          dir="ltr"
          aria-hidden="true"
        >
          {text}
        </span>
      </span>
    </div>
  );
}

/** One board row — flag · name · current · high · low (fixed order, logical
 *  flow so RTL mirrors the reading order naturally). Memoized: the clock
 *  ticks every second and must not re-render (nor re-flash) the value spans. */
const LedRow = memo(function LedRow({
  quote,
  index,
  currentLabel,
  highLabel,
  lowLabel,
  unitLabel,
  name,
}: LedRowProps) {
  const stagger = `${index * FLASH_STAGGER_MS}ms`;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-x-1 border-b border-white/[0.04] py-2.5 last:border-b-0 sm:gap-x-5 sm:py-3 lg:gap-x-6">
      {/* Leading cell: flag + name, aligned via padding-inline-start so the
          Persian names (RTL) keep the row's leading edge in both directions.
          Mobile: compact flag + tighter gaps so DSEG7's ~0.75em glyphs leave
          the name real room (DSEG7 has no narrow glyphs — see DSEG metrics). */}
      <div className="flex min-w-0 items-center gap-2 ps-1 sm:gap-2.5 sm:ps-2.5">
        <img
          src={`/images/flags/${quote.code.toLowerCase()}.png`}
          alt=""
          className="h-4 w-6 shrink-0 rounded-[3px] object-cover ring-1 ring-white/15 sm:h-[21px] sm:w-[32px]"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[0.75rem] font-semibold text-white/90 sm:text-[0.92rem]">{name}</p>
          <p className="text-[0.55rem] font-bold uppercase tracking-[0.18em] text-[#ff1e1e]/60 sm:text-[0.58rem]" dir="ltr">
            {quote.code}
          </p>
        </div>
      </div>

      {/* Current — the primary module: full glow, slightly larger. */}
      <LedValueCell
        code={quote.code}
        stat="cur"
        value={quote.current}
        ok={quote.ok}
        stagger={stagger}
        label={currentLabel}
        unitLabel={unitLabel}
        size="text-[0.8rem] sm:text-[1.12rem] lg:text-[1.28rem]"
        dim={false}
      />

      {/* Day high / day low — TGJU stats, secondary modules at ~75% glow. */}
      <LedValueCell
        code={quote.code}
        stat="high"
        value={quote.high}
        ok={quote.ok}
        stagger={stagger}
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
        stagger={stagger}
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
      {/* Header strip — live time + date in the same seven-segment red,
          plus the board's status LED. */}
      <header className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[#ff1e1e]/15 pb-3">
        <LedClock now={now} />
        <span className="led-digits text-[0.8rem] sm:text-[0.95rem]" dir="ltr" aria-hidden="true">
          {formatLedDate(now, locale)}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[0.6rem] font-extrabold uppercase tracking-[0.3em] text-[#ff1e1e]/55" dir="ltr">
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

      {/* Column headers — silkscreen labels on the housing (site font, not
          LED): currency · current · day high · day low. PHYSICAL right
          alignment so the labels sit exactly over the digit columns in both
          LTR and RTL. Long Persian high/low labels collapse to the short
          form below sm so the header never dictates column width on phones. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-1 px-1 pb-2 sm:gap-x-5 sm:ps-2.5 lg:gap-x-6">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">
          {t('liveRates.boardCurrency')}
        </p>
        <p className="whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/80">
          {currentLabel}
        </p>
        <p className="whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55">
          <span className="sm:hidden">{t('liveRates.boardHighShort')}</span>
          <span className="hidden sm:inline">{highLabel}</span>
        </p>
        <p className="whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/55">
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
          : // No snapshot yet: boot rows of dashes, like a powering-on module.
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
