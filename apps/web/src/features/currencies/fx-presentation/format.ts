/**
 * fx-presentation/format — the number+direction format group (Phase: WS-4
 * module split of the former fx-presentation.ts monolith — zero behavior
 * change, code moved verbatim). Every number the fx section shows passes
 * through one of these four shapes: the sentence abs1 (one decimal, no
 * sign — the words carry the direction), the chart label's signed pct
 * (fa gets ٪), the {line} threshold format, and whole numbers for the
 * money line. Shared by sentences/plain/headline/pairs; NOT re-exported
 * by the public barrel (internal by design, as in the monolith).
 */

import { formatNumber } from '@currena/core';

/** One decimal, no sign — the sentence's words carry the direction (§7). */
export function abs1(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** A signed percentage for on-screen labels ("−3.6%"). A value that rounds
 * to zero carries no sign — "−0.0%" reads as a bug. */
export function fxSignedPct(n: number, numberLocale: 'en-US' | 'fa-IR', locale: 'en' | 'fa'): string {
  const num = formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const roundsToZero = Math.round(Math.abs(n) * 10) === 0;
  const sign = roundsToZero ? '' : n > 0 ? '+' : '−';
  return `${sign}${num}${locale === 'fa' ? '٪' : '%'}`;
}

/** One decimal, no sign — the CR's {line} threshold format ("3.0"). */
export function threshold1(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.abs(n), numberLocale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

/** Whole numbers — the S5 money line's {old}/{new}/{diff}. */
export function whole0(n: number, numberLocale: 'en-US' | 'fa-IR'): string {
  return formatNumber(Math.round(n), numberLocale, { maximumFractionDigits: 0 });
}
