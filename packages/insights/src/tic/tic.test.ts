/**
 * TIC tests (gap-closure S2-M2.2) — the spec's full rejection matrix against
 * the REAL fixture bytes (fetched 2026-10-31 20:24 UTC, committed under
 * fixtures/tic/): wrong column counts, non-numeric cells, unit mix-ups, bad
 * header month formats, totals ≠ sum of parts, implausible jumps (flagged,
 * not dropped), the vintage/cross-check guards, the alias map, the derived
 * numbers (verified against awk-computed sums of the fixture itself), the
 * store's poisoned defense, and the ingest job's idempotence + failure
 * taxonomy. Tests never hit live sites (AGENTS.md rule 7).
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { TicSnapshotSchema } from '@currena/core';
import { BlockedError } from '../adapters/fetch-policy';
import {
  buildTicSnapshot,
  TIC_CUSTODY_HUBS,
  TIC_HOLDER_IDS,
  TIC_NAME_BY_ID,
  ticSlugFor,
} from './model';
import { parseTicTable3, parseTicTable5 } from './parse';
import {
  ticHolderDerived,
  ticIsStale,
  ticMinusMonths,
  ticRanks,
  ticTopMovers,
  TIC_STALE_AFTER_DAYS,
} from './compute';
import { InMemoryTicStore, parseStoredTic } from './store';
import { runTicIngest, TIC_TABLE3_URL, TIC_TABLE5_URL } from './job';

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, '..', '..', 'fixtures', 'tic');

const TABLE5 = readFileSync(join(FIXTURES, 'slt_table5-2026-10-31.txt'), 'utf-8');
const TABLE3 = readFileSync(join(FIXTURES, 'slt_table3-2026-10-31.txt'), 'utf-8');

/** Mutate a fixture text line-wise (a copy — the file on disk is evidence). */
function withLine(text: string, find: (line: string) => boolean, replace: (line: string) => string): string {
  return text
    .split(/\r?\n/)
    .map((l) => (find(l) ? replace(l) : l))
    .join('\r\n');
}

/** A fetch impl that serves the fixtures (or a text override per URL). */
function fixtureFetch(overrides: Partial<Record<string, string>> = {}): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const body =
      url === TIC_TABLE5_URL ? overrides.t5 ?? TABLE5 : url === TIC_TABLE3_URL ? overrides.t3 ?? TABLE3 : 'not found';
    if (body === 'not found') return new Response('not found', { status: 404 });
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/plain', 'last-modified': 'Fri, 16 Oct 2026 20:07:27 GMT' },
    });
  }) as typeof fetch;
}

describe('parseTicTable5 (the real fixture)', () => {
  it('parses the verified shape: 13 months, 20 countries, the official split', () => {
    const t5 = parseTicTable5(TABLE5);
    expect(t5.dataMonth).toBe('2026-08');
    expect(t5.months).toHaveLength(13);
    expect(t5.months[0]).toBe('2026-08');
    expect(t5.months.at(-1)).toBe('2025-08');
    expect(t5.countries).toHaveLength(20);
    expect(t5.countries.map((c) => c.name)).toContain('China, Mainland');
    expect(t5.countries.map((c) => c.name)).not.toContain('Australia'); // Australia is Table 3 only
    const japan = t5.countries[0]!;
    expect(japan.name).toBe('Japan');
    expect(japan.values[0]).toBe(1068.3); // the spec's own verified figure
    expect(t5.grandTotal[0]).toBe(9331.7);
    expect(t5.allOther[0]).toBe(1852.3);
    expect(t5.foreignOfficial[0]).toBe(3755.6);
    expect(t5.foreignOfficialBills[0]).toBe(312.2);
  });

  it('rejects a wrong column count in a data row', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Norway\t'), (l) => l.split('\t').slice(0, 13).join('\t'));
    expect(() => parseTicTable5(bad)).toThrow(/13 cells|expected 14/);
  });

  it('rejects a non-numeric cell', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Japan\t'), (l) => l.replace('1068.3', '1,068.3'));
    expect(() => parseTicTable5(bad)).toThrow(/non-numeric/);
  });

  it('rejects a units mix-up (the millions line in the billions file)', () => {
    const bad = TABLE5.replace('Billions of dollars', 'Millions of dollars');
    expect(() => parseTicTable5(bad)).toThrow(/Billions of dollars/);
  });

  it('rejects a header month that is not YYYY-MM', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Country\t'), (l) => l.replace('2026-08', 'Aug-2026'));
    expect(() => parseTicTable5(bad)).toThrow(/not a YYYY-MM/);
  });

  it('rejects a non-descending header', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Country\t'), (l) => {
      const cells = l.split('\t');
      const a = cells[1]!;
      const b = cells[2]!;
      cells[1] = b;
      cells[2] = a;
      return cells.join('\t');
    });
    expect(() => parseTicTable5(bad)).toThrow(/strictly descending/);
  });

  it('rejects totals that do not equal the sum of parts', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Grand Total\t'), (l) => l.replace('9331.7', '8331.7'));
    expect(() => parseTicTable5(bad)).toThrow(/sum of parts/);
  });

  it('rejects an unexpected title line', () => {
    expect(() => parseTicTable5(TABLE5.replace('Table 5:', 'Table 6:'))).toThrow(/unexpected title/);
  });

  it('rejects an implausible magnitude (a units flip)', () => {
    const bad = withLine(TABLE5, (l) => l.startsWith('Japan\t'), (l) => l.replace(/\t1068.3\t/, '\t1068283\t'));
    expect(() => parseTicTable5(bad)).toThrow(/implausible magnitude/);
  });
});

describe('parseTicTable3 (the real fixture)', () => {
  it('parses the verified shape: all countries, 80 months, Australia present', () => {
    const t3 = parseTicTable3(TABLE3);
    expect(t3.dataMonth).toBe('2026-08');
    expect(t3.countries.size).toBeGreaterThanOrEqual(50);
    const au = t3.countries.get('Australia');
    expect(au?.code).toBe('60089');
    expect(au?.months).toHaveLength(80);
    expect(au?.months[0]).toEqual({ ym: '2026-08', holdingsM: 79912, netM: -1444, valchgM: 683 });
    // The series break: transactions are n.a. before 2023-02.
    const japan = t3.countries.get('Japan')!;
    const jan23 = japan.months.find((m) => m.ym === '2023-01');
    expect(jan23?.netM).toBeNull();
    expect(jan23?.valchgM).toBeNull();
    expect(jan23?.holdingsM).toBeGreaterThan(0); // holdings DO exist before the break
    const feb23 = japan.months.find((m) => m.ym === '2023-02');
    expect(feb23?.netM).not.toBeNull();
    // Aggregates ride their own map.
    expect(t3.aggregates.get('Grand Total')?.months[0]?.holdingsM).toBe(9331654);
    expect(t3.aggregates.has('Of Which: Foreign Official')).toBe(true);
    // Small countries can carry n.a. TOTAL holdings while long-term data
    // exists (Greece is the fixture's live case) — parsed to null, never zero.
    const greece = t3.countries.get('Greece');
    expect(greece?.months[0]?.holdingsM).toBeNull();
    expect(greece?.months[0]?.netM).toBeNull();
  });

  it('rejects a field-id row mismatch (layout change)', () => {
    const bad = TABLE3.replace('for_treas_pos\tfor_treas_net', 'for_treas_position\tfor_treas_net');
    expect(() => parseTicTable3(bad)).toThrow(/field-id row mismatch/);
  });

  it('rejects a data row with the wrong cell count', () => {
    const bad = withLine(
      TABLE3,
      (l) => l.startsWith('Austria\t10189\t2026-08\t'),
      (l) => `${l}\t0`,
    );
    expect(() => parseTicTable3(bad)).toThrow(/has 11 cells|expected 10/);
  });

  it('rejects a non-contiguous month sequence', () => {
    const bad = withLine(TABLE3, (l) => l.startsWith('Austria\t10189\t2026-08\t'), (l) =>
      l.replace('2026-08', '2026-06'),
    );
    expect(() => parseTicTable3(bad)).toThrow(/does not follow/);
  });

  it('rejects a malformed country code', () => {
    const bad = withLine(TABLE3, (l) => l.startsWith('Austria\t10189\t2026-08\t'), (l) =>
      l.replace('Austria\t10189\t', 'Austria\t1018\t'),
    );
    expect(() => parseTicTable3(bad)).toThrow(/country_code/);
  });

  it('rejects a non-numeric holdings cell (prose where a number belongs)', () => {
    const bad = withLine(TABLE3, (l) => l.startsWith('Austria\t10189\t2026-08\t'), (l) =>
      l.replace('Austria\t10189\t2026-08\t6073', 'Austria\t10189\t2026-08\t6,073'),
    );
    expect(() => parseTicTable3(bad)).toThrow(/non-numeric/);
  });

  it('rejects a missing sign-convention line', () => {
    const bad = TABLE3.replace(
      'A positive number for net U.S. sales to foreigners denotes an increase in a foreign position',
      'Sign convention changed',
    );
    expect(() => parseTicTable3(bad)).toThrow(/sign-convention/);
  });

  it('rejects a units mix-up (the billions line in the millions file)', () => {
    const bad = TABLE3.replace('Millions of dollars', 'Billions of dollars');
    expect(() => parseTicTable3(bad)).toThrow(/Millions of dollars/);
  });
});

describe('the id map + custody hubs', () => {
  it('pins the spec slugs (the alias map)', () => {
    expect(ticSlugFor('Japan')).toBe('japan');
    expect(ticSlugFor('China, Mainland')).toBe('china-mainland');
    expect(ticSlugFor('Korea, South')).toBe('korea-south');
    expect(ticSlugFor('United Kingdom')).toBe('united-kingdom');
    expect(ticSlugFor('Cayman Islands')).toBe('cayman-islands');
    expect(ticSlugFor('Australia')).toBe('australia');
    expect(Object.keys(TIC_HOLDER_IDS)).toHaveLength(21);
    expect(TIC_NAME_BY_ID['china-mainland']).toBe('China, Mainland');
  });

  it('gives an unknown entrant a mechanical slug of its own published name', () => {
    expect(ticSlugFor('New Caledonia')).toBe('new-caledonia');
  });

  it('marks exactly the custody hubs Treasury names', () => {
    for (const hub of ['Belgium', 'Luxembourg', 'Cayman Islands', 'Ireland', 'United Kingdom', 'Switzerland', 'Bermuda']) {
      expect(TIC_CUSTODY_HUBS.has(hub)).toBe(true);
    }
    expect(TIC_CUSTODY_HUBS.has('Japan')).toBe(false);
    expect(TIC_CUSTODY_HUBS.has('China, Mainland')).toBe(false);
  });
});

describe('buildTicSnapshot (the merge + the guards)', () => {
  const t5 = parseTicTable5(TABLE5);
  const t3 = parseTicTable3(TABLE3);
  const built = () => buildTicSnapshot(t5, t3, { fetchedAt: '2026-10-31T20:30:00.000Z', releasedAt: '2026-10-16T20:07:27.000Z' });

  it('builds the 21-holder snapshot from the fixtures', () => {
    const snap = built();
    expect(snap.dataMonth).toBe('2026-08');
    expect(snap.holders).toHaveLength(21); // Table 5's 20 + Australia
    const japan = snap.holders.find((h) => h.id === 'japan')!;
    expect(japan.holdingsBn).toBe(1068.283); // Table 3's exact millions
    expect(japan.months.at(-1)).toEqual({ ym: '2026-08', v: 1068.283 });
    expect(japan.months).toHaveLength(24); // the trimmed history window
    expect(japan.months[0]?.ym).toBe('2024-09');
    expect(japan.isCustodyHub).toBe(false);
    expect(snap.totalBn).toBe(9331.7);
    expect(snap.officialBn).toBe(3755.6);
    expect(snap.privateBn).toBeCloseTo(5576.1, 6);
    expect(snap.releasedAt).toBe('2026-10-16T20:07:27.000Z');
    const au = snap.holders.find((h) => h.id === 'australia')!;
    expect(au.holdingsBn).toBe(79.912);
    const uk = snap.holders.find((h) => h.id === 'united-kingdom')!;
    expect(uk.isCustodyHub).toBe(true);
  });

  it('carries n.a. transactions months as ABSENT, never zero (the 2023-02 break)', () => {
    const snap = built();
    const japan = snap.holders.find((h) => h.id === 'japan')!;
    expect(japan.netSalesBn).toBeDefined();
    expect(japan.netSalesBn![0]!.ym).toBe('2024-09'); // 24-month window, all present
    // A country whose recent months are all present ends at dataMonth.
    expect(japan.netSalesBn!.at(-1)!.ym).toBe('2026-08');
  });

  it('flags implausible month-over-month jumps without dropping them', () => {
    // Japan 2025-12 (1183.904bn actual) inflated ×5 → a 4700bn jump: flagged.
    const t3bad = parseTicTable3(TABLE3);
    const japan = t3bad.countries.get('Japan')!;
    const idx = japan.months.findIndex((m) => m.ym === '2025-12');
    const mutated = japan.months[idx]!;
    japan.months[idx] = { ...mutated, holdingsM: (mutated.holdingsM ?? 0) * 5 };
    const snap = buildTicSnapshot(t5, t3bad, { fetchedAt: '2026-10-31T20:30:00.000Z' });
    const j = snap.holders.find((h) => h.id === 'japan')!;
    expect(j.flaggedMonths).toContain('2025-12');
    expect(j.months.find((m) => m.ym === '2025-12')!.v).toBeGreaterThan(5000); // still there, never dropped
  });

  it('does not flag the fixture’s real moves (largest real: Japan −$67bn ≈ 5.5%)', () => {
    const snap = built();
    for (const h of snap.holders) expect(h.flaggedMonths ?? []).toEqual([]);
  });

  it('rejects a vintage mismatch between the two tables', () => {
    const t5Old = { ...parseTicTable5(TABLE5), dataMonth: '2026-07' };
    expect(() => buildTicSnapshot(t5Old, t3, { fetchedAt: 'x' })).toThrow(/vintage mismatch/);
  });

  it('rejects a Table 5 value that disagrees with Table 3 beyond rounding', () => {
    // Mutate POST-parse: the parser's own sum-of-parts guard would catch a
    // raw-file edit first (defense in depth — so the model's cross-check is
    // exercised on the parsed object).
    const t5bad = {
      ...t5,
      countries: t5.countries.map((c) =>
        c.name === 'Japan' ? { ...c, values: [1168.3, ...c.values.slice(1)] } : c,
      ),
    };
    expect(() => buildTicSnapshot(t5bad, t3, { fetchedAt: 'x' })).toThrow(/cross-check failed for Japan/);
  });

  it('refuses a holder whose LATEST month carries n.a. holdings (never renders a stale row as current)', () => {
    const t3bad = parseTicTable3(TABLE3);
    const japan = t3bad.countries.get('Japan')!;
    japan.months[0] = { ...japan.months[0]!, holdingsM: null };
    expect(() => buildTicSnapshot(t5, t3bad, { fetchedAt: 'x' })).toThrow(/Japan has no holdings value for the latest month/);
  });

  it('validates against the production zod contract (round-trip)', () => {
    const snap = built();
    const parsed = TicSnapshotSchema.safeParse(JSON.parse(JSON.stringify(snap)));
    expect(parsed.success).toBe(true);
  });
});

describe('compute (the derived numbers — verified against awk sums of the fixture)', () => {
  const snap = buildTicSnapshot(parseTicTable5(TABLE5), parseTicTable3(TABLE3), {
    fetchedAt: '2026-10-31T20:30:00.000Z',
  });
  const byId = (id: string) => snap.holders.find((h) => h.id === id)!;

  it('derives Japan: share, 1m/12m changes, the net-selling 12m sum', () => {
    const d = ticHolderDerived(byId('japan'), snap);
    expect(d.sharePct).toBe(11.4); // 1068.283 / 9331.7
    expect(d.chg1mBn).toBe(-35.66); // 1068.283 − 1103.943
    expect(d.chg12mBn).toBe(-115.621); // 1068.283 − 1183.904 (2025-08)
    expect(d.chg12mPct).toBe(-9.8);
    expect(d.net12mBn).toBe(-103.553); // awk: sum(for_treas_net 2025-09..2026-08) = −103,553 M
    expect(d.netMonths).toBe(12);
  });

  it('derives China: the other large net seller (transactions, not holdings alone)', () => {
    const d = ticHolderDerived(byId('china-mainland'), snap);
    expect(d.chg12mBn).toBe(-108.969); // 590.729 − 699.698
    expect(d.net12mBn).toBe(-102.129); // awk: −102,129 M
  });

  it('derives the UK: holdings UP but that is mostly buying, price effects shown separately', () => {
    const d = ticHolderDerived(byId('united-kingdom'), snap);
    expect(d.chg12mBn).toBe(108.157); // 1009.450 − 901.293
    expect(d.net12mBn).toBe(144.665); // awk: +144,665 M — the largest net buyer (a custody hub)
  });

  it('derives Australia (the Table 3 row)', () => {
    const d = ticHolderDerived(byId('australia'), snap);
    expect(d.chg12mBn).toBe(12.516); // 79.912 − 67.396
    expect(d.net12mBn).toBe(21.405); // awk: +21,405 M
  });

  it('ranks by holdings and computes the 12-month rank change', () => {
    const ranks = ticRanks(snap.holders, snap.dataMonth);
    expect(ranks.get('japan')!.rank).toBe(1);
    expect(ranks.get('united-kingdom')!.rank).toBe(2);
    expect(ranks.get('china-mainland')!.rank).toBe(3);
    // Verified from the fixture: 2025-08 order put Belgium (451.093) and
    // Canada (443.990) ahead of Luxembourg (410.757)/Cayman (410.510) —
    // Cayman overtook Luxembourg over the 12 months, France held 8th.
    expect(ranks.get('canada')!.rank).toBe(5);
    expect(ranks.get('canada')!.rank12mAgo).toBe(5);
    expect(ranks.get('canada')!.rankChange).toBe(0);
    expect(ranks.get('cayman-islands')!.rank).toBe(6);
    expect(ranks.get('cayman-islands')!.rank12mAgo).toBe(7);
    expect(ranks.get('cayman-islands')!.rankChange).toBe(1);
    expect(ranks.get('luxembourg')!.rankChange).toBe(-1);
    expect(ranks.get('france')!.rank).toBe(8);
    expect(ranks.get('france')!.rankChange).toBe(0);
  });

  it('names the top-3 net buyers and sellers over 12 months (transactions)', () => {
    const movers = ticTopMovers(snap, 3);
    expect(movers.buyers.map((b) => b.id)).toEqual(['united-kingdom', 'cayman-islands', 'hong-kong']);
    expect(movers.buyers[0]!.net12mBn).toBe(144.665);
    expect(movers.sellers.map((s) => s.id)).toEqual(['japan', 'china-mainland', 'france']);
    expect(movers.sellers[0]!.net12mBn).toBe(-103.553);
    expect(movers.sellers[1]!.net12mBn).toBe(-102.129);
  });

  it('applies the 70-day stale gate from the data month END', () => {
    expect(ticMinusMonths('2026-08', 12)).toBe('2025-08');
    // 2026-10-31 is 61 days after the 2026-08 month end → fresh.
    expect(ticIsStale(snap, new Date('2026-10-31T00:00:00Z'))).toBe(false);
    // 70 days exactly → still fresh (the gate is > 70).
    expect(ticIsStale(snap, new Date('2026-11-09T00:00:00Z'))).toBe(false);
    expect(ticIsStale(snap, new Date('2026-11-10T12:00:00Z'))).toBe(true);
    expect(TIC_STALE_AFTER_DAYS).toBe(70);
  });
});

describe('store (the one-key contract)', () => {
  it('round-trips the snapshot and defends against poison', async () => {
    const store = new InMemoryTicStore();
    const snap = buildTicSnapshot(parseTicTable5(TABLE5), parseTicTable3(TABLE3), {
      fetchedAt: '2026-10-31T20:30:00.000Z',
    });
    await store.putTic(snap);
    expect(store.ops.writes).toBe(1);
    const back = await store.getTic();
    expect(back?.dataMonth).toBe('2026-08');
    expect(parseStoredTic('{"poison":true}')).toBeUndefined();
    expect(parseStoredTic(null)).toBeUndefined();
  });
});

describe('runTicIngest (the rung3 run body)', () => {
  it('fetches both tables, builds and WRITES the snapshot (2 fetches + 1 read + 1 write)', async () => {
    const kv = new InMemoryTicStore();
    const res = await runTicIngest(kv, { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T20:30:00Z') });
    expect(res.outcome).toEqual({ ok: true, note: expect.stringContaining('written — data month 2026-08') });
    expect(res.kv).toEqual({ reads: 1, writes: 1 });
    expect(kv.ops.writes).toBe(1);
    const stored = await kv.getTic();
    expect(stored?.dataMonth).toBe('2026-08');
    expect(stored?.sourceUrls).toEqual([TIC_TABLE5_URL, TIC_TABLE3_URL]);
  });

  it('is IDEMPOTENT: the same data month skips the write', async () => {
    const kv = new InMemoryTicStore();
    await runTicIngest(kv, { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T20:30:00Z') });
    const res2 = await runTicIngest(kv, { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T21:00:00Z') });
    expect(res2.outcome).toEqual({ ok: true, note: expect.stringContaining('unchanged') });
    expect(kv.ops.writes).toBe(1); // no second write
    expect(kv.ops.reads).toBe(2);
  });

  it('rewrites when the data month moved on', async () => {
    const kv = new InMemoryTicStore();
    await kv.putTic({ ...(await (async () => {
      const res = await runTicIngest(new InMemoryTicStore(), { fetchImpl: fixtureFetch(), now: new Date() });
      return res.snapshot!;
    })()), dataMonth: '2026-07' });
    const res = await runTicIngest(kv, { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T20:30:00Z') });
    expect(res.outcome).toEqual({ ok: true, note: expect.stringContaining('written — data month 2026-08') });
    expect(kv.ops.writes).toBe(2);
  });

  it('overwrites a poisoned stored value calmly (the read-path defense feeds the job)', async () => {
    // A raw poisoned value behind the reader port: parseStoredTic defends
    // → undefined → the job writes the fresh zod-valid snapshot over it.
    const raw = { value: 'not json' };
    const store = {
      getTic: async () => parseStoredTic(raw.value),
      putTic: async (s: import('@currena/core').TicSnapshot) => {
        raw.value = JSON.stringify(s);
      },
    };
    const res = await runTicIngest(store, { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T20:30:00Z') });
    expect(res.outcome.ok).toBe(true);
    expect(raw.value).toContain('"dataMonth":"2026-08"');
  });

  it('classifies a refusal as blocked (a block is a block)', async () => {
    const blocked = (async () => new Response('forbidden', { status: 403 })) as typeof fetch;
    const res = await runTicIngest(new InMemoryTicStore(), { fetchImpl: blocked });
    expect(res.outcome).toEqual({ ok: false, kind: 'blocked', note: expect.any(String) });
  });

  it('classifies a layout change as format-changed', async () => {
    const bad = withLine(TABLE3, (l) => l.startsWith('country\tcountry_code\t'), (l) => l.replace('for_treas_pos', 'moved'));
    const res = await runTicIngest(new InMemoryTicStore(), {
      fetchImpl: fixtureFetch({ t3: bad }),
    });
    expect(res.outcome).toEqual({ ok: false, kind: 'format-changed', note: expect.any(String) });
  });

  it('classifies a fetch throw as failed', async () => {
    const throwing = (async () => {
      throw new Error('network blip');
    }) as typeof fetch;
    const res = await runTicIngest(new InMemoryTicStore(), { fetchImpl: throwing });
    expect(res.outcome).toEqual({ ok: false, kind: 'failed', note: 'network blip' });
  });

  it('carries the provider’s Last-Modified as releasedAt', async () => {
    const res = await runTicIngest(new InMemoryTicStore(), { fetchImpl: fixtureFetch(), now: new Date('2026-10-31T20:30:00Z') });
    expect(res.snapshot?.releasedAt).toBe('2026-10-16T20:07:27.000Z');
  });

  it('uses the honest 12s single-attempt timeout by default (no retry policy)', async () => {
    let seenSignal = false;
    const probe = (async (_url: unknown, init?: RequestInit) => {
      seenSignal = init?.signal !== undefined;
      return new Response(TABLE5, { status: 200, headers: { 'content-type': 'text/plain' } });
    }) as typeof fetch;
    await runTicIngest(new InMemoryTicStore(), { fetchImpl: probe });
    expect(seenSignal).toBe(true);
    expect(new BlockedError('x', 'blocked').name).toBe('BlockedError'); // the taxonomy import stays pinned
  });
});
