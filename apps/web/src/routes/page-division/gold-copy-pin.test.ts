/**
 * gold-copy-pin tests (S5, 2026-11-08) — the verdict-vocabulary pins.
 *
 * The Gold page keeps its copy in the app dictionaries (pd.gold.*, the
 * S3 pattern) so the lean Gold chunk never loads the insights copy
 * corpus. That separation could drift — this test pins the VERDICT
 * VOCABULARY byte-for-byte against the corpus the legacy /insights
 * page (and every destination page) renders, in BOTH locales:
 *
 *   - the balance verdict words     ↔ copy.signals.balance.verdict*
 *   - the sparse + none words       ↔ notEnoughReadable / verdictNone
 *   - the counts parts              ↔ balance.verdictCount*
 *   - the lane names + intros       ↔ goldScore.laneNames / balance.laneIntro
 *   - the 37 voter names            ↔ goldScore.voterNames
 *   - the evidence words            ↔ goldScore.evidenceWords
 *   - the seat lean words           ↔ balance.memberSupports/Pressures + laneState*
 *   - the lane states + tallies     ↔ balance.laneState* / laneTally*
 *   - the beam aria + subtitle      ↔ balance.gaugeAria / subtitleLanes
 *   - the context line              ↔ balance.contextLine
 *   - the measured note + link      ↔ balance.measuredNote / goldScore.measuredNoteLink
 *   - the card names                ↔ indicators[id].name
 *   - the unit words                ↔ units.*
 *   - the position + band words     ↔ ui.position* / signals.band*
 *   - the status words              ↔ status.*
 *
 * A corpus rewording that forgets the Gold page fails HERE, at the
 * machine's door — never on a visitor's screen (D-48: one verdict
 * language everywhere; spec §17: the same engine words on every page).
 */

import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { fa } from '../../i18n/fa';
import { insightsCopyEn } from '../../i18n/insights-copy-en';
import { insightsCopyFa } from '../../i18n/insights-copy-fa';
import { GOLD_VOTER_IDS } from '@currena/insights/page-division';
import { GOLD_CONTEXT_IDS } from './gold-tiles';

const pdEn = en.pd.gold;
const pdFa = fa.pd.gold;
const corpusEn = insightsCopyEn;
const corpusFa = insightsCopyFa;

/* The pinned voter + context ids, typed loosely for the nested dictionary
 * lookups (the engine's own lists drive the iteration). */
type VoterNames = Record<string, string>;
type CardNames = Record<string, string>;

describe('the Gold page speaks the insights corpus’s verdict words (en)', () => {
  it('the hero verdict words ↔ copy.signals.balance', () => {
    expect(pdEn.heroHeading).toBe(corpusEn.signals.balance.heading);
    expect(pdEn.heroSubtitle).toBe(corpusEn.signals.balance.subtitleLanes);
    expect(pdEn.heroVerdictEyebrow).toBe(corpusEn.signals.balance.verdictEyebrow);
    expect(pdEn.heroVerdictFor).toBe(corpusEn.signals.balance.verdictFor);
    expect(pdEn.heroVerdictBalanced).toBe(corpusEn.signals.balance.verdictBalanced);
    expect(pdEn.heroVerdictAgainst).toBe(corpusEn.signals.balance.verdictAgainst);
    expect(pdEn.heroVerdictNone).toBe(corpusEn.signals.balance.verdictNone);
    expect(pdEn.heroNotEnough).toBe(corpusEn.signals.notEnoughReadable);
    expect(pdEn.heroBeamAria).toBe(corpusEn.signals.balance.gaugeAria);
    expect(pdEn.heroContextLine).toBe(corpusEn.signals.balance.contextLine);
    expect(pdEn.heroPositionLine).toBe(corpusEn.signals.footingPosition);
  });

  it('the counts parts ↔ balance.verdictCount*', () => {
    expect(pdEn.heroCountFor).toBe(corpusEn.signals.balance.verdictCountFor);
    expect(pdEn.heroCountAgainst).toBe(corpusEn.signals.balance.verdictCountAgainst);
    expect(pdEn.heroCountNotLeaning).toBe(corpusEn.signals.balance.verdictCountNotLeaning);
    expect(pdEn.heroCountUnread).toBe(corpusEn.signals.balance.verdictCountUnread);
  });

  it('the lane names + intros ↔ goldScore.laneNames / balance.laneIntro', () => {
    expect(pdEn.laneBorrowingCosts).toBe(corpusEn.signals.goldScore.laneNames['borrowing-costs']);
    expect(pdEn.laneDollar).toBe(corpusEn.signals.goldScore.laneNames.dollar);
    expect(pdEn.laneStress).toBe(corpusEn.signals.goldScore.laneNames.stress);
    expect(pdEn.laneInflation).toBe(corpusEn.signals.goldScore.laneNames.inflation);
    expect(pdEn.laneFlows).toBe(corpusEn.signals.goldScore.laneNames.flows);
    expect(pdEn.laneIntroBorrowingCosts).toBe(corpusEn.signals.balance.laneIntro['borrowing-costs']);
    expect(pdEn.laneIntroDollar).toBe(corpusEn.signals.balance.laneIntro.dollar);
    expect(pdEn.laneIntroStress).toBe(corpusEn.signals.balance.laneIntro.stress);
    expect(pdEn.laneIntroInflation).toBe(corpusEn.signals.balance.laneIntro.inflation);
    expect(pdEn.laneIntroFlows).toBe(corpusEn.signals.balance.laneIntro.flows);
  });

  it('all 37 voter names ↔ goldScore.voterNames (every engine voter, byte-for-byte)', () => {
    const names = pdEn.voterNames as VoterNames;
    for (const id of GOLD_VOTER_IDS) {
      expect(names[id], `voter ${id}`).toBe(corpusEn.signals.goldScore.voterNames[id as keyof typeof corpusEn.signals.goldScore.voterNames]);
    }
    expect(Object.keys(names)).toHaveLength(GOLD_VOTER_IDS.length);
  });

  it('the evidence words ↔ goldScore.evidenceWords', () => {
    expect(pdEn.evidenceRising).toBe(corpusEn.signals.goldScore.evidenceWords.rising);
    expect(pdEn.evidenceFalling).toBe(corpusEn.signals.goldScore.evidenceWords.falling);
    expect(pdEn.evidenceHigh).toBe(corpusEn.signals.goldScore.evidenceWords.high);
    expect(pdEn.evidenceLow).toBe(corpusEn.signals.goldScore.evidenceWords.low);
  });

  it('the seat lean words ↔ balance.memberSupports/Pressures + laneState*', () => {
    expect(pdEn.seatSupports).toBe(corpusEn.signals.balance.memberSupports);
    expect(pdEn.seatPressures).toBe(corpusEn.signals.balance.memberPressures);
    expect(pdEn.seatSteady).toBe(corpusEn.signals.balance.laneStateNeutral);
    expect(pdEn.seatUnread).toBe(corpusEn.signals.balance.laneStateUnread);
    expect(pdEn.seatLink).toBe(corpusEn.signals.balance.memberOpenIndicator);
  });

  it('the lane states + tallies ↔ balance.laneState* / laneTally*', () => {
    expect(pdEn.laneStateFor).toBe(corpusEn.signals.balance.laneStateFor);
    expect(pdEn.laneStateAgainst).toBe(corpusEn.signals.balance.laneStateAgainst);
    expect(pdEn.laneStateNeutral).toBe(corpusEn.signals.balance.laneStateNeutral);
    expect(pdEn.laneStateUnread).toBe(corpusEn.signals.balance.laneStateUnread);
    expect(pdEn.laneStateSplit).toBe(corpusEn.signals.balance.laneStateSplit);
    expect(pdEn.laneTally).toBe(corpusEn.signals.balance.laneTally);
    expect(pdEn.laneTallyNone).toBe(corpusEn.signals.balance.laneTallyNone);
    expect(pdEn.laneSplit).toBe(corpusEn.signals.balance.laneSplit);
  });

  it('the honest-record note + link ↔ balance.measuredNote / goldScore.measuredNoteLink', () => {
    expect(pdEn.measuredNote).toBe(corpusEn.signals.balance.measuredNote);
    expect(pdEn.measuredLink).toBe(corpusEn.signals.goldScore.measuredNoteLink);
  });

  it('S6 (BD-S6a): the classic stage + tray words ↔ the corpus (the previous shape speaks the legacy card\u2019s own words)', () => {
    expect(pdEn.stageSideFor).toBe(corpusEn.signals.balance.sideFor);
    expect(pdEn.stageSideAgainst).toBe(corpusEn.signals.balance.sideAgainst);
    expect(pdEn.stageEmptyFor).toBe(corpusEn.signals.balance.listEmptyFor);
    expect(pdEn.stageEmptyAgainst).toBe(corpusEn.signals.balance.listEmptyAgainst);
    expect(pdEn.stageEmptyNone).toBe(corpusEn.signals.balance.listEmptyNone);
    expect(pdEn.stageAria).toBe(corpusEn.signals.balance.aria);
    expect(pdEn.stageCountFor).toBe(corpusEn.signals.balance.countFor);
    expect(pdEn.stageCountAgainst).toBe(corpusEn.signals.balance.countAgainst);
    expect(pdEn.stageCountNeutral).toBe(corpusEn.signals.balance.countNeutral);
    expect(pdEn.stageCountUnread).toBe(corpusEn.signals.balance.countUnread);
    expect(pdEn.laneChipAria).toBe(corpusEn.signals.balance.laneChipAria);
    expect(pdEn.splitBadge).toBe(corpusEn.signals.balance.splitBadge);
    expect(pdEn.stateShortSupportive).toBe(corpusEn.signals.conditionStateShort.supportive);
    expect(pdEn.stateShortAgainst).toBe(corpusEn.signals.conditionStateShort.against);
    expect(pdEn.stateShortNeutral).toBe(corpusEn.signals.conditionStateShort.neutral);
    expect(pdEn.stateShortUnknown).toBe(corpusEn.signals.conditionStateShort.unknown);
    expect(pdEn.trayTitle).toBe(corpusEn.signals.balance.trayTitle);
    expect(pdEn.trayNote).toBe(corpusEn.signals.balance.trayNote);
    expect(pdEn.trayEmpty).toBe(corpusEn.signals.balance.trayEmpty);
  });

  it('all 14 context-card names ↔ indicators[id].name', () => {
    const names = pdEn.cardNames as CardNames;
    for (const id of GOLD_CONTEXT_IDS) {
      expect(names[id], `card ${id}`).toBe(corpusEn.indicators[id as keyof typeof corpusEn.indicators].name);
    }
    expect(Object.keys(names)).toHaveLength(GOLD_CONTEXT_IDS.length);
  });

  it('the unit words ↔ copy.units', () => {
    expect(pdEn.unitUsd).toBe(corpusEn.units.usd);
    expect(pdEn.unitAud).toBe(corpusEn.units.aud);
    expect(pdEn.unitPercent).toBe(corpusEn.units.percent);
    expect(pdEn.unitRatio).toBe(corpusEn.units.ratio);
    expect(pdEn.unitTonnes).toBe(corpusEn.units.tonnes);
  });

  it('the position + band words ↔ copy.ui.position* / signals.band*', () => {
    expect(pdEn.positionLow).toBe(corpusEn.ui.positionLow);
    expect(pdEn.positionTypical).toBe(corpusEn.ui.positionTypical);
    expect(pdEn.positionHigh).toBe(corpusEn.ui.positionHigh);
    expect(pdEn.bandTop).toBe(corpusEn.signals.bandTop);
    expect(pdEn.bandMid).toBe(corpusEn.signals.bandMid);
    expect(pdEn.bandBottom).toBe(corpusEn.signals.bandBottom);
  });

  it('the status words ↔ copy.status', () => {
    expect(pdEn.statusWarning).toBe(corpusEn.status.warning);
    expect(pdEn.statusNormal).toBe(corpusEn.status.normal);
    expect(pdEn.statusStale).toBe(corpusEn.status.stale);
    expect(pdEn.statusCheckPending).toBe(corpusEn.status['check-pending']);
    expect(pdEn.statusUnavailable).toBe(corpusEn.status.unavailable);
    expect(pdEn.statusContext).toBe(corpusEn.status.context);
  });
});

describe('the Gold page speaks the insights corpus’s verdict words (fa)', () => {
  it('the hero verdict words ↔ copy.signals.balance', () => {
    expect(pdFa.heroHeading).toBe(corpusFa.signals.balance.heading);
    expect(pdFa.heroSubtitle).toBe(corpusFa.signals.balance.subtitleLanes);
    expect(pdFa.heroVerdictEyebrow).toBe(corpusFa.signals.balance.verdictEyebrow);
    expect(pdFa.heroVerdictFor).toBe(corpusFa.signals.balance.verdictFor);
    expect(pdFa.heroVerdictBalanced).toBe(corpusFa.signals.balance.verdictBalanced);
    expect(pdFa.heroVerdictAgainst).toBe(corpusFa.signals.balance.verdictAgainst);
    expect(pdFa.heroVerdictNone).toBe(corpusFa.signals.balance.verdictNone);
    expect(pdFa.heroNotEnough).toBe(corpusFa.signals.notEnoughReadable);
    expect(pdFa.heroBeamAria).toBe(corpusFa.signals.balance.gaugeAria);
    expect(pdFa.heroContextLine).toBe(corpusFa.signals.balance.contextLine);
    expect(pdFa.heroPositionLine).toBe(corpusFa.signals.footingPosition);
  });

  it('the counts parts ↔ balance.verdictCount*', () => {
    expect(pdFa.heroCountFor).toBe(corpusFa.signals.balance.verdictCountFor);
    expect(pdFa.heroCountAgainst).toBe(corpusFa.signals.balance.verdictCountAgainst);
    expect(pdFa.heroCountNotLeaning).toBe(corpusFa.signals.balance.verdictCountNotLeaning);
    expect(pdFa.heroCountUnread).toBe(corpusFa.signals.balance.verdictCountUnread);
  });

  it('the lane names + intros ↔ goldScore.laneNames / balance.laneIntro', () => {
    expect(pdFa.laneBorrowingCosts).toBe(corpusFa.signals.goldScore.laneNames['borrowing-costs']);
    expect(pdFa.laneDollar).toBe(corpusFa.signals.goldScore.laneNames.dollar);
    expect(pdFa.laneStress).toBe(corpusFa.signals.goldScore.laneNames.stress);
    expect(pdFa.laneInflation).toBe(corpusFa.signals.goldScore.laneNames.inflation);
    expect(pdFa.laneFlows).toBe(corpusFa.signals.goldScore.laneNames.flows);
    expect(pdFa.laneIntroBorrowingCosts).toBe(corpusFa.signals.balance.laneIntro['borrowing-costs']);
    expect(pdFa.laneIntroDollar).toBe(corpusFa.signals.balance.laneIntro.dollar);
    expect(pdFa.laneIntroStress).toBe(corpusFa.signals.balance.laneIntro.stress);
    expect(pdFa.laneIntroInflation).toBe(corpusFa.signals.balance.laneIntro.inflation);
    expect(pdFa.laneIntroFlows).toBe(corpusFa.signals.balance.laneIntro.flows);
  });

  it('all 37 voter names ↔ goldScore.voterNames (every engine voter, byte-for-byte)', () => {
    const names = pdFa.voterNames as VoterNames;
    for (const id of GOLD_VOTER_IDS) {
      expect(names[id], `voter ${id}`).toBe(corpusFa.signals.goldScore.voterNames[id as keyof typeof corpusFa.signals.goldScore.voterNames]);
    }
    expect(Object.keys(names)).toHaveLength(GOLD_VOTER_IDS.length);
  });

  it('the evidence words ↔ goldScore.evidenceWords', () => {
    expect(pdFa.evidenceRising).toBe(corpusFa.signals.goldScore.evidenceWords.rising);
    expect(pdFa.evidenceFalling).toBe(corpusFa.signals.goldScore.evidenceWords.falling);
    expect(pdFa.evidenceHigh).toBe(corpusFa.signals.goldScore.evidenceWords.high);
    expect(pdFa.evidenceLow).toBe(corpusFa.signals.goldScore.evidenceWords.low);
  });

  it('the seat lean words ↔ balance.memberSupports/Pressures + laneState*', () => {
    expect(pdFa.seatSupports).toBe(corpusFa.signals.balance.memberSupports);
    expect(pdFa.seatPressures).toBe(corpusFa.signals.balance.memberPressures);
    expect(pdFa.seatSteady).toBe(corpusFa.signals.balance.laneStateNeutral);
    expect(pdFa.seatUnread).toBe(corpusFa.signals.balance.laneStateUnread);
    expect(pdFa.seatLink).toBe(corpusFa.signals.balance.memberOpenIndicator);
  });

  it('the lane states + tallies ↔ balance.laneState* / laneTally*', () => {
    expect(pdFa.laneStateFor).toBe(corpusFa.signals.balance.laneStateFor);
    expect(pdFa.laneStateAgainst).toBe(corpusFa.signals.balance.laneStateAgainst);
    expect(pdFa.laneStateNeutral).toBe(corpusFa.signals.balance.laneStateNeutral);
    expect(pdFa.laneStateUnread).toBe(corpusFa.signals.balance.laneStateUnread);
    expect(pdFa.laneStateSplit).toBe(corpusFa.signals.balance.laneStateSplit);
    expect(pdFa.laneTally).toBe(corpusFa.signals.balance.laneTally);
    expect(pdFa.laneTallyNone).toBe(corpusFa.signals.balance.laneTallyNone);
    expect(pdFa.laneSplit).toBe(corpusFa.signals.balance.laneSplit);
  });

  it('the honest-record note + link ↔ balance.measuredNote / goldScore.measuredNoteLink', () => {
    expect(pdFa.measuredNote).toBe(corpusFa.signals.balance.measuredNote);
    expect(pdFa.measuredLink).toBe(corpusFa.signals.goldScore.measuredNoteLink);
  });

  it('S6 (BD-S6a): the classic stage + tray words ↔ the corpus (the previous shape speaks the legacy card’s own words)', () => {
    expect(pdFa.stageSideFor).toBe(corpusFa.signals.balance.sideFor);
    expect(pdFa.stageSideAgainst).toBe(corpusFa.signals.balance.sideAgainst);
    expect(pdFa.stageEmptyFor).toBe(corpusFa.signals.balance.listEmptyFor);
    expect(pdFa.stageEmptyAgainst).toBe(corpusFa.signals.balance.listEmptyAgainst);
    expect(pdFa.stageEmptyNone).toBe(corpusFa.signals.balance.listEmptyNone);
    expect(pdFa.stageAria).toBe(corpusFa.signals.balance.aria);
    expect(pdFa.stageCountFor).toBe(corpusFa.signals.balance.countFor);
    expect(pdFa.stageCountAgainst).toBe(corpusFa.signals.balance.countAgainst);
    expect(pdFa.stageCountNeutral).toBe(corpusFa.signals.balance.countNeutral);
    expect(pdFa.stageCountUnread).toBe(corpusFa.signals.balance.countUnread);
    expect(pdFa.laneChipAria).toBe(corpusFa.signals.balance.laneChipAria);
    expect(pdFa.splitBadge).toBe(corpusFa.signals.balance.splitBadge);
    expect(pdFa.stateShortSupportive).toBe(corpusFa.signals.conditionStateShort.supportive);
    expect(pdFa.stateShortAgainst).toBe(corpusFa.signals.conditionStateShort.against);
    expect(pdFa.stateShortNeutral).toBe(corpusFa.signals.conditionStateShort.neutral);
    expect(pdFa.stateShortUnknown).toBe(corpusFa.signals.conditionStateShort.unknown);
    expect(pdFa.trayTitle).toBe(corpusFa.signals.balance.trayTitle);
    expect(pdFa.trayNote).toBe(corpusFa.signals.balance.trayNote);
    expect(pdFa.trayEmpty).toBe(corpusFa.signals.balance.trayEmpty);
  });

  it('all 14 context-card names ↔ indicators[id].name', () => {
    const names = pdFa.cardNames as CardNames;
    for (const id of GOLD_CONTEXT_IDS) {
      expect(names[id], `card ${id}`).toBe(corpusFa.indicators[id as keyof typeof corpusFa.indicators].name);
    }
    expect(Object.keys(names)).toHaveLength(GOLD_CONTEXT_IDS.length);
  });

  it('the unit words ↔ copy.units', () => {
    expect(pdFa.unitUsd).toBe(corpusFa.units.usd);
    expect(pdFa.unitAud).toBe(corpusFa.units.aud);
    expect(pdFa.unitPercent).toBe(corpusFa.units.percent);
    expect(pdFa.unitRatio).toBe(corpusFa.units.ratio);
    expect(pdFa.unitTonnes).toBe(corpusFa.units.tonnes);
  });

  it('the position + band words ↔ copy.ui.position* / signals.band*', () => {
    expect(pdFa.positionLow).toBe(corpusFa.ui.positionLow);
    expect(pdFa.positionTypical).toBe(corpusFa.ui.positionTypical);
    expect(pdFa.positionHigh).toBe(corpusFa.ui.positionHigh);
    expect(pdFa.bandTop).toBe(corpusFa.signals.bandTop);
    expect(pdFa.bandMid).toBe(corpusFa.signals.bandMid);
    expect(pdFa.bandBottom).toBe(corpusFa.signals.bandBottom);
  });

  it('the status words ↔ copy.status', () => {
    expect(pdFa.statusWarning).toBe(corpusFa.status.warning);
    expect(pdFa.statusNormal).toBe(corpusFa.status.normal);
    expect(pdFa.statusStale).toBe(corpusFa.status.stale);
    expect(pdFa.statusCheckPending).toBe(corpusFa.status['check-pending']);
    expect(pdFa.statusUnavailable).toBe(corpusFa.status.unavailable);
    expect(pdFa.statusContext).toBe(corpusFa.status.context);
  });
});
