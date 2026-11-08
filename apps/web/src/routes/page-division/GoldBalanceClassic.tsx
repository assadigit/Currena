/**
 * GoldBalanceClassic — the PREVIOUS shape of the gold balance, rendered
 * SMALLER inside the Gold hero (page-division S6, 2026-11-08 — the
 * owner's in-session request, decision BD-S6a).
 *
 * The owner's words: "I want the previous shape of Gold balance in the
 * gold dedicated page, it must be alternated with this new proposed
 * minimal design, just make it smaller." This component IS that shape:
 * the brass assay-office stage (tapered beam, 11-tick dial, column,
 * bowl pans hung plumb) with the five lane WEIGHTS on its pans and the
 * "Not leaning" tray — the SAME drawing every visitor meets on the
 * legacy /insights card, extracted in S6 as BalanceStage/BalanceTray
 * and rendered here through ONE code path (D-48: the drawing is never
 * restated; the legacy card and this view differ only in the words they
 * feed it and the width they give it).
 *
 * Smaller: the visual root is capped at 480px, so the drawing always
 * renders at the s-size metrics (pivot 56, dial 30, two weights per
 * row) — clearly below the legacy card's m/l steps. Everything else is
 * the balance's own discipline, verbatim: the beam swings on the SAME
 * presentation scale (balanceTilt over the same lane counts — one
 * math), sparse keeps the level beam (UI-40), an empty pan speaks its
 * full evidence-based sentence, and the not-leaning lanes rest in the
 * tray (never hidden).
 *
 * The words are the pd.gold.* keys, pinned byte-for-byte to the
 * insights corpus by gold-copy-pin.test.ts — the classic drawing speaks
 * EXACTLY the words the legacy card speaks, in both locales.
 *
 * Pressing a lane weight scrolls to that lane's seat card below
 * (GoldSeats' #gold-lane-{lane}) — the on-page equivalent of the legacy
 * ledger row: the same "open this lane's membership" intent, answered
 * by the seats section this page already renders.
 */

import { formatNumber } from '@currena/core';
import { interpolate } from '../../i18n';
import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import type { GoldBalanceLane, GoldBalanceMember } from '@currena/insights';
import { BalanceGradients } from '../../components/insights/signals/BalanceWeight';
import {
  BalanceStage,
  BalanceTray,
  balanceVisualSizeOf,
  useBalanceVisualRootWidth,
  type BalanceDriver,
  type BalanceStageCopy,
} from '../../components/insights/signals/BalanceScale';
import { LANE_INTRO_KEY, LANE_TITLE_KEY, VOTER_NAME_KEY, EVIDENCE_KEY } from './GoldSeats';
import type { GoldHeroModel, GoldHeroVerdictState } from './gold-tiles';
import { goldHeroCounts, goldHeroTilt, goldHeroVerdictState } from './gold-tiles';

/** The classic view's width cap — "just make it smaller": 480px (the
 * Tailwind max-w on the root) keeps the drawing at the s-size metrics
 * under every hero width (the legacy card renders m/l at 560px+; the
 * hero's balance block gives ~330–600px). */

/** The verdict word key per the sparse-aware state (the minimal row and
 * this classic view compose the SAME word — goldHeroVerdictState). */
const VERDICT_WORD_KEY: Record<GoldHeroVerdictState, TranslationKey> = {
  for: 'pd.gold.heroVerdictFor',
  balanced: 'pd.gold.heroVerdictBalanced',
  against: 'pd.gold.heroVerdictAgainst',
  none: 'pd.gold.heroVerdictNone',
  'not-enough': 'pd.gold.heroNotEnough',
};

export function GoldBalanceClassic({ hero }: { hero: GoldHeroModel }): React.JSX.Element | null {
  const { t, numberLocale } = useI18n();
  const [rootEl, rootWidth] = useBalanceVisualRootWidth();
  const num = (n: number): string => formatNumber(n, numberLocale, { maximumFractionDigits: 0 });

  /* The lane drivers — the SAME engine lines the seats cards render,
   * shaped for the drawing: one driver per lane, its members the lane's
   * voters (the segmented rims), the tally the GoldSeats rule. */
  const laneTallyOf = (lane: GoldBalanceLane): string | undefined => {
    if (lane.split) {
      return interpolate(t('pd.gold.laneSplit'), { supports: num(lane.supports), pressures: num(lane.pressures) });
    }
    if (lane.side === 'unread') return undefined;
    if (lane.firing === 0) return t('pd.gold.laneTallyNone');
    return interpolate(t('pd.gold.laneTally'), { firing: num(lane.firing), readable: num(lane.readable) });
  };
  const memberEvidenceOf = (m: GoldBalanceMember): string | null =>
    m.evidence === null ? null : t(EVIDENCE_KEY[m.evidence]);
  const drivers: BalanceDriver[] = hero.balance.lanes.map((lane) => ({
    key: lane.lane,
    label: t(LANE_TITLE_KEY[lane.lane]),
    detail: t(LANE_INTRO_KEY[lane.lane]),
    valueText: null,
    state: lane.side,
    split: lane.split,
    tally: laneTallyOf(lane),
    members: lane.members.map((m) => ({
      key: m.id as string,
      label: t(VOTER_NAME_KEY[m.id as keyof typeof VOTER_NAME_KEY]),
      impact: m.impact,
      evidenceText: memberEvidenceOf(m),
      valueText: null,
    })),
  }));

  /* The stage's group label + the gauge's text equivalent — composed
   * from the SAME rules the legacy card composes with: the non-zero
   * counts parts (the corpus's own count words, corpus-pinned here) +
   * the sparse-aware verdict word + the SAME beam angle. */
  const counts = goldHeroCounts(hero);
  const verdictState = goldHeroVerdictState(hero);
  const verdictWord = t(VERDICT_WORD_KEY[verdictState]);
  const parts: Array<[number, string]> = [
    [counts.for, interpolate(t('pd.gold.stageCountFor'), { n: num(counts.for) })],
    [counts.against, interpolate(t('pd.gold.stageCountAgainst'), { n: num(counts.against) })],
    [counts.neutral, interpolate(t('pd.gold.stageCountNeutral'), { n: num(counts.neutral) })],
    [counts.unread, interpolate(t('pd.gold.stageCountUnread'), { n: num(counts.unread) })],
  ];
  const summary = parts
    .filter(([count]) => count > 0)
    .map(([, text]) => text)
    .join(' · ');
  const stageAria = interpolate(t('pd.gold.stageAria'), { summary, verdict: verdictWord });
  const tilt = goldHeroTilt(hero);
  const gaugeAria = interpolate(t('pd.gold.heroBeamAria'), {
    n: num(tilt.angleDeg),
    verdict: verdictWord,
  });

  /* The narrow stage copy — every word corpus-pinned (gold-copy-pin). */
  const stageCopy: BalanceStageCopy = {
    sideFor: t('pd.gold.stageSideFor'),
    sideAgainst: t('pd.gold.stageSideAgainst'),
    listEmptyFor: t('pd.gold.stageEmptyFor'),
    listEmptyAgainst: t('pd.gold.stageEmptyAgainst'),
    listEmptyNone: t('pd.gold.stageEmptyNone'),
    laneChipAria: t('pd.gold.laneChipAria'),
    splitBadge: t('pd.gold.splitBadge'),
    sideWords: {
      supportive: t('pd.gold.stateShortSupportive'),
      against: t('pd.gold.stateShortAgainst'),
      neutral: t('pd.gold.stateShortNeutral'),
      unknown: t('pd.gold.stateShortUnknown'),
    },
    trayTitle: t('pd.gold.trayTitle'),
    trayNote: t('pd.gold.trayNote'),
    trayEmpty: t('pd.gold.trayEmpty'),
  };

  /** Pressing a weight scrolls to its lane's seat card (the page's own
   * answer to the legacy ledger row). Reduced motion scrolls instantly. */
  const openLaneFromWeight = (key: string): void => {
    const el = document.getElementById(`gold-lane-${key}`);
    if (el === null) return;
    const reduced =
      typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
    }
  };

  return (
    <div
      ref={rootEl}
      data-balance="gold"
      data-balance-visual
      data-balance-classic
      data-size={balanceVisualSizeOf(rootWidth)}
      className="relative mx-auto flex w-full max-w-[480px] flex-col"
    >
      <BalanceGradients />
      <div className="bal-glow" aria-hidden="true" />
      <BalanceStage
        drivers={drivers}
        copy={stageCopy}
        numberLocale={numberLocale}
        rootWidth={rootWidth}
        stageAria={stageAria}
        gaugeAria={gaugeAria}
        onWeightOpen={openLaneFromWeight}
      />
      <BalanceTray drivers={drivers} copy={stageCopy} rootWidth={rootWidth} onWeightOpen={openLaneFromWeight} />
    </div>
  );
}
