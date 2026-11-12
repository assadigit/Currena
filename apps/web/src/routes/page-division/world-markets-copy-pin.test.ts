/**
 * world-markets-copy-pin tests (S7, 2026-11-08) — the verdict-vocabulary
 * pins.
 *
 * The World Markets page keeps its copy in the app dictionaries
 * (pd.worldMarkets.*, the S3/S5 pattern) so the lean World Markets
 * chunk never loads the insights copy corpus. That separation could
 * drift — this test pins the vocabulary byte-for-byte against the
 * corpus the legacy /insights page (and every destination page)
 * renders, in BOTH locales:
 *
 *   - the map block (every word the REUSED drawing speaks)
 *     ↔ copy.markets.map
 *   - the 16 index names + countries + latin names
 *     ↔ copy.markets.entries
 *   - the verdict words + aria + measure labels
 *     ↔ copy.markets.verdict* / measure*
 *   - the correction-count + below-high lines ↔ copy.markets
 *   - the group words, column headers, trend + status words, the
 *     delayed tag and the local-currency note ↔ copy.markets
 *   - the 9 risk-card names ↔ indicators[id].name
 *   - the unit words ↔ copy.units (index · usd-tr · usd)
 *   - the position + band words ↔ copy.ui.position* / signals.band*
 *
 * A corpus rewording that forgets the World Markets page fails HERE,
 * at the machine's door — never on a visitor's screen (D-48: one map,
 * one verdict language; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { MARKETS } from '@currena/insights/markets/definitions';
import { WORLD_RISK_IDS } from './world-markets-tiles';
import { WM_ENTRY_IDS } from './WorldMarketsHero';

type Copy = typeof insightsCopyEn;
type Pd = typeof en.pd.worldMarkets;

/** Pin one field of the map block against the corpus's own map block. */
function pinMapBlock(pd: Pd, corpus: Copy, locale: 'en' | 'fa'): void {
  const pdm = pd.map as Record<string, unknown>;
  const cm = corpus.markets.map as unknown as Record<string, unknown>;
  // Every scalar field of the corpus's map block, by name.
  const scalarKeys = [
    'periodSwitchAria',
    'periodToday',
    'periodWeek',
    'periodMonth',
    'periodYear',
    'period3M',
    'period5Y',
    'periodWordToday',
    'periodWordWeek',
    'periodWordMonth',
    'periodWordYear',
    'periodWord3M',
    'periodWord5Y',
    'open',
    'closed',
    'noData',
    'oldData',
    'stepFall',
    'stepFlat',
    'stepRise',
    'cellD',
    'cellW',
    'cellM',
    'cellY',
    'cell3M',
    'cell5Y',
    'legendMoreDown',
    'legendMoreUp',
    'showingFrom',
    'srContext',
    'srPerf',
    'srVal',
    'cardNameSsec',
    'cardNameStoxx',
    'cardNameTsx',
    'cardNameNdx',
  ];
  for (const key of scalarKeys) {
    expect(pdm[key], `${locale} map.${key}`).toBe(cm[key]);
  }
  // The country-name table, country by country.
  const pdCountries = pdm.countryNames as Record<string, string>;
  const cCountries = cm.countryNames as Record<string, string>;
  for (const [cc, word] of Object.entries(cCountries)) {
    expect(pdCountries[cc], `${locale} map.countryNames.${cc}`).toBe(word);
  }
  expect(Object.keys(pdCountries)).toHaveLength(Object.keys(cCountries).length);
}

/** Pin the 16 index entries (name + latin + country) against the corpus. */
function pinEntries(pd: Pd, corpus: Copy, locale: 'en' | 'fa'): void {
  const pde = pd.entries as Record<string, { name: string; latin: string; country: string }>;
  for (const id of WM_ENTRY_IDS) {
    const mine = pde[id];
    const corpusEntry = corpus.markets.entries[id];
    expect(mine?.name, `${locale} entries.${id}.name`).toBe(corpusEntry.name);
    expect(mine?.latin, `${locale} entries.${id}.latin`).toBe(corpusEntry.latin);
    expect(mine?.country, `${locale} entries.${id}.country`).toBe(corpusEntry.country);
  }
  // TOTAL: exactly the 16 registry ids, never more.
  expect(Object.keys(pde)).toHaveLength(MARKETS.length);
}

/** Pin the shared table/status vocabulary against the corpus's markets
 * block. */
function pinTableWords(pd: Pd, corpus: Copy, locale: 'en' | 'fa'): void {
  const pdAny = pd as unknown as Record<string, string>;
  const cm = corpus.markets as unknown as Record<string, string>;
  const keys = [
    'verdictAria',
    'verdictBullish',
    'verdictMixed',
    'verdictBearish',
    'measureNormal',
    'measureAttention',
    'measureUnusual',
    'inCorrectionCount',
    'belowHighLine',
    'thMarket',
    'thToday',
    'thWeek',
    'thMonth',
    'th3m',
    'thYear',
    'thTrend',
    'thStatus',
    'trendUp',
    'trendFlat',
    'trendDown',
    'statusNearHigh',
    'statusPullback',
    'statusCorrection',
    'statusBear',
    'delayedTag',
    'localCurrencyNote',
  ];
  for (const key of keys) {
    expect(pdAny[key], `${locale} ${key}`).toBe(cm[key]);
  }
  // The group words.
  const groups = pd.groups as Record<string, string>;
  for (const [group, word] of Object.entries(corpus.markets.groups)) {
    expect(groups[group], `${locale} groups.${group}`).toBe(word);
  }
}

/** Pin the risk cards' names + units + position/band/status words. */
function pinRiskWords(pd: Pd, corpus: Copy, locale: 'en' | 'fa'): void {
  const names = pd.cardNames as Record<string, string>;
  const indicators = corpus.indicators as unknown as Record<string, { name: string }>;
  for (const id of WORLD_RISK_IDS) {
    expect(names[id], `${locale} cardNames.${id}`).toBe(indicators[id]?.name);
  }
  expect(Object.keys(names)).toHaveLength(WORLD_RISK_IDS.length);

  expect(pd.unitIndex, locale).toBe(corpus.units.index);
  expect(pd.unitUsdTr, locale).toBe(corpus.units['usd-tr']);
  expect(pd.unitUsd, locale).toBe(corpus.units.usd);

  expect(pd.positionLow, locale).toBe(corpus.ui.positionLow);
  expect(pd.positionTypical, locale).toBe(corpus.ui.positionTypical);
  expect(pd.positionHigh, locale).toBe(corpus.ui.positionHigh);
  expect(pd.bandTop, locale).toBe(corpus.signals.bandTop);
  expect(pd.bandMid, locale).toBe(corpus.signals.bandMid);
  expect(pd.bandBottom, locale).toBe(corpus.signals.bandBottom);

  expect(pd.statusWarning, locale).toBe(corpus.status.warning);
  expect(pd.statusStale, locale).toBe(corpus.status.stale);
  expect(pd.statusCheckPending, locale).toBe(corpus.status['check-pending']);
  expect(pd.statusUnavailable, locale).toBe(corpus.status.unavailable);
}

/** Pin the briefing layer's restored editorial vocabulary (the
 * 2026-11-12 owner round: the breadth headline, the movers, the tiles
 * and the detail panel) against the corpus's own markets block. The pd
 * key names differ from the corpus's on four words (the corpus's own
 * names were kept where they existed; the page's names speak the pd
 * block's flat shape) — the WORDS must not. */
function pinBriefingWords(pd: Pd, corpus: Copy, locale: 'en' | 'fa'): void {
  const pdAny = pd as unknown as Record<string, string>;
  const cm = corpus.markets as unknown as Record<string, string>;
  const keys: Array<[string, string]> = [
    ['briefingHeading', 'sectionLabel'],
    ['breadthPeriod', 'breadthPeriod'],
    ['breadthUp', 'breadthUp'],
    ['breadthDown', 'breadthDown'],
    ['breadthFlat', 'breadthFlat'],
    ['flatBandNote', 'flatBandNote'],
    ['coverageNote', 'coverageNote'],
    ['moverGain', 'moverGain'],
    ['moverLoss', 'moverLoss'],
    ['moverPeriodLabel', 'moverPeriodLabel'],
    ['moversNone', 'moversNone'],
    ['thFromHigh', 'thFromHigh'],
    ['atHighTag', 'atHighTag'],
    ['tileTagBelow', 'tileTagBelow'],
    ['oldDataLine', 'oldData'],
    ['noReadingAria', 'noReadingAria'],
    ['valueAria', 'heatmapValueAria'],
    ['asOfLine', 'asOf'],
    ['lastCloseLabel', 'lastCloseLabel'],
    ['high52wLabel', 'high52wLabel'],
    ['low52wLabel', 'low52wLabel'],
    ['chartAria', 'chartAria'],
  ];
  for (const [pdKey, corpusKey] of keys) {
    expect(pdAny[pdKey], `${locale} ${pdKey}`).toBe(cm[corpusKey]);
  }
  // The chart's honest no-data word — the corpus's own ui.na.
  expect(pdAny.naWord, `${locale} naWord`).toBe(corpus.ui.na);
}

describe('the World Markets page speaks the insights corpus’s words (en)', () => {
  const pd = en.pd.worldMarkets;
  const corpus = insightsCopyEn;

  it('the map block ↔ copy.markets.map (every word the REUSED drawing speaks)', () => {
    pinMapBlock(pd, corpus, 'en');
  });

  it('the 16 index names + latin + countries ↔ copy.markets.entries', () => {
    pinEntries(pd, corpus, 'en');
  });

  it('the verdict + measure + count lines + the table/status vocabulary ↔ copy.markets', () => {
    pinTableWords(pd, corpus, 'en');
  });

  it('the 9 risk-card names + the unit + position + band + status words ↔ the corpus', () => {
    pinRiskWords(pd, corpus, 'en');
  });

  it('the briefing layer (breadth + movers + tiles + detail) ↔ copy.markets', () => {
    pinBriefingWords(pd, corpus, 'en');
  });
});

describe('the World Markets page speaks the insights corpus’s words (fa)', () => {
  const pd = fa.pd.worldMarkets;
  const corpus = insightsCopyFa;

  it('the map block ↔ copy.markets.map (every word the REUSED drawing speaks)', () => {
    pinMapBlock(pd, corpus, 'fa');
  });

  it('the 16 index names + latin + countries ↔ copy.markets.entries', () => {
    pinEntries(pd, corpus, 'fa');
  });

  it('the verdict + measure + count lines + the table/status vocabulary ↔ copy.markets', () => {
    pinTableWords(pd, corpus, 'fa');
  });

  it('the 9 risk-card names + the unit + position + band + status words ↔ the corpus', () => {
    pinRiskWords(pd, corpus, 'fa');
  });

  it('the briefing layer (breadth + movers + tiles + detail) ↔ copy.markets', () => {
    pinBriefingWords(pd, corpus, 'fa');
  });
});
