/**
 * narrative.ts — GPE R11 / F1 (2026-11-18): the daily narrative's pure
 * engine — "Why gold moved", the explanation layer's first card
 * (docs/specs/gold-page-elevation: s7/03 §2 the binding rules, s6/03
 * zone D's landing spot, s8/01 R11).
 *
 * THE HONEST TRANSLATION OF GRAM (s7/03 §2, binding): GRAM is a
 * statistical attribution — a regression decomposing returns into
 * contribution shares. Currena's narrative NEVER fakes that arithmetic:
 * it is a structural translation — a daily story organized by the five
 * driver FAMILIES, each stating its observed firing state (the lane
 * word + counts, byte-identical to the hero — the one-projection rule,
 * §2.4) and the raw deltas of the seats that moved. Deltas are facts
 * about the seats, never shares of the price move. GRAM's "drivers do
 * not fully explain returns" residual maps to the mixed/unreadable lane
 * words — the honest "we don't know" bucket.
 *
 * THE DATA PATH (§2.3): a pure derivation over the page projection —
 * the SAME readings the hero and the seats section render, through the
 * SAME goldBalance engine. No second computation, no stored prose: a
 * stale projection renders its own (older) numbers with its own
 * date-stamp, never yesterday's wording presented as today's (the
 * derivation runs at render, on what is on screen). The template
 * grammar is versioned with tests (narrative.test.ts — the
 * gold-frozen-scenarios pattern): every sentence pattern pinned against
 * frozen scenarios.
 *
 * Platform-free (AGENTS.md rule 2): pure over the readings; zero
 * fetches, zero KV, zero wire fields, zero clock.
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { goldBalance, type GoldBalanceSide, type GoldBalanceReading } from './gold-balance';
import type { GoldLane } from '../../shared/gold-score';

/** The narrative's own grammar version — bump when a sentence pattern
 * changes (the tests pin the patterns; this constant records the
 * grammar's generation for the record). */
export const NARRATIVE_GRAMMAR_VERSION = 1;

/** The price fact — the TE pattern (adopted; the forecast headline is
 * banned, C4): gold's own move with its context windows, the series and
 * as-of named at point of use (C1). The windows are the reading's OWN
 * available change fields (1d · 30d · 90d — each named at render; the
 * s7/03 draft's 1-year leg rides the available 90-day context until
 * F7/R18 widens the chart's windows — recorded, not invented). */
export interface NarrativePriceFact {
  /** The gold-usd value (the live hourly overlay's own reading). */
  value: number | null;
  /** The reading's own asOf (the date-stamp the sentence carries). */
  asOf: string | null;
  /** The reading's own sourceName — the series named at point of use. */
  seriesName: string | null;
  seriesUrl: string | null;
  change1d: number | null;
  change30d: number | null;
  change90d: number | null;
}

/** One moved seat inside a family line — a fact about the seat, never a
 * share of the price move (the no-fake-GRAM rule). The window is the
 * evaluator's own (30 days — the same window the meter's rising/falling
 * evidence reads); the unit follows the series' own changeKind. */
export interface NarrativeMover {
  id: IndicatorId;
  /** Signed 30-day change in the series' own units. */
  delta30d: number;
  /** The series' own change unit — 'points' (yields: pp) or 'pct'. */
  changeKind: 'points' | 'pct';
  /** The evaluator's own evidence word (why the seat fired). */
  evidence: 'rising' | 'falling' | 'high' | 'low';
}

/** One driver family's line: the lane word + counts (byte-identical to
 * the hero and the seats' lane cards — one projection, one truth) plus
 * the raw deltas of the seats that moved. */
export interface NarrativeFamily {
  lane: GoldLane;
  side: GoldBalanceSide;
  split: boolean;
  supports: number;
  pressures: number;
  readable: number;
  firing: number;
  /** The lane's biggest movers — at most 2, the largest |30-day change|
   * among the FIRING seats with a finite change30d (a fact about the
   * seats, compactly; the full membership is one tap away at the lane
   * card, which the line links). */
  movers: readonly NarrativeMover[];
}

/** The assembled daily narrative — the price fact + the five families
 * in GOLD_LANES order + the balance's own counts (the byte-identical
 * consistency pin). */
export interface GoldNarrative {
  price: NarrativePriceFact | null;
  families: readonly NarrativeFamily[];
  counts: GoldBalanceReading['counts'];
  /** The consolidated balance itself — the SAME object the hero reads
   * (the consistency test pins the counts against it). */
  balance: GoldBalanceReading;
}

/** How many movers a family line carries at most (compact — the lane
 * card behind the link carries the full membership). */
export const NARRATIVE_MAX_MOVERS = 2;

/** The changeKind of a series, read from the reading's own display
 * metadata where the page model carries it; the gold voters' known
 * point-series are enumerated (yields + spreads quote in points), every
 * other voter is percent-kind. This is the SAME split the cards' change
 * lines render — restated here so the engine stays pure over readings
 * (the definitions' changeKind map is the engine's own data). */
const POINTS_KIND_IDS: ReadonlySet<string> = new Set([
  'real-yield-10y',
  'us10y',
  'us30y',
  'fed-target',
  'fed-expectations',
  'real-yield-5y',
  'us-japan-10y-gap',
  'ecb-dfr',
  'stress-stlfsi',
  'nfci',
  'vix',
  'term-premium-10y',
  'ebp',
  'bank-stress',
  'breakeven-5y5y',
  'breakeven-tilt',
  't5yie',
  'michigan-1y-expectations',
  'michigan-5y-expectations',
  'm2-us',
]);

/**
 * The daily narrative over the page projection's readings — the same
 * derivation the hero runs (one goldBalance call), plus each family's
 * biggest movers. Pure: no clock, no fetch, no storage.
 */
export function goldNarrative(readings: readonly IndicatorReading[]): GoldNarrative {
  const balance = goldBalance(readings);
  const byId = new Map(readings.map((r) => [r.id as string, r]));

  const priceReading = byId.get('gold-usd');
  const price: NarrativePriceFact | null =
    priceReading !== undefined
      ? {
          value: priceReading.value,
          asOf: priceReading.asOf,
          seriesName: priceReading.sourceName ?? null,
          seriesUrl: priceReading.sourceUrl ?? null,
          change1d: numOrNaN(priceReading.change1d),
          change30d: numOrNaN(priceReading.change30d),
          change90d: numOrNaN(priceReading.change90d),
        }
      : null;

  const families: NarrativeFamily[] = balance.lanes.map((lane) => {
    const movers: NarrativeMover[] = [];
    for (const m of lane.members) {
      if (m.impact !== 'supports' && m.impact !== 'pressures') continue; // only the seats that MOVED
      const reading = byId.get(m.id);
      const delta = reading?.change30d;
      if (reading === undefined || delta === undefined || !Number.isFinite(delta)) continue;
      movers.push({
        id: m.id,
        delta30d: delta,
        changeKind: POINTS_KIND_IDS.has(m.id) ? 'points' : 'pct',
        evidence: m.evidence ?? 'rising',
      });
    }
    movers.sort((a, b) => Math.abs(b.delta30d) - Math.abs(a.delta30d));
    return {
      lane: lane.lane,
      side: lane.side,
      split: lane.split,
      supports: lane.supports,
      pressures: lane.pressures,
      readable: lane.readable,
      firing: lane.firing,
      movers: movers.slice(0, NARRATIVE_MAX_MOVERS),
    };
  });

  return { price, families, counts: balance.counts, balance };
}

/** The finite-number pass-through (NaN/Infinity → null — a missing
 * window renders nothing, never a garbage number). */
function numOrNaN(v: number | undefined): number | null {
  return v !== undefined && Number.isFinite(v) ? v : null;
}
