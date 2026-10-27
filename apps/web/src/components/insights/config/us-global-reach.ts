/**
 * config/us-global-reach — R9-07 (2026-10-27 owner round: "special
 * container for US-based indicators that affect global markets").
 *
 * The pure, rule-based ANALYTICAL BRIEF generator: it reads the CURRENT
 * readings of the nine US-global-reach indicators (real-yield-10y, us10y,
 * us30y, euro-hicp, us-cpi-yoy, us-pce-core-yoy, walcl, stress-stlfsi,
 * nfci) and synthesises a three-sentence "what this means for the world"
 * paragraph — the same discipline as the consequenceLine machinery
 * (bands.ts): a FIXED table of sentence templates whose WORDS are chosen
 * and whose VALUES are interpolated from the live readings, so the brief
 * can never contradict the cards beside it. No free text, no invented
 * thresholds: every word rides a percentile band or the engine's own
 * warning status, and every number is the card's own formatted value.
 *
 * Pure, platform-free (AGENTS.md rule 2). Bilingual via the copy
 * dictionary's `usGlobalReach` templates (EN + fa).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import type { InsightsCopy } from '../../../i18n/insights-copy-en';
import { interpolate } from '../../../i18n';
import { formatIndicatorValue } from './display';
import { US_GLOBAL_REACH_IDS } from './sections';

/** The three analytical legs (R9-07): costs, inflation, stress/liquidity. */
export type UsGlobalLegBand = 'high' | 'mid' | 'low';

/** The reading lookup the generator reads (the page's own snapshot). */
export type ReadingLookup = ReadonlyMap<IndicatorId, IndicatorReading>;

const pct = (r: IndicatorReading | undefined): number | null => {
  if (r === undefined) return null;
  return r.percentile10y !== undefined ? r.percentile10y : null;
};

const isWarning = (r: IndicatorReading | undefined): boolean => r !== undefined && r.status === 'warning';

/**
 * The borrowing-costs leg's band: the most binding of the three yields'
 * 10-year percentiles (≥ 0.75 high, ≤ 0.25 low), with any needs-attention
 * status counting as high — a warning IS the elevated case, whatever the
 * percentile says. Pure.
 */
export function usCostsBand(byId: ReadingLookup): UsGlobalLegBand {
  const ids: readonly IndicatorId[] = ['real-yield-10y', 'us10y', 'us30y'];
  if (ids.some((id) => isWarning(byId.get(id)))) return 'high';
  const pcts = ids.map((id) => pct(byId.get(id))).filter((p): p is number => p !== null);
  if (pcts.length === 0) return 'mid';
  const max = Math.max(...pcts);
  if (max >= 0.75) return 'high';
  if (max <= 0.25) return 'low';
  return 'mid';
}

/**
 * The inflation leg's band: the engine's own verdict statuses decide —
 * any of the three inflation readings needing attention means "still
 * above the central banks' goals"; otherwise "close to the goals". Pure.
 */
export function usInflationBand(byId: ReadingLookup): 'above' | 'near' {
  const ids: readonly IndicatorId[] = ['us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp'];
  return ids.some((id) => isWarning(byId.get(id))) ? 'above' : 'near';
}

/**
 * The stress/liquidity leg's band: any needs-attention stress reading
 * means "strained"; otherwise (both calm, whatever the balance sheet
 * does) "calm". Pure.
 */
export function usStressBand(byId: ReadingLookup): 'strained' | 'calm' {
  const ids: readonly IndicatorId[] = ['stress-stlfsi', 'nfci'];
  return ids.some((id) => isWarning(byId.get(id))) ? 'strained' : 'calm';
}

/** The brief's per-leg structure: the chosen band + the leg's live values. */
export interface UsGlobalBriefLegs {
  costs: UsGlobalLegBand;
  inflation: 'above' | 'near';
  stress: 'strained' | 'calm';
}

/** Which bands the current readings select (pure — exported for tests). */
export function usGlobalBriefLegs(byId: ReadingLookup): UsGlobalBriefLegs {
  return { costs: usCostsBand(byId), inflation: usInflationBand(byId), stress: usStressBand(byId) };
}

/**
 * The nine readings' live values, display-formatted the page's own way
 * (formatIndicatorValue — the same number + unit a card face shows). A
 * missing/unreadable value renders the honest em dash, never a guess.
 * Pure.
 */
export function usGlobalBriefValues(
  byId: ReadingLookup,
  numberLocale: 'en-US' | 'fa-IR',
  copy: InsightsCopy,
): Record<IndicatorId, string> {
  const out = {} as Record<IndicatorId, string>;
  for (const id of US_GLOBAL_REACH_IDS) {
    const r = byId.get(id);
    out[id] =
      r !== undefined && r.value !== null
        ? formatIndicatorValue(id, r.value, numberLocale, copy.units)
        : '—';
  }
  return out;
}

/**
 * The analytical brief itself (R9-07): three sentences — borrowing costs,
 * inflation, stress — each chosen and interpolated from the live
 * readings, joined with a single space. Returns null only when the page
 * carries none of the nine readings (nothing to synthesise, no card to
 * sit beside). Pure.
 */
export function usGlobalBrief(
  readings: readonly IndicatorReading[],
  copy: InsightsCopy,
  numberLocale: 'en-US' | 'fa-IR',
): string | null {
  const byId: ReadingLookup = new Map(readings.map((r) => [r.id, r]));
  if (!US_GLOBAL_REACH_IDS.some((id) => byId.has(id))) return null;
  const legs = usGlobalBriefLegs(byId);
  const v = usGlobalBriefValues(byId, numberLocale, copy);
  const t = copy.usGlobalReach;
  const costs =
    legs.costs === 'high' ? t.briefCostsHigh : legs.costs === 'low' ? t.briefCostsLow : t.briefCostsMid;
  const inflation = legs.inflation === 'above' ? t.briefInflationAbove : t.briefInflationNear;
  const stress = legs.stress === 'strained' ? t.briefStressStrained : t.briefStressCalm;
  const fill = (template: string): string =>
    interpolate(template, {
      us10y: v.us10y,
      us30y: v.us30y,
      real: v['real-yield-10y'],
      cpi: v['us-cpi-yoy'],
      pce: v['us-pce-core-yoy'],
      hicp: v['euro-hicp'],
      stlfsi: v['stress-stlfsi'],
      nfci: v.nfci,
      walcl: v.walcl,
    });
  return [fill(costs), fill(inflation), fill(stress)].join(' ');
}
