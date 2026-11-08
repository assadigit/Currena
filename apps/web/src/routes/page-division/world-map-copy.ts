/**
 * world-map-copy — the ONE WorldMapCopy adapter for the page-division
 * surfaces (S8, 2026-11-08 — extracted from WorldMarketsHero.tsx, the
 * S6 BalanceStageCopy lineage).
 *
 * Every surface that re-renders the REUSED map with the page-division
 * dictionaries feeds it the SAME corpus-pinned `pd.worldMarkets.map.*`
 * keys through this adapter: the /world-markets hero (S7) and the four
 * region zoom sections (S8). ONE adapter = the drawing can never speak
 * a different word on a different page (D-48); world-markets-copy-pin
 * .test.ts pins every key byte-for-byte to the insights corpus in both
 * locales, so this module is the single door that test guards.
 */

import type { MarketId } from '@currena/core';
import { useI18n } from '../../lib/locale';
import type { WorldMapCopy } from '../../components/insights/world-markets/WorldMap';

/* ------------------------------------------------------------------ *
 * The key maps — the pd.worldMarkets keys shaped into the map's copy
 * contract (every word pinned to the corpus by
 * world-markets-copy-pin.test.ts).
 * ------------------------------------------------------------------ */

const MAP_KEY = {
  periodSwitchAria: 'pd.worldMarkets.map.periodSwitchAria',
  periodToday: 'pd.worldMarkets.map.periodToday',
  periodWeek: 'pd.worldMarkets.map.periodWeek',
  periodMonth: 'pd.worldMarkets.map.periodMonth',
  periodYear: 'pd.worldMarkets.map.periodYear',
  period3M: 'pd.worldMarkets.map.period3M',
  period5Y: 'pd.worldMarkets.map.period5Y',
  periodWordToday: 'pd.worldMarkets.map.periodWordToday',
  periodWordWeek: 'pd.worldMarkets.map.periodWordWeek',
  periodWordMonth: 'pd.worldMarkets.map.periodWordMonth',
  periodWordYear: 'pd.worldMarkets.map.periodWordYear',
  periodWord3M: 'pd.worldMarkets.map.periodWord3M',
  periodWord5Y: 'pd.worldMarkets.map.periodWord5Y',
  open: 'pd.worldMarkets.map.open',
  closed: 'pd.worldMarkets.map.closed',
  noData: 'pd.worldMarkets.map.noData',
  oldData: 'pd.worldMarkets.map.oldData',
  stepFall: 'pd.worldMarkets.map.stepFall',
  stepFlat: 'pd.worldMarkets.map.stepFlat',
  stepRise: 'pd.worldMarkets.map.stepRise',
  cellD: 'pd.worldMarkets.map.cellD',
  cellW: 'pd.worldMarkets.map.cellW',
  cellM: 'pd.worldMarkets.map.cellM',
  cellY: 'pd.worldMarkets.map.cellY',
  cell3M: 'pd.worldMarkets.map.cell3M',
  cell5Y: 'pd.worldMarkets.map.cell5Y',
  legendMoreDown: 'pd.worldMarkets.map.legendMoreDown',
  legendMoreUp: 'pd.worldMarkets.map.legendMoreUp',
  showingFrom: 'pd.worldMarkets.map.showingFrom',
  srContext: 'pd.worldMarkets.map.srContext',
  srPerf: 'pd.worldMarkets.map.srPerf',
  srVal: 'pd.worldMarkets.map.srVal',
  cardNameSsec: 'pd.worldMarkets.map.cardNameSsec',
  cardNameStoxx: 'pd.worldMarkets.map.cardNameStoxx',
  cardNameTsx: 'pd.worldMarkets.map.cardNameTsx',
  cardNameNdx: 'pd.worldMarkets.map.cardNameNdx',
} as const;

const COUNTRY_KEY = {
  us: 'pd.worldMarkets.map.countryNames.us',
  ca: 'pd.worldMarkets.map.countryNames.ca',
  br: 'pd.worldMarkets.map.countryNames.br',
  gb: 'pd.worldMarkets.map.countryNames.gb',
  fr: 'pd.worldMarkets.map.countryNames.fr',
  de: 'pd.worldMarkets.map.countryNames.de',
  eu: 'pd.worldMarkets.map.countryNames.eu',
  in: 'pd.worldMarkets.map.countryNames.in',
  hk: 'pd.worldMarkets.map.countryNames.hk',
  cn: 'pd.worldMarkets.map.countryNames.cn',
  tw: 'pd.worldMarkets.map.countryNames.tw',
  kr: 'pd.worldMarkets.map.countryNames.kr',
  jp: 'pd.worldMarkets.map.countryNames.jp',
  au: 'pd.worldMarkets.map.countryNames.au',
} as const;

/** The 16 index entries — the map reads name + country, the grids read
 * name + latin (one dictionary block, two consumers). */
export const WM_ENTRY_IDS = [
  'n225',
  'asx200',
  'kospi',
  'hsi',
  'ssec',
  'taiex',
  'nifty50',
  'stoxx50',
  'dax',
  'cac',
  'ftse',
  'sp500',
  'ndx',
  'dow',
  'tsx',
  'ibov',
] as const satisfies readonly MarketId[];

/** Build the WorldMapCopy adapter from the pinned keys — the ONE door
 * every page-division map surface feeds the drawing through. */
export function useWorldMapCopy(t: ReturnType<typeof useI18n>['t']): WorldMapCopy {
  return {
    markets: {
      map: {
        periodSwitchAria: t(MAP_KEY.periodSwitchAria),
        periodToday: t(MAP_KEY.periodToday),
        periodWeek: t(MAP_KEY.periodWeek),
        periodMonth: t(MAP_KEY.periodMonth),
        periodYear: t(MAP_KEY.periodYear),
        period3M: t(MAP_KEY.period3M),
        period5Y: t(MAP_KEY.period5Y),
        periodWordToday: t(MAP_KEY.periodWordToday),
        periodWordWeek: t(MAP_KEY.periodWordWeek),
        periodWordMonth: t(MAP_KEY.periodWordMonth),
        periodWordYear: t(MAP_KEY.periodWordYear),
        periodWord3M: t(MAP_KEY.periodWord3M),
        periodWord5Y: t(MAP_KEY.periodWord5Y),
        open: t(MAP_KEY.open),
        closed: t(MAP_KEY.closed),
        noData: t(MAP_KEY.noData),
        oldData: t(MAP_KEY.oldData),
        stepFall: t(MAP_KEY.stepFall),
        stepFlat: t(MAP_KEY.stepFlat),
        stepRise: t(MAP_KEY.stepRise),
        cellD: t(MAP_KEY.cellD),
        cellW: t(MAP_KEY.cellW),
        cellM: t(MAP_KEY.cellM),
        cellY: t(MAP_KEY.cellY),
        cell3M: t(MAP_KEY.cell3M),
        cell5Y: t(MAP_KEY.cell5Y),
        legendMoreDown: t(MAP_KEY.legendMoreDown),
        legendMoreUp: t(MAP_KEY.legendMoreUp),
        showingFrom: t(MAP_KEY.showingFrom),
        srContext: t(MAP_KEY.srContext),
        srPerf: t(MAP_KEY.srPerf),
        srVal: t(MAP_KEY.srVal),
        cardNameSsec: t(MAP_KEY.cardNameSsec),
        cardNameStoxx: t(MAP_KEY.cardNameStoxx),
        cardNameTsx: t(MAP_KEY.cardNameTsx),
        cardNameNdx: t(MAP_KEY.cardNameNdx),
        countryNames: {
          us: t(COUNTRY_KEY.us),
          ca: t(COUNTRY_KEY.ca),
          br: t(COUNTRY_KEY.br),
          gb: t(COUNTRY_KEY.gb),
          fr: t(COUNTRY_KEY.fr),
          de: t(COUNTRY_KEY.de),
          eu: t(COUNTRY_KEY.eu),
          in: t(COUNTRY_KEY.in),
          hk: t(COUNTRY_KEY.hk),
          cn: t(COUNTRY_KEY.cn),
          tw: t(COUNTRY_KEY.tw),
          kr: t(COUNTRY_KEY.kr),
          jp: t(COUNTRY_KEY.jp),
          au: t(COUNTRY_KEY.au),
        },
      },
      entries: Object.fromEntries(
        WM_ENTRY_IDS.map((id) => [
          id,
          {
            name: t(`pd.worldMarkets.entries.${id}.name`),
            country: t(`pd.worldMarkets.entries.${id}.country`),
          },
        ]),
      ) as WorldMapCopy['markets']['entries'],
    },
  };
}
