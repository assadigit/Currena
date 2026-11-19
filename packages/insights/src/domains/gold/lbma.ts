/**
 * lbma.ts — GPE R24 / F22 (2026-11-19): the LBMA London vault +
 * clearing families' store + rung job — the xau-ohlc/cb-demand twin
 * (docs/specs/gold-page-elevation: s8/01 R24 · the s14 M1 §5 S14-D2
 * record).
 *
 * ONE KV key (`insights:gold-lbma:v1`): both workbooks' parsed series.
 * THE JOB (the rung3 gold-lbma source, days 8–27, budget 4): read the
 * stored snapshot, fetch the single most-plausible candidate per file
 * (vault: currentMonth−1 — the ~T+2.5wk rhythm; clearing: currentMonth−2
 * — the measured deeper arrears), and treat a 403/404 as the calm
 * "not yet published, nothing to do" (the stored month never regresses;
 * the workbook itself IS the full 124/360-month backfill, so the first
 * 200 bootstraps the whole history). Write-if-changed.
 *
 * The manual runner (gold-lbma-run, the gold-xau-run twin) may walk a
 * wider candidate ladder at bootstrap — the runner is a Node script
 * outside the rung's subrequest budget; the RUNG stays single-candidate
 * by design (the S14-D3 arithmetic).
 *
 * Platform boundary: the store + job touch KV through the narrow
 * tic/cb-demand-style port (AGENTS.md rule 2). Exported via the
 * "@currena/insights/lbma" subpath so the SPA-facing root export never
 * pulls the fetch halves.
 */

import type { GoldLbmaSnapshot, GoldLbmaVaultRow, GoldLbmaClearingRow } from '@currena/core';
import { GoldLbmaSnapshotSchema } from '@currena/core';
import { classifySourceError } from '../../shared/adapters/fetch-policy';
import { LbmaVaultNotPublished } from './adapters/lbma-vault';
import { fetchLbmaVault, lbmaVaultUrl } from './adapters/lbma-vault';
import { fetchLbmaClearing, lbmaClearingUrl } from './adapters/lbma-clearing';

export { lbmaVaultUrl, lbmaClearingUrl };

/** The one month-subtraction that never trips JS Date's edge days
 *  ('2026-01' − 1 → '2025-12'). */
export function minusMonths(ym: string, n: number): string {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  const total = y * 12 + (m - 1) - n;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return `${String(ny).padStart(4, '0')}-${String(nm).padStart(2, '0')}`;
}

/* ------------------------------------------------------------------ *
 * The store (the ONE KV key)
 * ------------------------------------------------------------------ */

export const GOLD_LBMA_KV_KEY = 'insights:gold-lbma:v1';

/** The minimal KV surface (env.RATES satisfies it; tests mock it). */
export interface GoldLbmaKv {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export function parseStoredGoldLbma(raw: string | null | undefined): GoldLbmaSnapshot | undefined {
  if (raw === null || raw === undefined) return undefined;
  try {
    const parsed = GoldLbmaSnapshotSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      console.warn(`[gold-lbma-store] ${GOLD_LBMA_KV_KEY} failed validation — ignoring stored value`);
      return undefined;
    }
    return parsed.data;
  } catch {
    return undefined;
  }
}

export interface GoldLbmaReader {
  getGoldLbma(): Promise<GoldLbmaSnapshot | undefined>;
}

export interface GoldLbmaStore extends GoldLbmaReader {
  writeGoldLbma(snapshot: GoldLbmaSnapshot): Promise<void>;
}

export class KvGoldLbmaStore implements GoldLbmaStore {
  constructor(private readonly kv: GoldLbmaKv) {}

  async getGoldLbma(): Promise<GoldLbmaSnapshot | undefined> {
    return parseStoredGoldLbma(await this.kv.get(GOLD_LBMA_KV_KEY));
  }

  async writeGoldLbma(snapshot: GoldLbmaSnapshot): Promise<void> {
    await this.kv.put(GOLD_LBMA_KV_KEY, JSON.stringify(snapshot));
  }
}

/** The REST adapter (the manual runner's landing lever — the
 *  RestGoldXauStore twin: writes through the Cloudflare KV REST API). */
export interface RestGoldLbmaOptions {
  apiToken: string;
  accountId: string;
  namespaceId: string;
  /** Injectable for tests. */
  fetchImpl?: typeof fetch;
}

const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

export class RestGoldLbmaStore implements GoldLbmaStore {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: RestGoldLbmaOptions) {
    this.fetchImpl = opts.fetchImpl ?? ((input, init) => fetch(input, init));
  }

  private url(): string {
    return (
      `${CLOUDFLARE_API_BASE}/accounts/${this.opts.accountId}` +
      `/storage/kv/namespaces/${this.opts.namespaceId}/values/${encodeURIComponent(GOLD_LBMA_KV_KEY)}`
    );
  }

  async getGoldLbma(): Promise<GoldLbmaSnapshot | undefined> {
    const response = await this.fetchImpl(this.url(), {
      headers: { Authorization: `Bearer ${this.opts.apiToken}` },
    });
    if (response.status === 404) return undefined;
    if (!response.ok) {
      throw new Error(`KV REST read failed: HTTP ${response.status}`);
    }
    return parseStoredGoldLbma(await response.text());
  }

  async writeGoldLbma(snapshot: GoldLbmaSnapshot): Promise<void> {
    const response = await this.fetchImpl(this.url(), {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.opts.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(snapshot),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`KV REST write failed: HTTP ${response.status}: ${body.slice(0, 160)}`);
    }
  }
}

/* ------------------------------------------------------------------ *
 * The job (the rung3 body)
 * ------------------------------------------------------------------ */

export interface GoldLbmaJobDeps {
  /** Injectable fetch (tests replay saved workbooks — never live sites). */
  fetchImpl?: typeof fetch;
  /** Clock (tests). */
  now?: Date;
}

export type GoldLbmaJobOutcome =
  | { ok: true; note?: string }
  | { ok: false; kind: 'failed' | 'blocked' | 'format-changed'; note: string };

export interface GoldLbmaJobResult {
  outcome: GoldLbmaJobOutcome;
  snapshot?: GoldLbmaSnapshot;
  kv: { reads: number; writes: number };
}

/** Build the snapshot over the two families (asOf = the vault's month —
 *  the schema's own cross-family check rides on parse). */
export function buildGoldLbmaSnapshot(
  vault: readonly GoldLbmaVaultRow[],
  clearing: readonly GoldLbmaClearingRow[],
  now: Date,
): GoldLbmaSnapshot {
  return GoldLbmaSnapshotSchema.parse({
    v: 1,
    asOf: vault[vault.length - 1]!.month,
    fetchedAt: now.toISOString(),
    vault: {
      asOf: vault[vault.length - 1]!.month,
      rows: [...vault],
      sourceUrl: lbmaVaultUrl(vault[vault.length - 1]!.month),
    },
    clearing: {
      asOf: clearing[clearing.length - 1]!.month,
      rows: [...clearing],
      sourceUrl: lbmaClearingUrl(clearing[clearing.length - 1]!.month),
    },
  });
}

/** The rung's candidate months: vault = currentMonth−1, clearing =
 *  currentMonth−2 (the measured publication rhythms — s14 M1 §4b). */
export function lbmaCandidateMonths(now: Date): { vault: string; clearing: string } {
  const ym = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  return { vault: minusMonths(ym, 1), clearing: minusMonths(ym, 2) };
}

/**
 * The rung body: read the stored snapshot, fetch the two candidates,
 * replace each family only when its file answered 200, and write ONLY
 * when something changed. Both files "not yet published" with stored
 * data = the quiet no-op; both not-published with NOTHING stored = the
 * honest ok with the waiting note (the route serves the calm 503).
 */
export async function runGoldLbmaIngest(store: GoldLbmaStore, deps: GoldLbmaJobDeps): Promise<GoldLbmaJobResult> {
  const now = deps.now ?? new Date();
  const stored = await store.getGoldLbma();
  const candidates = lbmaCandidateMonths(now);

  let vaultRows: readonly GoldLbmaVaultRow[] | null = null;
  let clearingRows: readonly GoldLbmaClearingRow[] | null = null;
  let waiting: string[] = [];

  try {
    try {
      vaultRows = await fetchLbmaVault({ dataMonth: candidates.vault, fetchImpl: deps.fetchImpl });
    } catch (err) {
      if (err instanceof LbmaVaultNotPublished) {
        waiting.push(`vault ${candidates.vault}`);
      } else {
        throw err;
      }
    }
    try {
      clearingRows = await fetchLbmaClearing({ dataMonth: candidates.clearing, fetchImpl: deps.fetchImpl });
    } catch (err) {
      if (err instanceof LbmaVaultNotPublished) {
        waiting.push(`clearing ${candidates.clearing}`);
      } else {
        throw err;
      }
    }
  } catch (err) {
    return {
      outcome: { ok: false, kind: classifySourceError(err), note: err instanceof Error ? err.message : String(err) },
      kv: { reads: 1, writes: 0 },
    };
  }

  // The families: a fetched file replaces its family (the file IS the
  // full series); a not-published file keeps the stored family.
  const vault = vaultRows ?? stored?.vault.rows ?? null;
  const clearing = clearingRows ?? stored?.clearing.rows ?? null;

  if (vault === null || clearing === null) {
    // Nothing stored yet and at least one file not published — the honest
    // waiting state (never a failure: the publication calendar governs).
    return {
      outcome: {
        ok: true,
        note: `waiting on ${waiting.join(' + ')} — nothing stored yet`,
      },
      kv: { reads: 1, writes: 0 },
    };
  }

  const snapshot = buildGoldLbmaSnapshot(vault, clearing, now);
  if (
    stored !== undefined &&
    vaultRows === null &&
    clearingRows === null
  ) {
    // Nothing fetched, nothing changed — the quiet no-op.
    return {
      outcome: { ok: true, note: `no change (vault ${stored.vault.asOf} · clearing ${stored.clearing.asOf})` },
      snapshot: stored,
      kv: { reads: 1, writes: 0 },
    };
  }
  if (
    stored !== undefined &&
    JSON.stringify(snapshot.vault.rows) === JSON.stringify(stored.vault.rows) &&
    JSON.stringify(snapshot.clearing.rows) === JSON.stringify(stored.clearing.rows)
  ) {
    return {
      outcome: {
        ok: true,
        note: `no change (vault ${snapshot.vault.asOf} · clearing ${snapshot.clearing.asOf})`,
      },
      snapshot: stored,
      kv: { reads: 1, writes: 0 },
    };
  }
  await store.writeGoldLbma(snapshot);
  const parts: string[] = [];
  if (vaultRows !== null) parts.push(`vault → ${snapshot.vault.asOf} (${vaultRows.length} rows)`);
  if (clearingRows !== null) parts.push(`clearing → ${snapshot.clearing.asOf} (${clearingRows.length} rows)`);
  if (waiting.length > 0) parts.push(`waiting: ${waiting.join(', ')}`);
  return {
    outcome: { ok: true, note: parts.join(' · ') },
    snapshot,
    kv: { reads: 1, writes: 1 },
  };
}
