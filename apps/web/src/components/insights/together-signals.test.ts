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
import type { ConnectionReading, LegEval, SignalConditionKey } from '@currena/insights';
import { CONNECTIONS, evaluateConnections } from '@currena/insights';
import { legPhrase, SIGNALS_ENABLED, connectionSummaryInfo } from './config';
// v3 merge (2026-10-19): the balance law lives in BalanceScale — the owner's
// iterated v7 ratio law (net/total × 8°, 2° floor, level when sparse per
// UI-40) superseding the retired 12° helper, which is deleted with its
// component (Balance.tsx) now that the v7 machinery renders per metal.
import {
  BALANCE_MAX_ANGLE_DEG,
  BALANCE_MIN_ANGLE_DEG,
  balanceCounts,
  balanceTilt,
  BALANCE_LH_PX,
  signedTiltDeg,
  type BalanceDriver,
} from './signals/BalanceScale';
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
    // 2026-10-17e (owner spec): the grouped driver list became the balance
    // visual — the side labels are the balance's pan labels now; the count
    // line and the aria label must carry the same {n}/{summary}/{verdict}
    // tokens in both locales.
    expect(sorted(tokens(fa.balance.countFor))).toEqual(sorted(tokens(en.balance.countFor)));
    expect(sorted(tokens(fa.balance.countAgainst))).toEqual(sorted(tokens(en.balance.countAgainst)));
    expect(sorted(tokens(fa.balance.countNeutral))).toEqual(sorted(tokens(en.balance.countNeutral)));
    expect(sorted(tokens(fa.balance.countUnread))).toEqual(sorted(tokens(en.balance.countUnread)));
    expect(sorted(tokens(fa.balance.aria))).toEqual(sorted(tokens(en.balance.aria)));
    expect(sorted(Object.keys(fa.balance))).toEqual(sorted(Object.keys(en.balance)));
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
 * v3 UI_SPEC §9 — the balance law (grouping, equal weights, honesty
 * UI-40) on the merged v7 machinery (2026-10-19 v3 merge).
 * ------------------------------------------------------------------ */

describe('the merged balance law (UI-39/UI-40 on the v7 machinery)', () => {
  const d = (key: SignalConditionKey, state: 'for' | 'against' | 'neutral' | 'unread'): BalanceDriver => ({
    key,
    label: key,
    detail: key,
    valueText: null,
    state,
  });
  const driversOf = (
    entries: Array<[SignalConditionKey, 'for' | 'against' | 'neutral' | 'unread']>,
  ): BalanceDriver[] => entries.map(([key, state]) => d(key, state));
  const ALL = ['real-yield', 'expectations', 'stress', 'dollar', 'footing'] as const;

  it('groups the sides; an unreadable condition never joins one (never silently counted)', () => {
    const counts = balanceCounts(
      driversOf([
        ['real-yield', 'for'],
        ['expectations', 'neutral'],
        ['stress', 'against'],
        ['dollar', 'unread'],
        ['footing', 'for'],
      ]),
    );
    expect(counts.for).toBe(2);
    expect(counts.against).toBe(1);
    expect(counts.neutral).toBe(1);
    expect(counts.unread).toBe(1);
    expect(counts.readable).toBe(4); // for + against + neutral — never the unread
    expect(counts.total).toBe(5);
  });

  it('the tilt law (2026-10-21c owner round): |net|/(for+against) × 10° with the 3° floor — the directional-load share', () => {
    // 4 supporting vs 1 against of 5 → net 3 over 5 directional → 0.6 × 10 = 6°
    const mostly = balanceCounts(
      driversOf(ALL.map((k, i) => [k, i === 4 ? ('against' as const) : ('for' as const)] as [SignalConditionKey, 'for' | 'against'])),
    );
    expect(balanceTilt(mostly, BALANCE_LH_PX).angleDeg).toBeCloseTo(6, 10);
    // all supporting → the 10-degree maximum, for side heavy (negative sign)
    const allFor = balanceCounts(driversOf(ALL.map((k) => [k, 'for'] as [SignalConditionKey, 'for'])));
    expect(balanceTilt(allFor, BALANCE_LH_PX).angleDeg).toBe(BALANCE_MAX_ANGLE_DEG);
    expect(signedTiltDeg(balanceTilt(allFor, BALANCE_LH_PX))).toBe(-BALANCE_MAX_ANGLE_DEG);
    // all pressuring → the mirrored maximum
    const allAgainst = balanceCounts(driversOf(ALL.map((k) => [k, 'against'] as [SignalConditionKey, 'against'])));
    expect(signedTiltDeg(balanceTilt(allAgainst, BALANCE_LH_PX))).toBe(BALANCE_MAX_ANGLE_DEG);
    // balanced 2–2 with one neutral → level
    const even = balanceCounts(
      driversOf([
        ['real-yield', 'for'],
        ['expectations', 'against'],
        ['stress', 'for'],
        ['dollar', 'against'],
        ['footing', 'neutral'],
      ]),
    );
    expect(balanceTilt(even, BALANCE_LH_PX)).toEqual({ angleDeg: 0, risePx: 0, endDropPx: 0, heavy: null });
    // the constants: the 2026-10-21c scale (10° max, 3° floor)
    expect(BALANCE_MAX_ANGLE_DEG).toBe(10);
    expect(BALANCE_MIN_ANGLE_DEG).toBe(3);
  });

  it('UI-40: fewer than 3 readable conditions keeps the beam LEVEL — the sparse rule rides the component (data-tilt 0 + the not-enough line; pinned in balance.test.tsx §9 and the U-09a visual)', () => {
    // The pure law still yields a full one-sided tilt for a one-driver
    // lean (the 2026-10-21c directional scale: one item on one pan tips
    // the whole way)…
    const scarce = balanceCounts(
      driversOf([
        ['real-yield', 'for'],
        ['expectations', 'unread'],
        ['stress', 'unread'],
        ['dollar', 'unread'],
      ]),
    );
    expect(scarce.readable).toBe(1);
    expect(signedTiltDeg(balanceTilt(scarce, BALANCE_LH_PX))).toBe(-BALANCE_MAX_ANGLE_DEG);
    // …but the COMPONENT refuses to weigh it (UI-40, BalanceScale's sparse
    // rule): readable < 3 → targetDeg 0 — the rendered pin lives in
    // balance.test.tsx §9 (data-tilt '0' + 'Not enough readable conditions
    // to weigh') and in the U-09a visual test.
  });

  it('UI-45: silver keeps its industrial condition in the tally; gold never sees one (pinned rendered in balance.test.tsx §9)', () => {
    const gold = balanceCounts(driversOf(ALL.map((k) => [k, 'for'] as [SignalConditionKey, 'for'])));
    const silver = balanceCounts(
      driversOf([...ALL.map((k) => [k, 'for'] as [SignalConditionKey, 'for']), ['industrial', 'for'] as [SignalConditionKey, 'for']]),
    );
    expect(gold.total).toBe(5);
    expect(silver.total).toBe(6);
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
    expect(evaluated).toHaveLength(9); // 6 v1 + the S4-M4.5 trio (2026-11-01)
    // every leg present, every state a valid vocabulary word
    for (const c of evaluated) {
      expect(['active', 'partly', 'pending', 'inactive', 'disagree', 'unknown']).toContain(c.state);
      expect(c.legs).toHaveLength(CONNECTIONS.find((d) => d.id === c.connection)!.legs.length);
    }
  });
});
