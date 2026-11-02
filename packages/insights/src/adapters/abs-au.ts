/**
 * abs-au.ts — gap-closure S5-M5.2 (2026-11-02): the Australian macro
 * family's ABS collection. Eight series off the SAME keyless SDMX host the
 * live `abs` provider already uses (data.api.abs.gov.au serves Worker
 * egress — the S1-M1.1 probe; the monthly CPI has run from the Worker
 * since 2026-10-06), every series key verified from the structure
 * endpoints + live responses 2026-11-02 (M5.1 — VERIFIED-SOURCES.md, the
 * fixtures under fixtures/s5/):
 *
 *   au-gdp-growth        ANA_AGG/M1.GPM.20.AUS.Q   chain-volume GDP level
 *                         (quarterly $m; the YoY % is COMPUTED — the
 *                         provider's own M2 QoQ cross-check lives in the
 *                         fixture pair)
 *   au-trade-balance     ITGS/M1.170.20.AUS.M      Balance on goods, SA
 *                         (DATA_ITEM 170 — the balance is SERVED, never
 *                         computed; $m)
 *   au-household-spend.  HSI_M/9.TOT.CUR.10.AUS.M  through-the-year % —
 *                         the CEASED Retail Trade flow's successor (the
 *                         RT dataflow's own description reads "CEASED …
 *                         discontinued", all RT data ends 2025-06; the
 *                         Monthly Household Spending Indicator is the
 *                         ABS's own replacement, catalogue 5682.0)
 *   au-building-approv.  BA_GCCSA/1.1.9.1.100.10.AUS.M  dwelling units
 *                         approved, NEW residential, ORIGINAL terms (no SA
 *                         variant exists in the SDMX API for the national
 *                         total — verified M5.1)
 *   au-population-growth ERP_COMP_Q/10.AUS.Q       Estimated Resident
 *                         Population level (thousands; the YoY % is
 *                         COMPUTED)
 *   au-nom               ERP_COMP_Q/9.AUS.Q        Net Overseas Migration,
 *                         the quarterly level (thousands) — COMPANION-ONLY
 *                         (renders INSIDE the population card)
 *   au-participation     LF/M12.3.1599.20.AUS.M    participation rate,
 *                         persons, SA — the SAME flow/key family as the
 *                         live au-unemployment (M13 sibling)
 *   au-underemployment   LF_UNDER/M23.3.1599.20.AUS.M  underemployment
 *                         rate, proportion of labour force, persons, SA —
 *                         the LF flow carries NO underemployment measures
 *                         (probed M5.1); the LF_UNDER mirror flow is the
 *                         only SDMX home
 *
 * The ids' readings are context-only (G-5, the shadow-lane discipline);
 * their fetches ride the rung3 'abs-au-macro' extra source (never the
 * 04:10 main rung — the free-tier budget table); the Node venue collects
 * the same series inline (the venues cannot drift). One honest attempt
 * per series (F-11); a failed fetch fails soft (the reading carries).
 */

import type { IndicatorId, InsightsSourceReport } from '@currena/core';
import { classifySourceError, insightsFetch } from './fetch-policy';
import { providerFetchEnabled } from '../sources';
import { yoyPctSeries, type SeriesPoint } from '../series';
import { parseAbsSdmxCsv } from '../parsers';
import { ABS_DATA_BASE } from './abs';
import type { FetchDeps } from './types';

/** The raw ABS series keys the S5 family consumes (verified M5.1). */
export const ABS_AU_SERIES = {
  gdpChainVolume: 'ANA_AGG/M1.GPM.20.AUS.Q',
  tradeBalance: 'ITGS/M1.170.20.AUS.M',
  householdSpendingTty: 'HSI_M/9.TOT.CUR.10.AUS.M',
  dwellingApprovals: 'BA_GCCSA/1.1.9.1.100.10.AUS.M',
  erp: 'ERP_COMP_Q/10.AUS.Q',
  nom: 'ERP_COMP_Q/9.AUS.Q',
  participation: 'LF/M12.3.1599.20.AUS.M',
  underemployment: 'LF_UNDER/M23.3.1599.20.AUS.M',
} as const;

/** The indicator ids this family owns (rides CARRY_FORWARD_IDS; the
 * history phases exclude them — the rung3 phase writes its own keys). */
export const ABS_AU_IDS: readonly IndicatorId[] = [
  'au-gdp-growth',
  'au-trade-balance',
  'au-household-spending',
  'au-building-approvals',
  'au-population-growth',
  'au-nom',
  'au-participation',
  'au-underemployment',
];

/** One ABS series' full-history CSV URL (the existing abs.ts key shape). */
function absAuUrl(key: string): string {
  if (!/^[A-Za-z0-9_.]+(\/[A-Za-z0-9_.]+)+$/.test(key)) {
    throw new Error(`ABS: series key "${key}" is malformed`);
  }
  return `${ABS_DATA_BASE}/${key}?format=csv`;
}

/** Fetch + parse one ABS AU series (full history; NoRecordsFound fails loud). */
async function fetchAbsAuSeries(key: string, deps: FetchDeps = {}): Promise<SeriesPoint[]> {
  const res = await insightsFetch(absAuUrl(key), {}, deps);
  const text = await res.text();
  if (text.trim() === 'NoRecordsFound') {
    throw new Error(`ABS: series "${key}" returned NoRecordsFound (key or flow changed upstream?)`);
  }
  return parseAbsSdmxCsv(text);
}

/** The collection's output: the DERIVED indicator series + honest report rows. */
export interface AbsAuCollectResult {
  series: Partial<Record<IndicatorId, SeriesPoint[]>>;
  reports: InsightsSourceReport[];
}

/**
 * Collect the eight ABS AU series and derive the indicator series.
 * Fail-soft per series (the collect discipline — one honest attempt, a
 * failed fetch logs its row and the affected reading carries). The two
 * growth ids derive YoY from the fetched LEVELS (the same yoyPctSeries
 * the CPI cards use — the provider's own percentage-change conventions
 * are cross-checks, not inputs: the GDP fixture pair pins M2's QoQ 0.4
 * against the computed 0.42).
 */
export async function collectAbsAuMacro(deps: FetchDeps = {}): Promise<AbsAuCollectResult> {
  const reports: InsightsSourceReport[] = [];
  const series: Partial<Record<IndicatorId, SeriesPoint[]>> = {};

  async function fetchLogged(id: IndicatorId, label: string, fn: () => Promise<SeriesPoint[]>): Promise<SeriesPoint[] | undefined> {
    const source = 'abs';
    if (!providerFetchEnabled(source)) {
      reports.push({ source, ok: false, detail: `${label}: skipped — source disabled (kill switch M-6)`, kind: 'disabled' });
      return undefined;
    }
    try {
      const value = await fn();
      reports.push({ source, ok: true, detail: `${label}: ${value.length} obs`, kind: 'fetched' });
      return value;
    } catch (err) {
      const kind = classifySourceError(err);
      const detail =
        kind === 'blocked'
          ? `${label}: blocked by the site — no retry, waiting for the next scheduled refresh (${err instanceof Error ? err.message : String(err)})`
          : kind === 'format-changed'
            ? `${label}: format changed — the card shows can't tell right now until the shape is re-verified (${err instanceof Error ? err.message : String(err)})`
            : `${label}: ${err instanceof Error ? err.message : String(err)}`;
      reports.push({ source, ok: false, detail, kind });
      return undefined;
    }
  }

  const gdp = await fetchLogged('au-gdp-growth', 'ABS GDP chain volume (ANA_AGG M1.GPM.20.AUS.Q)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.gdpChainVolume, deps),
  );
  const trade = await fetchLogged('au-trade-balance', 'ABS balance on goods (ITGS M1.170.20.AUS.M)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.tradeBalance, deps),
  );
  const spending = await fetchLogged('au-household-spending', 'ABS household spending tty% (HSI_M 9.TOT.CUR.10.AUS.M)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.householdSpendingTty, deps),
  );
  const approvals = await fetchLogged('au-building-approvals', 'ABS dwelling approvals (BA_GCCSA 1.1.9.1.100.10.AUS.M)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.dwellingApprovals, deps),
  );
  const erp = await fetchLogged('au-population-growth', 'ABS estimated resident population (ERP_COMP_Q 10.AUS.Q)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.erp, deps),
  );
  const nom = await fetchLogged('au-nom', 'ABS net overseas migration (ERP_COMP_Q 9.AUS.Q)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.nom, deps),
  );
  const participation = await fetchLogged('au-participation', 'ABS participation rate (LF M12.3.1599.20.AUS.M)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.participation, deps),
  );
  const underemployment = await fetchLogged('au-underemployment', 'ABS underemployment rate (LF_UNDER M23.3.1599.20.AUS.M)', () =>
    fetchAbsAuSeries(ABS_AU_SERIES.underemployment, deps),
  );

  // The derivations (pure, shared with the phase):
  //  - GDP growth: the YoY % of the chain-volume level (quarterly).
  //  - Population growth: the YoY % of the ERP level (quarterly).
  //  - The other six: the provider's own series verbatim.
  if (gdp !== undefined && gdp.length > 0) series['au-gdp-growth'] = yoyPctSeries(gdp);
  if (trade !== undefined && trade.length > 0) series['au-trade-balance'] = trade;
  if (spending !== undefined && spending.length > 0) series['au-household-spending'] = spending;
  if (approvals !== undefined && approvals.length > 0) series['au-building-approvals'] = approvals;
  if (erp !== undefined && erp.length > 0) series['au-population-growth'] = yoyPctSeries(erp);
  if (nom !== undefined && nom.length > 0) series['au-nom'] = nom;
  if (participation !== undefined && participation.length > 0) series['au-participation'] = participation;
  if (underemployment !== undefined && underemployment.length > 0) series['au-underemployment'] = underemployment;

  return { series, reports };
}
