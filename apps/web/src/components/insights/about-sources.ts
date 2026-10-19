/**
 * about-sources.ts — v3 UI_SPEC §10 UI-49 (2026-10-20, PH6-C): the pure
 * builder behind "About this data"'s per-source table.
 *
 * The ROWS derive from the generated audit sidecar
 * (data/indicator-audit.json — the same file full-export.ts imports for
 * the E-23 export columns): each sidecar entry is one indicator's licence
 * + level + kill-switch fact. The table GROUPS those per-indicator entries
 * into ONE ROW PER PROVIDER (the provider token each indicator's
 * definition declares — fred, rba, abs, …). Per provider the row carries:
 *
 *   Source (display name, link to the terms page) · Attribution · Licence
 *   name(s) · Level badge (L0..L3, worst across the provider's series) ·
 *   Enabled / kill-switch state (all on · all off · n of m off).
 *
 * The terms lines themselves are NOT in the sidecar, so the table stops at
 * the five columns above (the brief's honest limit).
 *
 * The display names, attribution strings and terms URLs MIRROR the risk
 * register (packages/insights/src/sources.ts SOURCE_RISK_REGISTER — the
 * register is not exported to the web package, and importing it would ship
 * its quoted terms corpus into the page bundle). about-sources.test.ts
 * re-reads that file as text and fails the build when this mirror drifts;
 * the register stays the source of truth. 'derived' has no register row by
 * design (its cards inherit through their upstream legs) and says so
 * honestly.
 *
 * In public mode the table still renders: it is metadata about sources,
 * not data (UI-49).
 */

/** The reuse-risk ladder's levels (mirrors the register's SourceLevel). */
export type AboutSourceLevel = 'L0' | 'L1' | 'L2' | 'L3';

const LEVEL_RANK: Record<AboutSourceLevel, number> = { L0: 0, L1: 1, L2: 2, L3: 3 };

/** The per-indicator audit facts the rows group (the sidecar's entries). */
export interface AboutSourceSidecarEntry {
  id: string;
  licenceName: string;
  level: AboutSourceLevel;
  enabled: boolean;
}

/** One provider's aggregated row (UI-49's table row). */
export interface AboutSourceRow {
  /** The provider token the definitions declare ('fred', 'rba', …). */
  provider: string;
  /** Display name (mirrors the register row's label). */
  name: string;
  /** The terms/home page to link, or null when the register has none. */
  url: string | null;
  /** The attribution text to show (mirrors the register row's attribution). */
  attribution: string;
  /** Unique licence names across the provider's series, first-appearance order. */
  licences: readonly string[];
  /** Unique levels across the provider's series, ascending. */
  levels: readonly AboutSourceLevel[];
  /** The WORST level — the badge's text; honesty: restrictions apply if any series is restricted. */
  worstLevel: AboutSourceLevel;
  /** How many of the provider's series the M-6 kill switch leaves enabled. */
  enabledCount: number;
  /** How many series the provider feeds. */
  seriesCount: number;
}

/**
 * The provider mirror. Keys are the IndicatorSource tokens the definitions
 * declare. Every value quotes (or, for fred's two register rows, joins) the
 * register's own label/attribution/termsUrl — pinned by about-sources.test.ts.
 */
export const ABOUT_PROVIDER_META: Readonly<
  Record<
    string,
    { name: string; attribution: string; url: string | null }
  >
> = {
  rba: {
    // register row 'rba-tables'
    name: 'Reserve Bank of Australia (statistical tables)',
    attribution: 'Source: Reserve Bank of Australia',
    url: 'https://www.rba.gov.au/copyright/',
  },
  abs: {
    // register row 'abs-data'
    name: 'Australian Bureau of Statistics',
    attribution: 'Source: Australian Bureau of Statistics',
    url: 'https://www.abs.gov.au/about/copyright-and-disclaimer',
  },
  fred: {
    // register rows 'fred-public' + 'fred-copyright' — one provider, two
    // licence tiers; the attribution joins both rows' fragments verbatim.
    name: 'FRED, Federal Reserve Bank of St. Louis',
    attribution: 'Source: FRED, Federal Reserve Bank of St. Louis · © Cboe, via FRED (for VIX)',
    url: 'https://fred.stlouisfed.org/legal/',
  },
  ecb: {
    // register row 'ecb-portal'
    name: 'ECB Data Portal',
    attribution: 'Source: European Central Bank',
    url: 'https://data.ecb.europa.eu/',
  },
  frankfurter: {
    // register row 'ecb-frankfurter'
    name: 'ECB reference rates via the Frankfurter project',
    attribution: 'Source: European Central Bank (reference rates via Frankfurter)',
    url: 'https://frankfurter.dev/license/',
  },
  'world-bank': {
    // register row 'world-bank'
    name: 'World Bank (Commodity Markets “Pink Sheet”)',
    attribution: 'Source: World Bank',
    url: 'https://www.worldbank.org/en/about/legal/terms-of-use',
  },
  'gold-api': {
    // register row 'gold-api'
    name: 'gold-api.com',
    attribution: 'Data: gold-api.com',
    url: 'https://gold-api.com/terms',
  },
  'alternative-me': {
    // register row 'alternative-me'
    name: 'Alternative.me (Crypto Fear and Greed)',
    attribution: 'Source: Alternative.me Crypto Fear and Greed Index',
    url: 'https://alternative.me/crypto/fear-and-greed-index/',
  },
  manual: {
    // register row 'nbs-china'
    name: 'China NBS (manual entry)',
    attribution: 'Source: National Bureau of Statistics of China',
    url: 'https://www.stats.gov.cn/english/',
  },
  shiller: {
    // register row 'shiller'
    name: 'Robert Shiller dataset (ie_data)',
    attribution: 'Data: Robert Shiller, Yale',
    url: 'https://shillerdata.com/',
  },
  derived: {
    // No register row by design: derived cards inherit through their
    // upstream legs (sources.ts riskRowForLeg); the row says so honestly.
    name: 'Currena’s own computed series',
    attribution: 'Computed by Currena from the upstream sources in this table; their terms apply.',
    url: null,
  },
};

/**
 * Parse the sidecar's raw JSON into the per-indicator facts, failing
 * visible: an entry missing its id/licence/level/enabled is SKIPPED, never
 * guessed (an unknown level string cannot badge a row). The component feeds
 * this the imported sidecar; the test pins the malformed-input skips.
 */
export function aboutSidecarEntriesOf(raw: unknown): readonly AboutSourceSidecarEntry[] {
  // null/undefined/non-object payloads carry no array — fail visible, never
  // throw (the table simply stays absent).
  const indicators = (raw as { indicators?: unknown } | null | undefined)?.indicators;
  if (!Array.isArray(indicators)) return [];
  return indicators.flatMap((entry) => {
    const e = entry as { id?: unknown; licenceName?: unknown; level?: unknown; enabled?: unknown } | null;
    return typeof e?.id === 'string' && typeof e?.licenceName === 'string' &&
      (e?.level === 'L0' || e?.level === 'L1' || e?.level === 'L2' || e?.level === 'L3') &&
      typeof e?.enabled === 'boolean'
      ? [{ id: e.id, licenceName: e.licenceName, level: e.level, enabled: e.enabled }]
      : [];
  });
}

/**
 * Group the sidecar's per-indicator entries into one row per provider.
 *
 * providerOf joins an indicator id to its definition's provider token (the
 * caller passes definitionFor().source — the join the web already holds);
 * an id with no provider renders no row (the table lists sources, not
 * unknown ids). Rows sort by display name so the table order is stable
 * across sidecar regenerations.
 */
export function aboutSourceRows(
  entries: readonly AboutSourceSidecarEntry[],
  providerOf: (id: string) => string,
): readonly AboutSourceRow[] {
  const byProvider = new Map<string, {
    licences: string[];
    licenceSet: Set<string>;
    levelSet: Set<AboutSourceLevel>;
    enabledCount: number;
    seriesCount: number;
  }>();
  for (const entry of entries) {
    const provider = providerOf(entry.id);
    let group = byProvider.get(provider);
    if (group === undefined) {
      group = { licences: [], licenceSet: new Set(), levelSet: new Set(), enabledCount: 0, seriesCount: 0 };
      byProvider.set(provider, group);
    }
    group.seriesCount += 1;
    if (entry.enabled) group.enabledCount += 1;
    if (!group.licenceSet.has(entry.licenceName)) {
      group.licenceSet.add(entry.licenceName);
      group.licences.push(entry.licenceName);
    }
    group.levelSet.add(entry.level);
  }
  const rows: AboutSourceRow[] = [];
  for (const [provider, group] of byProvider) {
    const levels = [...group.levelSet].sort((a, b) => LEVEL_RANK[a] - LEVEL_RANK[b]);
    const meta = ABOUT_PROVIDER_META[provider];
    rows.push({
      provider,
      name: meta?.name ?? provider,
      url: meta !== undefined ? meta.url : null,
      attribution: meta?.attribution ?? '',
      licences: group.licences,
      levels,
      worstLevel: levels[levels.length - 1] ?? 'L0',
      enabledCount: group.enabledCount,
      seriesCount: group.seriesCount,
    });
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows;
}

/**
 * The kill-switch cell's display state: all on, all off, or honestly mixed
 * ("3 of 12 switched off" — the M-6 switch can disable a source's whole
 * feed or leave the provider's other series live).
 */
export function aboutEnabledState(row: AboutSourceRow): 'on' | 'off' | 'mixed' {
  if (row.enabledCount === 0) return 'off';
  if (row.enabledCount === row.seriesCount) return 'on';
  return 'mixed';
}
