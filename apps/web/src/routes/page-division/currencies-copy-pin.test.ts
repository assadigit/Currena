/**
 * currencies-copy-pin tests (S18, 2026-11-12) — the vocabulary pins.
 *
 * The Currencies page keeps its copy in the app dictionaries
 * (pd.currencies.*, the S3/S5/S7/S9/S12/S14/S16/S17 pattern) so the lean
 * Currencies chunk never loads the insights copy corpus. That separation
 * could drift — this test pins the vocabulary byte-for-byte against the
 * corpus the legacy /insights page (and every destination page) renders,
 * in BOTH locales:
 *
 *   - the 14 card names ↔ indicators[id].name
 *   - the 11 unit words ↔ copy.units (percent · points · index · try ·
 *     aed · jpy · eur · chf · cny · usd · nzd)
 *   - the 11 pair names ↔ copy.fx.entries[pair].name (D-42's board,
 *     audnzd included)
 *   - the 7 rule names + the 7 everyday explanations ↔ copy.fx.rules
 *     (D-41's plain-language hero)
 *   - the status/chip/measure words + the no-data line ↔ copy.fx
 *   - the big-move tag + the old-data line + the board group labels +
 *     the table headers ↔ copy.fx (bigMoveTag · oldData · groups ·
 *     csvColRate/thToday/thM1/thM3/thY1)
 *   - the position + band words ↔ copy.ui.position* / signals.band*
 *   - the status words ↔ copy.status
 *
 * A corpus rewording that forgets the Currencies page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { CURRENCIES_BOARD_PAIR_IDS, CURRENCIES_CARD_IDS, CURRENCIES_RULE_IDS } from './currencies-tiles';

type Pd = typeof en.pd.currencies;

/** Pin the card names, the units, the pair + rule words, the status/
 *  chip/measure words, the board labels and the position/band/status
 *  words. */
function pinPageWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  const names = pd.cardNames as Record<string, string>;
  const indicators = corpus.indicators as unknown as Record<string, { name: string }>;
  for (const id of CURRENCIES_CARD_IDS) {
    expect(names[id], `${locale} cardNames.${id}`).toBe(indicators[id]?.name);
  }
  // TOTAL: exactly the 14 S18 ids, never more.
  expect(Object.keys(names)).toHaveLength(CURRENCIES_CARD_IDS.length);

  // The unit words (the eleven families the 14 ids span).
  expect(pd.units.percent, `${locale} units.percent`).toBe(corpus.units.percent);
  expect(pd.units.points, `${locale} units.points`).toBe(corpus.units.points);
  expect(pd.units.index, `${locale} units.index`).toBe(corpus.units.index);
  expect(pd.units.try, `${locale} units.try`).toBe(corpus.units.try);
  expect(pd.units.aed, `${locale} units.aed`).toBe(corpus.units.aed);
  expect(pd.units.jpy, `${locale} units.jpy`).toBe(corpus.units.jpy);
  expect(pd.units.eur, `${locale} units.eur`).toBe(corpus.units.eur);
  expect(pd.units.chf, `${locale} units.chf`).toBe(corpus.units.chf);
  expect(pd.units.cny, `${locale} units.cny`).toBe(corpus.units.cny);
  expect(pd.units.usd, `${locale} units.usd`).toBe(corpus.units.usd);
  expect(pd.units.nzd, `${locale} units.nzd`).toBe(corpus.units.nzd);

  // The 11 pair names (D-42's board — the corpus's own fx entries).
  const pairNames = pd.pairNames as Record<string, string>;
  const fxEntries = corpus.fx.entries as unknown as Record<string, { name: string }>;
  for (const id of CURRENCIES_BOARD_PAIR_IDS) {
    expect(pairNames[id], `${locale} pairNames.${id}`).toBe(fxEntries[id]?.name);
  }
  expect(Object.keys(pairNames)).toHaveLength(11);

  // The 7 rule names + everyday explanations (D-41's hero).
  const ruleKeys = ['r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7'] as const;
  for (const k of ruleKeys) {
    expect(pd.ruleNames[k], `${locale} ruleNames.${k}`).toBe(corpus.fx.rules[k].name);
    expect(pd.ruleEveryday[k], `${locale} ruleEveryday.${k}`).toBe(corpus.fx.rules[k].everyday);
  }
  expect(CURRENCIES_RULE_IDS).toHaveLength(7);

  // The status + chip + measure words + the no-data line (V1: only
  // Active / Watching / Quiet; the page's chips; §9.10's labels).
  expect(pd.statusActive, `${locale} statusActive`).toBe(corpus.fx.statusActive);
  expect(pd.statusWatching, `${locale} statusWatching`).toBe(corpus.fx.statusWatching);
  expect(pd.statusQuiet, `${locale} statusQuiet`).toBe(corpus.fx.statusQuiet);
  expect(pd.noDataRule, `${locale} noDataRule`).toBe(corpus.fx.noDataRow);
  expect(pd.fxPreparing, `${locale} fxPreparing`).toBe(corpus.fx.empty);
  expect(pd.chipNormal, `${locale} chipNormal`).toBe(corpus.fx.chipNormal);
  expect(pd.chipAttention, `${locale} chipAttention`).toBe(corpus.fx.chipAttention);
  expect(pd.chipUnusual, `${locale} chipUnusual`).toBe(corpus.fx.chipUnusual);
  expect(pd.measureNormal, `${locale} measureNormal`).toBe(corpus.fx.measureNormal);
  expect(pd.measureAttention, `${locale} measureAttention`).toBe(corpus.fx.measureAttention);
  expect(pd.measureUnusual, `${locale} measureUnusual`).toBe(corpus.fx.measureUnusual);

  // The board words: the big-move tag, the old-data line, the group
  // labels + the table headers (the corpus's own fx block).
  expect(pd.bigMoveTag, `${locale} bigMoveTag`).toBe(corpus.fx.bigMoveTag);
  expect(pd.oldData, `${locale} oldData`).toBe(corpus.fx.oldData);
  expect(pd.groups.dollarWorld, `${locale} groups.dollarWorld`).toBe(corpus.fx.groups.dollarWorld);
  expect(pd.groups.warningLights, `${locale} groups.warningLights`).toBe(corpus.fx.groups.warningLights);
  expect(pd.groups.chinaLink, `${locale} groups.chinaLink`).toBe(corpus.fx.groups.chinaLink);
  expect(pd.groups.auLink, `${locale} groups.auLink`).toBe(corpus.fx.groups.auLink);
  expect(pd.thPair, `${locale} thPair`).toBe(corpus.fx.thPair);
  expect(pd.thRate, `${locale} thRate`).toBe(corpus.fx.csvColRate);
  expect(pd.thToday, `${locale} thToday`).toBe(corpus.fx.thToday);
  expect(pd.thM1, `${locale} thM1`).toBe(corpus.fx.thM1);
  expect(pd.thM3, `${locale} thM3`).toBe(corpus.fx.thM3);
  expect(pd.thY1, `${locale} thY1`).toBe(corpus.fx.thY1);

  // The position + band words (the corpus's own).
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

describe('the Currencies page speaks the insights corpus’s words (en)', () => {
  it('the 14 card names + the 11 units + the 11 pair names + the 7 rules + the status/chip/measure/board/position/status words ↔ the corpus', () => {
    pinPageWords(en.pd.currencies, insightsCopyEn, 'en');
  });
});

describe('the Currencies page speaks the insights corpus’s words (fa)', () => {
  it('the 14 card names + the 11 units + the 11 pair names + the 7 rules + the status/chip/measure/board/position/status words ↔ the corpus', () => {
    pinPageWords(fa.pd.currencies, insightsCopyFa, 'fa');
  });
});
