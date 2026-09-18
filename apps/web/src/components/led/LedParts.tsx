/**
 * Shared LED panel parts — the physical primitives both shopfront boards use
 * (the currency board and the gold & coins board). Extracted 2026-09-27 from
 * LedRateBoard.tsx so the gold panel reuses the exact same hardware layers:
 *
 *   LedDigits   — one recessed module: ghost '8'-shape + bloom halo + the
 *                 lit dot-matrix value (three pixel-identical layers).
 *   LedClock    — HH:MM:SS as three recessed modules with dimming colons.
 *   LedStatus   — the LIVE/CACHED/OFFLINE indicator LED.
 *   LedValueCell — one value module + its accessible label, placed in the
 *                 shared column grid, with the primary/secondary emphasis
 *                 tiers and the 260ms flash-on-change.
 *
 * Formatting helpers: formatLedDate (locale-aware LED date, '.' separators,
 * Jalali for fa) and formatLedNumber (space-grouped ASCII digits — DSEG7 has
 * no commas — with optional decimals for USD-quoted items).
 *
 * All styling lives in index.css (.led-cell/.led-digits/.led-label/…); these
 * components are structure only. A11y notes are on LedDigits/LedValueCell.
 */

import { Fragment } from 'react';

/* ---------------------------- formatting ----------------------------- */

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

export function formatLedDate(date: Date, locale: 'en' | 'fa'): string {
  if (locale === 'fa') {
    const parts = ledJalaliFormatter.formatToParts(date);
    const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '00';
    return `${get('year')}.${get('month')}.${get('day')}`;
  }
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`;
}

/**
 * LED number rendering — plain ASCII digits, space-separated groups, exactly
 * like a multi-module board (no commas: DSEG7 has none, and real boards never
 * show them). `decimals` (default 0) keeps fractional digits with a '.'
 * separator — the DSEG7 glyph set covers it (used by the USD gold ounce).
 * Numbers are canonical until this render-time boundary.
 */
export function formatLedNumber(value: number, decimals = 0): string {
  const fixed = Math.round(value * 10 ** decimals) / 10 ** decimals;
  const parts = fixed.toFixed(decimals).split('.');
  const int = parts[0] ?? '0';
  const frac = parts[1];
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return frac !== undefined ? `${grouped}.${frac}` : grouped;
}

/* ------------------------------ digits ------------------------------- */

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
export function LedDigits({
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

/* ------------------------------- clock ------------------------------- */

/** Ticking board clock: HH:MM:SS as three recessed digit modules with
 *  softly dimming colons (the DSEG7 colon glyph is two segment dots). */
export function LedClock({ now }: { now: Date }) {
  const groups = [pad2(now.getHours()), pad2(now.getMinutes()), pad2(now.getSeconds())];
  return (
    <span className="flex items-center gap-[3px] sm:gap-1.5" dir="ltr" aria-hidden="true">
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className="led-digits led-colon text-base sm:text-xl">:</span> : null}
          <LedDigits value={group} className="text-base sm:text-xl" />
        </Fragment>
      ))}
    </span>
  );
}

/* ------------------------------- status ------------------------------ */

/** Header status LED: LIVE (red heartbeat) / CACHED (amber) / OFFLINE (gray). */
export function LedStatus({ state, label }: { state: 'live' | 'cached' | 'offline'; label: string }) {
  const color = state === 'live' ? '#ff1e1e' : state === 'cached' ? '#ffb020' : '#8a8f98';
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`led-status inline-block h-[7px] w-[7px] rounded-full ${state === 'live' ? 'led-status-live' : ''}`}
        style={{ backgroundColor: color, color }}
        aria-hidden="true"
      />
      <span className="text-[0.6rem] font-bold uppercase tracking-[0.14em]" style={{ color }} dir="ltr">
        {label}
      </span>
    </span>
  );
}

/* ----------------------------- value cell ---------------------------- */

/**
 * One LED value cell — a recessed module + its accessible label, placed in
 * the shared column grid (track comes from .led-table, alignment is physical
 * right). The `key` on LedDigits carries the formatted value: a change
 * remounts the module, replaying the 260ms brightness surge (staggered by
 * row) — the electronic-refresh flash. LED glyph layers are hidden from AT
 * and replaced by a comma-grouped aria-label so screen readers hear
 * "2,279,000 Toman", not space-split digit runs.
 * `emphasis` picks the module tier: primary (CURRENT — hot bulbs, full
 * power) vs secondary (high/low — standard treatment at 75% power).
 * `decimals` feeds formatLedNumber (2 for the USD gold ounce).
 * `wrapperClass` lets boards hide the cell at some breakpoints (the gold
 * board shows high/low only from md up).
 */
export function LedValueCell({
  keyId,
  stat,
  value,
  ok,
  staggerMs,
  label,
  unitLabel,
  size,
  emphasis,
  decimals = 0,
  wrapperClass = 'text-right',
}: {
  /** Identity for the remount key (currency code or gold item id). */
  keyId: string;
  stat: 'cur' | 'high' | 'low';
  value: number;
  ok: boolean;
  staggerMs: number;
  label: string;
  unitLabel: string;
  size: string;
  emphasis: 'primary' | 'secondary';
  decimals?: number;
  wrapperClass?: string;
}) {
  const text = ok && Number.isFinite(value) ? formatLedNumber(value, decimals) : '-------';
  return (
    <div className={wrapperClass}>
      <span
        role="img"
        aria-label={`${label} ${ok && Number.isFinite(value) ? `${text.replace(/ /g, ',')} ${unitLabel}` : '—'}`}
      >
        <LedDigits
          key={`${keyId}-${stat}-${text}`}
          value={text}
          flash={ok}
          idle={!ok}
          staggerMs={staggerMs}
          className={`${size} ${emphasis === 'primary' ? 'led-cell-hot' : 'led-cell-soft opacity-75'}`}
        />
      </span>
    </div>
  );
}
