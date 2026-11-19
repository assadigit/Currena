/**
 * polymarket.test.ts — GPE R28 / F24: the Polymarket gamma-API adapter's
 * tests over the LIVE-CAPTURED payloads (2026-11-19, the s15 fixtures —
 * the discovery listing with 11 unclosed FOMC-tagged events + the
 * December Fed-decision event read by slug): the discovery filter, the
 * rolling pick, the five-market move mapping, the venue-verbatim
 * fields, and the fail-closed shapes (never a guessed column, never a
 * half-parsed market).
 *
 * Tests never hit live sites (AGENTS.md rule 7) — the fetch half takes
 * an injected fetchImpl that replays the fixture bytes.
 */

import { describe, expect, it } from 'vitest';
import { FormatChangedError } from '../../../shared/adapters/fetch-policy';
import discoveryFixture from '../../../../fixtures/s15/polymarket-fomc-events-2026-11-19.json';
import eventFixture from '../../../../fixtures/s15/polymarket-fed-december-event-2026-11-19.json';
import {
  parseFedDecisionEvents,
  pickFedEvent,
  polymarketEventUrl,
  polymarketFomcEventsUrl,
  fetchPolymarketFedExpectations,
} from './polymarket';

const NOW = new Date('2026-11-19T06:00:00Z');

describe('parseFedDecisionEvents (the live discovery fixture, 11 events)', () => {
  it('keeps exactly the four fed-decision events, each with mapped markets', () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    expect(events.map((e) => e.slug)).toEqual([
      'fed-decision-in-december-20260729232808632',
      'fed-decision-in-january-20260729233815502',
      'fed-decision-in-march-2027',
      'fed-decision-in-april-2027',
    ]);
    for (const e of events) expect(e.markets.length).toBe(5);
  });

  it('the non-fed-decision FOMC events are filtered out (the tag serves 11 — the prefix keeps 4)', () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    const rejected = (discoveryFixture as unknown[]).length - events.length;
    expect(rejected).toBe(7); // the multi-meeting series, the chair markets, the hike-25 narrative event
  });

  it('the December event\'s five moves map with the venue-verbatim questions and implied prices', () => {
    const events = parseFedDecisionEvents(discoveryFixture);
    const dec = events.find((e) => e.slug.startsWith('fed-decision-in-december'))!;
    const byMove = new Map(dec.markets.map((m) => [m.move, m]));
    expect([...byMove.keys()].sort()).toEqual(['cut25', 'cut50plus', 'hike25', 'hike50plus', 'hold']);
    // The session's own live reads (the M1 §2b record — 2026-11-19 ~05:3x UTC).
    expect(byMove.get('hike25')!.yesPrice).toBeCloseTo(0.915, 4);
    expect(byMove.get('hike50plus')!.yesPrice).toBeCloseTo(0.0625, 5);
    expect(byMove.get('hold')!.yesPrice).toBeCloseTo(0.0225, 4);
    expect(byMove.get('cut25')!.yesPrice).toBeCloseTo(0.0035, 4);
    expect(byMove.get('cut50plus')!.yesPrice).toBeCloseTo(0.0015, 4);
    // The venue's own question text rides the wire verbatim.
    expect(byMove.get('hike25')!.question).toBe('Will the Fed increase interest rates by 25 bps after the December 2026 meeting?');
    expect(byMove.get('hold')!.question).toBe('Will there be no change in Fed interest rates after the December 2026 meeting?');
  });

  it('the per-event URL is the venue\'s own event-page grammar', () => {
    expect(polymarketEventUrl('fed-decision-in-december-20260729232808632')).toBe(
      'https://polymarket.com/event/fed-decision-in-december-20260729232808632',
    );
  });
});

describe('pickFedEvent (THE ROLLING RULE — the event-close → next market roll)', () => {
  const events = parseFedDecisionEvents(discoveryFixture);

  it('picks the December event while its endDate is ahead of now', () => {
    const picked = pickFedEvent(events, NOW);
    expect(picked!.slug).toBe('fed-decision-in-december-20260729232808632');
  });

  it('rolls to January once the December event has passed (the venue flips closed; the listing re-queried)', () => {
    // The venue's closed=false filter already drops closed events — this
    // simulates the listing AFTER the flip (December absent).
    const afterDecember = events.filter((e) => !e.slug.startsWith('fed-decision-in-december'));
    const picked = pickFedEvent(afterDecember, new Date('2026-12-11T00:00:00Z'));
    expect(picked!.slug).toBe('fed-decision-in-january-20260729233815502');
  });

  it('a stale all-past listing picks the soonest end date, never a guess', () => {
    const picked = pickFedEvent(events, new Date('2027-05-01T00:00:00Z'));
    expect(picked!.slug).toBe('fed-decision-in-december-20260729232808632');
    expect(picked).not.toBeNull();
  });

  it('an empty listing is null (the caller records the honest failure)', () => {
    expect(pickFedEvent([], NOW)).toBeNull();
  });
});

describe('fail-closed shapes (never a guessed market)', () => {
  it('a payload that is not an array throws FormatChangedError', () => {
    expect(() => parseFedDecisionEvents({ not: 'an array' })).toThrow(FormatChangedError);
  });

  it('an event whose markets carry an exotic question maps only the canonical five — the exotic row is skipped', () => {
    const payload = [
      {
        slug: 'fed-decision-in-test',
        title: 'Fed Decision in Test?',
        endDate: '2026-12-10T04:59:00Z',
        active: true,
        closed: false,
        markets: [
          {
            question: 'Will the Fed decrease interest rates by 25 bps after the Test meeting?',
            slug: 'm1',
            outcomes: ['Yes', 'No'],
            outcomePrices: ['0.03', '0.97'],
            closed: false,
            active: true,
          },
          {
            question: 'Will gold hit $5000 by the Test meeting?',
            slug: 'm2',
            outcomes: ['Yes', 'No'],
            outcomePrices: ['0.5', '0.5'],
            closed: false,
            active: true,
          },
        ],
      },
    ];
    const events = parseFedDecisionEvents(payload);
    expect(events.length).toBe(1);
    expect(events[0]!.markets.length).toBe(1); // the exotic row skipped, the canonical one kept
    expect(events[0]!.markets[0]!.move).toBe('cut25');
  });

  it('a market with a non-Yes/No outcome contract is skipped, never half-parsed', () => {
    const payload = [
      {
        slug: 'fed-decision-in-test',
        title: 'Fed Decision in Test?',
        endDate: '2026-12-10T04:59:00Z',
        active: true,
        closed: false,
        markets: [
          { question: 'Will there be no change?', slug: 'm1', outcomes: ['UP', 'DOWN'], outcomePrices: ['0.9'], closed: false, active: true },
          { question: 'other shape — no outcomes at all', slug: 'm2', closed: false, active: true },
        ],
      },
    ];
    expect(parseFedDecisionEvents(payload)).toEqual([]); // zero mapped markets → the event drops
  });

  it('a yesPrice outside [0,1] is skipped (the venue contract is 0..1)', () => {
    const payload = [
      {
        slug: 'fed-decision-in-test',
        title: 'Fed Decision in Test?',
        endDate: '2026-12-10T04:59:00Z',
        active: true,
        closed: false,
        markets: [
          { question: 'Will there be no change?', slug: 'm1', outcomes: ['Yes', 'No'], outcomePrices: ['1.5'], closed: false, active: true },
        ],
      },
    ];
    expect(parseFedDecisionEvents(payload)).toEqual([]);
  });

  it('a listing with no mapped event at all throws through the fetch half (never empty data)', async () => {
    const fetchImpl = (async () =>
      new Response(JSON.stringify([{ slug: 'some-other-market', title: 'x', endDate: '2026-12-10T04:59:00Z', active: true, closed: false, markets: [] }]), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })) as typeof fetch;
    await expect(fetchPolymarketFedExpectations({ fetchImpl, now: NOW })).rejects.toThrow(FormatChangedError);
  });
});

describe('the fetch half (the fixture replay — never live sites)', () => {
  it('one discovery request serves the rolling pick (the s15 URL grammar)', async () => {
    const seen: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      seen.push(url);
      expect(url).toBe(polymarketFomcEventsUrl());
      return new Response(JSON.stringify(discoveryFixture), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }) as typeof fetch;
    const picked = await fetchPolymarketFedExpectations({ fetchImpl, now: NOW });
    expect(seen.length).toBe(1); // ONE request — the discovery query alone
    expect(picked.slug).toBe('fed-decision-in-december-20260729232808632');
    expect(picked.title).toBe('Fed Decision in December?');
    expect(picked.url).toBe('https://polymarket.com/event/fed-decision-in-december-20260729232808632');
  });

  it('a 429 from the venue surfaces as the honest failure (the rung records it)', async () => {
    const fetchImpl = (async () => new Response('', { status: 429 })) as typeof fetch;
    await expect(fetchPolymarketFedExpectations({ fetchImpl, now: NOW })).rejects.toThrow();
  });
});

describe('the event fixture read (the venue\'s own per-event contract)', () => {
  it('the December event read parses identically through the discovery path', () => {
    // The event fixture is [event] — the same row the discovery listing carries.
    const events = parseFedDecisionEvents(eventFixture);
    expect(events.length).toBe(1);
    expect(events[0]!.markets.length).toBe(5);
    expect(events[0]!.markets.every((m) => m.yesPrice >= 0 && m.yesPrice <= 1)).toBe(true);
  });
});
