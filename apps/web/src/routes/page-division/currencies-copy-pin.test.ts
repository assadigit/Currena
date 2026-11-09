/**
 * currencies-copy-pin tests (S18, 2026-11-11) — the vocabulary pins.
 *
 * What is pinned here (the S9 usa-copy-pin / S12 europe-copy-pin / S14
 * asia-copy-pin / S16 australia-copy-pin / S17 commodities-copy-pin
 * pattern, scoped to the Currencies page's surfaces):
 *
 *   - the 7 rule lights' names + everyday explanations + per-outcome
 *     headlines ↔ the insights corpus's own fx.rules block, byte-for-byte,
 *     both locales, exact-count;
 *   - the status words (Active/Watching/Quiet) + the severity chips +
 *     the nodata word + the progress label + the downgrade caution ↔ the
 *     corpus's own fx block;
 *   - the board's period words + the rate word + the bigMove tag + the
 *     oldData line + the footer ↔ the corpus's own fx block;
 *   - the 11 pair names ↔ the corpus's own fx.entries (audnzd included —
 *     the S18 engine leg's own entry);
 *   - the 7 pair-context + 7 dollar-standing card names ↔ the corpus's
 *     own indicator names;
 *   - the 11 unit words ↔ the corpus's own units block;
 *   - the 3 position words + 3 band words + 4 status words ↔ the
 *     corpus's own ui/signals/status blocks.
 *
 * The loading/error lines, the section headings + intros and the
 * move-rank / 52-week words are FRESH (not pinned) — they ride the
 * Persian-copy manifest as unreviewed, pending the owner's review.
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { CURRENCIES_BOARD_PAIR_IDS, CURRENCIES_CARD_IDS } from './currencies-tiles';

type Pd = typeof en.pd.currencies;

/** The rule-light key ↔ corpus-key table (the outcomes each rule can show,
 *  per the engine's rules.ts — R4's two warning shapes, R7's two leads). */
const RULE_LIGHT_KEYS = {
  r1: ['name', 'everyday', 'headlineWarning', 'headlineWatch', 'headlineSupportive', 'headlineQuiet'],
  r2: ['name', 'everyday', 'headlineWarning', 'headlineWatch', 'headlineQuiet'],
  r3: ['name', 'everyday', 'headlineWarning', 'headlineSupportive', 'headlineQuiet'],
  r4: ['name', 'everyday', 'headlineFlight', 'headlineWobble', 'headlineQuiet'],
  r5: ['name', 'everyday', 'headlineWarning', 'headlineWatch', 'headlineSupportive', 'headlineQuiet'],
  r6: ['name', 'everyday', 'headlineWarning', 'headlineWatch', 'headlineQuiet'],
  r7: ['name', 'everyday', 'headlineDollarLed', 'headlineEuroLed'],
} as const satisfies Record<string, readonly string[]>;

/**
 * Pin the Currencies page's vocabulary against the insights corpus (the
 * S17 commodities-copy-pin pinCardWords pattern, scoped to the Currencies
 * families — the rules hero + the pair board + the registry cards: no
 * gauge words, no verdict words — every currencies card is context-only
 * per G-5).
 */
function pinWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  // The 7 rule lights ↔ the corpus's own fx.rules block.
  for (const [light, keys] of Object.entries(RULE_LIGHT_KEYS)) {
    const pdRule = pd.ruleLights[light as keyof typeof pd.ruleLights] as Record<string, string>;
    const corpusRule = (corpus.fx.rules as unknown as Record<string, Record<string, string>>)[light]!;
    for (const key of keys) {
      expect(pdRule[key], `${locale} ruleLights.${light}.${key}`).toBe(corpusRule[key]);
    }
    expect(Object.keys(pdRule), `${locale} ruleLights.${light} exact keys`).toHaveLength(keys.length);
  }
  expect(Object.keys(pd.ruleLights)).toHaveLength(7);

  // The status words + chips + the nodata/progress/downgrade words.
  expect(pd.statusActive, `${locale} statusActive`).toBe(corpus.fx.statusActive);
  expect(pd.statusWatching, `${locale} statusWatching`).toBe(corpus.fx.statusWatching);
  expect(pd.statusQuiet, `${locale} statusQuiet`).toBe(corpus.fx.statusQuiet);
  expect(pd.chipNormal, `${locale} chipNormal`).toBe(corpus.fx.chipNormal);
  expect(pd.chipAttention, `${locale} chipAttention`).toBe(corpus.fx.chipAttention);
  expect(pd.chipUnusual, `${locale} chipUnusual`).toBe(corpus.fx.chipUnusual);
  expect(pd.noDataRow, `${locale} noDataRow`).toBe(corpus.fx.noDataRow);
  expect(pd.barLabel, `${locale} barLabel`).toBe(corpus.fx.barLabel);
  expect(pd.reliabilityDetail, `${locale} reliabilityDetail`).toBe(corpus.fx.reliabilityDetail);
  expect(pd.downgradeCaution, `${locale} downgradeCaution`).toBe(corpus.fx.downgradeCaution);

  // The board's period words + rate word + tags + footer.
  expect(pd.thPair, `${locale} thPair`).toBe(corpus.fx.thPair);
  expect(pd.thRate, `${locale} thRate`).toBe(corpus.fx.csvColRate);
  expect(pd.thToday, `${locale} thToday`).toBe(corpus.fx.thToday);
  expect(pd.thM1, `${locale} thM1`).toBe(corpus.fx.thM1);
  expect(pd.thM3, `${locale} thM3`).toBe(corpus.fx.thM3);
  expect(pd.thY1, `${locale} thY1`).toBe(corpus.fx.thY1);
  expect(pd.bigMoveTag, `${locale} bigMoveTag`).toBe(corpus.fx.bigMoveTag);
  expect(pd.oldData, `${locale} oldData`).toBe(corpus.fx.oldData);
  expect(pd.boardFooter, `${locale} boardFooter`).toBe(corpus.fx.footerLine);
  expect(pd.fxEmpty, `${locale} fxEmpty`).toBe(corpus.fx.empty);

  // The 11 pair names ↔ the corpus's own fx.entries (audnzd included —
  // the S18 engine leg's own entry, D-42).
  for (const id of CURRENCIES_BOARD_PAIR_IDS) {
    expect(pd.pairNames[id], `${locale} pairNames.${id}`).toBe(
      (corpus.fx.entries as Record<string, { name: string }>)[id]!.name,
    );
  }
  expect(Object.keys(pd.pairNames)).toHaveLength(11);

  // The 14 registry card names ↔ the corpus's own indicator names.
  for (const id of CURRENCIES_CARD_IDS) {
    expect(
      (pd.pairCardNames as Record<string, string>)[id] ?? (pd.standingCardNames as Record<string, string>)[id],
      `${locale} cardNames.${id}`,
    ).toBe((corpus.indicators as Record<string, { name: string }>)[id]!.name);
  }
  expect(Object.keys(pd.pairCardNames)).toHaveLength(7);
  expect(Object.keys(pd.standingCardNames)).toHaveLength(7);

  // The 11 unit words ↔ the corpus's own units block.
  const units = pd.units as Record<string, string> & typeof pd.units;
  expect(units.index, `${locale} units.index`).toBe(corpus.units.index);
  expect(units.points, `${locale} units.points`).toBe(corpus.units.points);
  expect(units.percent, `${locale} units.percent`).toBe(corpus.units.percent);
  expect(units.try, `${locale} units.try`).toBe(corpus.units.try);
  expect(units.aed, `${locale} units.aed`).toBe(corpus.units.aed);
  expect(units.jpy, `${locale} units.jpy`).toBe(corpus.units.jpy);
  expect(units.eur, `${locale} units.eur`).toBe(corpus.units.eur);
  expect(units.chf, `${locale} units.chf`).toBe(corpus.units.chf);
  expect(units.cny, `${locale} units.cny`).toBe(corpus.units.cny);
  expect(units.usd, `${locale} units.usd`).toBe(corpus.units.usd);
  expect(units.nzd, `${locale} units.nzd`).toBe(corpus.units.nzd);

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

describe('currencies copy pins — en (the corpus’s own words, byte-for-byte)', () => {
  it('the rule lights + the board words + the card names + the unit/position/band/status words match the insights corpus', () => {
    pinWords(en.pd.currencies, insightsCopyEn, 'en');
  });
});

describe('currencies copy pins — fa (the corpus’s own words, byte-for-byte)', () => {
  it('the rule lights + the board words + the card names + the unit/position/band/status words match the insights corpus', () => {
    pinWords(fa.pd.currencies, insightsCopyFa, 'fa');
  });
});
