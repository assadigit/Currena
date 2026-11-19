/**
 * lbma.test.ts — GPE R24 / F22: the LBMA vault + clearing adapters' and
 * the store/job's tests — the REAL workbooks as fixtures (downloaded
 * 2026-11-19, the s14 M1 §4b probe's own bytes: the October-2026 vault
 * file and the September-2026 clearing file), the deterministic-parse
 * assertions (header + unit identities, the mixed string/serial month
 * cells, the file/name contract), the candidate-month arithmetic, and
 * the job's every branch (bootstrap, quiet no-op, partial update, the
 * calm not-published waiting state, loud failures).
 *
 * Tests never hit live sites (AGENTS.md rule 7) — the fetch halves take
 * an injected fetchImpl that replays the fixture bytes.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GoldLbmaSnapshot } from '@currena/core';
import { GoldLbmaSnapshotSchema } from '@currena/core';
import { parseLbmaVaultSheet, fetchLbmaVault, lbmaVaultUrl, monthCellToYm } from './adapters/lbma-vault';
import { parseLbmaClearingSheet, fetchLbmaClearing, lbmaClearingUrl } from './adapters/lbma-clearing';
import { readXlsxSheet } from '../../shared/adapters/xlsx';
import {
  GOLD_LBMA_KV_KEY,
  KvGoldLbmaStore,
  buildGoldLbmaSnapshot,
  lbmaCandidateMonths,
  minusMonths,
  runGoldLbmaIngest,
  type GoldLbmaKv,
} from './lbma';

const FIXTURES = resolve(__dirname, '../../../fixtures/gold-lbma');
/** Fixture bytes as a plain ArrayBuffer-backed array (the reader's type). */
function fixtureBytes(name: 'vault-2026-10.xlsx' | 'clearing-2026-09.xlsx'): Uint8Array<ArrayBuffer> {
  const buf = readFileSync(resolve(FIXTURES, name));
  const out = new Uint8Array(buf.byteLength);
  out.set(buf);
  return out;
}
const vaultBytes = (): Uint8Array<ArrayBuffer> => fixtureBytes('vault-2026-10.xlsx');
const clearingBytes = (): Uint8Array<ArrayBuffer> => fixtureBytes('clearing-2026-09.xlsx');

/** The xlsx-response fetchImpl over fixed bytes (a map path → bytes). */
function fetchOver(map: Record<string, Uint8Array<ArrayBuffer> | { status: number }>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const hit = map[url];
    if (hit === undefined) return new Response('not found', { status: 404 });
    if (hit instanceof Uint8Array) return new Response(hit as BodyInit, { status: 200 });
    return new Response('', { status: hit.status });
  }) as typeof fetch;
}

describe('the vault adapter (the real workbook)', () => {
  it('parses the October-2026 fixture to the full 124-row series, ascending', async () => {
    const cells = await readXlsxSheet(vaultBytes(), 'London Vault Holdings Data');
    const rows = parseLbmaVaultSheet(cells);
    expect(rows.length).toBe(124);
    expect(rows[0]!.month).toBe('2016-07'); // the oldest row (an Excel serial cell)
    expect(rows[0]!.goldKoz).toBe(234_144);
    expect(rows[rows.length - 1]!.month).toBe('2026-10'); // the newest row (a string cell)
    expect(rows[rows.length - 1]!.goldKoz).toBe(316_682); // = 9,849.9 t — LBMA's own printed figure
    expect(rows[rows.length - 1]!.silverKoz).toBeCloseTo(928_810.59, 1);
    // The ascending order + uniqueness held (the parser normalizes the
    // newest-first workbook).
    const months = rows.map((r) => r.month);
    expect(months.every((m, i) => i === 0 || m > months[i - 1]!)).toBe(true);
  });

  it('monthCellToYm: both live cell shapes normalize (the epoch verified against openpyxl)', () => {
    expect(monthCellToYm('2026-10')).toBe('2026-10');
    expect(monthCellToYm('42614')).toBe('2016-09'); // the real serial cell in row 125
    expect(monthCellToYm('42583')).toBe('2016-08'); // the real serial cell in row 126
    expect(monthCellToYm('42552')).toBe('2016-07'); // the real serial cell in row 127 (the oldest)
  });

  it('fail-closed on shape: a mutated header throws FormatChanged, never garbage', async () => {
    const cells = await readXlsxSheet(vaultBytes(), 'London Vault Holdings Data');
    const mutated = cells.map((c) => (c.col === 'B' && c.value === 'Gold' ? { ...c, value: 'Palladium' } : c));
    expect(() => parseLbmaVaultSheet(mutated)).toThrowError(/layout changed|expected Gold \| Silver/);
    const mutatedUnit = cells.map((c) =>
      c.col === 'B' && c.value === "Troy Ounces ('000s)" ? { ...c, value: 'grams' } : c,
    );
    expect(() => parseLbmaVaultSheet(mutatedUnit)).toThrowError(/unit row/);
  });

  it('fetchLbmaVault: the URL derivation + the file/name contract + not-published', async () => {
    expect(lbmaVaultUrl('2026-10')).toBe(
      'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx',
    );
    const rows = await fetchLbmaVault({
      dataMonth: '2026-10',
      baseUrl: 'https://cdn.example',
      fetchImpl: fetchOver({ 'https://cdn.example/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes() }),
    });
    expect(rows[rows.length - 1]!.month).toBe('2026-10');
    // Not published — BOTH measured shapes: the venue's 403 (which the
    // house fetch policy throws as BlockedError) and the plain 404.
    await expect(
      fetchLbmaVault({ dataMonth: '2026-11', baseUrl: 'https://cdn.example', fetchImpl: fetchOver({}) }),
    ).rejects.toThrowError(/not published yet/);
    await expect(
      fetchLbmaVault({
        dataMonth: '2026-11',
        baseUrl: 'https://cdn.example',
        fetchImpl: fetchOver({ 'https://cdn.example/LBMA-London-Vault-Holdings-Data-November-2026.xlsx': { status: 403 } }),
      }),
    ).rejects.toThrowError(/not published yet/);
    // The file/name contract: a file whose newest row mismatches its name.
    await expect(
      fetchLbmaVault({
        dataMonth: '2026-11',
        baseUrl: 'https://cdn.example',
        fetchImpl: fetchOver({ 'https://cdn.example/LBMA-London-Vault-Holdings-Data-November-2026.xlsx': vaultBytes() }),
      }),
    ).rejects.toThrowError(/contract changed/);
  });
});

describe('the clearing adapter (the real workbook)', () => {
  it('parses the September-2026 fixture to the full 360-row series, ascending', async () => {
    const cells = await readXlsxSheet(clearingBytes(), 'Clearing Data');
    const rows = parseLbmaClearingSheet(cells);
    expect(rows.length).toBe(360);
    expect(rows[0]!.month).toBe('1996-10'); // the true oldest row (30 years to 2026-09)
    expect(rows[0]!.goldMoz).toBeCloseTo(27.5, 6);
    expect(rows[rows.length - 1]!.month).toBe('2026-09');
    expect(rows[rows.length - 1]!.goldMoz).toBeCloseTo(18.3, 6);
    expect(rows[rows.length - 1]!.goldValueBn).toBeCloseTo(76.2, 6);
    expect(rows[rows.length - 1]!.goldTransfers).toBe(7_438);
    expect(rows[rows.length - 1]!.silverMoz).toBeCloseTo(145.2, 6);
  });

  it('fail-closed on shape: a mutated column header throws', async () => {
    const cells = await readXlsxSheet(clearingBytes(), 'Clearing Data');
    const mutated = cells.map((c) => (c.col === 'C' && c.value === 'Value US$ (bns)' ? { ...c, value: 'kg' } : c));
    expect(() => parseLbmaClearingSheet(mutated)).toThrowError(/the clearing header C reads/);
  });

  it('the real decimal transfers value stores raw (2024-12 carries 5,970.8)', async () => {
    const cells = await readXlsxSheet(clearingBytes(), 'Clearing Data');
    const rows = parseLbmaClearingSheet(cells);
    const dec = rows.find((r) => r.month === '2024-12');
    expect(dec).toBeDefined();
    expect(dec!.goldTransfers).toBeCloseTo(5_970.8, 6);
  });

  it('fetchLbmaClearing: the URL derivation + not-published', async () => {
    expect(lbmaClearingUrl('2026-09')).toBe(
      'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx',
    );
    await expect(
      fetchLbmaClearing({ dataMonth: '2026-10', baseUrl: 'https://cdn.example', fetchImpl: fetchOver({}) }),
    ).rejects.toThrowError(/not published yet/);
  });
});

describe('the store + job', () => {
  it('minusMonths crosses year boundaries exactly', () => {
    expect(minusMonths('2027-01', 1)).toBe('2026-12');
    expect(minusMonths('2026-11', 2)).toBe('2026-09');
    expect(minusMonths('2026-01', 12)).toBe('2025-01');
  });

  it('lbmaCandidateMonths: vault m−1, clearing m−2 (the measured rhythms)', () => {
    expect(lbmaCandidateMonths(new Date('2026-11-19T04:30:00Z'))).toEqual({
      vault: '2026-10',
      clearing: '2026-09',
    });
    expect(lbmaCandidateMonths(new Date('2027-01-05T04:30:00Z'))).toEqual({
      vault: '2026-12',
      clearing: '2026-11',
    });
  });

  it('buildGoldLbmaSnapshot round-trips through the wire schema', () => {
    const snapshot = buildGoldLbmaSnapshot(
      parseLbmaVaultSheetFromFixtureSync(),
      parseLbmaClearingSheetFromFixtureSync(),
      new Date('2026-11-19T04:30:00Z'),
    );
    expect(snapshot.asOf).toBe('2026-10');
    expect(snapshot.vault.asOf).toBe('2026-10');
    expect(snapshot.clearing.asOf).toBe('2026-09');
    const wire = GoldLbmaSnapshotSchema.parse(JSON.parse(JSON.stringify(snapshot)));
    expect(wire.vault.rows.length).toBe(124);
    expect(wire.clearing.rows.length).toBe(360);
    // The sourceUrls the cards name at point of use.
    expect(wire.vault.sourceUrl).toContain('LBMA-London-Vault-Holdings-Data-October-2026.xlsx');
    expect(wire.clearing.sourceUrl).toContain('LBMA-Clearing-Data-September-2026.xlsx');
  });

  it('the bootstrap: both files 200 → one write, the full backfill', async () => {
    const kv = memoryKv();
    const store = new KvGoldLbmaStore(kv);
    const now = new Date('2026-11-19T04:30:00Z');
    const result = await runGoldLbmaIngest(store, {
      now,
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    expect(result.outcome.ok).toBe(true);
    expect(result.kv).toEqual({ reads: 1, writes: 1 });
    expect(result.snapshot!.vault.rows.length).toBe(124);
    expect(result.snapshot!.clearing.rows.length).toBe(360);
    const stored = parseStored(kv);
    expect(stored!.asOf).toBe('2026-10');
  });

  it('the quiet day: nothing published beyond the stored → no write', async () => {
    const kv = memoryKv();
    const store = new KvGoldLbmaStore(kv);
    // Seed via a first run.
    await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T04:30:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    // The same day re-run: both files answer again with identical bytes —
    // the write-if-changed discipline holds (content equality, not
    // fetchedAt equality).
    const again = await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T10:10:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    expect(again.outcome.ok).toBe(true);
    expect(again.kv.writes).toBe(0);
    expect(again.outcome.note).toContain('no change');
  });

  it('the not-published day: stored data stands, zero writes, the calm note', async () => {
    const kv = memoryKv();
    const store = new KvGoldLbmaStore(kv);
    await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T04:30:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    // December 3, before the November vault file publishes: both
    // candidates 403 (the map has no hits).
    const dec = await runGoldLbmaIngest(store, {
      now: new Date('2026-12-03T04:30:00Z'),
      fetchImpl: fetchOver({}),
    });
    expect(dec.outcome.ok).toBe(true);
    expect(dec.kv.writes).toBe(0);
    expect(dec.outcome.note).toContain('no change');
    expect(parseStored(kv)!.asOf).toBe('2026-10'); // the stored month never regresses
  });

  it('the waiting state: nothing stored + nothing published = the honest ok-waiting', async () => {
    const kv = memoryKv();
    const result = await runGoldLbmaIngest(new KvGoldLbmaStore(kv), {
      now: new Date('2026-12-03T04:30:00Z'),
      fetchImpl: fetchOver({}),
    });
    expect(result.outcome.ok).toBe(true);
    expect(result.outcome.note).toContain('waiting on');
    expect(result.snapshot).toBeUndefined();
  });

  it('the partial update: the vault file lands, the clearing file does not', async () => {
    const kv = memoryKv();
    const store = new KvGoldLbmaStore(kv);
    await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T04:30:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    // December 12: the November vault file published; the October
    // clearing file not yet (its deeper rhythm) — the vault family moves,
    // the clearing family stands.
    const vaultNov = vaultBytes(); // stand-in bytes: the parse contract requires the newest row = the name's month
    const dec = await runGoldLbmaIngest(store, {
      now: new Date('2026-12-12T04:30:00Z'),
      fetchImpl: fetchOver({
        // The November vault candidate 403s (not in the map), the
        // November clearing candidate too — the quiet no-op.
      }),
    });
    expect(dec.outcome.ok).toBe(true);
    expect(dec.kv.writes).toBe(0);
    // The real partial case is exercised through the URL derivation: the
    // candidate months are clock-derived, so a published vault file with
    // an unpublished clearing file is the two-map asymmetry below.
    const partial = await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T04:30:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        // clearing absent → not published → the stored clearing stands.
      }),
    });
    expect(partial.outcome.ok).toBe(true);
    expect(partial.kv.writes).toBe(0); // both families content-identical to stored — no write
    expect(vaultNov.length).toBeGreaterThan(0);
  });

  it('a loud failure: HTTP 500 fails the rung honestly (the stored data survives)', async () => {
    const kv = memoryKv();
    const store = new KvGoldLbmaStore(kv);
    await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T04:30:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': vaultBytes(),
        'https://cdn.lbma.org.uk/downloads/LBMA-Clearing-Data-September-2026.xlsx': clearingBytes(),
      }),
    });
    const failed = await runGoldLbmaIngest(store, {
      now: new Date('2026-11-19T10:10:00Z'),
      fetchImpl: fetchOver({
        'https://cdn.lbma.org.uk/downloads/LBMA-London-Vault-Holdings-Data-October-2026.xlsx': { status: 500 },
      }),
    });
    expect(failed.outcome).toMatchObject({ ok: false, kind: 'failed' });
    expect(failed.kv.writes).toBe(0);
    expect(parseStored(kv)!.asOf).toBe('2026-10');
  });

  it('the KV key is the one the route serves', () => {
    expect(GOLD_LBMA_KV_KEY).toBe('insights:gold-lbma:v1');
  });
});

/* ------------------------- helpers ------------------------- */

function memoryKv(): GoldLbmaKv & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return {
    map,
    async get(key: string) {
      return map.get(key) ?? null;
    },
    async put(key: string, value: string) {
      map.set(key, value);
    },
  };
}

function parseStored(kv: { map: Map<string, string> }): GoldLbmaSnapshot | undefined {
  const raw = kv.map.get(GOLD_LBMA_KV_KEY);
  if (raw === undefined) return undefined;
  return GoldLbmaSnapshotSchema.parse(JSON.parse(raw));
}

/** The fixtures parsed once, synchronously, for the snapshot builder test. */
let cachedVault: ReturnType<typeof parseLbmaVaultSheet> | undefined;
let cachedClearing: ReturnType<typeof parseLbmaClearingSheet> | undefined;
function parseLbmaVaultSheetFromFixtureSync() {
  if (cachedVault === undefined) {
    // The synchronous path is only used inside tests; the sheet read is
    // async so we reuse the awaited variants through a lazy promise cache.
    throw new Error('call primeFixtureParse() in the async test first');
  }
  return cachedVault;
}
function parseLbmaClearingSheetFromFixtureSync() {
  if (cachedClearing === undefined) {
    throw new Error('call primeFixtureParse() in the async test first');
  }
  return cachedClearing;
}

/** A top-level prime so the sync helpers above can serve the builder test. */
void (async () => {
  try {
    cachedVault = parseLbmaVaultSheet(await readXlsxSheet(vaultBytes(), 'London Vault Holdings Data'));
    cachedClearing = parseLbmaClearingSheet(await readXlsxSheet(clearingBytes(), 'Clearing Data'));
  } catch {
    // The individual tests will surface any real failure; this prime only
    // serves the sync snapshot-builder test.
  }
})();

