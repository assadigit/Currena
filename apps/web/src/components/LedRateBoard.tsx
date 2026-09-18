/**
 * LedRateBoard — the shopfront LED rate board (2026-09-18).
 *
 * Recreates the physical experience of walking past a currency-exchange
 * shopfront: a near-black housing (#0d0d0d) with a live time/date header
 * and one row per currency — flag, name, sell rate, buy rate — rendered as
 * red seven-segment digits (DSEG7 Classic, OFL-1.1) with a soft glow bloom.
 * When a rate updates, that digit briefly intensifies its glow (~260ms,
 * staggered per row) so the change reads as an electronic refresh, the way
 * real tickers signal "this value just changed" — NOT an instant swap.
 *
 * Layout rules (owner spec):
 *   - Row cells in fixed order: flag · currency name · sell · buy.
 *   - The flag+name cell aligns to the row's leading edge via
 *     padding-inline-start (names are Persian; the row must stay RTL-safe).
 *   - The two rate cells keep PHYSICAL right alignment (digits are LTR runs —
 *     a stable numeric column edge in both directions).
 *   - Every number — rates, clock, date — is DSEG7; all other text stays in
 *     the site font (Vazirmatn renders the Persian names).
 *
 * A11y (WCAG 2.3.1 photosensitivity): the update-flash fires ONCE per rate
 * change (changes arrive at most once per refresh window), lasts 260ms and
 * carries a 0–210ms per-row stagger, so the board never flashes in sync and
 * stays far below the 3-flashes/second threshold. The clock colon dims at
 * 0.5Hz with 0.45–1.0 amplitude (soft dim, never a hard blink). Everything
 * motion-based is disabled under prefers-reduced-motion (see index.css).
 *
 * Honesty: TGJU serves ONE open-market price per currency (a mid/last
 * trade), not a dealer two-way quote. Sell/buy are derived from that mid
 * with a documented ±0.25% dealer margin and stated in the footnote — the
 * board mimics the shopfront FORM without inventing an undisclosed spread.
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

/** Total two-way dealer spread, ± per side (footnoted on the board). */
const DEALER_SPREAD_PCT = 0.5;

/** Per-row flash stagger step — 8 rows × 30ms = 0–210ms (WCAG 2.3.1). */
const FLASH_STAGGER_MS = 30;

/** One LED rate cell: sell (higher) / buy (lower) around the market mid. */
export interface BoardQuote {
  code: CurrencyCode;
  /** Market mid-rate, Toman per 1 unit (from the TGJU snapshot). */
  mid: number;
  sell: number;
  buy: number;
  ok: boolean;
}

/** Dealer two-way quote around the mid, rounded like a real board
 *  (majors to the nearest 100 Toman, small values to 10/1). */
function quoteFromMid(mid: number): { sell: number; buy: number } {
  const half = DEALER_SPREAD_PCT / 200; // 0.25% per side
  const roundStep = (v: number): number => {
    const step = v >= 10_000 ? 100 : v >= 1_000 ? 10 : 1;
    return Math.round(v / step) * step;
  };
  return { sell: roundStep(mid * (1 + half)), buy: roundStep(mid * (1 - half)) };
}

/** Quotes for every board currency off one snapshot (local math only). */
export function boardQuotes(snapshot: Snapshot | null): BoardQuote[] | null {
  if (!snapshot) return null;
  return BOARD.map((code) => {
    try {
      const { rate: tomanPerUnit } = convert(snapshot, code, 'IRR', 1);
      const { sell, buy } = quoteFromMid(tomanPerUnit);
      return { code, mid: tomanPerUnit, sell, buy, ok: true as const };
    } catch {
      return { code, mid: Number.NaN, sell: Number.NaN, buy: Number.NaN, ok: false as const };
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
  sellLabel: string;
  buyLabel: string;
  unitLabel: string;
  name: string;
}

/** One board row — flag · name · sell · buy (fixed order, logical flow so
 *  RTL mirrors the reading order naturally). Memoized: the clock ticks every
 *  second and must not re-render (nor re-flash) the value spans. */
const LedRow = memo(function LedRow({ quote, index, sellLabel, buyLabel, unitLabel, name }: LedRowProps) {
  const dashes = '-------';
  const stagger = `${index * FLASH_STAGGER_MS}ms`;

  const sellText = quote.ok ? formatLedNumber(quote.sell) : dashes;
  const buyText = quote.ok ? formatLedNumber(quote.buy) : dashes;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-2 border-b border-white/[0.04] py-2.5 last:border-b-0 sm:gap-x-5 sm:py-3">
      {/* Leading cell: flag + name, aligned via padding-inline-start so the
          Persian names (RTL) keep the row's leading edge in both directions. */}
      <div className="flex min-w-0 items-center gap-2.5 ps-1 sm:ps-2.5">
        <img
          src={`/images/flags/${quote.code.toLowerCase()}.png`}
          alt=""
          className="h-[18px] w-[27px] shrink-0 rounded-[3px] object-cover ring-1 ring-white/15 sm:h-[21px] sm:w-[32px]"
        />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[0.82rem] font-semibold text-white/90 sm:text-[0.92rem]">{name}</p>
          <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-[#ff1e1e]/60" dir="ltr">
            {quote.code}
          </p>
        </div>
      </div>

      {/* Sell — physically right-aligned seven-segment cell. `key` carries the
          value: a change remounts the span, which replays the 260ms glow pulse
          (staggered by row) — the electronic-refresh flash. The LED glyph span
          is hidden from AT and replaced by a comma-grouped aria-label so screen
          readers hear "2,279,000 Toman", not space-split digit runs. */}
      <div className="text-right">
        <span role="img" aria-label={`${sellLabel} ${quote.ok ? `${sellText.replace(/ /g, ',')} ${unitLabel}` : '—'}`}>
          <span
            key={`${quote.code}-sell-${sellText}`}
            className={`led-digits led-flash whitespace-nowrap text-[0.95rem] sm:text-[1.12rem] lg:text-[1.25rem] ${quote.ok ? '' : 'led-idle'}`}
            style={{ animationDelay: stagger }}
            dir="ltr"
            aria-hidden="true"
          >
            {sellText}
          </span>
        </span>
      </div>

      {/* Buy — same treatment. */}
      <div className="text-right">
        <span role="img" aria-label={`${buyLabel} ${quote.ok ? `${buyText.replace(/ /g, ',')} ${unitLabel}` : '—'}`}>
          <span
            key={`${quote.code}-buy-${buyText}`}
            className={`led-digits led-flash whitespace-nowrap text-[0.95rem] sm:text-[1.12rem] lg:text-[1.25rem] ${quote.ok ? '' : 'led-idle'}`}
            style={{ animationDelay: stagger }}
            dir="ltr"
            aria-hidden="true"
          >
            {buyText}
          </span>
        </span>
      </div>
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

  const sellLabel = t('liveRates.boardSell');
  const buyLabel = t('liveRates.boardBuy');
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
          LED): currency / sell / buy. PHYSICAL right alignment so the labels
          sit exactly over the digit columns in both LTR and RTL. */}
      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-2 px-1 pb-2 sm:gap-x-5 sm:ps-2.5">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.16em] text-white/35">
          {t('liveRates.boardCurrency')}
        </p>
        <p className="whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/70">
          {sellLabel}
        </p>
        <p className="whitespace-nowrap text-right text-[0.6rem] font-bold uppercase tracking-[0.16em] text-[#ff1e1e]/70">
          {buyLabel}
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
                sellLabel={sellLabel}
                buyLabel={buyLabel}
                unitLabel={unitLabel}
                name={t(`currencies.${quote.code}` as TranslationKey)}
              />
            ))
          : // No snapshot yet: boot rows of dashes, like a powering-on module.
            BOARD.map((code, index) => (
              <LedRow
                key={code}
                quote={{ code, mid: Number.NaN, sell: Number.NaN, buy: Number.NaN, ok: false }}
                index={index}
                sellLabel={sellLabel}
                buyLabel={buyLabel}
                unitLabel={unitLabel}
                name={t(`currencies.${code}` as TranslationKey)}
              />
            ))}
      </ul>

      {/* Footnote — the honesty line: derived two-way quote, source. */}
      <footer className="mt-3 border-t border-white/[0.06] pt-2.5">
        <p className="text-[0.62rem] font-medium text-white/35">{t('liveRates.boardFootnote')}</p>
      </footer>
    </section>
  );
}
