/**
 * usa-copy-pin tests (S9, 2026-11-09) — the vocabulary pins.
 *
 * The USA page keeps its copy in the app dictionaries (pd.usa.*, the
 * S3/S5/S7 pattern) so the lean USA chunk never loads the insights copy
 * corpus. That separation could drift — this test pins the vocabulary
 * byte-for-byte against the corpus the legacy /insights page (and every
 * destination page) renders, in BOTH locales:
 *
 *   - the 26 card names ↔ indicators[id].name
 *   - the unit words ↔ copy.units (percent · points · ratio · usd-tr ·
 *     usd-bn · usd)
 *   - the position + band words ↔ copy.ui.position* / signals.band*
 *   - the status words ↔ copy.status
 *   - the strip's verdict words + why-lines ride the EXISTING pd.global
 *     keys (one verdict language everywhere, D-48) — pinned here against
 *     the corpus's own copy.label, so the USA page speaks the engine's
 *     words on every screen it renders.
 *
 * A corpus rewording that forgets the USA page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { USA_CARD_IDS } from './usa-tiles';

type Pd = typeof en.pd.usa;

/** Pin the 26 card names + the unit + position + band + status words. */
function pinCardWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  const names = pd.cardNames as Record<string, string>;
  const indicators = corpus.indicators as unknown as Record<string, { name: string }>;
  for (const id of USA_CARD_IDS) {
    expect(names[id], `${locale} cardNames.${id}`).toBe(indicators[id]?.name);
  }
  // TOTAL: exactly the 26 S9 ids, never more.
  expect(Object.keys(names)).toHaveLength(USA_CARD_IDS.length);

  expect(pd.unitPercent, `${locale} unitPercent`).toBe(corpus.units.percent);
  expect(pd.unitPoints, `${locale} unitPoints`).toBe(corpus.units.points);
  expect(pd.unitRatio, `${locale} unitRatio`).toBe(corpus.units.ratio);
  expect(pd.unitUsdTr, `${locale} unitUsdTr`).toBe(corpus.units['usd-tr']);
  expect(pd.unitUsdBn, `${locale} unitUsdBn`).toBe(corpus.units['usd-bn']);
  expect(pd.unitUsd, `${locale} unitUsd`).toBe(corpus.units.usd);

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

/** Pin the strip's ONE-verdict-language discipline: the verdict words and
 *  the why-lines the strip renders ride the EXISTING pd.global keys, and
 *  those keys speak the corpus's own copy.label — pinned here so the USA
 *  page can never drift from the engine's words. */
function pinVerdictLanguage(pdGlobal: typeof en.pd.global, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  expect(pdGlobal.labelRelaxed, `${locale} labelRelaxed`).toBe(corpus.label.relaxed);
  expect(pdGlobal.labelCautious, `${locale} labelCautious`).toBe(corpus.label.cautious);
  expect(pdGlobal.labelStressed, `${locale} labelStressed`).toBe(corpus.label.stressed);
  expect(pdGlobal.labelAlarmed, `${locale} labelAlarmed`).toBe(corpus.label.alarmed);
  // The why-lines exist and are non-empty in both locales (their wording
  // is the S3 Global board's own fresh language — one wording everywhere).
  for (const key of ['gaugeWhySome', 'gaugeWhyNone', 'gaugeWhyUnread', 'cannotRead'] as const) {
    expect(pdGlobal[key].length, `${locale} ${key}`).toBeGreaterThan(0);
  }
}

describe('the USA page speaks the insights corpus’s words (en)', () => {
  it('the 26 card names + the unit + position + band + status words ↔ the corpus', () => {
    pinCardWords(en.pd.usa, insightsCopyEn, 'en');
  });

  it('the strip’s verdict words + why-lines ↔ the corpus’s copy.label through the shared pd.global keys', () => {
    pinVerdictLanguage(en.pd.global, insightsCopyEn, 'en');
  });
});

describe('the USA page speaks the insights corpus’s words (fa)', () => {
  it('the 26 card names + the unit + position + band + status words ↔ the corpus', () => {
    pinCardWords(fa.pd.usa, insightsCopyFa, 'fa');
  });

  it('the strip’s verdict words + why-lines ↔ the corpus’s copy.label through the shared pd.global keys', () => {
    pinVerdictLanguage(fa.pd.global, insightsCopyFa, 'fa');
  });
});
