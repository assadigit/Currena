/**
 * bands-s16.test.ts — gap-closure S1-M1.6 #4 (2026-10-31 audit): a
 * percentile-zone flag is a LEVEL claim; the generated attention line now
 * carries the 30-day speed beside it, so a high level that is fast
 * unwinding never reads as fresh stress (the gold/silver case: top-decile
 * wording beside a −7.8% month).
 */
import { describe, expect, it } from 'vitest';
import type { IndicatorReading } from '@currena/core';
import { attentionLineOf } from './bands';
import { insightsCopyEn } from '../../../i18n/insights-copy-en';

const reading = (fields: Partial<IndicatorReading>): IndicatorReading =>
  ({
    id: 'gold-silver',
    value: 88.1,
    asOf: '2026-10-30',
    status: 'warning',
    sourceName: 'gold-api.com',
    updatedAt: '2026-10-31T04:20:00.000Z',
    percentile10y: 0.91,
    change30d: -7.8,
    ...fields,
  }) as IndicatorReading;

describe('S1-M1.6 #4 — the attention line carries the 30-day speed', () => {
  it('a percentile-zone warning with a measurable 30-day move appends the speed', () => {
    const line = attentionLineOf(reading({}), insightsCopyEn, 'en-US')!;
    expect(line).toContain('in the highest 20% of its 10-year range');
    expect(line).toContain('(-7.8% over the last 30 days)');
  });

  it('a rise carries its own sign; a sub-1% move adds nothing (no noise)', () => {
    const rising = attentionLineOf(reading({ change30d: 4.2 }), insightsCopyEn, 'en-US')!;
    expect(rising).toContain('(4.2% over the last 30 days)');
    const quiet = attentionLineOf(reading({ change30d: 0.4 }), insightsCopyEn, 'en-US')!;
    expect(quiet).not.toContain('30 days');
    const missing = attentionLineOf(
      reading({ change30d: undefined }),
      insightsCopyEn,
      'en-US',
    )!;
    expect(missing).not.toContain('30 days');
  });

  it('non-percentile rules keep their plain line (the speed is a level-claim companion)', () => {
    // threshold rule (us10y family): no percentile zone, no speed phrase.
    const line = attentionLineOf(
      reading({ id: 'us-cpi-yoy', change30d: -5 }),
      insightsCopyEn,
      'en-US',
    )!;
    expect(line).not.toContain('30 days');
  });
});
