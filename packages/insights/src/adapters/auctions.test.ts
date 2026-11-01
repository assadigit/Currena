/**
 * auctions.test.ts — gap-closure S3-M3.5 (2026-11-01): the Treasury
 * FiscalData auction families. Fixture: the 4000-row page[size]=4000
 * response recorded 2026-11-01 (packages/insights/fixtures/s3/
 * treasury-auctions-full-2026-11-01.json, verbatim — tests never hit live
 * sites).
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { DEFINITIONS } from '../definitions';
import {
  AUCTIONS_FIELDS,
  AUCTIONS_PAGE_SIZE,
  auctionsUrl,
  parseAuctionsQuery,
  selectAuctionFamily,
} from './auctions';

const here = dirname(fileURLToPath(import.meta.url));
const fixture = readFileSync(
  join(here, '..', '..', 'fixtures', 's3', 'treasury-auctions-full-2026-11-01.json'),
  'utf8',
);

describe('the request shape (the M3.1-verified contract)', () => {
  it('is ONE request: page[size]=4000, sort=-auction_date, the six documented fields', () => {
    expect(AUCTIONS_PAGE_SIZE).toBe(4000);
    expect([...AUCTIONS_FIELDS]).toEqual([
      'auction_date',
      'original_security_term',
      'bid_to_cover_ratio',
      'indirect_bidder_accepted',
      'total_accepted',
      'inflation_index_security',
    ]);
    const url = auctionsUrl();
    expect(url).toContain('page%5Bsize%5D=4000');
    expect(url).toContain('sort=-auction_date');
    expect(url).toContain(
      'fields=auction_date%2Coriginal_security_term%2Cbid_to_cover_ratio%2Cindirect_bidder_accepted%2Ctotal_accepted%2Cinflation_index_security',
    );
    // No filters on the URL — every FILTER on this endpoint is silently
    // ignored (the M3.1 live finding); selection is client-side only.
    expect(url).not.toContain('filter=');
    expect(url).not.toMatch(/security_term=/);
  });
});

describe('parseAuctionsQuery (fail closed on shape)', () => {
  it('parses the 4000-row fixture and keeps every result-bearing row', () => {
    const rows = parseAuctionsQuery(fixture);
    expect(rows.length).toBeGreaterThan(1000); // the full all-types window
    // The fixture's own five pending rows (string "null" results, e.g. the
    // 2026-10-22 5-Year TIPS) are skipped, not parsed.
    expect(rows.every((r) => Number.isFinite(r.bidToCover))).toBe(true);
    expect(rows.some((r) => r.auctionDate === '2026-10-22' && r.originalSecurityTerm === '5-Year' && r.inflationIndexed)).toBe(false);
    for (const r of rows.slice(0, 50)) {
      expect(r.auctionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.originalSecurityTerm.length).toBeGreaterThan(0);
      expect(Number.isFinite(r.bidToCover)).toBe(true);
      expect(Number.isFinite(r.indirectAccepted)).toBe(true);
      expect(Number.isFinite(r.totalAccepted)).toBe(true);
    }
  });

  it('rejects a non-array envelope loudly', () => {
    expect(() => parseAuctionsQuery('{"data": {"oops": true}}')).toThrow(/envelope shape changed/);
    expect(() => parseAuctionsQuery('not json at all')).toThrow(/JSON parse failed/);
  });

  it('rejects rows with missing or malformed fields', () => {
    const base = {
      auction_date: '2026-10-07',
      original_security_term: '10-Year',
      bid_to_cover_ratio: '2.77',
      indirect_bidder_accepted: '31063238000',
      total_accepted: '39926321900',
      inflation_index_security: 'No',
    };
    expect(() => parseAuctionsQuery(JSON.stringify({ data: [{ ...base, auction_date: 'Oct 7' }] }))).toThrow(
      /malformed auction_date/,
    );
    expect(() => parseAuctionsQuery(JSON.stringify({ data: [{ ...base, original_security_term: '' }] }))).toThrow(
      /original_security_term/,
    );
    expect(() => parseAuctionsQuery(JSON.stringify({ data: [{ ...base, bid_to_cover_ratio: 'n/a' }] }))).toThrow(
      /non-finite/,
    );
  });

  it('skips pending-results rows (null results fields) and zero-takedown rows; rejects a window with no result-bearing rows', () => {
    // The provider serializes pending results as the STRING "null" (the
    // fixture's own convention — five such rows); JSON null also appears.
    const pending = {
      auction_date: '2026-10-29',
      original_security_term: '10-Year',
      bid_to_cover_ratio: 'null',
      indirect_bidder_accepted: 'null',
      total_accepted: 'null',
      inflation_index_security: 'No',
    };
    const pendingJsonNull = {
      auction_date: '2026-10-30',
      original_security_term: '10-Year',
      bid_to_cover_ratio: null,
      indirect_bidder_accepted: null,
      total_accepted: null,
      inflation_index_security: 'No',
    };
    const zero = {
      ...pending,
      auction_date: '2026-10-28',
      bid_to_cover_ratio: '2.5',
      indirect_bidder_accepted: '0',
      total_accepted: '0',
    };
    // An all-pending window fails closed (no result-bearing rows at all).
    expect(() => parseAuctionsQuery(JSON.stringify({ data: [pending, pendingJsonNull, zero] }))).toThrow(
      /no result-bearing rows/,
    );
    expect(() => parseAuctionsQuery(JSON.stringify({ data: [] }))).toThrow(/no result-bearing rows/);
  });
});

describe('selectAuctionFamily (the pure selection)', () => {
  const rows = parseAuctionsQuery(fixture);

  it('selects the 10-Year family: 125 auctions, latest btc 2.77 @ 2026-10-07 (ex TIPS, ex other terms)', () => {
    const ten = selectAuctionFamily(rows, '10-Year');
    expect(ten.btc.length).toBe(125);
    expect(ten.btc[0]!.date).toBe('2016-08-10');
    expect(ten.btc.at(-1)).toEqual({ date: '2026-10-07', value: 2.77 });
    // The indirect share of accepted at the latest auction: 31,063,238,000
    // of 39,926,321,900 accepted = 77.8014%.
    expect(ten.indirectShare.at(-1)!.value).toBeCloseTo(77.8014, 3);
  });

  it('selects the 30-Year family: 123 auctions, latest btc 2.54 @ 2026-10-08', () => {
    const thirty = selectAuctionFamily(rows, '30-Year');
    expect(thirty.btc.length).toBe(123);
    expect(thirty.btc.at(-1)).toEqual({ date: '2026-10-08', value: 2.54 });
    expect(thirty.indirectShare.at(-1)!.value).toBeCloseTo(70.4453, 3); // 15,866,059,500 of 22,522,535,300 accepted
  });

  it('excludes TIPS rows from the families (the inflation-indexed masquerade — the M3.1 finding)', () => {
    const raw = JSON.parse(fixture) as {
      data: { original_security_term: string; inflation_index_security: string; bid_to_cover_ratio: string | null }[];
    };
    const tips10 = raw.data.filter(
      (r) => r.original_security_term === '10-Year' && r.inflation_index_security === 'Yes' && r.bid_to_cover_ratio,
    );
    expect(tips10.length).toBeGreaterThan(0); // the fixture carries TIPS rows…
    const ten = selectAuctionFamily(rows, '10-Year');
    expect(ten.btc.length).toBe(125); // …and none of them join the family
    // The same selection WITHOUT the TIPS exclusion would find more rows.
    const familyRows = rows.filter((r) => r.originalSecurityTerm === '10-Year');
    expect(familyRows.length).toBe(ten.btc.length + tips10.length);
  });

  it('returns empty series (never throws) when the family is absent', () => {
    const empty = selectAuctionFamily([], '10-Year');
    expect(empty.btc).toEqual([]);
    expect(empty.indirectShare).toEqual([]);
  });
});

describe("the event-based stale rule (the spec's explicit demand)", () => {
  it('pins cadence monthly + staleAfterDays 45 for all four auction ids', () => {
    for (const id of [
      'treasury-auction-10y',
      'treasury-auction-10y-indirect',
      'treasury-auction-30y',
      'treasury-auction-30y-indirect',
    ] as const) {
      const def = DEFINITIONS.find((d) => d.id === id)!;
      expect(def.cadence, `${id} cadence`).toBe('monthly'); // the event rhythm: a fresh family auction lands roughly monthly
      expect(def.staleAfterDays, `${id} staleAfterDays`).toBe(45); // one missed or delayed cycle, then honest stale
      expect(def.rule.kind, `${id} rule`).toBe('info'); // context-only per G-5
    }
  });
});
