import { describe, expect, it } from 'vitest';
import { YahooQuoteError, parseYahooQuoteResponse } from './yahoo';

/** A minimal v8 chart envelope shaped like BZ=F / GC=F answers. */
function chartResponse(overrides?: {
  stamps?: number[];
  closes?: (number | null)[];
  adjcloses?: (number | null)[];
  live?: number;
}): unknown {
  const stamps = overrides?.stamps ?? [
    Date.UTC(2026, 9, 6) / 1000, // 2026-10-06
    Date.UTC(2026, 9, 7) / 1000, // 2026-10-07
    Date.UTC(2026, 9, 9) / 1000, // 2026-10-09
  ];
  const closes = overrides?.closes ?? [125.44, 100.2, 104.72];
  return {
    chart: {
      result: [
        {
          meta: { regularMarketPrice: overrides?.live ?? 107.14 },
          timestamp: stamps,
          indicators: {
            quote: [{ close: closes }],
            ...(overrides?.adjcloses !== undefined ? { adjclose: [{ adjclose: overrides.adjcloses }] } : {}),
          },
        },
      ],
    },
  };
}

describe('parseYahooQuoteResponse', () => {
  it('parses daily closes + the live price', () => {
    const parsed = parseYahooQuoteResponse(chartResponse(), 'BZ=F');
    expect(parsed.livePrice).toBe(107.14);
    expect(parsed.points).toEqual([
      { date: '2026-10-06', value: 125.44 },
      { date: '2026-10-07', value: 100.2 },
      { date: '2026-10-09', value: 104.72 },
    ]);
  });

  it('prefers adjclose over close when present', () => {
    const parsed = parseYahooQuoteResponse(
      chartResponse({ adjcloses: [125.0, 100.0, 105.0] }),
      'BZ=F',
    );
    expect(parsed.points.map((p) => p.value)).toEqual([125, 100, 105]);
  });

  it('drops null/non-finite closes and dedupes by date keeping the last print', () => {
    // Two bars on the same UTC day (a settlement revision) + one null bar.
    const parsed = parseYahooQuoteResponse(
      chartResponse({
        stamps: [
          Date.UTC(2026, 9, 6) / 1000,
          Date.UTC(2026, 9, 6, 12) / 1000,
          Date.UTC(2026, 9, 7) / 1000,
        ],
        closes: [125.44, 125.5, null],
      }),
      'BZ=F',
    );
    expect(parsed.points).toEqual([{ date: '2026-10-06', value: 125.5 }]);
    expect(parsed.livePrice).toBe(107.14);
  });

  it('falls back to the last bar close when regularMarketPrice is absent', () => {
    const json = {
      chart: {
        result: [
          {
            meta: {},
            timestamp: [Date.UTC(2026, 9, 6) / 1000, Date.UTC(2026, 9, 9) / 1000],
            indicators: { quote: [{ close: [125.44, 104.72] }] },
          },
        ],
      },
    };
    const parsed = parseYahooQuoteResponse(json, 'BZ=F');
    expect(parsed.livePrice).toBe(104.72);
  });

  it('throws loudly when chart.result is missing (404-style error envelope)', () => {
    expect(() =>
      parseYahooQuoteResponse({ chart: { result: null, error: { description: 'Not Found' } } }, 'XAUUSD=X'),
    ).toThrow(YahooQuoteError);
    try {
      parseYahooQuoteResponse({ chart: { result: null, error: { description: 'Not Found' } } }, 'XAUUSD=X');
    } catch (err) {
      expect((err as Error).message).toContain('XAUUSD=X');
      expect((err as Error).message).toContain('Not Found');
    }
  });

  it('throws on an empty timestamp array', () => {
    expect(() => parseYahooQuoteResponse(chartResponse({ stamps: [] }), 'BZ=F')).toThrow(
      'missing/empty timestamp array',
    );
  });

  it('throws when neither adjclose nor close is present', () => {
    const json = {
      chart: { result: [{ meta: { regularMarketPrice: 1 }, timestamp: [1, 2], indicators: { quote: [{}] } }] },
    };
    expect(() => parseYahooQuoteResponse(json, 'BZ=F')).toThrow('neither adjclose nor close');
  });

  it('throws when no date carries a positive close', () => {
    expect(() =>
      parseYahooQuoteResponse(chartResponse({ closes: [null, null, null] }), 'BZ=F'),
    ).toThrow('no date carried a positive close');
  });

  it('throws on a non-positive regularMarketPrice', () => {
    expect(() => parseYahooQuoteResponse(chartResponse({ live: 0 }), 'BZ=F')).toThrow(
      'missing/invalid regularMarketPrice',
    );
  });
});
