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
import type { LegEval } from '@currena/insights';
import { legPhrase, SIGNALS_ENABLED } from './config';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { CONNECTIONS, evaluateConnections } from '@currena/insights';

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
    // Balance Rework (docs/insights/gold-card/): the expanded card's copy
    // corpus — every interpolated string carries the same tokens in both
    // locales and the two objects stay key-identical, so the verdict
    // phrases, captions, context lines, unread reasons, flip lines and
    // effect lines can never drift apart.
    expect(sorted(Object.keys(fa.balanceCard))).toEqual(sorted(Object.keys(en.balanceCard)));
    expect(sorted(Object.keys(fa.balanceCard.verdict))).toEqual(sorted(Object.keys(en.balanceCard.verdict)));
    expect(sorted(Object.keys(fa.balanceCard.confidence))).toEqual(sorted(Object.keys(en.balanceCard.confidence)));
    expect(sorted(Object.keys(fa.balanceCard.stateWords))).toEqual(sorted(Object.keys(en.balanceCard.stateWords)));
    expect(sorted(Object.keys(fa.balanceCard.unreadReason))).toEqual(sorted(Object.keys(en.balanceCard.unreadReason)));
    expect(sorted(Object.keys(fa.balanceCard.flip))).toEqual(sorted(Object.keys(en.balanceCard.flip)));
    expect(sorted(Object.keys(fa.balanceCard.effect))).toEqual(sorted(Object.keys(en.balanceCard.effect)));
    for (const key of Object.keys(en.balanceCard.effect) as (keyof typeof en.balanceCard.effect)[]) {
      expect(sorted(Object.keys(fa.balanceCard.effect[key]!))).toEqual(
        sorted(Object.keys(en.balanceCard.effect[key]!)),
      );
      for (const line of ['forAsset', 'against', 'explain'] as const) {
        expect(sorted(tokens(fa.balanceCard.effect[key]![line]))).toEqual(
          sorted(tokens(en.balanceCard.effect[key]![line])),
        );
      }
    }
    for (const key of Object.keys(en.balanceCard.verdict) as (keyof typeof en.balanceCard.verdict)[]) {
      expect(sorted(tokens(fa.balanceCard.verdict[key]))).toEqual(sorted(tokens(en.balanceCard.verdict[key])));
    }
    for (const key of ['updatedMeta', 'updatedMetaOne', 'subline', 'capSupports', 'capPressures', 'beamAlt', 'grpNeutral', 'grpUnread', 'ctxLabel', 'ctxChange', 'asOf', 'lastKnown'] as const) {
      expect(sorted(tokens(fa.balanceCard[key]))).toEqual(sorted(tokens(en.balanceCard[key])));
    }
    for (const key of Object.keys(en.balanceCard.flip) as (keyof typeof en.balanceCard.flip)[]) {
      expect(sorted(tokens(fa.balanceCard.flip[key]))).toEqual(sorted(tokens(en.balanceCard.flip[key])));
    }
    // R7b: the collapsed per-metal summary carries the same tokens.
    expect(sorted(tokens(fa.collapsedFooting!))).toEqual(sorted(tokens(en.collapsedFooting!)));
    expect(sorted(tokens(fa.bandTop!))).toEqual(sorted(tokens(en.bandTop!)));
    expect(sorted(tokens(fa.bandBottom!))).toEqual(sorted(tokens(en.bandBottom!)));
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
