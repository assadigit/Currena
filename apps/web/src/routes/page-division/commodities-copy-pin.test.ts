/**
 * commodities-copy-pin tests (S17, 2026-11-11) — the vocabulary pins.
 *
 * What is pinned here (the S9 usa-copy-pin / S12 europe-copy-pin / S14
 * asia-copy-pin / S16 australia-copy-pin pattern, scoped to the
 * Commodities page's 24 placed ids):
 *
 *   - the 24 card names ↔ the insights corpus's own indicator names
 *     (indicators[id].name), byte-for-byte, both locales, exact-count;
 *   - the 5 unit words ↔ the corpus's own units block;
 *   - the 3 position words ↔ the corpus's own ui block;
 *   - the 3 band words ↔ the corpus's own signals block;
 *   - the 4 status words ↔ the corpus's own status block.
 *
 * The loading/error lines, the group headings + intros and the gold
 * cross-link words are FRESH (not pinned) — they ride the Persian-copy
 * manifest as unreviewed, pending the owner's review.
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { COMMODITIES_CARD_IDS } from './commodities-tiles';

type Pd = typeof en.pd.commodities;

/**
 * Pin the card-name + unit + position + band + status words against the
 * insights corpus (the S16 australia-copy-pin pinCardWords pattern,
 * scoped to the Commodities families — no boardCopy, no seat names, no
 * gauge questions/answers, no verdict words: the Commodities page has
 * no board, no seat chips and no gauges).
 */
function pinCardWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  // The 24 card names ↔ the corpus's own indicator names.
  for (const id of COMMODITIES_CARD_IDS) {
    expect(pd.cardNames[id as keyof typeof pd.cardNames], `${locale} cardNames.${id}`).toBe(corpus.indicators[id as keyof typeof corpus.indicators].name);
  }
  expect(Object.keys(pd.cardNames)).toHaveLength(COMMODITIES_CARD_IDS.length);

  // The 5 unit words ↔ the corpus's own units block.
  expect(pd.units.usd, `${locale} units.usd`).toBe(corpus.units.usd);
  expect(pd.units.index, `${locale} units.index`).toBe(corpus.units.index);
  expect(pd.units.barrels, `${locale} units.barrels`).toBe(corpus.units.barrels);
  expect(pd.units['barrels-per-day'], `${locale} units.barrels-per-day`).toBe(corpus.units['barrels-per-day']);
  expect(pd.units.transits, `${locale} units.transits`).toBe(corpus.units.transits);

  // The 3 position words ↔ the corpus's own ui block.
  expect(pd.positionLow, `${locale} positionLow`).toBe(corpus.ui.positionLow);
  expect(pd.positionTypical, `${locale} positionTypical`).toBe(corpus.ui.positionTypical);
  expect(pd.positionHigh, `${locale} positionHigh`).toBe(corpus.ui.positionHigh);

  // The 3 band words ↔ the corpus's own signals block.
  expect(pd.bandTop, `${locale} bandTop`).toBe(corpus.signals.bandTop);
  expect(pd.bandMid, `${locale} bandMid`).toBe(corpus.signals.bandMid);
  expect(pd.bandBottom, `${locale} bandBottom`).toBe(corpus.signals.bandBottom);

  // The 4 status words ↔ the corpus's own status block.
  expect(pd.statusWarning, `${locale} statusWarning`).toBe(corpus.status.warning);
  expect(pd.statusStale, `${locale} statusStale`).toBe(corpus.status.stale);
  expect(pd.statusCheckPending, `${locale} statusCheckPending`).toBe(corpus.status['check-pending']);
  expect(pd.statusUnavailable, `${locale} statusUnavailable`).toBe(corpus.status.unavailable);
}

describe('commodities copy pins — en (the corpus’s own words, byte-for-byte)', () => {
  it('the 24 card names + the 5 unit words + the position/band/status words match the insights corpus', () => {
    pinCardWords(en.pd.commodities, insightsCopyEn, 'en');
  });
});

describe('commodities copy pins — fa (the corpus’s own words, byte-for-byte)', () => {
  it('the 24 card names + the 5 unit words + the position/band/status words match the insights corpus', () => {
    pinCardWords(fa.pd.commodities, insightsCopyFa, 'fa');
  });
});
