/**
 * GET /api/markets — the 16-world-indices snapshot (illustrative demo data).
 *
 * Returns a MarketsSnapshot: asOf + asOfDisplay + 16 EnrichedIndex rows,
 * one per world index, each carrying the five return lenses (today/week/
 * month/quarter/year), the level, the 52-week high/low, the from-high
 * distance and the market-cap weight.
 *
 * v1 scope (spec §13): live EODHD data is out of scope — the values below
 * are plausible late-cycle demo figures so the treemap, the breadth and the
 * movers all read authentically. The card's footer labels them as such.
 */

import { NextResponse } from 'next/server';
import { INDICES, MARKET_CAP_T, CAP_FALLBACK_T } from '@/lib/markets';
import type { EnrichedIndex, MarketsSnapshot } from '@/components/markets/types';
import { fmtDate } from '@/lib/format';

export const dynamic = 'force-static';

/** The as-of date for the demo snapshot. Stable so SSR and the client agree. */
const AS_OF_ISO = '2026-11-12';

/** One raw demo row: level + 52w band + the five period changes. */
interface RawRow {
  level: number;
  high52w: number;
  low52w: number;
  changes: { today: number; week: number; month: number; quarter: number; year: number };
}

/** The 16 demo rows — plausible late-2026 levels with a realistic spread of
 *  gains and losses across every lens (so the treemap's diverging ramp, the
 *  breadth counts and the mover cards all carry honest variety). */
const RAW: Record<string, RawRow> = {
  sp500: { level: 6049.38, high52w: 6128.18, low52w: 4835.65, changes: { today: 0.42, week: 1.85, month: 3.21, quarter: 5.42, year: 14.18 } },
  ndx: { level: 21658.74, high52w: 22157.52, low52w: 15982.31, changes: { today: 0.68, week: 2.34, month: 4.12, quarter: 6.81, year: 19.42 } },
  dow: { level: 44116.78, high52w: 45014.04, low52w: 37600.47, changes: { today: 0.31, week: 1.42, month: 2.68, quarter: 4.31, year: 11.24 } },
  tsx: { level: 25114.62, high52w: 25600.91, low52w: 20700.18, changes: { today: 0.18, week: 0.94, month: 1.82, quarter: 3.14, year: 8.96 } },
  ibov: { level: 131842.5, high52w: 134000.12, low52w: 115200.44, changes: { today: -0.74, week: -1.82, month: -2.41, quarter: 1.28, year: 6.74 } },
  ssec: { level: 3326.46, high52w: 3674.28, low52w: 2635.74, changes: { today: -0.38, week: -1.14, month: 2.86, quarter: 8.42, year: 12.18 } },
  n225: { level: 39286.14, high52w: 42222.75, low52w: 31156.63, changes: { today: 0.86, week: 2.18, month: 4.94, quarter: 7.62, year: 16.84 } },
  hsi: { level: 19524.32, high52w: 23241.68, low52w: 14790.32, changes: { today: 1.24, week: 3.86, month: 6.42, quarter: 12.18, year: 21.46 } },
  nifty50: { level: 24638.4, high52w: 24801.05, low52w: 21281.43, changes: { today: 0.34, week: 0.62, month: 1.18, quarter: 2.94, year: 9.18 } },
  taiex: { level: 23014.62, high52w: 23928.18, low52w: 17603.74, changes: { today: 0.52, week: 1.46, month: 3.84, quarter: 6.42, year: 28.16 } },
  kospi: { level: 2518.94, high52w: 2722.81, low52w: 2222.32, changes: { today: -0.42, week: -1.24, month: -2.18, quarter: -4.62, year: -8.14 } },
  asx200: { level: 8294.18, high52w: 8515.74, low52w: 7194.42, changes: { today: 0.21, week: 0.84, month: 1.46, quarter: 2.18, year: 7.42 } },
  stoxx50: { level: 4982.64, high52w: 5124.18, low52w: 4402.36, changes: { today: 0.38, week: 1.18, month: 2.42, quarter: 4.86, year: 9.64 } },
  ftse: { level: 8214.72, high52w: 8474.81, low52w: 7445.62, changes: { today: 0.14, week: 0.62, month: 1.24, quarter: 3.18, year: 6.94 } },
  cac: { level: 7418.59, high52w: 8254.18, low52w: 7104.32, changes: { today: -0.58, week: -1.42, month: -2.84, quarter: -5.18, year: -4.62 } },
  dax: { level: 19842.31, high52w: 20618.74, low52w: 16824.46, changes: { today: 0.46, week: 1.32, month: 2.94, quarter: 5.84, year: 12.42 } },
};

export function GET() {
  const markets: EnrichedIndex[] = INDICES.map((meta) => {
    const raw = RAW[meta.symbol];
    const high52w = raw.high52w;
    const fromHigh = (raw.level / high52w - 1) * 100;
    return {
      symbol: meta.symbol,
      name: meta.name,
      shortName: meta.shortName,
      country: meta.country,
      shortCountry: meta.shortCountry,
      region: meta.region,
      level: raw.level,
      high52w,
      low52w: raw.low52w,
      fromHigh,
      changes: raw.changes,
      capT: MARKET_CAP_T[meta.symbol] ?? CAP_FALLBACK_T,
    };
  });

  const snapshot: MarketsSnapshot = {
    asOf: AS_OF_ISO,
    asOfDisplay: fmtDate(AS_OF_ISO),
    markets,
  };

  return NextResponse.json(snapshot, {
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
