/**
 * auctions.ts — gap-closure S3-M3.5 (2026-11-01): the Treasury FiscalData
 * auction families — the demand side of the US Treasury market (the
 * 10-Year and 30-Year original-term families, bid-to-cover + the indirect
 * bidder share of accepted), the G4 "Treasury supply" leg beside the
 * deficit cards.
 *
 * VENUE CONSTRAINT (the S1-M1.1 probe, re-confirmed 2026-11-01):
 * api.fiscaldata.treasury.gov is BLOCKED from Cloudflare Worker egress
 * (timeout ×3 at 12 s/12 s/30 s while a normal client gets 200 JSON in
 * <1 s — 3.6 s / 803 KB measured 2026-11-01). The Node/GHA venue is the
 * ONLY production fetcher: scripts/ingest.ts runs collectTreasuryAuctions
 * inline; the Worker NEVER fetches this host (the ids ride RUNG4_IDS for
 * the carry + history-exclusion discipline — see adapters/rung4.ts).
 *
 * REQUEST SHAPE (M3.1-verified from the provider's own responses, re-probed
 * 2026-11-01): every FILTER is silently ignored on this endpoint
 * (security_type / security_term / original_security_term / auction_date
 * gte|eq — all return the unfiltered set; `filter=` 400s) while
 * `page[size]`, `sort` AND `fields=` all work. The design: ONE request —
 * page[size]=4000 (covers ~10.3 years of ALL auctions, 2016-07-18 →
 * 2026-10-22 measured), sort=-auction_date, fields=<the six documented
 * fields> — then CLIENT-SIDE family selection.
 *
 * FAMILY SELECTION (M3.1, from the response's own field values):
 * `original_security_term` is the family classifier (a 10y reopening reads
 * security_term "9-Year 10-Month" but original_security_term "10-Year");
 * `inflation_index_security` = "Yes" marks TIPS (must be excluded — a 10y
 * TIPS reopening otherwise masquerades as the note). The reading is the
 * newest family auction whose results have published (bid_to_cover_ratio
 * non-null); its asOf is the AUCTION date.
 *
 * Purity discipline: the parser fails closed on shape (envelope, required
 * fields, ISO dates, finite numerics); the family selection + the indirect
 * share are pure functions (unit-tested against the fixture).
 */

import type { InsightsSourceReport } from '@currena/core';
import { classifySourceError, insightsFetch } from './fetch-policy';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

/** The FiscalData auctions_query endpoint (M3.1-verified — never invented). */
export const AUCTIONS_URL =
  'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query';

/**
 * The six documented fields the request asks for (M3.1 + the 2026-11-01
 * re-probe: `fields=` works — the filters do not).
 */
export const AUCTIONS_FIELDS = [
  'auction_date',
  'original_security_term',
  'bid_to_cover_ratio',
  'indirect_bidder_accepted',
  'total_accepted',
  'inflation_index_security',
] as const;

/**
 * The single request: ~10.3 years of every auction (page[size]=4000
 * measured 2016-07-18 → 2026-10-22 on 2026-11-01; ~270–450 auctions/year
 * across all types), newest first, only the six documented fields
 * (~800 KB, ~3.6 s from a normal client).
 */
export const AUCTIONS_PAGE_SIZE = 4000;

/** The full request URL (the request-shape contract, pinned by test). */
export function auctionsUrl(): string {
  const params = new URLSearchParams({
    'page[size]': String(AUCTIONS_PAGE_SIZE),
    sort: '-auction_date',
    fields: AUCTIONS_FIELDS.join(','),
  });
  return `${AUCTIONS_URL}?${params.toString()}`;
}

/** One parsed auction row (the request's own six fields). */
export interface AuctionRow {
  auctionDate: string;
  /** The family classifier ("10-Year" / "30-Year" — the ORIGINAL term). */
  originalSecurityTerm: string;
  bidToCover: number;
  /** $ accepted by indirect bidders (the foreign/intermediary demand). */
  indirectAccepted: number;
  /** Total $ accepted (the takedown denominator). */
  totalAccepted: number;
  /** "Yes" marks TIPS (excluded from every family — an inflation-indexed
   * 10y reopening otherwise masquerades as the note; the M3.1 finding). */
  inflationIndexed: boolean;
}

/** Strict ISO calendar date (the provider's own auction_date format). */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** The envelope the parser fails closed against. */
interface AuctionsEnvelope {
  data: unknown;
}

/**
 * Parse the auctions_query envelope into validated rows. Fail closed on
 * shape: the envelope must carry an array; every row must carry the six
 * requested fields; dates must be ISO; the numerics finite. Rows whose
 * results have NOT published yet (null bid_to_cover_ratio) are SKIPPED
 * (an honest absent row, not an error — the reading is the newest auction
 * whose results are out).
 */
export function parseAuctionsQuery(jsonText: string): AuctionRow[] {
  let parsed: AuctionsEnvelope;
  try {
    parsed = JSON.parse(jsonText) as AuctionsEnvelope;
  } catch (err) {
    throw new Error(`auctions_query: JSON parse failed: ${err instanceof Error ? err.message : String(err)}`, { cause: err });
  }
  if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.data)) {
    throw new Error('auctions_query: envelope shape changed — no data[] array');
  }
  const out: AuctionRow[] = [];
  for (const raw of parsed.data) {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error('auctions_query: non-object row in data[]');
    }
    const row = raw as Record<string, unknown>;
    const auctionDate = row['auction_date'];
    const term = row['original_security_term'];
    const btc = row['bid_to_cover_ratio'];
    const indirect = row['indirect_bidder_accepted'];
    const total = row['total_accepted'];
    const tips = row['inflation_index_security'];
    if (typeof auctionDate !== 'string' || !DATE_RE.test(auctionDate)) {
      throw new Error(`auctions_query: malformed auction_date ${JSON.stringify(auctionDate)}`);
    }
    if (typeof term !== 'string' || term.length === 0) {
      throw new Error(`auctions_query: missing original_security_term @ ${auctionDate}`);
    }
    if (typeof tips !== 'string') {
      throw new Error(`auctions_query: missing inflation_index_security @ ${auctionDate}`);
    }
    // Results pending on a brand-new auction: skip the row (the reading
    // stays the newest auction whose results have published). The provider
    // serializes absent results as the STRING "null" (verified in the
    // fixture: five such rows, e.g. the 2026-10-22 5-Year TIPS) — treat
    // JSON null, undefined, '' and 'null' all as absent.
    const absent = (v: unknown): boolean =>
      v === null || v === undefined || v === '' || v === 'null';
    if (absent(btc) || absent(indirect) || absent(total)) {
      continue;
    }
    const bidToCover = Number(btc);
    const indirectAccepted = Number(indirect);
    const totalAccepted = Number(total);
    if (!Number.isFinite(bidToCover) || !Number.isFinite(indirectAccepted) || !Number.isFinite(totalAccepted)) {
      throw new Error(`auctions_query: non-finite numerics @ ${auctionDate} (btc=${String(btc)})`);
    }
    if (totalAccepted <= 0) {
      continue; // a zero-takedown row carries no share — skip, never invent
    }
    out.push({
      auctionDate,
      originalSecurityTerm: term,
      bidToCover,
      indirectAccepted,
      totalAccepted,
      inflationIndexed: tips === 'Yes',
    });
  }
  if (out.length === 0) {
    throw new Error('auctions_query: no result-bearing rows in the window');
  }
  return out;
}

/** One auction family's derived series (the reading + its history base). */
export interface AuctionFamilySeries {
  /** bid_to_cover_ratio per family auction, ascending by auction date. */
  btc: SeriesPoint[];
  /** indirect share of accepted, % (0–100), ascending by auction date. */
  indirectShare: SeriesPoint[];
}

/**
 * Select one original-term family from the parsed rows (pure): the family
 * classifier + the TIPS exclusion (inflation_index_security=Yes rows never
 * join a family), ascending by auction date. Returns empty series when the
 * family has no result-bearing non-TIPS auctions in the window (the caller
 * fails closed — no reading that run).
 */
export function selectAuctionFamily(rows: readonly AuctionRow[], originalTerm: '10-Year' | '30-Year'): AuctionFamilySeries {
  const family = rows
    .filter((r) => r.originalSecurityTerm === originalTerm && !r.inflationIndexed)
    .sort((a, b) => (a.auctionDate < b.auctionDate ? -1 : a.auctionDate > b.auctionDate ? 1 : 0));
  const btc: SeriesPoint[] = [];
  const indirectShare: SeriesPoint[] = [];
  for (const r of family) {
    btc.push({ date: r.auctionDate, value: r.bidToCover });
    indirectShare.push({ date: r.auctionDate, value: Math.round((100 * r.indirectAccepted) / r.totalAccepted * 1e4) / 1e4 });
  }
  return { btc, indirectShare };
}

/** Fetch deps + the collect clock. */
export type AuctionsCollectDeps = FetchDeps & { now?: Date };

/** The auctions collect's output (the credit collect's shape). */
export interface AuctionsCollectResult {
  /** The four indicator series, pre-derived (the Rung4SeriesInputs.auctions shape). */
  series: {
    btc10y?: SeriesPoint[];
    indirect10y?: SeriesPoint[];
    btc30y?: SeriesPoint[];
    indirect30y?: SeriesPoint[];
  };
  /** The collect's outcome rows (appended to insights:status). */
  reports: InsightsSourceReport[];
}

/**
 * Collect the Treasury auction families — the Node venue's inline
 * collection (ONE honest single-attempt fetch; the 12 s default timeout
 * does NOT apply well to an ~800 KB answer from this host: the measured
 * 3.6 s needs headroom, so this fetch pins a 30 s budget — the TIC
 * precedent for a slow-but-reachable government host, still ONE attempt,
 * no retries, F-11). Fail-soft as a whole (one honest row); a failed
 * collect simply omits the four series and the readings carry.
 */
export async function collectTreasuryAuctions(deps: AuctionsCollectDeps = {}): Promise<AuctionsCollectResult> {
  const reports: InsightsSourceReport[] = [];
  const series: AuctionsCollectResult['series'] = {};
  try {
    const res = await insightsFetch(auctionsUrl(), {}, { ...deps, timeoutMs: 30_000 });
    const text = new TextDecoder().decode(await res.arrayBuffer());
    const rows = parseAuctionsQuery(text);
    const ten = selectAuctionFamily(rows, '10-Year');
    const thirty = selectAuctionFamily(rows, '30-Year');
    if (ten.btc.length === 0 || thirty.btc.length === 0) {
      throw new Error(`auctions_query: no result-bearing 10y/30y family auctions (${ten.btc.length}/${thirty.btc.length})`);
    }
    series.btc10y = ten.btc;
    series.indirect10y = ten.indirectShare;
    series.btc30y = thirty.btc;
    series.indirect30y = thirty.indirectShare;
    const latest10 = ten.btc.at(-1)!;
    const latest30 = thirty.btc.at(-1)!;
    reports.push({
      source: 'treasury-auctions',
      ok: true,
      detail: `auctions_query: ${rows.length} rows · 10y ${ten.btc.length} auctions (latest btc ${latest10.value} @ ${latest10.date}) · 30y ${thirty.btc.length} (latest btc ${latest30.value} @ ${latest30.date})`,
      kind: 'fetched',
    });
  } catch (err) {
    reports.push({
      source: 'treasury-auctions',
      ok: false,
      detail: `auctions_query: ${err instanceof Error ? err.message : String(err)}`,
      kind: classifySourceError(err),
    });
  }
  return { series, reports };
}
