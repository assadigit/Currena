/**
 * Currena market formatting helpers.
 *
 * The single source of truth for how every market number is rendered across
 * the treemap, the region grid tiles, the detail panel and the summary — so
 * the tile, the tooltip and the panel can never drift apart on formatting.
 *
 * Sign convention (spec §6): the percentage glyph rides the number; the sign
 * is a Unicode MINUS (U+2212 "−") for negatives, an ASCII "+" for positives,
 * and nothing at all when the value rounds to zero ("−0.0" reads as a bug).
 * Every percentage uses tabular figures so columns of percentages align.
 */

/** A value that rounds to one decimal as zero shows no sign. */
function roundsToZero(n: number): boolean {
  return Math.round(Math.abs(n) * 10) === 0;
}

/** The Unicode minus used for every negative percentage (−, U+2212). */
const MINUS = '\u2212';

/** Format a signed percentage: +1.2% / −1.2% / 0.4% (no sign when ~0). */
export function fmtPct(n: number | null): string {
  if (n === null) return '\u2014'; // — the honest no-reading dash
  const num = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const sign = roundsToZero(n) ? '' : n > 0 ? '+' : MINUS;
  return `${sign}${num}%`;
}

/** Format a drawdown / from-high percentage — always spoken as "below the
 *  high", so a zero reads "0.0%" and a −7.3% reads "−7.3%". Used by the
 *  tooltip's "From 52-week high" line. */
export function fmtMinusPct(n: number | null): string {
  if (n === null) return '\u2014';
  return fmtPct(n);
}

/** Format an index level/close: thousands separators, 0 decimals when the
 *  value is >= 1000 (indices like Ibovespa at ~130k), 2 decimals otherwise
 *  (small-point indices like SSEC at ~3300 or KOSPI at ~2500). */
export function fmtLevel(n: number | null): string {
  if (n === null) return '\u2014';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: n >= 1000 ? 0 : 2,
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  });
}

/** Format a market-cap weight in USD trillions, 1 decimal. */
export function fmtCap(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 1 });
}

/** Format an as-of ISO date (YYYY-MM-DD) as "Nov 12, 2026" (UTC-safe). */
export function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}

/** The plain up/down/flat word for a signed reading. */
export function directionWord(n: number | null): 'Up' | 'Down' | 'Flat' {
  if (n === null || roundsToZero(n)) return 'Flat';
  return n > 0 ? 'Up' : 'Down';
}
