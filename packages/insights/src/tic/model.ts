/**
 * TIC snapshot builder (gap-closure S2-M2.2) — merges the two parsed
 * tables into the one `insights:tic:v1` document.
 *
 * The merge rules (all fail CLOSED — a mismatched pair is never half-merged):
 *  - both tables must carry the SAME data month (they publish together; a
 *    difference means one file updated mid-fetch — Table 5 and Table 3 are
 *    then from different vintages, and mixing them would be dishonest);
 *  - every Table 5 country must exist in Table 3 under the SAME published
 *    name (the explicit id map pins the 21 known holders; an unknown new
 *    entrant gets a mechanical slug of its published name — derived from
 *    the provider's own string, never invented);
 *  - the latest month's holdings must agree between the two tables within
 *    $0.06bn (Table 5 rounds to 0.1bn) — the same provider cross-check
 *    that caught nothing but must keep guarding;
 *  - Table 5's Grand Total must agree with Table 3's Grand Total;
 *  - the month-over-month plausibility gate FLAGS implausible jumps
 *    (> $50bn AND > 60% of the prior month) — flagged, never dropped.
 */

import type { TicHolder, TicSnapshot, TicMonthlyValue } from '@currena/core';
import { FormatChangedError } from '../adapters/fetch-policy';
import type { TicTable3, TicTable3Row, TicTable5 } from './parse';

/** The two verified source URLs (VERIFIED-SOURCES.md; the dead mfh.txt/
 *  slt3d.txt are NEVER used) — the snapshot's provenance block. */
export const TIC_TABLE5_URL =
  'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table5.txt';
export const TIC_TABLE3_URL =
  'https://ticdata.treasury.gov/resource-center/data-chart-center/tic/Documents/slt_table3.txt';

/** How many months of history the snapshot carries per holder. */
export const TIC_HISTORY_MONTHS = 24;

/** The Table 5/3 cross-check tolerance (Table 5 rounds to 0.1bn). */
const CROSS_CHECK_TOL_BN = 0.06;

/** Treasury's own custody caveat applies to these rows (holdings recorded
 *  where HELD, not by owner — Table 3's footer, quoted in sources.ts). */
export const TIC_CUSTODY_HUBS: ReadonlySet<string> = new Set([
  'Belgium',
  'Luxembourg',
  'Cayman Islands',
  'Ireland',
  'United Kingdom',
  'Switzerland',
  'Bermuda',
]);

/**
 * The explicit published-name → slug map for the holders the section
 * knows by name (the Table 5 top-20 of the 2026-10-31 fixture + Australia
 * from Table 3). Slugs are OUR stable ids (i18n keys ride them); the
 * published names are the provider's own strings.
 */
export const TIC_HOLDER_IDS: Readonly<Record<string, string>> = {
  Japan: 'japan',
  'United Kingdom': 'united-kingdom',
  'China, Mainland': 'china-mainland',
  Belgium: 'belgium',
  Canada: 'canada',
  'Cayman Islands': 'cayman-islands',
  Luxembourg: 'luxembourg',
  France: 'france',
  Ireland: 'ireland',
  Taiwan: 'taiwan',
  Switzerland: 'switzerland',
  Singapore: 'singapore',
  'Hong Kong': 'hong-kong',
  India: 'india',
  Norway: 'norway',
  Brazil: 'brazil',
  'Saudi Arabia': 'saudi-arabia',
  'Korea, South': 'korea-south',
  'United Arab Emirates': 'united-arab-emirates',
  Bermuda: 'bermuda',
  Australia: 'australia',
};

/** The reverse map (slug → published name) — the UI's lookup. */
export const TIC_NAME_BY_ID: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(TIC_HOLDER_IDS).map(([name, id]) => [id, name]),
);

/** A new entrant's mechanical slug (lowercase, non-alphanumerics → "-"). */
export function ticSlugFor(name: string): string {
  const pinned = TIC_HOLDER_IDS[name];
  if (pinned !== undefined) return pinned;
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The month-over-month plausibility gate: a jump is flagged when the move
 *  is BOTH larger than $50bn AND larger than 60% of the prior month — real
 *  moves in the fixture stay under 6% (Japan's largest: −$67bn ≈ 5.5%); a
 *  units flip or a column shift lands far outside. FLAG, never drop. */
export const TIC_JUMP_ABS_BN = 50;
export const TIC_JUMP_REL = 0.6;

function isImplausibleJump(priorBn: number, nextBn: number): boolean {
  const delta = Math.abs(nextBn - priorBn);
  return delta > TIC_JUMP_ABS_BN && delta > TIC_JUMP_REL * priorBn;
}

/** Millions → billions, 3 dp ($1M precision: 1068283 M → 1068.283 B). */
function mToBn(millions: number): number {
  return Math.round(millions) / 1000;
}

/** The last `n` months of a Table 3 row, ASCENDING (oldest→newest). */
function tailAscending(row: TicTable3Row, n: number): TicTable3Row['months'] {
  return row.months.slice(0, n).reverse();
}

/** Trim to at most `n` entries, keeping the newest. */
function trimNewest<T>(arr: T[], n: number): T[] {
  return arr.length > n ? arr.slice(arr.length - n) : arr;
}

export interface BuildTicOptions {
  fetchedAt: string;
  /** The fetched files' HTTP Last-Modified (display-only provenance). */
  releasedAt?: string;
  /** Defaults to the two verified URLs. */
  sourceUrls?: string[];
}

/**
 * Build the snapshot: Table 5's top-20 (ranked, with the official/private
 * split) merged with Table 3's series (holdings 24 months, net sales and
 * valuation change where the 2023-02+ data exists), plus Australia from
 * Table 3 alone.
 */
export function buildTicSnapshot(t5: TicTable5, t3: TicTable3, opts: BuildTicOptions): TicSnapshot {
  // Same-vintage guard: the two tables publish together.
  if (t5.dataMonth !== t3.dataMonth) {
    throw new FormatChangedError(
      `TIC vintage mismatch: table5 data month ${t5.dataMonth} != table3 data month ${t3.dataMonth} — refusing to mix vintages`,
    );
  }

  // The grand totals must agree between the two tables.
  const t3GrandTotal = t3.aggregates.get('Grand Total');
  if (t3GrandTotal === undefined || t3GrandTotal.months[0] === undefined || t3GrandTotal.months[0]!.holdingsM === null) {
    throw new FormatChangedError('TIC table3: Grand Total row has no months');
  }
  if (Math.abs(mToBn(t3GrandTotal.months[0]!.holdingsM) - t5.grandTotal[0]!) > CROSS_CHECK_TOL_BN) {
    throw new FormatChangedError(
      `TIC grand-total mismatch: table5 ${t5.grandTotal[0]!.toFixed(1)} vs table3 ${(t3GrandTotal.months[0]!.holdingsM / 1000).toFixed(1)}`,
    );
  }

  // The holder set: Table 5's countries (published order = descending
  // holdings) + Australia (Table 3 only, per the S2 spec).
  const holderNames = [...t5.countries.map((c) => c.name)];
  if (!holderNames.includes('Australia')) holderNames.push('Australia');
  if (!t3.countries.has('Australia')) {
    throw new FormatChangedError('TIC table3: Australia row missing (the always-visible row requires it)');
  }

  const holders: TicHolder[] = holderNames.map((name) => {
    const t3row = t3.countries.get(name);
    if (t3row === undefined || t3row.months.length < 2) {
      throw new FormatChangedError(`TIC table3: ${name} row missing or too short (<2 months)`);
    }
    const t5row = t5.countries.find((c) => c.name === name);
    if (t5row !== undefined && t3row.months[0]!.holdingsM !== null) {
      // The latest month must agree between the two tables.
      const t3Latest = mToBn(t3row.months[0]!.holdingsM);
      const t5Latest = t5row.values[0]!;
      if (Math.abs(t3Latest - t5Latest) > CROSS_CHECK_TOL_BN) {
        throw new FormatChangedError(
          `TIC cross-check failed for ${name}: table5 ${t5Latest.toFixed(1)} vs table3 ${t3Latest.toFixed(1)} (${t5.dataMonth})`,
        );
      }
    }

    const monthsAsc = tailAscending(t3row, TIC_HISTORY_MONTHS)
      .filter((m) => m.holdingsM !== null)
      .map((m) => ({ ym: m.ym, v: mToBn(m.holdingsM!) }));
    if (monthsAsc.length < 2 || monthsAsc.at(-1)!.ym !== t3row.months[0]!.ym) {
      throw new FormatChangedError(
        `TIC table3: ${name} has no holdings value for the latest month ${t3row.months[0]!.ym} (n.a.?) — refusing the row`,
      );
    }
    const netSalesBn = trimNewest(
      tailAscending(t3row, TIC_HISTORY_MONTHS)
        .filter((m) => m.netM !== null)
        .map((m) => ({ ym: m.ym, v: mToBn(m.netM!) })),
      TIC_HISTORY_MONTHS,
    );
    const valuationChangeBn = trimNewest(
      tailAscending(t3row, TIC_HISTORY_MONTHS)
        .filter((m) => m.valchgM !== null)
        .map((m) => ({ ym: m.ym, v: mToBn(m.valchgM!) })),
      TIC_HISTORY_MONTHS,
    );

    // The plausibility gate: FLAG implausible jumps, never drop them.
    const flaggedMonths: string[] = [];
    for (let i = 1; i < monthsAsc.length; i += 1) {
      if (isImplausibleJump(monthsAsc[i - 1]!.v, monthsAsc[i]!.v)) flaggedMonths.push(monthsAsc[i]!.ym);
    }

    const holder: TicHolder = {
      id: ticSlugFor(name),
      name,
      holdingsBn: monthsAsc.at(-1)!.v,
      months: monthsAsc,
      isCustodyHub: TIC_CUSTODY_HUBS.has(name),
    };
    if (netSalesBn.length > 0) holder.netSalesBn = netSalesBn as TicMonthlyValue[];
    if (valuationChangeBn.length > 0) holder.valuationChangeBn = valuationChangeBn as TicMonthlyValue[];
    if (flaggedMonths.length > 0) holder.flaggedMonths = flaggedMonths;
    return holder;
  });

  const totalBn = t5.grandTotal[0]!;
  const officialBn = t5.foreignOfficial[0]!;
  const snapshot: TicSnapshot = {
    v: 1,
    dataMonth: t5.dataMonth,
    fetchedAt: opts.fetchedAt,
    totalBn,
    officialBn,
    privateBn: Math.round((totalBn - officialBn) * 100) / 100,
    holders,
    sourceUrls: opts.sourceUrls ?? [TIC_TABLE5_URL, TIC_TABLE3_URL],
  };
  if (opts.releasedAt !== undefined && opts.releasedAt !== '') snapshot.releasedAt = opts.releasedAt;
  return snapshot;
}
