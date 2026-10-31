/**
 * insights-extra-rungs.test.ts — gap-closure S1-M1.7: the rung3/rung4
 * capacity scaffolding. The gates, the budget refusal, failure isolation,
 * the status record, and the sweep's heal arming — all pure/mock-KV, no
 * live sites.
 */

import { describe, expect, it } from 'vitest';
import {
  EXTRA_RUNG_SUBREQUEST_CEILING,
  EXTRA_SOURCES,
  type ExtraRungKv,
  type ExtraSourceDef,
  extraRungStatusKey,
  extraRungsNeedHealing,
  firstOfMonthGate,
  runExtraRung,
  ticReleaseAwareGate,
  weekdayGate,
} from './insights-extra-rungs';
import { insightsIngestRung, INGEST_CRON_HOUR } from './insights-ingest-cron';

/** A tiny in-memory KV (the rung's get/put surface). */
function mockKv(): ExtraRungKv & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    put: async (k, v) => {
      store.set(k, v);
    },
  };
}

const ENV = {} as unknown as Parameters<typeof runExtraRung>[0];

/** UTC timestamp helper (the rungs schedule on UTC hour:minute). */
function at(hour: number, minute: number, day = 25, month = 9): number {
  return Date.parse(
    `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00Z`,
  );
}

/** A test source factory (the registry override drives the real code path). */
function source(fields: Partial<ExtraSourceDef> & { id: string }): ExtraSourceDef {
  return {
    rung: 3,
    gate: () => true,
    budget: 1,
    run: async () => ({ ok: true }),
    ...fields,
  };
}

describe('the rung gates (S1-M1.7)', () => {
  it('04:30 maps to rung3 and 04:35 to rung4 — the slots were free', () => {
    expect(insightsIngestRung(at(INGEST_CRON_HOUR, 30))).toEqual({ kind: 'extra-3' });
    expect(insightsIngestRung(at(INGEST_CRON_HOUR, 35))).toEqual({ kind: 'extra-4' });
  });

  it('the neighbouring minutes stay ungated (no collisions with the existing rungs)', () => {
    for (const minute of [29, 31, 34, 36]) {
      expect(insightsIngestRung(at(INGEST_CRON_HOUR, minute))).toBeUndefined();
    }
    // The existing rungs keep their slots.
    expect(insightsIngestRung(at(INGEST_CRON_HOUR, 10))).toEqual({ kind: 'main' });
    expect(insightsIngestRung(at(INGEST_CRON_HOUR, 20))).toEqual({ kind: 'rung2' });
  });

  it('the day-gate helpers mirror the rung2 discipline', () => {
    expect(firstOfMonthGate(new Date(at(4, 30, 1, 10)))).toBe(true);
    expect(firstOfMonthGate(new Date(at(4, 30, 2, 10)))).toBe(false);
    const saturday = weekdayGate(6);
    expect(saturday(new Date('2026-10-31T04:30:00Z'))).toBe(true); // a Saturday
    expect(saturday(new Date('2026-11-01T04:30:00Z'))).toBe(false); // a Sunday
  });
});

describe('the TIC release-aware gate (S2-M2.2)', () => {
  it('runs daily from the 15th to the 25th, and weekly on Saturdays otherwise', () => {
    // 2026-11-14 is a Saturday BEFORE the window; 2026-11-26 a Thursday after it.
    expect(ticReleaseAwareGate(new Date('2026-11-14T04:30:00Z'))).toBe(true); // Saturday
    expect(ticReleaseAwareGate(new Date('2026-11-26T04:30:00Z'))).toBe(false); // Thursday outside the window
    for (let day = 15; day <= 25; day += 1) {
      expect(ticReleaseAwareGate(new Date(`2026-11-${String(day).padStart(2, '0')}T04:30:00Z`))).toBe(true);
    }
    expect(ticReleaseAwareGate(new Date('2026-11-14T04:30:00Z'))).toBe(true);
    expect(ticReleaseAwareGate(new Date('2026-11-27T04:30:00Z'))).toBe(false); // Friday outside the window
    expect(ticReleaseAwareGate(new Date('2026-11-28T04:30:00Z'))).toBe(true); // Saturday again
  });

  it('the registry carries the verified TIC source on rung3 with the 4-subrequest budget', () => {
    expect(EXTRA_SOURCES).toHaveLength(1);
    const tic = EXTRA_SOURCES[0]!;
    expect(tic.id).toBe('tic-slt');
    expect(tic.rung).toBe(3);
    expect(tic.gate).toBe(ticReleaseAwareGate);
    expect(tic.budget).toBe(4); // 2 fetches + 1 idempotence read + 1 write
  });
});

describe('runExtraRung — the empty rung is rung4 now (S2 registered tic-slt on rung3)', () => {
  it('an EMPTY rung still runs, writes its status record, and costs 1 subrequest', async () => {
    expect(EXTRA_SOURCES.filter((s) => s.rung === 4)).toHaveLength(0);
    const kv = mockKv();
    const status = await runExtraRung(ENV, 4, { kv, now: new Date(at(4, 35)) });
    expect(status.rows).toEqual([]);
    expect(status.budget).toEqual({ ceiling: EXTRA_RUNG_SUBREQUEST_CEILING, used: 1, refused: [] });
    const raw = kv.store.get(extraRungStatusKey(4));
    expect(raw).toBeDefined();
    expect(JSON.parse(raw!).rung).toBe(4);
  });

  it('FORCE mode (the manual /internal lever) runs a gated-out source anyway', async () => {
    const kv = mockKv();
    const calls: string[] = [];
    const sources = [
      source({
        id: 'monthly',
        gate: firstOfMonthGate,
        run: async () => {
          calls.push('monthly');
          return { ok: true };
        },
      }),
    ];
    // Day 25, non-Saturday: gated out normally.
    await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30, 25, 10)) });
    expect(calls).toEqual([]);
    // Force: runs regardless of the day gate (no heal read — used = 2).
    const status = await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30, 25, 10)), force: true });
    expect(calls).toEqual(['monthly']);
    expect(status.rows).toEqual([{ id: 'monthly', ok: true }]);
    expect(status.budget.used).toBe(2);
  });
});

describe('runExtraRung with sources (the registration contract for S2+)', () => {
  it('runs the DUE sources in registry order; a gated-out source never runs', async () => {
    const kv = mockKv();
    const calls: string[] = [];
    const sources = [
      source({ id: 'a', run: async () => { calls.push('a'); return { ok: true }; } }),
      source({ id: 'monthly', gate: firstOfMonthGate, run: async () => { calls.push('monthly'); return { ok: true }; } }),
      source({ id: 'b', run: async () => { calls.push('b'); return { ok: true, note: '2 rows' }; } }),
    ];
    const status = await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30, 25)) });
    expect(calls).toEqual(['a', 'b']); // the monthly gate is closed on the 25th
    expect(status.rows).toEqual([
      { id: 'a', ok: true },
      { id: 'b', ok: true, note: '2 rows' },
    ]);
    expect(status.budget.used).toBe(3); // 1 status write + 2 source budgets
  });

  it('FAILURE ISOLATION: a throwing source is recorded, the others still run, the rung completes', async () => {
    const kv = mockKv();
    const sources = [
      source({ id: 'boom', budget: 2, run: async () => { throw new Error('fetch failed upstream'); } }),
      source({ id: 'fine', run: async () => ({ ok: true }) }),
    ];
    const status = await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30)) });
    expect(status.rows).toEqual([
      { id: 'boom', ok: false, kind: 'failed', note: 'fetch failed upstream' },
      { id: 'fine', ok: true },
    ]);
    expect(status.budget.used).toBe(4); // 1 + 2 + 1 — the failed budget still counts
    expect(kv.store.get(extraRungStatusKey(3))).toBeDefined();
  });

  it('the BUDGET REFUSAL is loud and recorded — never a silent runtime death', async () => {
    const kv = mockKv();
    let ran = false;
    const sources = [
      source({ id: 'heavy', budget: 30, run: async () => ({ ok: true }) }),
      source({
        id: 'over',
        budget: 25, // 1 + 30 + 25 = 56 > 50
        run: async () => {
          ran = true;
          return { ok: true };
        },
      }),
    ];
    const status = await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30)) });
    expect(ran).toBe(false); // refused — never started
    expect(status.budget.refused).toEqual(['over']);
    expect(status.rows[1]!.ok).toBe(false);
    expect(status.rows[1]!.note).toContain('budget refused');
    expect(status.rows[1]!.note).toContain('ceiling');
  });

  it('the HEAL mode re-runs sources whose last row failed, ignoring the day gate', async () => {
    const kv = mockKv();
    const calls: string[] = [];
    const sources = [
      source({
        id: 'monthly',
        gate: firstOfMonthGate,
        run: async () => {
          calls.push('monthly');
          return { ok: true };
        },
      }),
    ];
    // Day 25: gated out, nothing runs.
    await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(4, 30, 25)) });
    expect(calls).toEqual([]);
    // A failure recorded from the 1st (a fake prior status).
    await kv.put(
      extraRungStatusKey(3),
      JSON.stringify({
        generatedAt: '2026-10-01T04:30:00Z',
        rung: 3,
        rows: [{ id: 'monthly', ok: false, kind: 'failed', note: 'upstream 503' }],
        budget: { ceiling: 50, used: 2, refused: [] },
      }),
    );
    // The sweep heals on the 25th: the day gate is bypassed for the failure.
    const status = await runExtraRung(ENV, 3, { kv, sources, now: new Date(at(10, 10, 25)), heal: true });
    expect(calls).toEqual(['monthly']);
    expect(status.rows).toEqual([{ id: 'monthly', ok: true }]);
    expect(status.budget.used).toBe(3); // 1 status write + 1 heal read + 1 source
  });
});

describe('the sweep heal arming (2 KV reads)', () => {
  it('arms on recorded failures only — healthy/absent statuses never arm', async () => {
    const kv = mockKv();
    expect(await extraRungsNeedHealing(kv)).toBe(false); // no status at all
    await kv.put(
      extraRungStatusKey(3),
      JSON.stringify({
        generatedAt: '2026-10-31T04:30:00Z',
        rung: 3,
        rows: [{ id: 'tic-slt', ok: false, kind: 'blocked', note: '403' }],
        budget: { ceiling: 50, used: 2, refused: [] },
      }),
    );
    expect(await extraRungsNeedHealing(kv)).toBe(true);
    await kv.put(
      extraRungStatusKey(3),
      JSON.stringify({
        generatedAt: '2026-10-31T04:30:00Z',
        rung: 3,
        rows: [{ id: 'tic-slt', ok: true }],
        budget: { ceiling: 50, used: 2, refused: [] },
      }),
    );
    expect(await extraRungsNeedHealing(kv)).toBe(false);
  });

  it('a poisoned status key must not sink the sweep (read tolerantly)', async () => {
    const kv = mockKv();
    await kv.put(extraRungStatusKey(4), 'not json');
    expect(await extraRungsNeedHealing(kv)).toBe(false);
  });
});
