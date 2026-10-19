/**
 * Insights display config + pure rendering helpers (Phase I4 → I15).
 *
 * Everything here is platform-free pure TypeScript (AGENTS.md rule 2) so it
 * unit-tests without a DOM: the question-group/gauge layout, per-indicator
 * value formatting (decimals, unit, scale, the Fed target's 25bp corridor),
 * plain-language rule text, 10-year-position warning zones + position
 * WORDS (Block F3), state-keyed consequence-line selection (Block F4 +
 * data spec §6), the big-mover callout (Block H3), the prices-board row
 * list (Block PB1), and the lane/hero ordering settings (Blocks H1/L1).
 *
 * Copy lives in the i18n copy modules (insights-copy-en/fa.ts); this module
 * only defines the structural interfaces those dictionaries satisfy.
 *
 * Since the Phase 3-c split this module is the PUBLIC BARREL of the former
 * 1,507-line config.ts monolith: the implementation lives in cohesive
 * domain modules and everything is re-exported unchanged so the ~20
 * importers ('./config', '../config', '../components/insights/config')
 * keep their existing surface untouched:
 *
 *   sections.ts       — section/group order, price rows, companions,
 *                       definitions + group-count helpers
 *   display.ts        — UnitToken/UnitLabels/DISPLAY + value/change
 *                       formatting (indicatorValueParts & friends)
 *   labels.ts         — change-window/data-period/from-peak labels +
 *                       the plain-language RuleCopy/formatRuleText machinery
 *   bands.ts          — 10y warning zones, position bands, tone classes,
 *                       consequence-line state selection, band-position words
 *   movers.ts         — big movers, alerting chips, the two-tier status
 *                       model, the card filter
 *   history-config.ts — chart range zoom, pinned watchlist, epoch-day
 *                       history rows
 *   signals.ts        — SIGNALS_ENABLED, leg phrases, StatusTone, the
 *                       collapsed Together/Signals summaries, mergeSignals
 *   hero.ts           — the hero reason line, attention tiles, per-group
 *                       visibility
 *   money.ts          — the money area map, driver votes, policy-rate
 *                       card helpers
 *
 * Domain modules import each other directly (never through this barrel —
 * no cycles) and module-private helpers (DisplayConfig, PREFIXED_UNITS,
 * FED_CORRIDOR_HALF, fmt, ruleAtomText, WORD_TONE_CLASS, spacedNorm,
 * RANGE_DAYS, TOGETHER_STATE_ORDER, UP_IS_RELIEF_AREAS) stay private to
 * their domain. The re-export list below is EXACTLY the former config.ts
 * export list — nothing new joins the public surface.
 */

export {
  SECTION_ORDER,
  GROUP_ORDER,
  PRICE_ROWS,
  BTC_RATIO_IDS,
  COMPANION_ONLY_IDS,
  COMPANIONS,
  companionParentOf,
  ALWAYS_POSITION_IDS,
  definitionsForGroup,
  definitionFor,
  groupCounts,
} from './sections';

export {
  DISPLAY,
  indicatorValueParts,
  priceValueParts,
  formatIndicatorValue,
  formatReadingValue,
  formatChange,
  formatChangeParts,
  changeToneClass,
  changeScaleOf,
} from './display';
export type {
  UnitToken,
  PriceValueParts,
} from './display';

export {
  changeWindowLabel,
  dataPeriodText,
  formatFromPeak,
  formatPeakDistance,
  formatRuleText,
  formatUtcHm,
} from './labels';

export {
  warningZone,
  positionBand,
  stepToneClass,
  bandToneClass,
  attentionToneClass,
  consequenceState,
  consequenceLine,
  bandPositionOf,
  bandWordsOf,
  attentionLineOf,
} from './bands';
export type { PositionBand } from './bands';

export {
  bigMovers,
  tierOf,
  tierIsCard,
  indicatorMatchesFilter,
  filterVisibleIds,
  statusCounts,
  dailyPeersOf,
  tradingDaysBehind,
  isDelayedReading,
} from './movers';
export type { IndicatorTier, StatusFilter, DailyPeers } from './movers';

export {
  sliceHistoryToRange,
  rangeIsPlottable,
  PINNED_STORAGE_KEY,
  parsePinnedIds,
  formatPinnedStorage,
  epochDayToIso,
  sampleHistoryRows,
} from './history-config';
export type { ChartRange } from './history-config';

export {
  SIGNALS_ENABLED,
  legPhrase,
  togetherSummary,
  TOGETHER_CARD_ORDER,
  mergeSignals,
  // v3 UI_SPEC §8 (2026-10-20, PH6-B): the card face + collapsed chips
  // share this one neutral-summary selector.
  connectionSummaryInfo,
} from './signals';
export type { StatusTone, ConnectionSummaryInfo, ConnectionSummaryKind } from './signals';

export {
  heroReason,
  heroReasonIsConsistent,
  heroSentence,
  heroWhy,
  heroReadingCounts,
  calmGauges,
  heroNextEvent,
  heroStaleInputs,
  attentionTiles,
  groupVisibility,
} from './hero';
export type { HeroSentenceInput, HeroReadingCounts } from './hero';

export {
  MONEY_AREAS,
  moneyAreaRow,
  moneyPanel,
  MONEY_DRIVER_KIND,
  moneyDriverVote,
  policyLastChangeOf,
  nextEventDate,
  moneyAreaDirection,
  moneyDirectionToneClass,
} from './money';
export type {
  MoneyAreaId,
  MoneyDirection,
} from './money';
