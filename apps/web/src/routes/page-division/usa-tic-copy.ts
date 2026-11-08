/**
 * usa-tic-copy — the ONE adapter that feeds the REUSED TicSection its
 * copy on the USA page (page-division S10, 2026-11-09 — the S8
 * world-map-copy pattern; D-31/D-48).
 *
 * The tier-6 board is the SAME drawing the legacy /insights page renders
 * ("Who holds US government debt"): ONE TicSection, never restated. The
 * words it speaks here ride the `pd.usa.tic.*` dictionary block — every
 * key pinned byte-for-byte to the insights corpus's own `copy.tic` by
 * usa-copy-pin.test.ts, so the section can never say a different word on
 * /usa than it says on /insights (one drawing, one vocabulary — D-48).
 *
 * The key names ARE the corpus's own camelCase keys, so this adapter is a
 * clean pass-through: a key added to the corpus without a pd mirror fails
 * the copy-pin test at the machine's door, never on a visitor's screen.
 *
 * Pure (no platform imports) so it rides the lean USA chunk.
 */

import { useI18n } from '../../lib/locale';
import type { TranslationKey } from '../../lib/locale';
import type { TicSectionCopy } from '../../components/insights/TicSection';

/** The 37 corpus tic keys (camelCase, the corpus's own names). */
const TIC_KEY = {
  title: 'pd.usa.tic.title',
  subtitle: 'pd.usa.tic.subtitle',
  provenance: 'pd.usa.tic.provenance',
  staleBadge: 'pd.usa.tic.staleBadge',
  empty: 'pd.usa.tic.empty',
  headline: 'pd.usa.tic.headline',
  phraseDown: 'pd.usa.tic.phraseDown',
  phraseUp: 'pd.usa.tic.phraseUp',
  phraseTrillion: 'pd.usa.tic.phraseTrillion',
  phraseBillion: 'pd.usa.tic.phraseBillion',
  splitTitle: 'pd.usa.tic.splitTitle',
  officialWord: 'pd.usa.tic.officialWord',
  privateWord: 'pd.usa.tic.privateWord',
  buyersTitle: 'pd.usa.tic.buyersTitle',
  sellersTitle: 'pd.usa.tic.sellersTitle',
  netBuyingWord: 'pd.usa.tic.netBuyingWord',
  netSellingWord: 'pd.usa.tic.netSellingWord',
  chartTitle: 'pd.usa.tic.chartTitle',
  chartSummary: 'pd.usa.tic.chartSummary',
  tableCaption: 'pd.usa.tic.tableCaption',
  colCountry: 'pd.usa.tic.colCountry',
  colHoldings: 'pd.usa.tic.colHoldings',
  colShare: 'pd.usa.tic.colShare',
  col1m: 'pd.usa.tic.col1m',
  col12m: 'pd.usa.tic.col12m',
  colNet: 'pd.usa.tic.colNet',
  colVal: 'pd.usa.tic.colVal',
  colTrend: 'pd.usa.tic.colTrend',
  sortAria: 'pd.usa.tic.sortAria',
  custodyBadge: 'pd.usa.tic.custodyBadge',
  netVsValueNote: 'pd.usa.tic.netVsValueNote',
  custodyCaveat: 'pd.usa.tic.custodyCaveat',
  custodyTooltip: 'pd.usa.tic.custodyTooltip',
  flaggedNote: 'pd.usa.tic.flaggedNote',
  netMonthsNote: 'pd.usa.tic.netMonthsNote',
  showAllRows: 'pd.usa.tic.showAllRows',
  showFewerRows: 'pd.usa.tic.showFewerRows',
} as const satisfies Record<Exclude<keyof TicSectionCopy['tic'], 'countries'> & string, string>;

/** The 21 known-holder slugs (the corpus's own countries map keys). */
export const TIC_HOLDER_SLUGS = [
  'japan',
  'united-kingdom',
  'china-mainland',
  'belgium',
  'canada',
  'cayman-islands',
  'luxembourg',
  'france',
  'ireland',
  'taiwan',
  'switzerland',
  'singapore',
  'hong-kong',
  'india',
  'norway',
  'brazil',
  'saudi-arabia',
  'korea-south',
  'united-arab-emirates',
  'bermuda',
  'australia',
] as const satisfies readonly (keyof TicSectionCopy['tic']['countries'])[];

/** The countries' key map (typed against the slug union). */
const COUNTRY_KEY: Readonly<Record<(typeof TIC_HOLDER_SLUGS)[number], TranslationKey>> = {
  japan: 'pd.usa.tic.countries.japan',
  'united-kingdom': 'pd.usa.tic.countries.united-kingdom',
  'china-mainland': 'pd.usa.tic.countries.china-mainland',
  belgium: 'pd.usa.tic.countries.belgium',
  canada: 'pd.usa.tic.countries.canada',
  'cayman-islands': 'pd.usa.tic.countries.cayman-islands',
  luxembourg: 'pd.usa.tic.countries.luxembourg',
  france: 'pd.usa.tic.countries.france',
  ireland: 'pd.usa.tic.countries.ireland',
  taiwan: 'pd.usa.tic.countries.taiwan',
  switzerland: 'pd.usa.tic.countries.switzerland',
  singapore: 'pd.usa.tic.countries.singapore',
  'hong-kong': 'pd.usa.tic.countries.hong-kong',
  india: 'pd.usa.tic.countries.india',
  norway: 'pd.usa.tic.countries.norway',
  brazil: 'pd.usa.tic.countries.brazil',
  'saudi-arabia': 'pd.usa.tic.countries.saudi-arabia',
  'korea-south': 'pd.usa.tic.countries.korea-south',
  'united-arab-emirates': 'pd.usa.tic.countries.united-arab-emirates',
  bermuda: 'pd.usa.tic.countries.bermuda',
  australia: 'pd.usa.tic.countries.australia',
};

/**
 * Build the TicSection's copy contract from the pinned pd.usa.tic keys —
 * the ONE door the USA page feeds the reused drawing through.
 */
export function useUsaTicCopy(t: ReturnType<typeof useI18n>['t']): TicSectionCopy {
  return {
    tic: {
      title: t(TIC_KEY.title),
      subtitle: t(TIC_KEY.subtitle),
      provenance: t(TIC_KEY.provenance),
      staleBadge: t(TIC_KEY.staleBadge),
      empty: t(TIC_KEY.empty),
      headline: t(TIC_KEY.headline),
      phraseDown: t(TIC_KEY.phraseDown),
      phraseUp: t(TIC_KEY.phraseUp),
      phraseTrillion: t(TIC_KEY.phraseTrillion),
      phraseBillion: t(TIC_KEY.phraseBillion),
      splitTitle: t(TIC_KEY.splitTitle),
      officialWord: t(TIC_KEY.officialWord),
      privateWord: t(TIC_KEY.privateWord),
      buyersTitle: t(TIC_KEY.buyersTitle),
      sellersTitle: t(TIC_KEY.sellersTitle),
      netBuyingWord: t(TIC_KEY.netBuyingWord),
      netSellingWord: t(TIC_KEY.netSellingWord),
      chartTitle: t(TIC_KEY.chartTitle),
      chartSummary: t(TIC_KEY.chartSummary),
      tableCaption: t(TIC_KEY.tableCaption),
      colCountry: t(TIC_KEY.colCountry),
      colHoldings: t(TIC_KEY.colHoldings),
      colShare: t(TIC_KEY.colShare),
      col1m: t(TIC_KEY.col1m),
      col12m: t(TIC_KEY.col12m),
      colNet: t(TIC_KEY.colNet),
      colVal: t(TIC_KEY.colVal),
      colTrend: t(TIC_KEY.colTrend),
      sortAria: t(TIC_KEY.sortAria),
      custodyBadge: t(TIC_KEY.custodyBadge),
      netVsValueNote: t(TIC_KEY.netVsValueNote),
      custodyCaveat: t(TIC_KEY.custodyCaveat),
      custodyTooltip: t(TIC_KEY.custodyTooltip),
      flaggedNote: t(TIC_KEY.flaggedNote),
      netMonthsNote: t(TIC_KEY.netMonthsNote),
      showAllRows: t(TIC_KEY.showAllRows),
      showFewerRows: t(TIC_KEY.showFewerRows),
      countries: Object.fromEntries(TIC_HOLDER_SLUGS.map((slug) => [slug, t(COUNTRY_KEY[slug])])) as TicSectionCopy['tic']['countries'],
    },
  };
}
