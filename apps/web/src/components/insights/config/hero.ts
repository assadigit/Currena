/**
 * The hero reason line, the needs-attention tiles, and per-group
 * visibility (Phase 3-c split of the former config.ts monolith — see
 * ./index.ts). Pure, platform-free.
 *
 * v3 UI_SPEC §3 (2026-10-20, UI-01..UI-08) adds the new hero machinery:
 *   heroSentence   — the ≤90-char generated verdict sentence (fixed table
 *                   from the gauge steps: counts + which areas raised —
 *                   never free text, never a new conclusion, never a
 *                   forecast; heroReason's fixed-table discipline reused)
 *   heroWhy        — the top-3 needs-attention readings by |moveScore|
 *                   (fallback: percentile extremity, the R3 measure)
 *   heroReadingCounts — the UI-02 reading bar: attention / normal /
 *                   can't-tell-right-now over the section's gauge members
 *   calmGauges     — the UI-04 calm line's gauge ids (zero warnings)
 *   gaugeMembersAffected / heroHasStaleInputs — the UI-06 freshness count
 *                   and the UI-08 alert-box condition (a stale/unavailable
 *                   reading inside a gauge whose members voted — chosen
 *                   CLIENT-SIDE because the engine already excludes those
 *                   readings from every count; the hero just says so)
 */

import type { CalendarEvent, IndicatorId, IndicatorReading, InsightsSection } from '@currena/core';
import { GAUGES } from '@currena/insights';
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
 *
 * v3: the RENDERED hero sentence is heroSentence below (the R2 machinery
 * stays — it is pinned by its tests and remains the extremity fallback's
 * fixed-table ancestor).
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
 * v3 UI-01: the generated verdict sentence (≤90 characters).
 *
 * A FIXED TABLE over the gauge steps, exactly like heroReason: the calm
 * case only fires when EVERY readable gauge is calm; otherwise the raised
 * areas are named (up to two, then "+{n} more") beside the honest count
 * "{k} of {n} gauges". k counts GAUGES with warnings (a gauge steps ≥ 2
 * exactly when at least one voting member fired), n counts readable
 * gauges. No reassurance sentence exists in the table.
 * ------------------------------------------------------------------ */

export interface HeroSentenceInput {
  gauges: readonly GaugeReading[];
  /** Short gauge names (copy.groupShort). */
  nameOf: (gauge: string) => string;
  /** Locale digit renderer (fa renders ۵). */
  fmt: (n: number) => string;
  /** Copy templates (copy.ui): */
  calm: string; // 'All {n} gauges are calm right now.'
  attention: string; // '{areas} {isAre} above the level their rules watch: {k} of {n} gauges.'
  andWord: string; // 'and' / «و»
  listSep: string; // ', ' / «، »
  moreWord: string; // '+{n} more' / «و {n} مورد دیگر»
  isWord: string; // 'needs' (one area, en)
  areWord: string; // 'need' (two or more, en)
  notEnough: string;
}

export function heroSentence(input: HeroSentenceInput): string {
  const readable = input.gauges.filter((g) => g.step >= 1);
  if (readable.length === 0) return input.notEnough;
  const raised = readable.filter((g) => g.step >= 2); // has ≥1 warning member
  if (raised.length === 0) {
    return interpolate(input.calm, { n: input.fmt(readable.length) });
  }
  const names = raised.map((g) => input.nameOf(g.gauge));
  const shown = names.slice(0, 2);
  const rest = names.length - shown.length;
  const joined =
    rest > 0
      ? `${shown.join(input.listSep)}${input.listSep}${interpolate(input.moreWord, { n: input.fmt(rest) })}`
      : shown.length === 2
        ? `${shown[0]} ${input.andWord} ${shown[1]}`
        : shown[0]!;
  return interpolate(input.attention, {
    areas: joined,
    isAre: raised.length === 1 ? input.isWord : input.areWord,
    k: input.fmt(raised.length),
    n: input.fmt(readable.length),
  });
}

/* ------------------------------------------------------------------ *
 * R3 → v3 UI-03: the why rows — the section's needs-attention readings.
 *
 * Contribution is defined honestly as |moveScore| (the reading's own
 * 30-day move relative to its history, already on the reading). When NO
 * warning member carries a finite moveScore the ranking falls back to
 * the R3 percentile extremity (warning-zone aware: 1 − percentile for
 * low-tail rules).
 * ------------------------------------------------------------------ */

/** How deep into its watched tail a warning reading sits (0..1). */
function warningExtremity(reading: IndicatorReading): number {
  const def = definitionFor(reading.id);
  const zone = warningZone(def.rule);
  let extremity = reading.percentile10y ?? 0.5;
  if (zone && reading.percentile10y !== undefined) {
    extremity = zone.to >= 1 ? reading.percentile10y : 1 - reading.percentile10y;
  }
  return extremity;
}

interface AttentionTileRow {
  id: IndicatorId;
  /** 0..1 — how deep into the watched tail the value sits. */
  extremity: number;
}

/** The warning members of one section, extremity-sorted (R3 tile order).
 *  Fix spec B-14 (2026-10-14): the tiles are the GAUGE members in warning —
 *  the same scored list the areas count, so the hero count equals the sum of
 *  the area counts by construction (T-09).
 */
export function attentionTiles(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): AttentionTileRow[] {
  const sectionIds = new Set(
    GAUGES.filter((g) => g.section === section).flatMap((g) => [...g.members]),
  );
  const rows: AttentionTileRow[] = [];
  for (const r of readings) {
    if (r.status !== 'warning' || !sectionIds.has(r.id)) continue;
    rows.push({ id: r.id, extremity: warningExtremity(r) });
  }
  return rows.sort((a, b) => b.extremity - a.extremity);
}

/** v3 UI-03: the top needs-attention readings of one section, the three
 * with the largest honest contribution to the verdict (|moveScore|; the
 * extremity fallback keeps the order when no move score exists). */
export function heroWhy(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
  limit = 3,
): IndicatorId[] {
  const tiles = attentionTiles(readings, section);
  const anyMoveScore = readings.some(
    (r) => r.status === 'warning' && r.moveScore !== undefined && Number.isFinite(r.moveScore),
  );
  if (!anyMoveScore) return tiles.slice(0, limit).map((t) => t.id);
  const byId = new Map(readings.map((r) => [r.id as IndicatorId, r]));
  const scored = tiles
    .map((t) => {
      const r = byId.get(t.id);
      const move = r?.moveScore;
      return {
        id: t.id,
        contribution: move !== undefined && Number.isFinite(move) ? Math.abs(move) : -1,
        extremity: t.extremity,
      };
    })
    .sort((a, b) => b.contribution - a.contribution || b.extremity - a.extremity);
  return scored.slice(0, limit).map((t) => t.id);
}

/* ------------------------------------------------------------------ *
 * v3 UI-02: the reading bar counts over the section's gauge members.
 *
 * Attention = voting members in warning; Normal = voting members at ease
 * (delayed rows still vote — they count as normal); Can't tell right now
 * = every member that cannot vote (stale, unavailable, check-pending,
 * no-history — and a context-status member, which by construction never
 * votes). The verdict's transparent count, one bar, no paragraphs.
 * ------------------------------------------------------------------ */

export interface HeroReadingCounts {
  attention: number;
  normal: number;
  cantTell: number;
}

export function heroReadingCounts(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): HeroReadingCounts {
  const sectionIds = new Set(
    GAUGES.filter((g) => g.section === section).flatMap((g) => [...g.members]),
  );
  const counts: HeroReadingCounts = { attention: 0, normal: 0, cantTell: 0 };
  for (const r of readings) {
    if (!sectionIds.has(r.id)) continue;
    if (r.status === 'warning') counts.attention += 1;
    else if (r.status === 'normal') counts.normal += 1;
    else counts.cantTell += 1; // stale | unavailable | check-pending | no-history | context
  }
  return counts;
}

/* ------------------------------------------------------------------ *
 * v3 UI-04: the calm line — gauge ids with zero warnings, GAUGES order.
 * ------------------------------------------------------------------ */

export function calmGauges(
  gauges: readonly GaugeReading[],
  limit = 3,
): string[] {
  return gauges
    .filter((g) => g.step === 1)
    .slice(0, limit)
    .map((g) => g.gauge);
}

/* ------------------------------------------------------------------ *
 * v3 UI-05: the hero's "what is next" — the next calendar event for the
 * region. Australia reads its own decisions and ABS prints; Global reads
 * everything else; both fall back to the plain next event when their own
 * kinds carry nothing ahead. (Choice documented here: the two cards answer
 * different readers, and the fallback keeps the line honest on thin
 * calendars.)
 * ------------------------------------------------------------------ */

const AU_EVENT_KINDS: ReadonlySet<string> = new Set(['rba', 'abs-cpi', 'abs-jobs']);

function eventDaysUntil(dateIso: string, todayIso: string): number {
  const a = Date.parse(`${todayIso}T00:00:00Z`);
  const b = Date.parse(`${dateIso}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.NaN;
  return Math.round((b - a) / 86_400_000);
}

export function heroNextEvent(
  events: readonly CalendarEvent[],
  section: InsightsSection,
  todayIso: string,
): CalendarEvent | null {
  const upcoming = events
    .filter((e) => {
      const days = eventDaysUntil(e.date, todayIso);
      return Number.isFinite(days) && days >= 0;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (upcoming.length === 0) return null;
  const own = upcoming.find((e) =>
    section === 'australia' ? AU_EVENT_KINDS.has(e.kind) : !AU_EVENT_KINDS.has(e.kind),
  );
  return own ?? upcoming[0]!;
}

/** v3 UI-06/UI-08 inputs: the stale/unavailable members of the section's
 * gauges. UI-06 counts stale scored members; UI-08 fires when a stale or
 * unavailable reading sits inside a gauge whose members voted (that gauge's
 * share was computed without it — the counts deserve the caveat). The
 * choice is made client-side because the engine has already excluded these
 * readings everywhere; the hero only states it. */
export function heroStaleInputs(
  readings: readonly IndicatorReading[],
  section: InsightsSection,
): { staleCount: number; affectsVotingGauge: boolean } {
  const gauges = GAUGES.filter((g) => g.section === section);
  const byId = new Map(readings.map((r) => [r.id as IndicatorId, r]));
  let staleCount = 0;
  let affectsVotingGauge = false;
  for (const gauge of gauges) {
    let voting = 0;
    for (const id of gauge.members) {
      const r = byId.get(id);
      if (!r) continue;
      if (r.status === 'warning' || r.status === 'normal') voting += 1;
      if (r.status === 'stale') staleCount += 1;
    }
    for (const id of gauge.members) {
      const r = byId.get(id);
      if (!r) continue;
      if ((r.status === 'stale' || r.status === 'unavailable') && voting > 0) {
        affectsVotingGauge = true;
      }
    }
  }
  return { staleCount, affectsVotingGauge };
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
