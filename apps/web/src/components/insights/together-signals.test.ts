/**
 * together-signals.test.ts — the I17 web-side pure helpers + copy parity
 * for the "Together" (T1) and "What the signals say" (S1–S3) sections.
 *
 * The fa copy module satisfies InsightsCopy at compile time (the type IS
 * the EN module's shape) — these tests guard the runtime parity the
 * compiler cannot: matching token sets on every interpolated string,
 * the same connection/condition key coverage, and the buy/sell-wording
 * discipline on the new corpus (acceptance test 6 — inflected forms like
 * "buying"/"buyers" pass by design; the S3 wording mandate is honoured
 * without ever rendering a bare "buy"/"sell").
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { ConnectionReading, LegEval, SignalConditionKey, SignalReading } from '@currena/insights';
import { CONNECTIONS, evaluateConnections } from '@currena/insights';
import { legPhrase, SIGNALS_ENABLED, connectionSummaryInfo } from './config';
import { balanceOf, MAX_TILT_DEGREES, MIN_READABLE_TO_WEIGH } from './signals/balance';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';

const leg = (fields: Partial<LegEval>): LegEval => ({
  id: 'gold-usd',
  role: 'required',
  direction: null,
  move: null,
  moveWindow: null,
  moved: false,
  ...fields,
});

describe('legPhrase (T1 right-now line assembly, B-04 uniform method)', () => {
  const copy = insightsCopyEn;

  it('direction → "gold: rising"', () => {
    expect(legPhrase(leg({ direction: 'rising', moved: true, move: 4.2, moveWindow: 30 }), 'gold', copy)).toBe(
      'gold: rising',
    );
  });

  it('a longer qualifying window is named ("over 90 days")', () => {
    expect(
      legPhrase(leg({ direction: 'rising', moved: true, move: 30, moveWindow: 90 }), 'oil', copy),
    ).toBe(`oil: rising ${copy.together.phrases.overWindow.replace('{days}', '90')}`);
  });

  it('direction only / neither', () => {
    expect(legPhrase(leg({ direction: 'falling' }), 'the dollar', copy)).toBe('the dollar: falling');
    expect(legPhrase(leg({}), 'gold', copy)).toBe('gold: no fresh reading');
  });

  it('fa phrases render the Persian template with the same inputs', () => {
    const fa = insightsCopyFa;
    expect(legPhrase(leg({ direction: 'steady' }), 'طلا', fa)).toBe(`طلا: ${fa.together.direction.steady}`);
    expect(legPhrase(leg({}), 'طلا', fa)).toBe('طلا: دادهٔ تازه ندارد');
  });
});

describe('I17 copy parity (en ↔ fa)', () => {
  const tokens = (s: string): string[] => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
  const sorted = (xs: readonly string[]): string[] => [...xs].sort();

  it('covers the same connection ids, legs and state keys', () => {
    const en = insightsCopyEn.together.connections;
    const fa = insightsCopyFa.together.connections;
    expect(sorted(Object.keys(fa))).toEqual(sorted(Object.keys(en)));
    for (const id of Object.keys(en) as (keyof typeof en)[]) {
      expect(sorted(Object.keys(fa[id]!.legs))).toEqual(sorted(Object.keys(en[id]!.legs)));
      expect(sorted(Object.keys(fa[id]!.rightNow))).toEqual(
        sorted(Object.keys(en[id]!.rightNow) as (keyof typeof fa[typeof id]['rightNow'])[]),
      );
    }
  });

  it('every right-now line carries the same interpolation tokens', () => {
    const en = insightsCopyEn.together.connections;
    const fa = insightsCopyFa.together.connections;
    for (const id of Object.keys(en) as (keyof typeof en)[]) {
      for (const state of ['active', 'partly', 'inactive', 'disagree', 'unknown'] as const) {
        expect(sorted(tokens(fa[id]!.rightNow[state]))).toEqual(sorted(tokens(en[id]!.rightNow[state])));
      }
    }
  });

  it('covers the same signals condition keys with the same token sets', () => {
    const en = insightsCopyEn.signals;
    const fa = insightsCopyFa.signals;
    expect(sorted(Object.keys(fa.conditions))).toEqual(sorted(Object.keys(en.conditions)));
    expect(fa.conditions.industrial!.tag).toBeTypeOf('string');
    expect(sorted(tokens(fa.conditionsMet))).toEqual(sorted(tokens(en.conditionsMet)));
    expect(sorted(tokens(fa.sideSupportive))).toEqual(sorted(tokens(en.sideSupportive)));
    expect(sorted(tokens(fa.sideAgainst))).toEqual(sorted(tokens(en.sideAgainst)));
    // R7b: the collapsed per-metal summary carries the same tokens.
    expect(sorted(tokens(fa.collapsedFooting!))).toEqual(sorted(tokens(en.collapsedFooting!)));
    expect(sorted(tokens(fa.bandTop!))).toEqual(sorted(tokens(en.bandTop!)));
    expect(sorted(tokens(fa.bandBottom!))).toEqual(sorted(tokens(en.bandBottom!)));
  });

  // v3 UI_SPEC §8/§9 (PH6-B): the new relationship + balance strings hold
  // the same token sets in both locales — placeholders may move inside the
  // sentence, never disappear (persian-terminology.md).
  it('the v3 together + balance strings carry the same tokens in both locales', () => {
    const en = insightsCopyEn.together;
    const fa = insightsCopyFa.together;
    const TOGETHER_TOKENED = [
      'matchSummary',
      'chipMatchCount',
      'passThroughPendingDates',
      'windowDays',
      'passThroughLine',
      'summaryActive',
      'summaryPartly',
      'summaryPending',
      'summaryInactive',
      'summaryDisagree',
      'summaryUnknown',
      'seeAllConnections',
    ] as const;
    for (const key of TOGETHER_TOKENED) {
      expect(sorted(tokens(fa[key] as string)), `together.${key}`).toEqual(sorted(tokens(en[key] as string)));
    }
    for (const key of ['active', 'partly', 'pending', 'inactive', 'disagree', 'unknown'] as const) {
      expect(fa.state[key], `together.state.${key} must be a non-empty fa word`).not.toBe('');
    }
    const enS = insightsCopyEn.signals;
    const faS = insightsCopyFa.signals;
    const SIGNALS_TOKENED = ['balanceSummary', 'readableLine', 'unreadableName', 'beamAria'] as const;
    for (const key of SIGNALS_TOKENED) {
      expect(sorted(tokens(faS[key] as string)), `signals.${key}`).toEqual(sorted(tokens(enS[key] as string)));
    }
  });
});

/* ------------------------------------------------------------------ *
 * v3 UI_SPEC §8 (2026-10-20, task PH6-B) — the relationship cards' pure
 * layer: the neutral-summary selector the card face and the collapsed
 * chips share, and the retirement of the Showing-family display words.
 * ------------------------------------------------------------------ */

const conn = (fields: Partial<ConnectionReading>): ConnectionReading =>
  ({
    connection: 'real-yields-gold',
    state: 'inactive',
    legs: [],
    ...fields,
  }) as ConnectionReading;

describe('connectionSummaryInfo (UI-33/35/37: the neutral summary line)', () => {
  it('counts when the trigger moved and every scored leg is readable', () => {
    expect(connectionSummaryInfo(conn({ state: 'active', summary: { triggerPresent: true, matchCount: 2, movedCount: 3 } }))).toEqual({
      kind: 'match',
      matchCount: 2,
      movedCount: 3,
    });
  });

  it('a missing trigger beats any count (UI-35: "Trigger not present", never a match count)', () => {
    expect(connectionSummaryInfo(conn({ state: 'inactive', summary: { triggerPresent: false } }))).toEqual({ kind: 'trigger-absent' });
    // even with stray counts present, triggerPresent=false wins
    expect(
      connectionSummaryInfo(conn({ state: 'inactive', summary: { triggerPresent: false, matchCount: 0, movedCount: 0 } })),
    ).toEqual({ kind: 'trigger-absent' });
  });

  it('pending and unknown states win before the engine summary (UI-37/UI-33)', () => {
    expect(connectionSummaryInfo(conn({ state: 'pending' }))).toEqual({ kind: 'pending' });
    expect(connectionSummaryInfo(conn({ state: 'unknown', summary: { triggerPresent: false } }))).toEqual({ kind: 'not-enough' });
    // trigger present but a scored leg unreadable: no counts over what
    // cannot be read
    expect(connectionSummaryInfo(conn({ state: 'unknown', summary: { triggerPresent: true } }))).toEqual({ kind: 'not-enough' });
  });

  it('cards without an engine summary (the RBA pass-through card) speak their own numbers line', () => {
    expect(connectionSummaryInfo(conn({ state: 'active' }))).toEqual({ kind: 'pass-through' });
    expect(connectionSummaryInfo(conn({ state: 'inactive' }))).toEqual({ kind: 'pass-through' });
  });

  it('the real engine output maps cleanly on the fixture-like snapshot', () => {
    const reading = (id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading =>
      ({ id, value: 1, asOf: '2026-10-07', status: 'normal', sourceName: 't', updatedAt: '2026-10-08T00:00:00Z', ...fields }) as IndicatorReading;
    // The visual fixture's shape: oil jumps (trigger moves), expectations
    // quiet, borrowing costs rise against the chain → 1 of 2 match.
    const evaluated = evaluateConnections([
      reading('brent', { change30d: -8.4, change90d: -6.1 }),
      reading('breakeven-5y5y', { change30d: -0.02 }),
      reading('us10y', { change30d: 0.53 }),
    ]);
    const oil = evaluated.find((c) => c.connection === 'oil-expectations-costs')!;
    expect(oil.state).toBe('disagree');
    expect(connectionSummaryInfo(oil)).toEqual({ kind: 'match', matchCount: 1, movedCount: 2 });
  });
});

describe('the v3 display vocabulary retires the Showing family (UI-33)', () => {
  // The words rendered on the card faces, chips and collapsed summary —
  // the retired v2 words must not survive anywhere the page DISPLAYS (the
  // internal state ids stay; the unused rightNow* copy keys stay archived
  // in the dictionary per UI_SPEC §1.7's nothing-deleted rule).
  const DISPLAY_CORPUS = (c: typeof insightsCopyEn): string[] => [
    c.together.subtitle,
    ...Object.values(c.together.state),
    c.together.summaryActive,
    c.together.summaryPartly,
    c.together.summaryInactive,
    c.together.summaryDisagree,
    c.together.matchSummary,
    c.together.triggerAbsentLine,
    c.together.notEnoughLine,
    c.together.chipMatchCount,
    c.together.usualTendency,
    c.together.weakerLink,
    c.together.weakerLinkWhy,
    c.together.windowsUsed,
    c.together.passThroughPendingDates,
  ];

  it('no Showing / Partly showing / Not showing word in the EN display corpus', () => {
    for (const text of DISPLAY_CORPUS(insightsCopyEn)) {
      expect(/showing/i.test(text), `"${text}" still speaks a retired Showing-family word`).toBe(false);
    }
  });

  it('no دیده می‌شود / دیده نمی‌شود in the fa display corpus', () => {
    for (const text of DISPLAY_CORPUS(insightsCopyFa)) {
      expect(/دیده می‌شود|دیده نمی‌شود|بخشی دیده/.test(text), `"${text}" still speaks a retired fa word`).toBe(false);
    }
  });

  it('the four neutral summary words render distinctly (match / trigger / pending / not-enough)', () => {
    const en = insightsCopyEn.together;
    const words = new Set([
      en.matchSummary.replace('{match}', '1').replace('{moved}', '2'),
      en.triggerAbsentLine,
      en.state.pending,
      en.notEnoughLine,
    ]);
    expect(words.size).toBe(4);
  });
});

/* ------------------------------------------------------------------ *
 * v3 UI_SPEC §9 (2026-10-20, task PH6-B) — the balance tally: grouping,
 * equal weights, the 12-degree tilt, and the honesty rules (UI-40).
 * ------------------------------------------------------------------ */

const cond = (key: SignalConditionKey, state: 'supportive' | 'against' | 'neutral' | 'unknown') => ({
  key,
  state,
  inputs: ['gold-usd' as IndicatorId],
});

const signalOf = (conditions: ReturnType<typeof cond>[]): SignalReading =>
  ({
    metal: 'gold',
    priceId: 'gold-usd',
    conditions,
    metCount: conditions.filter((c) => c.state === 'supportive').length,
    lean: 'mixed',
    position: null,
    speed: null,
  }) as SignalReading;

describe('balanceOf (UI-39: grouping, equal weights, the 12-degree tilt)', () => {
  const ALL = ['real-yield', 'expectations', 'stress', 'dollar', 'footing'] as const;
  const allReadable = (): ((key: SignalConditionKey) => boolean) => () => true;

  it('groups the sides; an unreadable condition never joins one (never silently counted)', () => {
    const signal = signalOf([
      cond('real-yield', 'supportive'),
      cond('expectations', 'neutral'),
      cond('stress', 'against'),
      cond('dollar', 'unknown'),
      cond('footing', 'supportive'),
    ]);
    const tally = balanceOf(signal, (key) => key !== 'dollar');
    expect(tally.supporting.map((i) => i.key)).toEqual(['real-yield', 'footing']);
    expect(tally.pressuring.map((i) => i.key)).toEqual(['stress']);
    expect(tally.neutral.map((i) => i.key)).toEqual(['expectations']);
    // the engine's 'unknown' dollar AND anything the readable rule rejects
    // both land unreadable — never on the beam
    expect(tally.unreadable.map((i) => i.key)).toEqual(['dollar']);
    expect(tally.readableCount).toBe(4);
    expect(tally.totalCount).toBe(5);
  });

  it('a dataless engine-neutral is unreadable too (its dashed token never weighs)', () => {
    const signal = signalOf([
      cond('real-yield', 'supportive'),
      cond('expectations', 'supportive'),
      cond('stress', 'supportive'),
      cond('dollar', 'neutral'), // fresh-looking to the engine, no data to compute
      cond('footing', 'against'),
    ]);
    const tally = balanceOf(signal, (key) => key !== 'dollar');
    expect(tally.unreadable.map((i) => i.key)).toEqual(['dollar']);
    expect(tally.readableCount).toBe(4);
  });

  it('tilt = (supporting − pressuring) / readable × 12°, clamped to ±12', () => {
    // 4 supporting of 5 readable → (4−1)/5 × 12 = 7.2°
    const mostly = balanceOf(
      signalOf(ALL.map((k, i) => cond(k, i === 4 ? 'against' : 'supportive'))),
      allReadable(),
    );
    expect(mostly.level).toBe(false);
    expect(mostly.tilt).toBeCloseTo(7.2, 5);
    // all supporting → the 12-degree maximum
    const allFor = balanceOf(signalOf(ALL.map((k) => cond(k, 'supportive'))), allReadable());
    expect(allFor.tilt).toBe(MAX_TILT_DEGREES);
    // all pressuring → the mirrored minimum
    const allAgainst = balanceOf(signalOf(ALL.map((k) => cond(k, 'against'))), allReadable());
    expect(allAgainst.tilt).toBe(-MAX_TILT_DEGREES);
    // balanced 2-2 with one neutral → 0
    const even = balanceOf(
      signalOf([cond('real-yield', 'supportive'), cond('expectations', 'against'), cond('stress', 'supportive'), cond('dollar', 'against'), cond('footing', 'neutral')]),
      allReadable(),
    );
    expect(even.tilt).toBe(0);
  });

  it('UI-40: fewer than 3 readable conditions keeps the beam level — unreadable never tilts it', () => {
    // 2 readable (1 supporting, 1 pressuring) + 3 unreadable → level
    const scarce = balanceOf(signalOf(ALL.map((k) => cond(k, 'supportive'))), (key) => key === 'real-yield' || key === 'footing');
    expect(scarce.readableCount).toBe(2);
    expect(scarce.level).toBe(true);
    expect(scarce.tilt).toBe(0);
    // 3 readable exactly → the beam may weigh
    expect(MIN_READABLE_TO_WEIGH).toBe(3);
    const three = balanceOf(
      signalOf(ALL.map((k) => cond(k, 'supportive'))),
      (key) => ['real-yield', 'expectations', 'footing'].includes(key),
    );
    expect(three.readableCount).toBe(3);
    expect(three.level).toBe(false);
    expect(three.tilt).toBe(MAX_TILT_DEGREES);
  });

  it('silver keeps its industrial condition in the tally; gold never sees one (UI-45)', () => {
    const gold = signalOf(ALL.map((k) => cond(k, 'supportive')));
    const silver = signalOf([...ALL.map((k) => cond(k, 'supportive')), cond('industrial', 'supportive')]);
    const goldTally = balanceOf(gold, allReadable());
    const silverTally = balanceOf(silver, allReadable());
    expect(goldTally.totalCount).toBe(5);
    expect(silverTally.totalCount).toBe(6);
    expect(silverTally.supporting.map((i) => i.key)).toContain('industrial');
    expect(goldTally.supporting.map((i) => i.key)).not.toContain('industrial');
  });
});

describe('I17 wording discipline (acceptance test 6)', () => {
  const NO_BARE = /\b(buy|sell)\b/i;
  const corpus = (obj: unknown): string[] => {
    if (typeof obj === 'string') return [obj];
    if (Array.isArray(obj)) return obj.flatMap(corpus);
    if (obj !== null && typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).flatMap(corpus);
    }
    return [];
  };

  it('no bare "buy"/"sell" word in the new EN + FA sections (inflected forms pass by design)', () => {
    for (const text of corpus(insightsCopyEn.together)) expect(NO_BARE.test(text)).toBe(false);
    for (const text of corpus(insightsCopyEn.signals)) expect(NO_BARE.test(text)).toBe(false);
    for (const text of corpus(insightsCopyFa.together)) expect(NO_BARE.test(text)).toBe(false);
    for (const text of corpus(insightsCopyFa.signals)) expect(NO_BARE.test(text)).toBe(false);
  });

  it('no bare Persian خرید/فروش as a standalone word in the new sections', () => {
    const bare = /(?:^|[\s\u200c«»()[\]:;،؛])\s*(خرید|فروش)\s*(?=$|[\s\u200c«»()[\]:;،؛.])/;
    for (const text of corpus(insightsCopyFa.together)) expect(bare.test(text)).toBe(false);
    for (const text of corpus(insightsCopyFa.signals)) expect(bare.test(text)).toBe(false);
  });
});

describe('the I17 wiring', () => {
  it('SIGNALS_ENABLED ships true (I17 owner approval; one-flip off-switch)', () => {
    expect(SIGNALS_ENABLED).toBe(true);
  });

  it('every connection renders against a minimal live-like snapshot (smoke through the pure layer)', () => {
    const reading = (id: IndicatorId, fields: Partial<IndicatorReading> = {}): IndicatorReading =>
      ({ id, value: 1, asOf: '2026-10-07', status: 'normal', sourceName: 't', updatedAt: '2026-10-08T00:00:00Z', ...fields }) as IndicatorReading;
    const readings = CONNECTIONS.flatMap((c) =>
      c.legs.map((l) =>
        reading(l.id, { percentile10y: 0.5, change30d: l.id === 'terms-of-trade' ? undefined : 0.01 }),
      ),
    );
    const evaluated = evaluateConnections(readings);
    expect(evaluated).toHaveLength(6);
    // every leg present, every state a valid vocabulary word
    for (const c of evaluated) {
      expect(['active', 'partly', 'pending', 'inactive', 'disagree', 'unknown']).toContain(c.state);
      expect(c.legs).toHaveLength(CONNECTIONS.find((d) => d.id === c.connection)!.legs.length);
    }
  });
});
