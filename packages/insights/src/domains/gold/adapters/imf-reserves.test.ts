/**
 * imf-reserves.test.ts — GPE R14: the IMF SDMX parse tests, over the
 * TRIMMED live payloads captured 2026-11-18 (104 reporters × 2023-10+,
 * the s12 fixtures). The spot values are the session's own live
 * verifications (the M1 record §5): USA 261,498,926.24 ozt = 8,133.5 t
 * exact; the RUS IL/IRFCL complement; the mixed period formats.
 */

import { describe, expect, it } from 'vitest';
import ilVolume from '../../../../fixtures/s12/il-volume-2026-11-18.json';
import irfclVolume from '../../../../fixtures/s12/irfcl-volume-2026-11-18.json';
import irfclGoldUsd from '../../../../fixtures/s12/irfcl-gold-usd-2026-11-18.json';
import irfclTotalUsd from '../../../../fixtures/s12/irfcl-total-usd-2026-11-18.json';
import {
  CB_MAX_OZT,
  CB_WINDOW_START,
  cbExcludedReporter,
  cbPeriodKey,
  normalizeCbMonth,
  parseCbLatestValue,
  parseCbVolume,
  ImfReservesError,
} from './imf-reserves';

describe('normalizeCbMonth / cbPeriodKey (the venue\'s mixed print shapes)', () => {
  it('normalizes both month shapes and fails closed on anything else', () => {
    expect(normalizeCbMonth('2026-M09')).toBe('2026-09');
    expect(normalizeCbMonth('2021-01')).toBe('2021-01');
    expect(normalizeCbMonth('2026-Q3')).toBeNull();
    expect(normalizeCbMonth('۲۵ آبان')).toBeNull();
  });

  it('the time key: a quarter maps to its end month; annual sorts lowest', () => {
    expect(cbPeriodKey('2026-Q3')).toBe('2026-09');
    expect(cbPeriodKey('2026-M09')).toBe('2026-09');
    expect(cbPeriodKey('2026-01')).toBe('2026-01');
    expect(cbPeriodKey('2020')).toBe('2020-00');
    expect(cbPeriodKey('2026-Q3') > cbPeriodKey('2026-M08')).toBe(true);
    expect(cbPeriodKey('2026-M10') > cbPeriodKey('2026-Q3')).toBe(true);
  });
});

describe('the exclusion rules (S4-D4 + the s12 additions)', () => {
  it('excludes every G-aggregate and the BIS banking book', () => {
    expect(cbExcludedReporter('G001')).toBe(true);
    expect(cbExcludedReporter('G163')).toBe(true);
    expect(cbExcludedReporter('G903')).toBe(true);
    expect(cbExcludedReporter('BIS')).toBe(true);
    expect(cbExcludedReporter('USA')).toBe(false);
    expect(cbExcludedReporter('POL')).toBe(false);
  });
});

describe('parseCbVolume (the IL volume fixture, live-captured 2026-11-18)', () => {
  it('parses the reporters with USA exact: 261,498,926.24 ozt = 8,133.5 t', () => {
    const legs = parseCbVolume(ilVolume);
    expect(legs.size).toBe(104);
    const usa = legs.get('USA')!;
    expect(usa.get('2026-09')).toBeCloseTo(261_498_926.24, 2);
    // tonnes = ozt × 31.1034768 / 1e6 — the S4 record reproduces exactly.
    expect((usa.get('2026-09')! * 31.1034768) / 1e6).toBeCloseTo(8133.5, 1);
  });

  it('drops observations outside the window and over the value band', () => {
    const legs = parseCbVolume(ilVolume);
    for (const months of legs.values()) {
      for (const [m, v] of months) {
        expect(m >= CB_WINDOW_START).toBe(true);
        expect(v).toBeLessThanOrEqual(CB_MAX_OZT);
      }
    }
  });

  it('the RUS complement: IL ends 2025-11, IRFCL carries 2026-09', () => {
    const il = parseCbVolume(ilVolume);
    const irfcl = parseCbVolume(irfclVolume);
    const rusIl = [...il.get('RUS')!.keys()].sort();
    expect(rusIl.at(-1)).toBe('2025-11');
    const rusIrfcl = [...irfcl.get('RUS')!.keys()].sort();
    expect(rusIrfcl.at(-1)).toBe('2026-09');
    expect(irfcl.get('RUS')!.get('2026-09')).toBeCloseTo(72_800_000, -4);
  });

  it('fails closed: a shape change throws (missing structures)', () => {
    expect(() => parseCbVolume({ data: {} })).toThrowError(ImfReservesError);
    expect(() => parseCbVolume({})).toThrowError(ImfReservesError);
  });

  it('fails closed: a truncated dataset (<50 reporters) throws — never a quiet wrong total', () => {
    const tiny = { data: { structures: [{ dimensions: { series: [], observation: [] } }] } };
    expect(() => parseCbVolume(tiny)).toThrowError(ImfReservesError);
  });
});

describe('parseCbLatestValue (the IRFCL value fixtures)', () => {
  it('carries each reporter\'s latest monthly print with its period', () => {
    const gold = parseCbLatestValue(irfclGoldUsd);
    const total = parseCbLatestValue(irfclTotalUsd);
    expect(gold.size).toBeGreaterThan(50);
    const chn = gold.get('CHN')!;
    expect(chn.usd).toBe(323_517_000_000);
    expect(chn.quarter).toBe('2026-09');
    const pol = gold.get('POL')!;
    expect(pol.usd).toBe(90_676_462_000);
    expect(pol.quarter).toBe('2026-09');
    const polTotal = total.get('POL')!;
    expect(polTotal.usd).toBeGreaterThan(250e9);
    expect(polTotal.usd).toBeLessThan(350e9);
  });
});
