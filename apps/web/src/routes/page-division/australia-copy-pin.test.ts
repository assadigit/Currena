/**
 * australia-copy-pin tests (S16, 2026-11-10) — the vocabulary pins.
 *
 * The Australia page keeps its copy in the app dictionaries
 * (pd.australia.*, the S3/S5/S7/S9/S12/S14 pattern) so the lean Australia
 * chunk never loads the insights copy corpus. That separation could drift —
 * this test pins the vocabulary byte-for-byte against the corpus the
 * legacy /insights page (and every destination page) renders, in BOTH
 * locales:
 *
 *   - the 28 card names + the 11 seat-chip names ↔ indicators[id].name
 *   - the unit words ↔ copy.units (percent · points · index · aud ·
 *     aud-bn · aud-m · vacancies · dwellings · persons-k)
 *   - the gauge questions ↔ copy.groups; the one-line answers ↔
 *     copy.gaugeAnswers (the five AU gauges)
 *   - the verdict words ↔ copy.label; the gauge-header words ↔ copy.ui
 *     (gaugeNotScored · gaugeNoReading · inAlert · gaugeContextCount ·
 *     staleReadingsBadge)
 *   - the position + band words ↔ copy.ui.position* / signals.band*
 *   - the status words ↔ copy.status
 *   - the whole boardCopy block ↔ copy.marketsAu (the REUSED
 *     AustralianMarkets drawing's copy contract — one drawing, one
 *     vocabulary, D-48)
 *
 * A corpus rewording that forgets the Australia page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { AUSTRALIA_CARD_IDS, AUSTRALIA_MOVED_OUT_IDS } from './australia-tiles';

type Pd = typeof en.pd.australia;

/** Pin the card + seat names, the units, the gauge + verdict + position +
 *  band + status words, and the whole boardCopy block. */
function pinCardWords(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  const names = pd.cardNames as Record<string, string>;
  const indicators = corpus.indicators as unknown as Record<string, { name: string }>;
  for (const id of AUSTRALIA_CARD_IDS) {
    expect(names[id], `${locale} cardNames.${id}`).toBe(indicators[id]?.name);
  }
  // TOTAL: exactly the 28 S16 ids, never more.
  expect(Object.keys(names)).toHaveLength(AUSTRALIA_CARD_IDS.length);

  const seatNames = pd.seatNames as Record<string, string>;
  for (const id of AUSTRALIA_MOVED_OUT_IDS) {
    expect(seatNames[id], `${locale} seatNames.${id}`).toBe(indicators[id]?.name);
  }
  expect(Object.keys(seatNames)).toHaveLength(AUSTRALIA_MOVED_OUT_IDS.length);

  // The unit words (the nine families the 28 ids span).
  expect(pd.units.percent, `${locale} units.percent`).toBe(corpus.units.percent);
  expect(pd.units.points, `${locale} units.points`).toBe(corpus.units.points);
  expect(pd.units.index, `${locale} units.index`).toBe(corpus.units.index);
  expect(pd.units.aud, `${locale} units.aud`).toBe(corpus.units.aud);
  expect(pd.units.audBn, `${locale} units.audBn`).toBe(corpus.units['aud-bn']);
  expect(pd.units.audM, `${locale} units.audM`).toBe(corpus.units['aud-m']);
  expect(pd.units.vacancies, `${locale} units.vacancies`).toBe(corpus.units.vacancies);
  expect(pd.units.dwellings, `${locale} units.dwellings`).toBe(corpus.units.dwellings);
  expect(pd.units.personsK, `${locale} units.personsK`).toBe(corpus.units['persons-k']);

  // The gauge questions + one-line answers (the corpus's own).
  expect(pd.gauges['au-inflation-rates'].question, `${locale} question au-inflation-rates`).toBe(corpus.groups['au-inflation-rates']);
  expect(pd.gauges['au-households'].question, `${locale} question au-households`).toBe(corpus.groups['au-households']);
  expect(pd.gauges['au-trade-currency'].question, `${locale} question au-trade-currency`).toBe(corpus.groups['au-trade-currency']);
  expect(pd.gauges['au-external'].question, `${locale} question au-external`).toBe(corpus.groups['au-external']);
  expect(pd.gauges['au-activity'].question, `${locale} question au-activity`).toBe(corpus.groups['au-activity']);
  expect(pd.gauges['au-inflation-rates'].answer, `${locale} answer au-inflation-rates`).toBe(corpus.gaugeAnswers['au-inflation-rates']);
  expect(pd.gauges['au-households'].answer, `${locale} answer au-households`).toBe(corpus.gaugeAnswers['au-households']);
  expect(pd.gauges['au-trade-currency'].answer, `${locale} answer au-trade-currency`).toBe(corpus.gaugeAnswers['au-trade-currency']);
  expect(pd.gauges['au-external'].answer, `${locale} answer au-external`).toBe(corpus.gaugeAnswers['au-external']);
  expect(pd.gauges['au-activity'].answer, `${locale} answer au-activity`).toBe(corpus.gaugeAnswers['au-activity']);

  // The verdict words + the gauge-header words (the corpus's own).
  expect(pd.verdictWords.relaxed, `${locale} verdictWords.relaxed`).toBe(corpus.label.relaxed);
  expect(pd.verdictWords.cautious, `${locale} verdictWords.cautious`).toBe(corpus.label.cautious);
  expect(pd.verdictWords.stressed, `${locale} verdictWords.stressed`).toBe(corpus.label.stressed);
  expect(pd.verdictWords.alarmed, `${locale} verdictWords.alarmed`).toBe(corpus.label.alarmed);
  expect(pd.gaugeNotScored, `${locale} gaugeNotScored`).toBe(corpus.ui.gaugeNotScored);
  expect(pd.gaugeNoReading, `${locale} gaugeNoReading`).toBe(corpus.ui.gaugeNoReading);
  expect(pd.inAlert, `${locale} inAlert`).toBe(corpus.ui.inAlert);
  expect(pd.gaugeContextCount, `${locale} gaugeContextCount`).toBe(corpus.ui.gaugeContextCount);
  expect(pd.staleReadingsBadge, `${locale} staleReadingsBadge`).toBe(corpus.ui.staleReadingsBadge);

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

/** Pin the whole boardCopy block ↔ the corpus's own marketsAu block. */
function pinBoardCopy(pd: Pd, corpus: typeof insightsCopyEn, locale: 'en' | 'fa'): void {
  const board = pd.boardCopy;
  const au = corpus.marketsAu;
  expect(board.title, `${locale} boardCopy.title`).toBe(au.title);
  expect(board.sectionLabel, `${locale} boardCopy.sectionLabel`).toBe(au.sectionLabel);
  expect(board.subtitle, `${locale} boardCopy.subtitle`).toBe(au.subtitle);
  expect(board.lastCloseBadge, `${locale} boardCopy.lastCloseBadge`).toBe(au.lastCloseBadge);
  expect(board.asOf, `${locale} boardCopy.asOf`).toBe(au.asOf);
  expect(board.asx200Anchor, `${locale} boardCopy.asx200Anchor`).toBe(au.asx200Anchor);
  expect(board.asx200AnchorHint, `${locale} boardCopy.asx200AnchorHint`).toBe(au.asx200AnchorHint);
  expect(board.summaryLeading, `${locale} boardCopy.summaryLeading`).toBe(au.summaryLeading);
  expect(board.summaryLagging, `${locale} boardCopy.summaryLagging`).toBe(au.summaryLagging);
  expect(board.summaryMixed, `${locale} boardCopy.summaryMixed`).toBe(au.summaryMixed);
  expect(board.summaryCalm, `${locale} boardCopy.summaryCalm`).toBe(au.summaryCalm);
  expect(board.summaryNoReading, `${locale} boardCopy.summaryNoReading`).toBe(au.summaryNoReading);
  expect(board.thIndex, `${locale} boardCopy.thIndex`).toBe(au.thIndex);
  expect(board.thToday, `${locale} boardCopy.thToday`).toBe(au.thToday);
  expect(board.thWeek, `${locale} boardCopy.thWeek`).toBe(au.thWeek);
  expect(board.thMonth, `${locale} boardCopy.thMonth`).toBe(au.thMonth);
  expect(board.thYear, `${locale} boardCopy.thYear`).toBe(au.thYear);
  expect(board.thFromHigh, `${locale} boardCopy.thFromHigh`).toBe(au.thFromHigh);
  expect(board.thClose, `${locale} boardCopy.thClose`).toBe(au.thClose);
  expect(board.delayedTag, `${locale} boardCopy.delayedTag`).toBe(au.delayedTag);
  expect(board.oldData, `${locale} boardCopy.oldData`).toBe(au.oldData);
  expect(board.localCurrencyNote, `${locale} boardCopy.localCurrencyNote`).toBe(au.localCurrencyNote);
  expect(board.empty, `${locale} boardCopy.empty`).toBe(au.empty);
  // The group labels.
  expect(board.groups.broad, `${locale} boardCopy.groups.broad`).toBe(au.groups.broad);
  expect(board.groups.sectors, `${locale} boardCopy.groups.sectors`).toBe(au.groups.sectors);
  expect(board.groups.banks, `${locale} boardCopy.groups.banks`).toBe(au.groups.banks);
  expect(board.groups.volatility, `${locale} boardCopy.groups.volatility`).toBe(au.groups.volatility);
  expect(board.groups.newzealand, `${locale} boardCopy.groups.newzealand`).toBe(au.groups.newzealand);
  // The 19 row names (the probe-verified symbols + the NZX 50 rider).
  const entries = board.entries as Record<string, string>;
  const corpusEntries = au.entries as unknown as Record<string, { name: string }>;
  expect(Object.keys(entries)).toHaveLength(19);
  for (const id of Object.keys(corpusEntries)) {
    if (id in entries) {
      expect(entries[id], `${locale} boardCopy.entries.${id}`).toBe(corpusEntries[id]?.name);
    }
  }
}

describe('the Australia page speaks the insights corpus’s words (en)', () => {
  it('the 28 card names + the 11 seat names + the unit/gauge/verdict/position/band/status words ↔ the corpus', () => {
    pinCardWords(en.pd.australia, insightsCopyEn, 'en');
  });

  it('the whole boardCopy block ↔ the corpus marketsAu block (the REUSED drawing’s copy contract)', () => {
    pinBoardCopy(en.pd.australia, insightsCopyEn, 'en');
  });
});

describe('the Australia page speaks the insights corpus’s words (fa)', () => {
  it('the 28 card names + the 11 seat names + the unit/gauge/verdict/position/band/status words ↔ the corpus', () => {
    pinCardWords(fa.pd.australia, insightsCopyFa, 'fa');
  });

  it('the whole boardCopy block ↔ the corpus marketsAu block (the REUSED drawing’s copy contract)', () => {
    pinBoardCopy(fa.pd.australia, insightsCopyFa, 'fa');
  });
});
