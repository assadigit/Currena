/**
 * Shared LED panel parts — the physical primitives both shopfront boards use
 * (the currency board and the gold & coins board). Extracted 2026-09-27 from
 * LedRateBoard.tsx so the gold panel reuses the exact same hardware layers:
 *
 *   LedDigits   — one recessed module: ghost '8'-shape + bloom halo + the
 *                 lit dot-matrix value (three pixel-identical layers).
 *   LedClock    — HH:MM:SS in a standard sans-serif (owner request
 *                 2026-09-27: the timer-like strip text left the seven-
 *                 segment look; the price digits keep it as the board's
 *                 signature) with tabular-nums and softly dimming colons.
 *   LedDate     — the board-header date (Jalali with the Persian month
 *                 name for fa) in the same readable sans-serif treatment.
 *   LedStatus   — the LIVE/CACHED/OFFLINE indicator LED.
 *   LedValueCell — one value module + its accessible label, placed in the
 *                 shared column grid, with the primary/secondary emphasis
 *                 tiers and the 260ms flash-on-change.
 *
 * Formatting helpers: formatLedDate (fa → '28 شهریور 1405', en → '2026.09.18')
 * and formatLedNumber (space-grouped ASCII digits — DSEG7 has no commas —
 * with optional decimals for USD-quoted items).
 *
 * All styling lives in index.css (.led-cell/.led-digits/.led-label/…); these
 * components are structure only. A11y notes are on LedDigits/LedValueCell.
 */

import { Fragment } from 'react';

/* ---------------------------- formatting ----------------------------- */

/** 2-digit zero-pad — LED clock segments are always fixed-width. */
const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Locale-aware LED date: fa → Jalali with the Persian month name, day-first
 *  — '28 شهریور 1405' (owner request 2026-09-19; digits stay Latin to match
 *  the board's digit language). en → Gregorian '2026.09.18' ('.' is the
 *  real-board separator). NOTE for the fa rendering: the string alone in a
 *  dir="ltr" element scrambles to '28 1405 شهریور' (bidi: the year is an
 *  Arabic-type number AFTER the month word, so it joins the month's RTL run
 *  and lands left of it) — LedDate therefore renders the month word inside
 *  a <bdi> isolate, which pins the exact visual '28 شهریور 1405'. The Intl
 *  formatter is cached (core's format.ts measures 100–40,000× construction-
 *  vs-format cost). */
const ledJalaliFormatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn-ca-persian', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/** Jalali (day / Persian month name / year) parts of the fa LED date. */
function jalaliLedParts(date: Date): { day: string; month: string; year: string } {
  const parts = ledJalaliFormatter.formatToParts(date);
  const get = (type: string): string => parts.find((p) => p.type === type)?.value ?? '';
  return { day: get('day'), month: get('month'), year: get('year') };
}

export function formatLedDate(date: Date, locale: 'en' | 'fa'): string {
  if (locale === 'fa') {
    const { day, month, year } = jalaliLedParts(date);
    return `${day} ${month} ${year}`;
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

/** Ticking board clock — HH:MM:SS (owner request 2026-09-27): a standard
 *  sans-serif run with tabular-nums, full-power red for clear glance
 *  reading on the dark housing, and softly dimming colons (the one LED
 *  habit kept — 0.5Hz, amplitude 0.45–1, WCAG-safe). The seven-segment
 *  DSEG7 rendering is reserved for the price digits. */
export function LedClock({ now }: { now: Date }) {
  const groups = [pad2(now.getHours()), pad2(now.getMinutes()), pad2(now.getSeconds())];
  return (
    <span
      className="flex select-none items-center gap-[3px] font-semibold tabular-nums text-base text-[#ff1e1e] sm:gap-1.5 sm:text-xl"
      dir="ltr"
      aria-hidden="true"
    >
      {groups.map((group, i) => (
        <Fragment key={i}>
          {i > 0 ? <span className="led-colon">:</span> : null}
          <span>{group}</span>
        </Fragment>
      ))}
    </span>
  );
}

/* -------------------------------- date ------------------------------- */

/** Board-header date — the same readable sans-serif treatment as the clock
 *  (owner request 2026-09-27: dates left the seven-segment look): full-power
 *  red, tabular-nums, a touch of tracking — Latin only: letter-spacing breaks
 *  Persian letter joining in the fa month name, so fa keeps tracking-normal
 *  (the same rule the board column headers follow). Jalali month-name date
 *  for fa, Gregorian for en.
 *
 * fa is rendered from parts with the month word in a <bdi> isolate: the
 * plain string '28 شهریور 1405' in this dir="ltr" span would bidi-scramble
 * to '28 1405 شهریور' (the year, an Arabic-type number following the month
 * word, is absorbed into the month's RTL run and re-emerges LEFT of it).
 * The isolate breaks the run chain — day and year resolve as plain LTR
 * numbers around the isolated RTL word — so the strip renders visually
 * EXACTLY '28 شهریور 1405', the string the owner asked for, while the
 * accessible textContent stays the logical '28 شهریور 1405'.
 * Unlike the DSEG7 layers it replaced, the text is exposed to assistive
 *  tech (it is real information, not decoration). */
export function LedDate({ date, locale }: { date: Date; locale: 'en' | 'fa' }) {
  const className = `select-none font-semibold ${
    locale === 'en' ? 'tracking-[0.08em]' : 'tracking-normal'
  } tabular-nums text-[0.8rem] text-[#ff1e1e] sm:text-[0.95rem]`;
  if (locale === 'fa') {
    const { day, month, year } = jalaliLedParts(date);
    return (
      <span className={className} dir="ltr">
        {day} <bdi>{month}</bdi> {year}
      </span>
    );
  }
  return (
    <span className={className} dir="ltr">
      {formatLedDate(date, locale)}
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
