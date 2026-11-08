/**
 * gold-tiles tests (S5, 2026-11-08) — the Gold page's pure derivations,
 * driven directly (the house pattern: pure functions, plain fixtures, no
 * React rendering). What is pinned here:
 *
 *  - the D-26 lane structure: exactly five lanes with 7 · 7 · 11 · 10 · 2
 *    seats (37 total), the membership riding the ENGINE's own voter
 *    table through goldBalance — never a hand-copied list;
 *  - every seat's impact + evidence is the engine's own member line,
 *    byte-for-byte (the seat view adds ONLY the home-page link);
 *  - the seat home links: derived from the placement table (wrap-up
 *    note 4) — dollar voters → currencies, USA voters → usa, the euro
 *    pair → europe, gpr-daily → world-markets, and the three voters
 *    whose home card lives on THIS page (gold-silver · the CFTC pair)
 *    → gold;
 *  - the hero's verdict word + beam tilt are the BalanceScale's OWN
 *    pure helpers over the SAME counts (imported, never restated — the
 *    equivalence pin), including the UI-40 sparse discipline;
 *  - the context-card list is the placement's own 14 homes in order, and
 *    the display decimals mirror config/display.ts's DISPLAY registry;
 *  - the unread discipline: missing voters never invent a lean, and the
 *    D-18 input-presence rule (a readable seat with neither evaluator
 *    input reads unread, never steady).
 */

import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { goldBalance } from '@currena/insights';
import { GOLD_VOTER_IDS, homePageOfIndicator, pageHomeIds } from '@currena/insights/page-division';
import { DISPLAY } from '../../components/insights/config';
import { balanceTilt, balanceVerdictOf, type BalanceCounts } from '../../components/insights/signals/BalanceScale';
import {
  GOLD_BLOCKED_NOTES,
  GOLD_CONTEXT_IDS,
  GOLD_DISPLAY,
  goldContextCards,
  goldHero,
  goldHeroCounts,
  goldHeroTilt,
  goldHeroVerdict,
  goldSeatLanes,
  goldSeats,
  type GoldContextId,
  type GoldVoterId,
} from './gold-tiles';

/* ------------------------------------------------------------------ *
 * Fixtures — readings shaped like the projection's own
 * ------------------------------------------------------------------ */

function reading(id: string, partial: Partial<IndicatorReading> = {}): IndicatorReading {
  return {
    id: id as IndicatorReading['id'],
    value: 1,
    asOf: '2026-11-07',
    status: 'normal',
    sourceName: 'fixture',
    updatedAt: '2026-11-07T20:11:07.445Z',
    ...partial,
  } as IndicatorReading;
}

/** All 37 voters, readable, in `status` — the engine's own id list. */
function allVoterReadings(status: IndicatorReading['status']): IndicatorReading[] {
  return GOLD_VOTER_IDS.map((id) => reading(id, { status }));
}

/* ------------------------------------------------------------------ *
 * The five lanes and the 37 seats (D-26)
 * ------------------------------------------------------------------ */

describe('goldSeatLanes — the D-26 structure', () => {
  it('renders exactly five lanes with 7 · 7 · 11 · 10 · 2 seats (37 total), in GOLD_LANES order', () => {
    const lanes = goldSeatLanes(goldBalance(allVoterReadings('normal')));
    expect(lanes.map((l) => l.lane)).toEqual(['borrowing-costs', 'dollar', 'stress', 'inflation', 'flows']);
    expect(lanes.map((l) => l.seats.length)).toEqual([7, 7, 11, 10, 2]);
    expect(goldSeats(goldBalance(allVoterReadings('normal')))).toHaveLength(37);
  });

  it('carries the ENGINE member line byte-for-byte — impact + evidence come from goldBalance, never re-derived', () => {
    const readings = allVoterReadings('normal');
    const balance = goldBalance(readings);
    const seats = goldSeatLanes(balance);
    for (const lane of balance.lanes) {
      const viewLane = seats.find((l) => l.lane === lane.lane);
      expect(viewLane).toBeDefined();
      expect(viewLane!.side).toBe(lane.side);
      expect(viewLane!.split).toBe(lane.split);
      expect(viewLane!.readable).toBe(lane.readable);
      expect(viewLane!.firing).toBe(lane.firing);
      expect(viewLane!.supports).toBe(lane.supports);
      expect(viewLane!.pressures).toBe(lane.pressures);
      expect(viewLane!.seats.map((s) => [s.id, s.impact, s.evidence])).toEqual(
        lane.members.map((m) => [m.id, m.impact, m.evidence]),
      );
    }
  });

  it('derives every seat home link from the placement table (wrap-up note 4)', () => {
    const seats = goldSeats(goldBalance(allVoterReadings('normal')));
    for (const seat of seats) {
      expect(seat.homePage).toBe(homePageOfIndicator(seat.id));
    }
    // The known homes (the placement's own): the dollar lane's six FX
    // voters → currencies; the euro pair → europe; gpr-daily →
    // world-markets; the three gold-context voters → gold (the in-page
    // anchor); every USA-homed voter → usa.
    const homeOf = new Map(seats.map((s) => [s.id as string, s.homePage]));
    expect(homeOf.get('dollar-basket')).toBe('currencies');
    expect(homeOf.get('usdjpy')).toBe('currencies');
    expect(homeOf.get('dollar-broad')).toBe('currencies');
    expect(homeOf.get('ecb-dfr')).toBe('europe');
    expect(homeOf.get('euro-hicp')).toBe('europe');
    expect(homeOf.get('gpr-daily')).toBe('world-markets');
    expect(homeOf.get('gold-silver')).toBe('gold');
    expect(homeOf.get('cftc-gold-positioning')).toBe('gold');
    expect(homeOf.get('cftc-gold-gross-long')).toBe('gold');
    expect(homeOf.get('fed-target')).toBe('usa');
    expect(homeOf.get('vix')).toBe('usa');
    expect(homeOf.get('michigan-5y-expectations')).toBe('usa');
  });

  it('the unread discipline: missing voters never invent a lean — every lane reads unread, every seat unread', () => {
    const lanes = goldSeatLanes(goldBalance([]));
    expect(lanes).toHaveLength(5);
    for (const lane of lanes) {
      expect(lane.side).toBe('unread');
      expect(lane.seats.every((s) => s.impact === 'unread' && s.evidence === null)).toBe(true);
    }
  });

  it('the D-18 input-presence rule rides through: a readable seat with NEITHER evaluator input reads unread, never steady', () => {
    // Every voter readable but featureless: no change30d, no percentile10y
    // — the evaluator has nothing to evaluate on any seat.
    const lanes = goldSeatLanes(goldBalance(allVoterReadings('normal')));
    for (const lane of lanes) {
      expect(lane.seats.every((s) => s.impact === 'unread')).toBe(true);
      expect(lane.side).toBe('unread');
    }
  });

  it('a firing lane votes by majority: two falling borrowing-costs voters (polarity −1) lean FOR gold', () => {
    // real-yield-10y and us10y falling 1.0 over 30d — both polarity −1,
    // so falling yields → supports gold (the classic claim).
    const readings = allVoterReadings('normal').map((r) =>
      r.id === 'real-yield-10y' || r.id === 'us10y' ? { ...r, change30d: -1.0 } : r,
    );
    const lanes = goldSeatLanes(goldBalance(readings));
    const borrowing = lanes.find((l) => l.lane === 'borrowing-costs')!;
    expect(borrowing.side).toBe('for');
    expect(borrowing.supports).toBe(2);
    const seat = borrowing.seats.find((s) => s.id === 'real-yield-10y')!;
    expect(seat.impact).toBe('supports');
    expect(seat.evidence).toBe('falling');
  });
});

/* ------------------------------------------------------------------ *
 * The hero — the verdict word + the beam (the BalanceScale's own math)
 * ------------------------------------------------------------------ */

describe('goldHero — the balance verdict + the beam', () => {
  it('the verdict word selection is the BalanceScale\'s own balanceVerdictOf over the SAME counts', () => {
    const counts: BalanceCounts[] = [
      { for: 2, against: 1, neutral: 2, unread: 0, total: 5, net: 1, readable: 5 },
      { for: 1, against: 3, neutral: 1, unread: 0, total: 5, net: -2, readable: 5 },
      { for: 2, against: 2, neutral: 1, unread: 0, total: 5, net: 0, readable: 5 },
      { for: 0, against: 0, neutral: 0, unread: 5, total: 5, net: 0, readable: 0 },
      { for: 1, against: 0, neutral: 1, unread: 3, total: 5, net: 1, readable: 2 },
    ];
    for (const c of counts) {
      const fake = { balance: { counts: { for: c.for, against: c.against, neutral: c.neutral, unread: c.unread }, lanes: new Array(c.total), net: c.net, readable: c.readable } };
      expect(goldHeroCounts(fake)).toEqual(c);
      expect(goldHeroVerdict(fake)).toBe(balanceVerdictOf(c));
    }
  });

  it('the beam tilt is the BalanceScale\'s own balanceTilt over the SAME counts (level at net 0, floored at 3°)', () => {
    const cases: BalanceCounts[] = [
      { for: 2, against: 1, neutral: 2, unread: 0, total: 5, net: 1, readable: 5 },
      { for: 5, against: 0, neutral: 0, unread: 0, total: 5, net: 5, readable: 5 },
      { for: 2, against: 2, neutral: 1, unread: 0, total: 5, net: 0, readable: 5 },
      { for: 0, against: 0, neutral: 0, unread: 5, total: 5, net: 0, readable: 0 },
    ];
    for (const c of cases) {
      const fake = { balance: { counts: { for: c.for, against: c.against, neutral: c.neutral, unread: c.unread }, lanes: new Array(c.total), net: c.net, readable: c.readable } };
      expect(goldHeroTilt(fake)).toEqual(balanceTilt(c, 320));
    }
    // The one-sided load tips the beam the whole way (10°); a 2:1
    // majority lands ~6.7°; net 0 stays exactly level.
    const one = goldHeroTilt({ balance: { counts: { for: 5, against: 0, neutral: 0, unread: 0 }, lanes: new Array(5), net: 5, readable: 5 } });
    expect(one.angleDeg).toBe(10);
    const even = goldHeroTilt({ balance: { counts: { for: 2, against: 2, neutral: 1, unread: 0 }, lanes: new Array(5), net: 0, readable: 5 } });
    expect(even.angleDeg).toBe(0);
    expect(even.heavy).toBeNull();
  });

  it('the hero carries the gold-usd reading + the 10-year position band', () => {
    const readings = [
      reading('gold-usd', { value: 4072.1, percentile10y: 0.906, change30d: -3.42, change7d: 4.44 }),
      ...GOLD_VOTER_IDS.filter((id) => id !== 'gold-silver').map((id) =>
        id === 'real-yield-10y' || id === 'us10y' ? reading(id, { change30d: -1.0 }) : reading(id),
      ),
    ];
    const hero = goldHero(readings);
    expect(hero.price?.value).toBe(4072.1);
    expect(hero.position).toEqual({ band: 'high', percentile: 0.906 });
    expect(hero.outlook).not.toBeNull();
  });
});

/* ------------------------------------------------------------------ *
 * The context cards (D-27) + the blocked notes (§16)
 * ------------------------------------------------------------------ */

describe('goldContextCards — the D-27 list + display configs', () => {
  it('the context ids are the placement\'s own 14 gold homes, in placement order', () => {
    expect(GOLD_CONTEXT_IDS).toEqual(pageHomeIds('gold'));
    expect(GOLD_CONTEXT_IDS).toHaveLength(14);
    expect(GOLD_CONTEXT_IDS[0]).toBe('gold-usd');
  });

  it('the GoldContextId literal list pins to the placement order exactly', () => {
    const literals: readonly GoldContextId[] = [
      'gold-usd', 'gold-silver', 'gold-btc', 'gold-aud', 'gold-oil-ratio', 'gold-platinum',
      'real-gold-price', 'copper-gold', 'gold-equities-ratio', 'cftc-gold-positioning',
      'cftc-gold-gross-long', 'sge-gold-withdrawals', 'swiss-gold-flow', 'shanghai-gold-premium',
    ];
    expect(literals).toEqual(GOLD_CONTEXT_IDS as readonly GoldContextId[]);
  });

  it('the GoldVoterId literal list pins to the engine\'s own 37-voter table, exactly', () => {
    const literals: readonly GoldVoterId[] = [
      'real-yield-10y', 'us10y', 'us30y', 'fed-target', 'fed-expectations', 'ecb-dfr', 'real-yield-5y',
      'dollar-basket', 'usdjpy', 'us-japan-10y-gap', 'usd-reserve-share', 'nyfed-custody', 'dollar-broad', 'dollar-eme',
      'stress-stlfsi', 'nfci', 'vix', 'gold-silver', 'term-premium-10y', 'ebp',
      'michigan-sentiment', 'gpr-daily', 'epu-us', 'sp500-breadth-ratio', 'bank-stress',
      'us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'breakeven-tilt',
      't5yie', 'michigan-1y-expectations', 'm2-us', 'us-deficit-12m', 'michigan-5y-expectations',
      'cftc-gold-positioning', 'cftc-gold-gross-long',
    ];
    expect(literals).toHaveLength(37);
    expect([...literals].sort()).toEqual([...GOLD_VOTER_IDS].sort());
  });

  it('the display decimals mirror config/display.ts\'s DISPLAY registry for every id', () => {
    for (const id of GOLD_CONTEXT_IDS) {
      expect(GOLD_DISPLAY[id as GoldContextId].decimals).toBe(DISPLAY[id as keyof typeof DISPLAY].decimals);
    }
  });

  it('the entries ride the projection\'s own readings, absent ids staying absent', () => {
    const entries = goldContextCards([reading('gold-usd', { value: 4072.1 })]);
    expect(entries).toHaveLength(14);
    expect(entries[0]!.reading?.value).toBe(4072.1);
    expect(entries[1]!.reading).toBeUndefined();
  });

  it('the blocked quartet is the placement module\'s own table (§16)', () => {
    expect(GOLD_BLOCKED_NOTES.map((n) => n.id)).toEqual([
      'wgc-etf-holdings',
      'wgc-cb-demand',
      'official-gold-demand',
      'etf-short-interest',
    ]);
    expect(GOLD_BLOCKED_NOTES.every((n) => n.page === 'gold')).toBe(true);
  });
});
