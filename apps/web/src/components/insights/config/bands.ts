/**
 * 10-year position: warning zones, position WORDS, tone classes, and
 * state-keyed consequence lines (Phase 3-c split of the former config.ts
 * monolith — see ./index.ts). Pure, platform-free.
 */

import type { IndicatorReading, WarningRule } from '@currena/core';
import { interpolate } from '../../../i18n';
import type { IndicatorCopyEntry, ConsequenceLines, InsightsCopy } from '../../../i18n/insights-copy-en';
import { formatRuleText } from './labels';
import { formatIndicatorValue } from './display';
import { definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * 10-year position — warning zone, position WORDS, state keys
 * ------------------------------------------------------------------ */

/** The fraction band [from, to] of the 0–100% position bar the rule watches, if any. */
export function warningZone(rule: WarningRule): { from: number; to: number } | null {
  const zones = (rule.kind === 'any-of' ? rule.of : [rule])
    .map((atom): { from: number; to: number } | null => {
      if (atom.kind !== 'percentile') return null;
      return atom.tail === 'high' ? { from: 1 - atom.cutoff, to: 1 } : { from: 0, to: atom.cutoff };
    })
    .filter((z): z is { from: number; to: number } => z !== null);
  if (zones.length === 0) return null;
  // Merge overlapping zones (a hypothetical both-tails any-of).
  const sorted = [...zones].sort((a, b) => a.from - b.from);
  const merged = [sorted[0]!];
  for (const zone of sorted.slice(1)) {
    const last = merged[merged.length - 1]!;
    if (zone.from <= last.to) last.to = Math.max(last.to, zone.to);
    else merged.push(zone);
  }
  return merged.length === 1 ? merged[0]! : null; // Disjoint zones: don't shade (none today).
}

/** The position band (F3): <20 low · 20–80 typical · >80 high. */
export type PositionBand = 'low' | 'typical' | 'high';

export function positionBand(percentile10y: number): PositionBand {
  if (percentile10y < 0.2) return 'low';
  if (percentile10y > 0.8) return 'high';
  return 'typical';
}

/* ---------------------------------------------------------------- *
 * R29 (owner UI/UX audit): status WORDS speak in status ink. The
 * chips already carried red/green — now the verdict word and the
 * gauge step words do too. Never colour alone (G5): every tinted
 * word also sits beside an icon, a meter segment, or a number.
 *
 * R30 (roast 11 Oct): colour roles are defined ONCE —
 *   red = needs attention ONLY (the alert tier + its counts),
 *   the verdict scale is a FOUR-STEP ink scale (relaxed green →
 *   cautious amber → stressed orange → alarmed red; the old
 *   stressed-red made steps 3 and 4 read as one hue),
 *   and colour carries STATUS, never DIRECTION — price words
 *   ("expensive"/"cheap") are neutral ink again.
 * ---------------------------------------------------------------- */

/** WordTone → the status ink token (empty = inherit — neutral words).
 * (Shared with money.ts; NOT re-exported through the barrel.) */
export const WORD_TONE_CLASS: Record<'alert' | 'stressed' | 'watch' | 'normal' | 'neutral', string> = {
  alert: 'text-[var(--color-status-alert)]',
  stressed: 'text-[var(--color-status-stressed)]',
  watch: 'text-[var(--color-status-watch)]',
  normal: 'text-[var(--color-status-normal)]',
  neutral: '',
};

/** Verdict/gauge step (0 none · 1 relaxed · 2 cautious · 3 stressed ·
 * 4 alarmed) → the step word's tone class. Four DISTINCT hues — the
 * roast: "Stressed and Alarmed are close hues". */
export function stepToneClass(step: number): string {
  const tone = step <= 0 ? 'neutral' : step === 1 ? 'normal' : step === 2 ? 'watch' : step === 3 ? 'stressed' : 'alert';
  return WORD_TONE_CLASS[tone];
}

/** Price position band (low = cheap … high = expensive) → status ink.
 * Round 31 (owner): "everywhere which is marked 'expensive' use red
 * color" — the consumer-cost valence is the owner's decree and
 * overrides R30's neutral: expensive = the alert red, cheap = the
 * supportive green, typical stays neutral. Never colour alone (G5):
 * the word always rides beside the change numbers / the 10-year bar. */
export function bandToneClass(band: PositionBand): string {
  return band === 'high'
    ? WORD_TONE_CLASS.alert
    : band === 'low'
      ? WORD_TONE_CLASS.normal
      : WORD_TONE_CLASS.neutral;
}

/** Attention-count tone (R29): red while anything needs attention,
 * green only when the gauge is clear. */
export function attentionToneClass(warnings: number): string {
  return warnings > 0 ? WORD_TONE_CLASS.alert : WORD_TONE_CLASS.normal;
}

/** The state key for consequence-line selection (data spec §6 + F4). */
type ConsequenceState = keyof ConsequenceLines; // 'highRising' | 'highEasing' | 'typical' | 'low' | 'jumping'

/**
 * 2026-10-26 gap-audit build (A-9/A-10): the SD-regime cards — the GPR and
 * EPU indexes read their bands from the reading's sd10y (the rolling
 * 10-year z-score, recomputed on write) instead of the percentile, exactly
 * as the spec's thresholds direct: above +1 SD the attention zone, above
 * +2 SD the historic-spike class. The cards' copy carries the zone words;
 * the percentile bar keeps rendering the decade position (an independent,
 * honest measure on its own terms).
 */
export const SD_BAND_IDS: ReadonlySet<string> = new Set(['gpr-index', 'epu-us']);

/**
 * Pick the consequence-line state for one reading:
 *  - price rows (PB ids) with |moveScore| ≥ threshold → 'jumping'
 *  - SD-regime cards (SD_BAND_IDS) with sd10y: z ≥ 2 → 'jumping' (the
 *    historic-spike zone), z ≥ 1 the high band with the D2 direction
 *    discipline, z ≤ −1 'low', else 'typical'
 *  - high band + 30d rise → 'highRising'; high band + 30d fall → 'highEasing'
 *  - Step-1 audit item D2: a high band with NO measurable change never
 *    claims a direction — the line falls back to the oneLiner (the old
 *    code called every unmeasured case "easing", which contradicted the
 *    money panel's "becoming more expensive" on the same number).
 *  - low band → 'low'; else 'typical'
 * Stale/unavailable/no-percentile items have no state (oneLiner fallback).
 */
export const MOVE_SCORE_THRESHOLD = 2.0;

export function consequenceState(reading: IndicatorReading, isPriceRow: boolean): ConsequenceState | null {
  // A-9/A-10: the SD regime wins for its own cards (the spec's thresholds
  // are SD-based; the percentile line below never applies to them).
  if (SD_BAND_IDS.has(reading.id as string) && reading.sd10y !== undefined) {
    const z = reading.sd10y;
    if (z >= 2) return 'jumping'; // the historic-spike class (2001, 2022-03…)
    if (z <= -1) return 'low';
    if (z >= 1) {
      if (reading.change30d !== undefined && reading.change30d > 0) return 'highRising';
      if (reading.change30d !== undefined && reading.change30d < 0) return 'highEasing';
      return null; // elevated, but no measurable move — no direction claim (D2)
    }
    return 'typical';
  }
  if (reading.percentile10y === undefined) return null;
  if (isPriceRow && reading.moveScore !== undefined && Math.abs(reading.moveScore) >= MOVE_SCORE_THRESHOLD) {
    return 'jumping';
  }
  const band = positionBand(reading.percentile10y);
  if (band === 'high') {
    if (reading.change30d !== undefined && reading.change30d > 0) return 'highRising';
    if (reading.change30d !== undefined && reading.change30d < 0) return 'highEasing';
    return null; // high, but no measurable move — no direction claim (D2)
  }
  return band; // 'typical' | 'low'
}

/** The consequence line for a reading (F4): state line → oneLiner fallback.
 *  R28: lines quoting a published band carry {bandPos}/{bandLabel} tokens,
 *  interpolated here from the LIVE value — the sentence can never contradict
 *  the number beside it. `words` localises the position word (R22). */
export function consequenceLine(
  reading: IndicatorReading,
  entry: IndicatorCopyEntry,
  isPriceRow: boolean,
  words: { inside: string; above: string; below: string } = BAND_WORDS_EN,
): string {
  const state = consequenceState(reading, isPriceRow);
  const raw = (state && entry.lines?.[state]) || entry.oneLiner;
  if (!raw.includes('{bandPos}') && !raw.includes('{bandLabel}')) return raw;
  const band = entry.band;
  const value = reading.value;
  if (!band || value === null) return raw.replace(/\{bandPos\}/g, '').replace(/\{bandLabel\}/g, band?.label ?? '');
  return interpolate(raw, { bandPos: bandPositionWord(value, band, words), bandLabel: band.label });
}

/**
 * Fix spec A-02 (2026-10-14): the needs-attention line is GENERATED from the
 * reading's own rule and value — the hand-written `meaning` conclusions are
 * gone (they could contradict the card's numbers). Changing a value changes
 * this line automatically; nothing here can say "easing" while the value
 * rises, because the sentence is interpolated from the reading itself.
 */
export function attentionLineOf(
  reading: IndicatorReading,
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string | undefined {
  if (reading.status !== 'warning' || reading.value === null) return undefined;
  const def = definitionFor(reading.id);
  const rule = formatRuleText(def.rule, reading.id, copy.rule, copy.units, numberLocale);
  const value = formatIndicatorValue(reading.id, reading.value, numberLocale, copy.units);
  return interpolate(copy.ui.attentionLine, { rule, value });
}

/** Band position words keyed by locale (the R28 tokens' rendered form). */
type BandPosition = 'inside' | 'above' | 'below';

export function bandPositionOf(value: number, band: { min?: number; max?: number }): BandPosition {
  if (band.min !== undefined && value < band.min) return 'below';
  if (band.max !== undefined && value > band.max) return 'above';
  // Two-sided band (e.g. the RBA's 2–3%): neither below nor above → inside.
  if (band.min !== undefined && band.max !== undefined) return 'inside';
  if (band.min === undefined && band.max === undefined) return 'inside';
  // One-sided: the goal is a ceiling (min-only → above/inside is the claim).
  if (band.max === undefined) return value > (band.min ?? 0) ? 'above' : 'inside';
  return value < (band.max ?? 0) ? 'below' : 'inside';
}

/** The rendered band-position word for a locale's copy. */
function bandPositionWord(
  value: number,
  band: { min?: number; max?: number; label: string },
  words: { inside: string; above: string; below: string } = BAND_WORDS_EN,
): string {
  return words[bandPositionOf(value, band)];
}

const BAND_WORDS_EN: { inside: string; above: string; below: string } = {
  inside: 'inside',
  above: 'above',
  below: 'below',
};

/** The locale's band-position words from the copy corpus (R22: fa renders
 * درون/بالای/زیر — never the English defaults). */
export function bandWordsOf(copy: InsightsCopy): { inside: string; above: string; below: string } {
  return { inside: copy.ui.bandPosInside, above: copy.ui.bandPosAbove, below: copy.ui.bandPosBelow };
}
