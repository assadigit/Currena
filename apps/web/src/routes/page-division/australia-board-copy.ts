/**
 * australia-board-copy — the ONE adapter that feeds the REUSED
 * AustralianMarkets drawing its copy on the Australia page (page-division
 * S16, 2026-11-10 — the S10 usa-tic-copy / S8 world-map-copy pattern;
 * D-6/D-37/D-43/D-48).
 *
 * The AU Markets board is the SAME drawing the legacy /insights page
 * renders ("The Australian market up close"): ONE AustralianMarkets,
 * never restated. The words it speaks here ride the
 * `pd.australia.boardCopy.*` dictionary block — every key pinned
 * byte-for-byte to the insights corpus's own `copy.marketsAu` by
 * australia-copy-pin.test.ts, so the section can never say a different
 * word on /australia than it says on /insights (one drawing, one
 * vocabulary — D-48).
 *
 * The key names ARE the corpus's own camelCase keys, so this adapter is a
 * clean pass-through onto the drawing's own narrow contract
 * (AuMarketsBoardCopy): a key added to the corpus without a pd mirror
 * fails the copy-pin test at the machine's door, never on a visitor's
 * screen.
 *
 * Pure (no platform imports) so it rides the lean Australia chunk.
 */

import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import type { AuMarketsBoardCopy } from '../../components/insights/AustralianMarkets';

/** The corpus marketsAu keys the drawing's own contract names (camelCase,
 *  the corpus's own names). */
const BOARD_KEY = {
  title: 'pd.australia.boardCopy.title',
  sectionLabel: 'pd.australia.boardCopy.sectionLabel',
  subtitle: 'pd.australia.boardCopy.subtitle',
  lastCloseBadge: 'pd.australia.boardCopy.lastCloseBadge',
  asOf: 'pd.australia.boardCopy.asOf',
  asx200Anchor: 'pd.australia.boardCopy.asx200Anchor',
  asx200AnchorHint: 'pd.australia.boardCopy.asx200AnchorHint',
  summaryLeading: 'pd.australia.boardCopy.summaryLeading',
  summaryLagging: 'pd.australia.boardCopy.summaryLagging',
  summaryMixed: 'pd.australia.boardCopy.summaryMixed',
  summaryCalm: 'pd.australia.boardCopy.summaryCalm',
  summaryNoReading: 'pd.australia.boardCopy.summaryNoReading',
  thIndex: 'pd.australia.boardCopy.thIndex',
  thToday: 'pd.australia.boardCopy.thToday',
  thWeek: 'pd.australia.boardCopy.thWeek',
  thMonth: 'pd.australia.boardCopy.thMonth',
  thYear: 'pd.australia.boardCopy.thYear',
  thFromHigh: 'pd.australia.boardCopy.thFromHigh',
  thClose: 'pd.australia.boardCopy.thClose',
  delayedTag: 'pd.australia.boardCopy.delayedTag',
  oldData: 'pd.australia.boardCopy.oldData',
  localCurrencyNote: 'pd.australia.boardCopy.localCurrencyNote',
  empty: 'pd.australia.boardCopy.empty',
} as const satisfies Record<string, string>;

/** The five group labels (the corpus's own group keys — the drawing's own
 *  group-id union, in AU_MARKET_GROUP_ORDER). */
const GROUP_KEY = {
  broad: 'pd.australia.boardCopy.groups.broad',
  sectors: 'pd.australia.boardCopy.groups.sectors',
  banks: 'pd.australia.boardCopy.groups.banks',
  volatility: 'pd.australia.boardCopy.groups.volatility',
  newzealand: 'pd.australia.boardCopy.groups.newzealand',
} as const satisfies Record<keyof AuMarketsBoardCopy['groups'], string>;

/** The 19 row-name keys (the board's own probe-verified symbols + the
 *  NZX 50 rider — the ASX 200 anchor itself rides the world board, G-3). */
export const AU_BOARD_ENTRY_IDS = [
  'aord',
  'axso',
  'axfj',
  'axmj',
  'axej',
  'axpj',
  'axhj',
  'axij',
  'axnj',
  'axdj',
  'axsj',
  'axuj',
  'axtj',
  'cba',
  'nab',
  'anz',
  'wbc',
  'axvi',
  'nz50',
] as const satisfies readonly (keyof AuMarketsBoardCopy['entries'])[];

/** The entries' key map (typed against the board's own id union). */
const ENTRY_KEY: Readonly<Record<(typeof AU_BOARD_ENTRY_IDS)[number], TranslationKey>> = {
  aord: 'pd.australia.boardCopy.entries.aord',
  axso: 'pd.australia.boardCopy.entries.axso',
  axfj: 'pd.australia.boardCopy.entries.axfj',
  axmj: 'pd.australia.boardCopy.entries.axmj',
  axej: 'pd.australia.boardCopy.entries.axej',
  axpj: 'pd.australia.boardCopy.entries.axpj',
  axhj: 'pd.australia.boardCopy.entries.axhj',
  axij: 'pd.australia.boardCopy.entries.axij',
  axnj: 'pd.australia.boardCopy.entries.axnj',
  axdj: 'pd.australia.boardCopy.entries.axdj',
  axsj: 'pd.australia.boardCopy.entries.axsj',
  axuj: 'pd.australia.boardCopy.entries.axuj',
  axtj: 'pd.australia.boardCopy.entries.axtj',
  cba: 'pd.australia.boardCopy.entries.cba',
  nab: 'pd.australia.boardCopy.entries.nab',
  anz: 'pd.australia.boardCopy.entries.anz',
  wbc: 'pd.australia.boardCopy.entries.wbc',
  axvi: 'pd.australia.boardCopy.entries.axvi',
  nz50: 'pd.australia.boardCopy.entries.nz50',
};

/**
 * Build the AustralianMarkets drawing's copy contract from the pinned
 * pd.australia.boardCopy keys — the ONE door the Australia page feeds the
 * reused drawing through.
 */
export function useAustraliaBoardCopy(t: ReturnType<typeof useI18n>['t']): AuMarketsBoardCopy {
  return {
    title: t(BOARD_KEY.title),
    sectionLabel: t(BOARD_KEY.sectionLabel),
    subtitle: t(BOARD_KEY.subtitle),
    lastCloseBadge: t(BOARD_KEY.lastCloseBadge),
    asOf: t(BOARD_KEY.asOf),
    asx200Anchor: t(BOARD_KEY.asx200Anchor),
    asx200AnchorHint: t(BOARD_KEY.asx200AnchorHint),
    summaryLeading: t(BOARD_KEY.summaryLeading),
    summaryLagging: t(BOARD_KEY.summaryLagging),
    summaryMixed: t(BOARD_KEY.summaryMixed),
    summaryCalm: t(BOARD_KEY.summaryCalm),
    summaryNoReading: t(BOARD_KEY.summaryNoReading),
    thIndex: t(BOARD_KEY.thIndex),
    thToday: t(BOARD_KEY.thToday),
    thWeek: t(BOARD_KEY.thWeek),
    thMonth: t(BOARD_KEY.thMonth),
    thYear: t(BOARD_KEY.thYear),
    thFromHigh: t(BOARD_KEY.thFromHigh),
    thClose: t(BOARD_KEY.thClose),
    delayedTag: t(BOARD_KEY.delayedTag),
    oldData: t(BOARD_KEY.oldData),
    localCurrencyNote: t(BOARD_KEY.localCurrencyNote),
    empty: t(BOARD_KEY.empty),
    groups: {
      broad: t(GROUP_KEY.broad),
      sectors: t(GROUP_KEY.sectors),
      banks: t(GROUP_KEY.banks),
      volatility: t(GROUP_KEY.volatility),
      newzealand: t(GROUP_KEY.newzealand),
    },
    entries: Object.fromEntries(
      AU_BOARD_ENTRY_IDS.map((id) => [id, { name: t(ENTRY_KEY[id]) }]),
    ) as AuMarketsBoardCopy['entries'],
  };
}
