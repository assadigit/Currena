/**
 * sp500-breadth.test.ts — gap-closure S6-M6.3 (2026-11-02): the S&P 500
 * market-concentration proxy's suites, against the recorded captures
 * (AGENTS.md rule 7 — never a live site):
 *   s6/yahoo-rsp-10y-2026-11-02.json   the provider's own RSP chart answer
 *     (2,512 daily points 2016-11-03 → 2026-11-02, live fetch 2026-11-02;
 *     the live pin: RSP 219.98)
 *   s6/yahoo-spy-10y-2026-11-02.json   the SPY twin (2,512 points, the
 *     same window; the live pin: SPY 752.10)
 *
 * The derivation pins: the inner-join ratio on common dates, the F4
 * 4-decimal quantization (no float tails), the ascending order, and the
 * fail-closed rule when either leg is missing.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveBreadthRatio, fetchSp500BreadthRatio, BREADTH_RSP_SYMBOL, BREADTH_SPY_SYMBOL, BREADTH_RANGE } from './sp500-breadth';
import { parseYahooQuoteResponse } from './yahoo';
import type { SeriesPoint } from '../series';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = join(here, '..', '..', 'fixtures');
const rspJson = JSON.parse(readFileSync(join(fixtures, 's6', 'yahoo-rsp-10y-2026-11-02.json'), 'utf8')) as unknown;
const spyJson = JSON.parse(readFileSync(join(fixtures, 's6', 'yahoo-spy-10y-2026-11-02.json'), 'utf8')) as unknown;

const rsp = parseYahooQuoteResponse(rspJson, 'RSP');
const spy = parseYahooQuoteResponse(spyJson, 'SPY');

describe('the recorded captures (S6-M6.3: the two legs)', () => {
  it('both legs carry the verified ten-year windows (2,512 points each, the live pins)', () => {
    expect(rsp.points.length).toBe(2512);
    expect(spy.points.length).toBe(2512);
    expect(rsp.points[0]!.date).toBe('2016-11-03');
    expect(rsp.points.at(-1)!.date).toBe('2026-11-02');
    expect(rsp.livePrice).toBeCloseTo(219.98, 4);
    expect(spy.livePrice).toBeCloseTo(752.1, 4);
  });
});

describe('deriveBreadthRatio (the inner-join derivation)', () => {
  it('joins the legs on common dates and divides, 4dp — fixture-pinned end to end', () => {
    const ratio = deriveBreadthRatio(rsp.points, spy.points);
    expect(ratio.length).toBe(2512);
    expect(ratio[0]).toEqual({ date: '2016-11-03', value: 0.3784 });
    expect(ratio.at(-1)).toEqual({ date: '2026-11-02', value: 0.2925 });
    // A mid-history sample (the equal-weight catch-down of 2020–21).
    const byDate = new Map(ratio.map((p) => [p.date, p.value]));
    expect(byDate.get('2021-01-04')).toBe(0.3348);
    // Ascending, no float tails (F4).
    for (let i = 1; i < ratio.length; i++) {
      expect(ratio[i]!.date > ratio[i - 1]!.date).toBe(true);
    }
    for (const p of ratio) {
      expect(Number.isInteger(Math.round(p.value * 10_000))).toBe(true);
    }
  });

  it('keeps ONLY the common dates when one leg is missing a day (the audnzd inner-join discipline)', () => {
    const rspShort: SeriesPoint[] = rsp.points.filter((p) => p.date !== '2026-10-30' && p.date !== '2016-11-03');
    const ratio = deriveBreadthRatio(rspShort, spy.points);
    expect(ratio.some((p) => p.date === '2026-10-30')).toBe(false);
    expect(ratio.some((p) => p.date === '2016-11-03')).toBe(false);
    expect(ratio.length).toBe(2510);
  });

  it('fails closed when either leg is empty', () => {
    expect(() => deriveBreadthRatio([], spy.points)).toThrow(/both legs non-empty/);
    expect(() => deriveBreadthRatio(rsp.points, [])).toThrow(/both legs non-empty/);
  });
});

describe('fetchSp500BreadthRatio (the transport)', () => {
  it('fetches RSP then SPY sequentially at the 10y range and derives the ratio', async () => {
    const calls: string[] = [];
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes(`/${BREADTH_RSP_SYMBOL}?`)) return new Response(JSON.stringify(rspJson), { status: 200 });
      if (url.includes(`/${BREADTH_SPY_SYMBOL}?`)) return new Response(JSON.stringify(spyJson), { status: 200 });
      return new Response('not found', { status: 404 });
    }) as typeof fetch;
    const out = await fetchSp500BreadthRatio({ fetchImpl });
    expect(calls.length).toBe(2); // sequential, one per leg
    expect(calls[0]!).toContain(`/${BREADTH_RSP_SYMBOL}?range=${BREADTH_RANGE}&interval=1d`);
    expect(calls[1]!).toContain(`/${BREADTH_SPY_SYMBOL}?range=${BREADTH_RANGE}&interval=1d`);
    expect(out.rsp.length).toBe(2512);
    expect(out.spy.length).toBe(2512);
    expect(out.ratio.at(-1)).toEqual({ date: '2026-11-02', value: 0.2925 });
  });

  it('fails closed when the SPY leg refuses (a failed fetch surfaces, never a half-derived ratio)', async () => {
    const fetchImpl = (async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes(`/${BREADTH_RSP_SYMBOL}?`)) return new Response(JSON.stringify(rspJson), { status: 200 });
      return new Response(JSON.stringify({ chart: { error: { description: 'Not Found' } } }), { status: 404 });
    }) as typeof fetch;
    await expect(fetchSp500BreadthRatio({ fetchImpl })).rejects.toThrow(/SPY/);
  });
});
