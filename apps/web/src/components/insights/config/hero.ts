/**
 * The hero reason line, the needs-attention tiles, and per-group
 * visibility (Phase 3-c split of the former config.ts monolith — see
 * ./index.ts). Pure, platform-free.
 */

import type { IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { DEFINITIONS } from '@currena/insights';
import type { GaugeReading } from '@currena/insights';
import { interpolate } from '../../../i18n';
import { warningZone } from './bands';
import { tierOf } from './movers';
import { definitionFor } from './sections';

/* ------------------------------------------------------------------ *
 * Round-2 R2: the hero reason line — a FIXED TABLE computed from the
 * gauge steps, never free text. The sentence can never contradict the
 * gauges: the top step's word names its gauges, and no reassurance
 * phrase exists in the table (the calm line only fires when EVERY
 * readable gauge sits at step 1).
 * ------------------------------------------------------------------ */

interface HeroReasonInput {
  /** The section's gauge readings (gaugeReading rows). */
  gauges: readonly GaugeReading[];
  /** The step words, keyed 1–4 (copy.label). */
  words: Readonly<Record<number, string>>;
  calm: string;
  top: string; // '{k} of {n} areas {isAre} {word}: {names}.'
  others: string; // 'The rest are {word}.'
  othersOne: string; // 'The other one is {word}.'
  /** Round 24: used when the remaining gauges DISAGREE — {words} is the
   * distinct step words, pre-joined with andWord (the old mode-based tail
   * said "The rest are Stable" while one sat Cautious — the roast caught
   * the hero contradicting its own gauge rows). */
  othersMixed?: string; // 'The rest are {words}.'
  andWord?: string; // 'and' / «و»
  is: string;
  are: string;
  notEnough: string;
  /** The gauge display names, keyed by gauge id (copy.groups). */
  nameOf: (gauge: string) => string;
  /** Locale digit renderer (R22: fa renders ۵, not 5). Defaults to String. */
  fmt?: (n: number) => string;
}

export function heroReason(input: HeroReasonInput): string {
  const fmtN = input.fmt ?? String;
  const readable = input.gauges.filter((g) => g.step >= 1);
  if (readable.length === 0) return input.notEnough;
  if (readable.every((g) => g.step === 1)) return input.calm;
  const maxStep = Math.max(...readable.map((g) => g.step));
  const top = readable.filter((g) => g.step === maxStep);
  const word = input.words[maxStep] ?? '';
  const names = top.map((g) => input.nameOf(g.gauge)).join(', ');
  const line1 = interpolate(input.top, {
    k: fmtN(top.length),
    n: fmtN(readable.length),
    isAre: top.length === 1 ? input.is : input.are,
    word,
    names,
  });
  const rest = readable.filter((g) => g.step < maxStep);
  if (rest.length === 0) return line1;
  // Round 24 (roast): the tail used the MODE (most common step) of the
  // rest, which lied whenever the rest disagreed ("The rest are Stable"
  // beside a Cautious gauge row). When they share one step, the single
  // word is honest. When they DISAGREE, enumerate the DISTINCT words
  // (most notable first) if the locale provides the mixed template —
  // otherwise fall back to the mode (older call sites/tests).
  const restSteps = new Set(rest.map((g) => g.step));
  if (restSteps.size > 1 && input.othersMixed && input.andWord) {
    const wordsList = [...restSteps]
      .sort((a, b) => b - a)
      .map((s) => input.words[s] ?? '')
      .filter(Boolean)
      .join(` ${input.andWord} `);
    return `${line1} ${interpolate(input.othersMixed, { words: wordsList })}`;
  }
  if (restSteps.size === 1) {
    const restWord = input.words[[...restSteps][0]!] ?? '';
    const restLine = interpolate(
      rest.length === 1 ? input.othersOne : input.others,
      { word: restWord },
    );
    return `${line1} ${restLine}`;
  }
  // Mixed rest, no mixed template: the mode, ties resolving UP (the more
  // notable state wins a tie) — the R30 behaviour, kept as fallback.
  const tally = new Map<number, number>();
  for (const g of rest) tally.set(g.step, (tally.get(g.step) ?? 0) + 1);
  const restStep = [...tally.entries()].sort((a, b) => (b[1] !== a[1] ? b[1] - a[1] : b[0] - a[0]))[0]![0];
  const restWord = input.words[restStep] ?? '';
  const restLine = interpolate(
    rest.length === 1 ? input.othersOne : input.others,
    { word: restWord },
  );
  return `${line1} ${restLine}`;
}

/** The R2 guard: does a hero sentence contradict its gauges? (Test-only
 * helper.) The fixed table names every gauge AT THE TOP STEP and words the
 * tail ("The rest are Stressed") — so the guard checks: (1) every max-step
 * gauge is named; (2) no reassurance phrase while ANY gauge sits at step 3
 * or 4. A step-3 tail is described by its word, never reassured away. */
export function heroReasonIsConsistent(
  sentence: string,
  gauges: readonly GaugeReading[],
  nameOf: (gauge: string) => string,
): boolean {
  const readable = gauges.filter((g) => g.step >= 1);
  const maxStep = readable.length > 0 ? Math.max(...readable.map((g) => g.step)) : 0;
  for (const g of readable.filter((g) => g.step === maxStep && maxStep >= 1)) {
    if (!sentence.includes(nameOf(g.gauge))) return false;
  }
  if (maxStep >= 3) {
    const reassurance = /(not worth worrying|nothing needs your attention|no need to worry)/i;
    if (reassurance.test(sentence)) return false;
  }
  return true;
}

/* ------------------------------------------------------------------ *
 * Round-2 R3: the needs-attention tiles — sorted by how far the value
 * sits into its own 10-year range (rule-tail aware).
 * ------------------------------------------------------------------ */

interface AttentionTileRow {
  id: IndicatorId;
  /** 0..1 — how deep into the watched tail the value sits. */
  extremity: number;
}

/** The warning members of one section, extremity-sorted (R3 tile order). */
export function attentionTiles(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): AttentionTileRow[] {
  const sectionIds = new Set(DEFINITIONS.filter((d) => d.section === section).map((d) => d.id));
  const rows: AttentionTileRow[] = [];
  for (const r of readings) {
    if (r.status !== 'warning' || !sectionIds.has(r.id)) continue;
    const def = definitionFor(r.id);
    const zone = warningZone(def.rule);
    let extremity = r.percentile10y ?? 0.5;
    if (zone && r.percentile10y !== undefined) {
      extremity = zone.to >= 1 ? r.percentile10y : 1 - r.percentile10y;
    }
    rows.push({ id: r.id, extremity });
  }
  return rows.sort((a, b) => b.extremity - a.extremity);
}

/* ------------------------------------------------------------------ *
 * Round-2 R7: the signals-first default view — per-group split.
 * ------------------------------------------------------------------ */

interface GroupVisibility {
  /** Needs-attention + unusual + enough normal rows to reach MIN_VISIBLE. */
  visible: readonly IndicatorReading[];
  /** The rest — collapsed behind "See all {n} indicators". */
  collapsed: readonly IndicatorReading[];
}

/** At least this many items visible per group (spec R7). */
const GROUP_MIN_VISIBLE = 3;

export function groupVisibility(readings: readonly IndicatorReading[]): GroupVisibility {
  const cards: IndicatorReading[] = [];
  const rows: IndicatorReading[] = [];
  for (const r of readings) {
    const tier = tierOf(r);
    if (tier === 'needs-attention' || tier === 'unusual') cards.push(r);
    else rows.push(r);
  }
  const visible = [...cards];
  for (const r of rows) {
    if (visible.length >= GROUP_MIN_VISIBLE) break;
    visible.push(r);
  }
  const visibleSet = new Set(visible.map((r) => r.id));
  return { visible, collapsed: rows.filter((r) => !visibleSet.has(r.id)) };
}
