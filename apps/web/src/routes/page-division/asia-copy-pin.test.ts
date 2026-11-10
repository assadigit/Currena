/**
 * asia-copy-pin tests (S14, 2026-11-09) — the vocabulary pins.
 *
 * The Asia & Pacific page keeps its copy in the app dictionaries
 * (pd.asiaPacific.*, the S3/S5/S7/S9/S12 pattern) so the lean Asia chunk
 * never loads the insights copy corpus. That separation could drift —
 * this test pins the vocabulary byte-for-byte against the corpus the
 * legacy /insights page (and every destination page) renders, in BOTH
 * locales:
 *
 *   - the 14 card names ↔ indicators[id].name (the three S25 CPI ids
 *     joined — BD-S23a)
 *   - the unit words ↔ copy.units (percent · points · index · tonnes)
 *   - the position + band words ↔ copy.ui.position* / signals.band*
 *   - the status words ↔ copy.status
 *
 * A corpus rewording that forgets the Asia page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { ASIA_CARD_IDS } from './asia-tiles';

type Pd = typeof en.pd.asiaPacific;

/** Pin the 14 card names + the unit + position + band + status words. */
function pinCardWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  const names = pd.cardNames as Record<string, string>;
  const indicators = corpus.indicators as unknown as Record<string, { name: string }>;
  for (const id of ASIA_CARD_IDS) {
    expect(names[id], `${locale} cardNames.${id}`).toBe(indicators[id]?.name);
  }
  // TOTAL: exactly the 14 S14+S25 ids, never more.
  expect(Object.keys(names)).toHaveLength(ASIA_CARD_IDS.length);

  expect(pd.unitPercent, `${locale} unitPercent`).toBe(corpus.units.percent);
  expect(pd.unitPoints, `${locale} unitPoints`).toBe(corpus.units.points);
  expect(pd.unitIndex, `${locale} unitIndex`).toBe(corpus.units.index);
  // The tonnes unit (china-steel-output — the ONE Asia id beyond Europe's
  // three-unit lean render).
  expect(pd.unitTonnes, `${locale} unitTonnes`).toBe(corpus.units.tonnes);

  expect(pd.positionLow, `${locale} positionLow`).toBe(corpus.ui.positionLow);
  expect(pd.positionTypical, `${locale} positionTypical`).toBe(corpus.ui.positionTypical);
  expect(pd.positionHigh, `${locale} positionHigh`).toBe(corpus.ui.positionHigh);
  expect(pd.bandTop, `${locale} bandTop`).toBe(corpus.signals.bandTop);
  expect(pd.bandMid, `${locale} bandMid`).toBe(corpus.signals.bandMid);
  expect(pd.bandBottom, `${locale} bandBottom`).toBe(corpus.signals.bandBottom);

  expect(pd.statusWarning, `${locale} statusWarning`).toBe(corpus.status.warning);
  expect(pd.statusStale, `${locale} statusStale`).toBe(corpus.status.stale);
  expect(pd.statusCheckPending, `${locale} statusCheckPending`).toBe(corpus.status['check-pending']);
  expect(pd.statusUnavailable, `${locale} statusUnavailable`).toBe(corpus.status.unavailable);
}

describe('the Asia & Pacific page speaks the insights corpus’s words (en)', () => {
  it('the 14 card names + the unit + position + band + status words ↔ the corpus', () => {
    pinCardWords(en.pd.asiaPacific, insightsCopyEn, 'en');
  });
});

describe('the Asia & Pacific page speaks the insights corpus’s words (fa)', () => {
  it('the 14 card names + the unit + position + band + status words ↔ the corpus', () => {
    pinCardWords(fa.pd.asiaPacific, insightsCopyFa, 'fa');
  });
});
