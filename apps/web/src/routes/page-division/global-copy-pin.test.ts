/**
 * global-copy-pin tests (S3, 2026-11-08) — the verdict-vocabulary pins.
 *
 * The Global page keeps its copy in the app dictionaries (pd.global.*,
 * the S1 pattern) so the landing chunk never loads the insights copy
 * corpus. That separation could drift — this test pins the VERDICT WORDS
 * byte-for-byte against the corpus the legacy /insights page (and every
 * destination page) renders, in BOTH locales:
 *
 *   - the four gauge verdict words  ↔ copy.label
 *   - the 7-state outlook names     ↔ copy.signals.verdictStateNames
 *   - the fx signal words           ↔ copy.status (warning/unusual/normal)
 *   - the markets verdict words     ↔ copy.markets.verdictBullish/Mixed/Bearish
 *   - the unread word               ↔ copy.signals.verdictNone
 *
 * A corpus rewording that forgets the Global page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language everywhere; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';

const pdEn = en.pd.global;
const pdFa = fa.pd.global;

describe('the Global page speaks the insights corpus’s verdict words (en)', () => {
  it('the four gauge verdict words ↔ copy.label', () => {
    expect(pdEn.labelRelaxed).toBe(insightsCopyEn.label.relaxed);
    expect(pdEn.labelCautious).toBe(insightsCopyEn.label.cautious);
    expect(pdEn.labelStressed).toBe(insightsCopyEn.label.stressed);
    expect(pdEn.labelAlarmed).toBe(insightsCopyEn.label.alarmed);
  });

  it('the 7-state outlook names ↔ copy.signals.verdictStateNames', () => {
    expect(pdEn.outlookStrongBullish).toBe(insightsCopyEn.signals.verdictStateNames['strong-bullish']);
    expect(pdEn.outlookBullish).toBe(insightsCopyEn.signals.verdictStateNames.bullish);
    expect(pdEn.outlookNeutral).toBe(insightsCopyEn.signals.verdictStateNames.neutral);
    expect(pdEn.outlookRangeBound).toBe(insightsCopyEn.signals.verdictStateNames['range-bound']);
    expect(pdEn.outlookBearish).toBe(insightsCopyEn.signals.verdictStateNames.bearish);
    expect(pdEn.outlookStrongBearish).toBe(insightsCopyEn.signals.verdictStateNames['strong-bearish']);
    expect(pdEn.outlookMixed).toBe(insightsCopyEn.signals.verdictStateNames.mixed);
  });

  it('the fx signal words ↔ copy.status', () => {
    expect(pdEn.fxSignalNormal).toBe(insightsCopyEn.status.normal);
    expect(pdEn.fxSignalAttention).toBe(insightsCopyEn.status.warning);
    expect(pdEn.fxSignalUnusual).toBe(insightsCopyEn.status.unusual);
  });

  it('the markets verdict words ↔ copy.markets', () => {
    expect(pdEn.marketsBullish).toBe(insightsCopyEn.markets.verdictBullish);
    expect(pdEn.marketsMixed).toBe(insightsCopyEn.markets.verdictMixed);
    expect(pdEn.marketsBearish).toBe(insightsCopyEn.markets.verdictBearish);
  });

  it('the unread word ↔ copy.signals.verdictNone', () => {
    expect(pdEn.cannotRead).toBe(insightsCopyEn.signals.verdictNone);
  });
});

describe('the Global page speaks the insights corpus’s verdict words (fa)', () => {
  it('the four gauge verdict words ↔ copy.label', () => {
    expect(pdFa.labelRelaxed).toBe(insightsCopyFa.label.relaxed);
    expect(pdFa.labelCautious).toBe(insightsCopyFa.label.cautious);
    expect(pdFa.labelStressed).toBe(insightsCopyFa.label.stressed);
    expect(pdFa.labelAlarmed).toBe(insightsCopyFa.label.alarmed);
  });

  it('the 7-state outlook names ↔ copy.signals.verdictStateNames', () => {
    expect(pdFa.outlookStrongBullish).toBe(insightsCopyFa.signals.verdictStateNames['strong-bullish']);
    expect(pdFa.outlookBullish).toBe(insightsCopyFa.signals.verdictStateNames.bullish);
    expect(pdFa.outlookNeutral).toBe(insightsCopyFa.signals.verdictStateNames.neutral);
    expect(pdFa.outlookRangeBound).toBe(insightsCopyFa.signals.verdictStateNames['range-bound']);
    expect(pdFa.outlookBearish).toBe(insightsCopyFa.signals.verdictStateNames.bearish);
    expect(pdFa.outlookStrongBearish).toBe(insightsCopyFa.signals.verdictStateNames['strong-bearish']);
    expect(pdFa.outlookMixed).toBe(insightsCopyFa.signals.verdictStateNames.mixed);
  });

  it('the fx signal words ↔ copy.status', () => {
    expect(pdFa.fxSignalNormal).toBe(insightsCopyFa.status.normal);
    expect(pdFa.fxSignalAttention).toBe(insightsCopyFa.status.warning);
    expect(pdFa.fxSignalUnusual).toBe(insightsCopyFa.status.unusual);
  });

  it('the markets verdict words ↔ copy.markets', () => {
    expect(pdFa.marketsBullish).toBe(insightsCopyFa.markets.verdictBullish);
    expect(pdFa.marketsMixed).toBe(insightsCopyFa.markets.verdictMixed);
    expect(pdFa.marketsBearish).toBe(insightsCopyFa.markets.verdictBearish);
  });

  it('the unread word ↔ copy.signals.verdictNone', () => {
    expect(pdFa.cannotRead).toBe(insightsCopyFa.signals.verdictNone);
  });
});

describe('the ribbon speaks the corpus’s USD unit words', () => {
  it('unitUsd ↔ copy.units.usd (both locales)', () => {
    expect(pdEn.unitUsd).toBe(insightsCopyEn.units.usd);
    expect(pdFa.unitUsd).toBe(insightsCopyFa.units.usd);
  });
});
