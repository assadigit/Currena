/**
 * gold-episodes-records.ts — GPE R25 / F6 (2026-11-19): the Episode
 * Explorer's EDITORIAL data — the nine-record launch list (s7/03 §3.2,
 * the CP-C-locked default) as a typed static module (s6/03 §2's own
 * address). THE STRINGS LIVE IN THE DICTIONARIES (S15-D7: the repo's
 * binding convention — every fa string rides the fa dictionary through
 * the Persian-copy manifest; the s7/03 §3.1 inline-field sketch was a
 * pre-implementation data model, the repo convention wins).
 *
 * The hasData honesty flag is the model's own core: an episode never
 * renders a family reading it cannot source — the families' own
 * series start at different dates (TIPS real yields 1997+; DXY 1971+;
 * CPI 1913+; CFTC 1986+; WGC 2002+ quarterly / IMF monthly 2010s), and
 * a family without coverage renders the shared no-series line.
 *
 * THE METER-ERA BOUNDARY (s7/03 §3.4, binding): no record renders a
 * historical "meter verdict" — the meter exists only 2016+, and the
 * F12 time machine (P4) is the only surface that renders historical
 * meter states. Links are OUT-bound only (§3.5): the live seat cards
 * of the families that told each story; data cards never link in.
 */

import type { TranslationKey } from '../../shared/lib/locale';

/** The six families (s7/03 §3.1's own enum). */
export type EpisodeFamilyId = 'borrowing-costs' | 'dollar' | 'stress' | 'inflation' | 'flows' | 'demand';

/** One family reading (hasData carries the honesty flag). */
export interface EpisodeFamilyReading {
  family: EpisodeFamilyId;
  /** True when the family's own series covers the record's period. */
  hasData: boolean;
  /** The series named at point of use, e.g. 'DXY (1971+)'. */
  seriesNamed?: string;
  /** The reading's dictionary key (only hasData=true rows carry one). */
  readingKey: TranslationKey;
}

/** One out-bound link (the verified live seat cards only). */
export interface EpisodeLink {
  href: string;
  labelKey: TranslationKey;
}

/** One editorial record. */
export interface GoldEpisodeRecord {
  id: string;
  /** The episode's period: YYYY or YYYY-MM, start → end. */
  period: { start: string; end: string };
  /** The one living record (the 2024-26 correction leg). */
  living?: boolean;
  titleKey: TranslationKey;
  /** The one-line takeaway (era left, annotation right at 390). */
  annotationKey: TranslationKey;
  /** One paragraph, honest, sourced, dated — no counterfactuals. */
  interpretationKey: TranslationKey;
  /** The families (the reading rows; the no-data line renders the rest). */
  families: readonly EpisodeFamilyReading[];
  /** The sources (name + licence level, per record). */
  sources: ReadonlyArray<{ nameKey: TranslationKey; licence: 'L1' | 'L2' }>;
  /** Out-bound only: the live seat cards that told the story. */
  links: readonly EpisodeLink[];
}

/** The verified out-bound link targets (the #18 name-match pattern —
 *  the same anchors the on-ramp uses; nothing invented). */
const LINK_REAL_YIELD: EpisodeLink = { href: '/usa#usa-card-real-yield-10y', labelKey: 'pd.usa.cardNames.real-yield-10y' };
const LINK_DOLLAR_BASKET: EpisodeLink = { href: '/currencies#currencies-card-dollar-basket', labelKey: 'pd.currencies.standingCardNames.dollar-basket' };
const LINK_CPI: EpisodeLink = { href: '/usa#usa-card-us-cpi-yoy', labelKey: 'pd.usa.cardNames.us-cpi-yoy' };
const LINK_VIX: EpisodeLink = { href: '/usa#usa-card-vix', labelKey: 'pd.usa.cardNames.vix' };
const LINK_ZONE_K: EpisodeLink = { href: '#gold-zone-k', labelKey: 'pd.gold.cbTitle' };

/** The nine-record launch list (1971→2024-26 — s7/03 §3.2 verbatim). */
export const GOLD_EPISODES: readonly GoldEpisodeRecord[] = [
  {
    id: 'episode-1971-bretton-woods',
    period: { start: '1971-08', end: '1973-03' },
    titleKey: 'pd.gold.ep1971Title',
    annotationKey: 'pd.gold.ep1971Annotation',
    interpretationKey: 'pd.gold.ep1971Interpretation',
    families: [
      { family: 'dollar', hasData: true, seriesNamed: 'U.S. official gold parity (1934–1973)', readingKey: 'pd.gold.ep1971FamDollar' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep1971FamInflation' },
      { family: 'borrowing-costs', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'stress', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'flows', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [{ nameKey: 'pd.gold.epSrcParity', licence: 'L1' }],
    links: [LINK_DOLLAR_BASKET, LINK_CPI],
  },
  {
    id: 'episode-1980-volcker-peak',
    period: { start: '1979-10', end: '1980-02' },
    titleKey: 'pd.gold.ep1980Title',
    annotationKey: 'pd.gold.ep1980Annotation',
    interpretationKey: 'pd.gold.ep1980Interpretation',
    families: [
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep1980FamDollar' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep1980FamInflation' },
      { family: 'borrowing-costs', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'stress', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'flows', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcFed1979', licence: 'L1' },
      { nameKey: 'pd.gold.epSrcPress1980', licence: 'L1' },
    ],
    links: [LINK_DOLLAR_BASKET, LINK_CPI],
  },
  {
    id: 'episode-1999-browns-bottom',
    period: { start: '1999-05', end: '1999-09' },
    titleKey: 'pd.gold.ep1999Title',
    annotationKey: 'pd.gold.ep1999Annotation',
    interpretationKey: 'pd.gold.ep1999Interpretation',
    families: [
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep1999FamDollar' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep1999FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep1999FamFlows' },
      { family: 'borrowing-costs', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'stress', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcBoeAuctions', licence: 'L1' },
      { nameKey: 'pd.gold.epSrcWag', licence: 'L1' },
    ],
    links: [LINK_DOLLAR_BASKET, LINK_CPI],
  },
  {
    id: 'episode-2008-gfc',
    period: { start: '2008-07', end: '2009-03' },
    titleKey: 'pd.gold.ep2008Title',
    annotationKey: 'pd.gold.ep2008Annotation',
    interpretationKey: 'pd.gold.ep2008Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2008FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2008FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2008FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2008FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2008FamFlows' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcFed2008', licence: 'L1' },
      { nameKey: 'pd.gold.epSrcPress2008', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_VIX, LINK_CPI],
  },
  {
    id: 'episode-2011-qe-era-top',
    period: { start: '2011-04', end: '2011-09' },
    titleKey: 'pd.gold.ep2011Title',
    annotationKey: 'pd.gold.ep2011Annotation',
    interpretationKey: 'pd.gold.ep2011Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2011FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2011FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2011FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2011FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2011FamFlows' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcPress2011', licence: 'L1' },
      { nameKey: 'pd.gold.epSrcTips', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_CPI],
  },
  {
    id: 'episode-2013-taper-tantrum',
    period: { start: '2013-04', end: '2013-12' },
    titleKey: 'pd.gold.ep2013Title',
    annotationKey: 'pd.gold.ep2013Annotation',
    interpretationKey: 'pd.gold.ep2013Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2013FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2013FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2013FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2013FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2013FamFlows' },
      { family: 'demand', hasData: false, readingKey: 'pd.gold.epFamilyNoData' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcFedTaper', licence: 'L1' },
      { nameKey: 'pd.gold.epSrcPress2013', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_CPI],
  },
  {
    id: 'episode-2020-covid',
    period: { start: '2020-03', end: '2020-08' },
    titleKey: 'pd.gold.ep2020Title',
    annotationKey: 'pd.gold.ep2020Annotation',
    interpretationKey: 'pd.gold.ep2020Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2020FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2020FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2020FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2020FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2020FamFlows' },
      { family: 'demand', hasData: true, seriesNamed: 'WGC quarterly (2002+)', readingKey: 'pd.gold.ep2020FamDemand' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcWgcHistory', licence: 'L2' },
      { nameKey: 'pd.gold.epSrcPress2020', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_VIX, LINK_CPI, LINK_ZONE_K],
  },
  {
    id: 'episode-2022-sanctions-rotation',
    period: { start: '2022-02', end: '2022-11' },
    titleKey: 'pd.gold.ep2022Title',
    annotationKey: 'pd.gold.ep2022Annotation',
    interpretationKey: 'pd.gold.ep2022Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2022FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2022FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2022FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2022FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2022FamFlows' },
      { family: 'demand', hasData: true, seriesNamed: 'WGC quarterly (2002+) · IMF monthly (2010s)', readingKey: 'pd.gold.ep2022FamDemand' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcWgcHistory', licence: 'L2' },
      { nameKey: 'pd.gold.epSrcPress2022', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_CPI, LINK_ZONE_K],
  },
  {
    id: 'episode-2024-26-melt-up',
    period: { start: '2024-02', end: '2026-11' },
    living: true,
    titleKey: 'pd.gold.ep2024Title',
    annotationKey: 'pd.gold.ep2024Annotation',
    interpretationKey: 'pd.gold.ep2024Interpretation',
    families: [
      { family: 'borrowing-costs', hasData: true, seriesNamed: 'TIPS real yields (1997+)', readingKey: 'pd.gold.ep2024FamBorrowing' },
      { family: 'dollar', hasData: true, seriesNamed: 'DXY (1971+)', readingKey: 'pd.gold.ep2024FamDollar' },
      { family: 'stress', hasData: true, seriesNamed: 'VIX (1990+)', readingKey: 'pd.gold.ep2024FamStress' },
      { family: 'inflation', hasData: true, seriesNamed: 'CPI (1913+)', readingKey: 'pd.gold.ep2024FamInflation' },
      { family: 'flows', hasData: true, seriesNamed: 'CFTC (1986+)', readingKey: 'pd.gold.ep2024FamFlows' },
      { family: 'demand', hasData: true, seriesNamed: 'WGC quarterly (2002+) · IMF monthly (2010s)', readingKey: 'pd.gold.ep2024FamDemand' },
    ],
    sources: [
      { nameKey: 'pd.gold.epSrcWgcHistory', licence: 'L2' },
      { nameKey: 'pd.gold.epSrcPress2024', licence: 'L1' },
    ],
    links: [LINK_REAL_YIELD, LINK_DOLLAR_BASKET, LINK_CPI, LINK_ZONE_K],
  },
];

/** The family display order (the reading rows' own order). */
export const EPISODE_FAMILY_ORDER: readonly EpisodeFamilyId[] = [
  'borrowing-costs',
  'dollar',
  'stress',
  'inflation',
  'flows',
  'demand',
];

/** The family label keys (the display rows' own titles). */
export const EPISODE_FAMILY_LABEL_KEY: Readonly<Record<EpisodeFamilyId, TranslationKey>> = {
  'borrowing-costs': 'pd.gold.epFamBorrowing',
  dollar: 'pd.gold.epFamDollar',
  stress: 'pd.gold.epFamStress',
  inflation: 'pd.gold.epFamInflation',
  flows: 'pd.gold.epFamFlows',
  demand: 'pd.gold.epFamDemand',
};
