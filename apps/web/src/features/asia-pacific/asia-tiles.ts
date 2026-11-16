/**
 * asia-tiles — the Asia & Pacific page's derivations, PURE (page-division
 * S14, 2026-11-09 — docs/page-division/02-PAGE-DIVISION-SPEC.md §9 items
 * 1–6; D-16/D-17/D-35/D-36; the session prompt's S14 scope; the S25 fill
 * session 2026-11-12 adds the three §15 D-36 CPI cards — BD-S23a).
 *
 * ONE RULE GOVERNS THIS FILE (D-48 + spec §3.2 + Agent Rule 5, the S3
 * global-tiles / S5 gold-tiles / S7 world-markets-tiles / S9 usa-tiles /
 * S12 europe-tiles contract): every value the page renders is a DISPLAY
 * of an engine-computed reading, re-derived here through the SAME pure
 * functions the other surfaces read — never a second arithmetic, never
 * an invented composite.
 *
 *   - The China section (D-35, §9 item 1): the placement table's own
 *     `china` group via `pageGroupIds` (never hand-copied) — the seven
 *     China cards (china-pmi · china-cpi · oecd-cli-cn · gpr-china ·
 *     gpr-taiwan · china-property-investment · china-steel-output). SGE
 *     links point to /gold (the cross-links strip, §9 item 1's note).
 *   - The Japan section (D-35, §9 item 2): the placement's `japan`
 *     group — jgb-10y · boj-rate · japan-cpi (the S25 fill landed:
 *     BD-S23a — the IMF SDMX 3.0 CPI dataflow card, verified against the
 *     Statistics Bureau's own release).
 *   - The Korea · Taiwan · Hong Kong section (D-35, §9 item 3): the
 *     placement's `korea-taiwan-hk` group — KOSPI · TAIEX · HSI ride the
 *     markets board (the Asia zoom map); the Korea CPI fill (D-36)
 *     LANDED (BD-S23a) — korea-cpi, verified against KOSTAT's own
 *     October release. The section renders the card + its index note.
 *   - The India section (D-35, §9 item 4): the placement's `india`
 *     group — NIFTY50 rides the markets board; the India CPI fill
 *     (D-36) LANDED (BD-S23a) — india-cpi, verified against MoSPI's own
 *     press note (the mirror lags MoSPI by 1–3 months, labelled).
 *   - The Pacific — New Zealand section (D-17, §9 item 5): the
 *     placement's `pacific-nz` group — nz-short-rate · nz-10y — plus
 *     the NZX50 mirror card (S21, BD-S21b: NZX50 is NOT a world-board
 *     index, so it cannot ride the Asia zoom; the section renders the
 *     AU Markets board's own row, linking to /australia).
 *   - The cards' value render restates the DISPLAY registry's own
 *     decimals/units (the S9 usa-tiles / S12 europe-tiles pattern),
 *     pinned byte-for-byte against `config/display.ts`'s
 *     `formatReadingValue` by asia-tiles.test.ts, so the lean
 *     restatement can never drift from the legacy renderer.
 *
 * Asia has NO thematic gauge of its own (china-pmi + china-cpi vote in
 * growth-health / prices-heat — both are Global gauges; the three S25
 * CPI cards are context-only, never votes); there is no verdict strip on
 * this page. The §21 diff is the card trio (value · 10-year position ·
 * freshness) over the 14 placed ids, page ≡ the served snapshot
 * (asia-backtest-core.ts).
 *
 * Pure + platform-free so the unit tests drive it directly
 * (asia-tiles.test.ts) and the §21 backtest can pin it against the
 * engine without importing this module through the page
 * (asia-backtest-core.ts).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';
import { formatNumber } from '@currena/core';
import { pageGroupIds } from '@currena/insights/page-division';

/* ------------------------------------------------------------------ *
 * The five sections (spec §9 items 1–5; D-35 — China, Japan, Korea/
 * Taiwan/HK, India and the Pacific/New Zealand, listed apart per
 * sub-region, NOT by theme)
 * ------------------------------------------------------------------ */

/**
 * The China section (§9 item 1): the seven China cards. Derived from
 * the placement table's own group, never a hand-copied list (the S7
 * WORLD_RISK_IDS / S9 USA_TIER*_IDS / S12 EUROPE_EU_IDS discipline,
 * per-group).
 */
export const ASIA_CHINA_IDS: readonly IndicatorId[] = pageGroupIds('asia-pacific', 'china');

/**
 * The Japan section (§9 item 2): jgb-10y · boj-rate · japan-cpi (the
 * §15 Japan CPI fill LANDED in the S25 fill session — BD-S23a).
 */
export const ASIA_JAPAN_IDS: readonly IndicatorId[] = pageGroupIds('asia-pacific', 'japan');

/**
 * The Korea · Taiwan · Hong Kong section (§9 item 3): korea-cpi — the
 * §15 Korea CPI fill LANDED (BD-S23a). KOSPI · TAIEX · HSI ride the
 * markets board / the Asia zoom map (the section's intro copy says so).
 */
export const ASIA_KOREA_TAIWAN_HK_IDS: readonly IndicatorId[] = pageGroupIds('asia-pacific', 'korea-taiwan-hk');

/**
 * The India section (§9 item 4): india-cpi — the §15 India CPI fill
 * LANDED (BD-S23a; the mirror lags MoSPI by 1–3 months, labelled).
 * NIFTY50 rides the markets board / the Asia zoom map.
 */
export const ASIA_INDIA_IDS: readonly IndicatorId[] = pageGroupIds('asia-pacific', 'india');

/**
 * The Pacific — New Zealand section (§9 item 5, D-17): nz-short-rate ·
 * nz-10y. NZX50 rides the AU Markets board (the S21 mirror card in the
 * section renders its row; the board's home is /australia).
 */
export const ASIA_PACIFIC_NZ_IDS: readonly IndicatorId[] = pageGroupIds('asia-pacific', 'pacific-nz');

/**
 * Every Asia registry card id, section order (China 7 · Japan 3 ·
 * Korea/Taiwan/HK 1 · India 1 · Pacific-NZ 2 = 14 in all — the S25
 * fill session added the three §15 D-36 CPI cards, BD-S23a).
 */
export const ASIA_CARD_IDS: readonly IndicatorId[] = [
  ...ASIA_CHINA_IDS,
  ...ASIA_JAPAN_IDS,
  ...ASIA_KOREA_TAIWAN_HK_IDS,
  ...ASIA_INDIA_IDS,
  ...ASIA_PACIFIC_NZ_IDS,
];

/**
 * The literal union that keeps the display + copy maps TOTAL (a missing
 * key is a typecheck error, never a runtime undefined). asia-tiles.test.ts
 * pins this list against the placement's own groups byte-for-byte.
 */
export type AsiaCardId =
  | 'china-pmi'
  | 'china-cpi'
  | 'oecd-cli-cn'
  | 'gpr-china'
  | 'gpr-taiwan'
  | 'china-property-investment'
  | 'china-steel-output'
  | 'jgb-10y'
  | 'boj-rate'
  | 'japan-cpi'
  | 'korea-cpi'
  | 'india-cpi'
  | 'nz-short-rate'
  | 'nz-10y';

/** One card's reading (undefined = the id is absent from the served
 *  projection — public mode's honest gap, never a guess). */
export interface AsiaCardEntry {
  id: AsiaCardId;
  reading: IndicatorReading | undefined;
}

/**
 * One section's cards in placement order, straight off the projection
 * (the S7 worldRiskCards / S9 usaCards / S12 europeCards pattern: the
 * readings arrive already in placement order — the projection is built
 * from `pageReadingIds` — this only joins them).
 */
export function asiaCards(readings: readonly IndicatorReading[], ids: readonly IndicatorId[]): AsiaCardEntry[] {
  const byId = new Map(readings.map((r) => [r.id as string, r]));
  return ids.map((id) => ({ id: id as AsiaCardId, reading: byId.get(id) }));
}

/* ------------------------------------------------------------------ *
 * The cards' display configs — the DISPLAY registry's own values for the
 * 11 Asia ids, restated here so the lean Asia chunk does not pull the
 * config module chain (the S3 GlobalBoard / S5 GOLD_DISPLAY / S7
 * WORLD_RISK_DISPLAY / S9 USA_CARD_DISPLAY / S12 EUROPE_CARD_DISPLAY
 * pattern). The decimals/units/scale are pinned against config/display.ts
 * by asia-tiles.test.ts — and the VALUE RENDER is pinned against
 * `formatReadingValue` output-for-output over every id × both locales
 * (a stronger pin than a table echo: the restated join can never drift
 * from the legacy renderer).
 *
 * Asia's 11 ids span FOUR unit families: percent (the rates + CPI),
 * points (none today — kept for parity with the europe-tiles contract),
 * index (the PMI + CLI + GPR cards) and tonnes (china-steel-output, the
 * NBS's own 10,000-ton unit scaled to millions of tonnes — the ONE id
 * that carries a display `scale`, the only Asia id beyond Europe's
 * three-unit lean render). The equivalence pin proves the join matches
 * formatReadingValue over all four shapes.
 * ------------------------------------------------------------------ */

export type AsiaUnitToken = 'percent' | 'points' | 'index' | 'tonnes';

export interface AsiaCardDisplayConfig {
  decimals: number;
  unit: AsiaUnitToken;
  /** The multiplicative display scale (china-steel-output's 1e-2 — the
   *  NBS 10,000-ton unit → millions of tonnes). Absent → 1 (no scale). */
  scale?: number;
}

export const ASIA_CARD_DISPLAY: Readonly<Record<AsiaCardId, AsiaCardDisplayConfig>> = {
  'china-pmi': { decimals: 1, unit: 'index' },
  'china-cpi': { decimals: 1, unit: 'percent' },
  'oecd-cli-cn': { decimals: 1, unit: 'index' },
  'gpr-china': { decimals: 2, unit: 'index' },
  'gpr-taiwan': { decimals: 2, unit: 'index' },
  'china-property-investment': { decimals: 1, unit: 'percent' },
  'china-steel-output': { decimals: 1, unit: 'tonnes', scale: 1e-2 },
  'jgb-10y': { decimals: 2, unit: 'percent' },
  'boj-rate': { decimals: 2, unit: 'percent' },
  // S25 (BD-S23a): the three §15 D-36 CPI cards — the china-cpi percent
  // convention (1dp).
  'japan-cpi': { decimals: 1, unit: 'percent' },
  'korea-cpi': { decimals: 1, unit: 'percent' },
  'india-cpi': { decimals: 1, unit: 'percent' },
  'nz-short-rate': { decimals: 2, unit: 'percent' },
  'nz-10y': { decimals: 2, unit: 'percent' },
};

/** The locale-dependent unit labels the value render joins (the corpus's
 *  own units block, pinned by asia-copy-pin.test.ts). */
export interface AsiaUnitLabels {
  percent: string;
  points: string;
  index: string;
  tonnes: string;
}

/**
 * One card's VALUE — the DISPLAY registry's own render, restated lean
 *  (the indicatorValueParts + formatIndicatorValue join): percent binds
 *  tight ('3.50%' / '۳٫۵۰٪'), the word units (points · index · tonnes)
 *  suffix with a space ('1.28 pts' / '73.6 m tonnes'). The tonnes unit
 *  applies the display scale (value × scale) before formatting — exactly
 *  the formatIndicatorValue join for this unit shape. null = the reading
 *  is absent or carries no value (the honest unavailable word, never a
 *  guess).
 *
 * Pinned output-for-output against `formatReadingValue` over every id ×
 * both locales by asia-tiles.test.ts — the lean restatement can never
 * drift from the legacy renderer.
 */
export function asiaCardValueText(
  id: AsiaCardId,
  reading: IndicatorReading | undefined,
  numberLocale: 'en-US' | 'fa-IR',
  units: AsiaUnitLabels,
): string | null {
  if (reading === undefined || reading.value === null) return null;
  const cfg = ASIA_CARD_DISPLAY[id];
  const num = formatNumber(reading.value * (cfg.scale ?? 1), numberLocale, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  });
  const unit = units[cfg.unit];
  if (!unit) return num;
  // percent binds tight (both locales); points, index and tonnes suffix
  // with a space — exactly the formatIndicatorValue join for these unit
  // shapes (tonnes is NOT in PREFIXED_UNITS, so it falls to the default
  // suffix-with-space path, same as points and index).
  if (cfg.unit === 'percent') return `${num}${unit}`;
  return `${num} ${unit}`;
}
