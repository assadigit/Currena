/**
 * australia-tiles — the Australia page's derivations, PURE (page-division
 * S16, 2026-11-10 — docs/page-division/02-PAGE-DIVISION-SPEC.md §10 items
 * 1–3; D-6/D-17/D-19/D-27/D-32/D-35/D-37/D-42/D-43; the session prompt's
 * S16 scope).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles /
 * S12 europe-tiles / S14 asia-tiles contract): every value the page
 * renders is a DISPLAY of an engine-computed reading or gauge verdict,
 * re-derived here through the SAME pure engine functions the other
 * surfaces read — never a second arithmetic, never an invented composite.
 *
 *   - The five gauge sections + the world-risk group (§10 item 2, D-37:
 *     the unchanged 3-voting + 2-shadow structure): each group's ids via
 *     `pageGroupIds` (never hand-copied) — au-inflation-rates (6) ·
 *     au-households (11) · au-trade-currency (2 + 8 moved-out seat chips) ·
 *     au-external (1 + 3 seat chips, SHADOW) · au-activity (7, SHADOW) ·
 *     au-world-risk (1: gpr-australia, AF-4) = 28 placed cards.
 *   - The gauge verdicts: the SAME pure `gaugeReading` + `labelForVerdictStep`
 *     + `isShadowGauge` the legacy /insights AU section and the ingest read
 *     (the S3 globalGaugeTiles pattern over the AU gauges) — a voting gauge
 *     states its step word + its "{warnings} of {voting}" count line; a
 *     shadow gauge (G-5) never claims a verdict and reads the honest
 *     "not scored yet" + context-count words.
 *   - The moved-out seat chips (§10 "Moved out", D-32/D-42 · D-17/D-35 ·
 *     D-19 · D-27): the registry's own AU display-group membership MINUS
 *     the placement's home ids, per gauge — 8 in au-trade-currency
 *     (audusd · audjpy · gold-aud · iron-ore · coal-aus · lng-japan ·
 *     china-property-investment · china-steel-output) + 3 in au-external
 *     (audnzd · nz-short-rate · nz-10y) = 11 chips, each linking to the
 *     id's placement home (`homePageOfIndicator` — the S5 seat-chip
 *     discipline, never hand-copied). The 5 that still vote in the AU
 *     gauges (audusd · audjpy · audnzd · nz-short-rate · nz-10y) ride the
 *     projection as the placement's own mirrors.
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units/scale (the S9/S12/S14 pattern), pinned byte-for-byte
 *     against `config/display.ts`'s `formatReadingValue` by
 *     australia-tiles.test.ts — including the AU-only money joins: the
 *     billion/million rows bind "A$97.6bn" / "A$495m" tight in EN and
 *     keep the fa suffix word ("۹۷٫۶ میلیارد دلار استرالیا").
 *
 * Pure + platform-free so the unit tests drive it directly
 * (australia-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (australia-backtest-core.ts).
 */

import type { IndicatorDefinition, IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { GAUGES, gaugeReading, isShadowGauge, labelForVerdictStep, DEFINITIONS } from '@currena/insights';
import type { GaugeReading } from '@currena/insights';
import { pageGroupIds, homePageOfIndicator } from '@currena/insights/page-division';

/* ------------------------------------------------------------------ *
 * The five gauge sections + the world-risk group (spec §10 item 2;
 * D-37 — the unchanged structure, minus the ids that moved out, plus
 * gpr-australia)
 * ------------------------------------------------------------------ */

/** The AU gauges, the ENGINE's own order (GAUGES order — the same order
 *  `gaugesForSection('australia', …)` serves; the page renders its SECTIONS
 *  in placement-group order below, matching each section to its gauge by
 *  id, never by position). */
export const AUSTRALIA_GAUGE_IDS = GAUGES.filter((g) => g.section === 'australia').map((g) => g.id) as readonly AustraliaGaugeId[];

/** The AU gauge ids (the literal union that keeps the display + copy maps
 *  TOTAL — a missing key is a typecheck error, never a runtime undefined). */
export type AustraliaGaugeId =
  | 'au-inflation-rates'
  | 'au-households'
  | 'au-trade-currency'
  | 'au-activity'
  | 'au-external';

/** The Inflation & rates section (§10 item 2): the six cards. Derived from
 *  the placement table's own group, never a hand-copied list. */
export const AUSTRALIA_INFLATION_RATES_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-inflation-rates');

/** The Households section (§10 item 2): the eleven cards. */
export const AUSTRALIA_HOUSEHOLDS_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-households');

/** The Trade & currency section (§10 item 2): terms-of-trade · rba-fed-gap
 *  + the 8 moved-out seat chips (the mirrors + the display-group ids that
 *  moved out per D-32/D-42/D-19/D-27/D-35). */
export const AUSTRALIA_TRADE_CURRENCY_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-trade-currency');

/** The Trade & partners section (§10 item 2, SHADOW — G-5): au-trade-balance
 *  + the 3 moved-out seat chips (D-17/D-35/D-42). */
export const AUSTRALIA_EXTERNAL_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-external');

/** The Activity section (§10 item 2, SHADOW — G-5): the seven cards. */
export const AUSTRALIA_ACTIVITY_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-activity');

/** The World risk group (§10 item 2's "plus gpr-australia"; AF-4: a
 *  GLOBAL-section registry id whose page home is Australia). */
export const AUSTRALIA_WORLD_RISK_IDS: readonly IndicatorId[] = pageGroupIds('australia', 'au-world-risk');

/**
 * Every Australia registry card id, section order (6 + 11 + 2 + 1 + 7 + 1
 * = 28 in all). The moved-out members contribute seat chips, never cards.
 */
export const AUSTRALIA_CARD_IDS: readonly IndicatorId[] = [
  ...AUSTRALIA_INFLATION_RATES_IDS,
  ...AUSTRALIA_HOUSEHOLDS_IDS,
  ...AUSTRALIA_TRADE_CURRENCY_IDS,
  ...AUSTRALIA_EXTERNAL_IDS,
  ...AUSTRALIA_ACTIVITY_IDS,
  ...AUSTRALIA_WORLD_RISK_IDS,
];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined).
 * australia-tiles.test.ts pins this list against the placement's own
 * groups byte-for-byte.
 */
export type AustraliaCardId =
  | 'au-cpi'
  | 'au-trimmed-mean'
  | 'rba-expectations'
  | 'au-10y'
  | 'au-us-10y-gap'
  | 'au-petrol-yoy'
  | 'au-home-loan'
  | 'au-wage-growth'
  | 'au-rent-yoy'
  | 'au-household-debt-arrears'
  | 'au-unemployment'
  | 'au-home-values'
  | 'au-housing-finance'
  | 'rba-cash-rate'
  | 'au-deposit-rate'
  | 'au-saving-ratio'
  | 'au-job-vacancies'
  | 'terms-of-trade'
  | 'rba-fed-gap'
  | 'au-trade-balance'
  | 'au-gdp-growth'
  | 'au-household-spending'
  | 'au-building-approvals'
  | 'au-population-growth'
  | 'au-nom'
  | 'au-participation'
  | 'au-underemployment'
  | 'gpr-australia';

/** One card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface AustraliaCardEntry {
  id: AustraliaCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One section's cards in placement order, straight off the projection
 * (the S7/S9/S12/S14 pattern: the readings arrive already in placement
 * order — the projection is built from `pageReadingIds` — this only
 * joins them).
 */
export function australiaCards(readings: readonly IndicatorReading[], ids: readonly IndicatorId[]): AustraliaCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as AustraliaCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The gauge verdicts — the SAME pure engine functions the legacy AU
 * section and the ingest read (the S3 globalGaugeTiles pattern, over
 * the AU gauges)
 * ------------------------------------------------------------------ */

/** One AU gauge's verdict line inputs (the engine's own GaugeReading +
 *  the shared verdict word + the G-5 shadow flag). */
export interface AustraliaGaugeVerdict {
  gauge: AustraliaGaugeId;
  reading: GaugeReading;
  /** labelForVerdictStep(step) — the shared 4-word verdict language.
   *  null = the honest unread state (step 0 — no fresh voter could vote). */
  word: 'relaxed' | 'cautious' | 'stressed' | 'alarmed' | null;
  /** isShadowGauge — a shadow gauge (G-5) never claims a verdict: its
   *  header reads the "not scored yet" + context-count words. */
  shadow: boolean;
}

/**
 * The five AU gauges' verdicts over the served readings — the SAME pure
 * `gaugeReading` the legacy /insights AU section renders (the projection
 * carries every AU gauge member: the 21 home voters + the 5 mirrors),
 * so the page's verdict words can never disagree with the engine's.
 */
export function australiaGaugeVerdicts(readings: readonly IndicatorReading[]): AustraliaGaugeVerdict[] {
  return GAUGES.filter((g) => g.section === 'australia').map((g) => {
    const reading = gaugeReading(g, readings);
    return {
      gauge: g.id as AustraliaGaugeId,
      reading,
      word: labelForVerdictStep(reading.step),
      shadow: isShadowGauge(g),
    };
  });
}

/* ------------------------------------------------------------------ *
 * The moved-out seat chips (§10 "Moved out" — D-32/D-42 · D-17/D-35 ·
 * D-19 · D-27). Derived from the registry's own AU display-group
 * membership MINUS the placement's home ids, per gauge — never
 * hand-copied (the same engine-derived-membership discipline as
 * AU_GAUGE_MEMBER_IDS; the placement's own note records the D-37 story).
 * ------------------------------------------------------------------ */

/** The registry's own display-group members for an AU gauge group. */
function registryDisplayGroupIds(gauge: AustraliaGaugeId): IndicatorId[] {
  return DEFINITIONS.filter((d: IndicatorDefinition) => d.section === 'australia' && d.group === gauge).map(
    (d) => d.id,
  );
}

/** The moved-out members per AU gauge: the registry's display-group
 *  membership minus the placement's own home ids (D-37's reorganization —
 *  the ids that used to render in these gauges on /insights whose
 *  detail-card homes moved to other pages; their seat chips remain and
 *  link to the new homes). 8 in au-trade-currency + 3 in au-external =
 *  11 chips; the other three gauges kept all their members. */
export const AUSTRALIA_SEAT_IDS: Readonly<Record<AustraliaGaugeId, readonly IndicatorId[]>> = {
  'au-inflation-rates': registryDisplayGroupIds('au-inflation-rates').filter(
    (id) => !AUSTRALIA_INFLATION_RATES_IDS.includes(id),
  ),
  'au-households': registryDisplayGroupIds('au-households').filter((id) => !AUSTRALIA_HOUSEHOLDS_IDS.includes(id)),
  'au-trade-currency': registryDisplayGroupIds('au-trade-currency').filter(
    (id) => !AUSTRALIA_TRADE_CURRENCY_IDS.includes(id),
  ),
  'au-activity': registryDisplayGroupIds('au-activity').filter((id) => !AUSTRALIA_ACTIVITY_IDS.includes(id)),
  'au-external': registryDisplayGroupIds('au-external').filter((id) => !AUSTRALIA_EXTERNAL_IDS.includes(id)),
};

/** Every moved-out seat id (the 11, gauge order). */
export const AUSTRALIA_MOVED_OUT_IDS: readonly IndicatorId[] = AUSTRALIA_GAUGE_IDS.flatMap((g) => [
  ...AUSTRALIA_SEAT_IDS[g],
]);

/** The route path of a page id — the destinations' own slugs (D-46; the
 *  GoldSeats PAGE_ROUTE discipline, restated lean so this pure module
 *  never imports the router). */
const PAGE_ROUTE: Record<string, string> = {
  global: '/',
  gold: '/gold',
  'world-markets': '/world-markets',
  usa: '/usa',
  europe: '/europe',
  'asia-pacific': '/asia-pacific',
  australia: '/australia',
  commodities: '/commodities',
  currencies: '/currencies',
};

/**
 * A moved-out seat chip's link — the id's placement home page route,
 * derived from the placement table itself (homePageOfIndicator — the S5
 * seat-chip discipline: a placement change re-points every chip
 * automatically). null = not a placed id (fail-closed: the caller renders
 * no link, never a dead anchor).
 */
export function australiaSeatHref(id: IndicatorId): string | null {
  const home = homePageOfIndicator(id);
  return home === null ? null : (PAGE_ROUTE[home] ?? null);
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 28 Australia ids, restated here so the lean Australia chunk does not
 * pull the config module chain (the S3/S5/S7/S9/S12/S14 pattern). The
 * decimals/units/scale are pinned against config/display.ts by
 * australia-tiles.test.ts — and the VALUE RENDER is pinned against
 * `formatReadingValue` output-for-output over every id × both locales.
 *
 * Australia's 28 ids span EIGHT unit families: percent (17 — the rates,
 * CPI and labour cards), points (3 — the gap cards), index (3 — home
 * values · terms of trade · the GPR card), the AU money pair aud-bn /
 * aud-m (au-housing-finance scale 0.001 → "A$97.6bn"; au-trade-balance
 * → "A$495m"), and the counted trio vacancies · dwellings · persons-k
 * (the M6 Wave 3 / S5-M5.2 display families — "325k vacancies",
 * "18,264 dwellings approved", "101k people"). The equivalence pin
 * proves the join matches formatReadingValue over all eight shapes.
 * ------------------------------------------------------------------ */

export type AustraliaUnitToken =
  | 'percent'
  | 'points'
  | 'index'
  | 'aud-bn'
  | 'aud-m'
  | 'vacancies'
  | 'dwellings'
  | 'persons-k';

export interface AustraliaCardDisplayConfig {
  decimals: number;
  unit: AustraliaUnitToken;
  /** The multiplicative display scale (au-housing-finance's 0.001 — the
   *  raw $m series → billions of dollars). Absent → 1 (no scale). */
  scale?: number;
}

export const AUSTRALIA_CARD_DISPLAY: Readonly<Record<AustraliaCardId, AustraliaCardDisplayConfig>> = {
  'au-cpi': { decimals: 1, unit: 'percent' },
  'au-trimmed-mean': { decimals: 1, unit: 'percent' },
  'rba-expectations': { decimals: 2, unit: 'points' },
  'au-10y': { decimals: 2, unit: 'percent' },
  'au-us-10y-gap': { decimals: 2, unit: 'points' },
  'au-petrol-yoy': { decimals: 1, unit: 'percent' },
  'au-home-loan': { decimals: 2, unit: 'percent' },
  'au-wage-growth': { decimals: 1, unit: 'percent' },
  'au-rent-yoy': { decimals: 1, unit: 'percent' },
  'au-household-debt-arrears': { decimals: 1, unit: 'percent' },
  'au-unemployment': { decimals: 1, unit: 'percent' },
  'au-home-values': { decimals: 1, unit: 'index' },
  'au-housing-finance': { decimals: 1, unit: 'aud-bn', scale: 0.001 },
  'rba-cash-rate': { decimals: 2, unit: 'percent' },
  'au-deposit-rate': { decimals: 2, unit: 'percent' },
  'au-saving-ratio': { decimals: 1, unit: 'percent' },
  'au-job-vacancies': { decimals: 0, unit: 'vacancies' },
  'terms-of-trade': { decimals: 1, unit: 'index' },
  'rba-fed-gap': { decimals: 2, unit: 'points' },
  'au-trade-balance': { decimals: 0, unit: 'aud-m' },
  'au-gdp-growth': { decimals: 1, unit: 'percent' },
  'au-household-spending': { decimals: 1, unit: 'percent' },
  'au-building-approvals': { decimals: 0, unit: 'dwellings' },
  'au-population-growth': { decimals: 1, unit: 'percent' },
  'au-nom': { decimals: 0, unit: 'persons-k' },
  'au-participation': { decimals: 1, unit: 'percent' },
  'au-underemployment': { decimals: 1, unit: 'percent' },
  'gpr-australia': { decimals: 2, unit: 'index' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by australia-copy-pin.test.ts). The `aud`
 *  label feeds the EN money-prefix join. */
export interface AustraliaUnitLabels {
  percent: string;
  points: string;
  index: string;
  aud: string;
  'aud-bn': string;
  'aud-m': string;
  vacancies: string;
  dwellings: string;
  'persons-k': string;
}

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 * (the indicatorValueParts + formatIndicatorValue join): percent binds
 * tight ('2.8%' / '۲٫۸٪'), the word units (points · index · vacancies ·
 * dwellings · persons-k) suffix with a space ('0.48 pts' · '109.87
 * index' · '325k vacancies'), and the AU MONEY rows join exactly the
 * registry's own way — EN prefixes the currency and binds the magnitude
 * word tight ('A$97.6bn' · 'A$495m'), fa keeps its suffix word
 * ('۹۷٫۶ میلیارد دلار استرالیا' · '۴۹۵ میلیون دلار استرالیا'). null =
 * the reading is absent or carries no value (the honest unavailable
 * word, never a guess).
 *
 * Pinned output-for-output against `formatReadingValue` over every id ×
 * both locales by australia-tiles.test.ts — the lean restatement can
 * never drift from the legacy renderer.
 */
export function australiaCardValueText(
  id: AustraliaCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: AustraliaUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = AUSTRALIA_CARD_DISPLAY[id];
  const num = formatNumber(reading.value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  if (cfg.unit === 'percent') return `${num}${unit}`;
  // The AU money rows (aud-bn / aud-m): the EN render prefixes the
  // currency and binds the magnitude word tight — exactly the
  // indicatorValueParts join for these unit shapes ('A$97.6bn'); fa
  // keeps the default suffix-with-space path ('۹۷٫۶ میلیارد دلار
  // استرالیا').
  if ((cfg.unit === 'aud-bn' || cfg.unit === 'aud-m') && numberLocale === 'en-US') {
    return `${units.aud}${num}${unit}`;
  }
  return `${num} ${unit}`;
}
