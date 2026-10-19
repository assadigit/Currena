/**
 * fng.ts — Step 3 L1-18 (runbook Phase 4, 2026-10-16): the Alternative.me
 * crypto Fear and Greed Index. Free API, attribution shown next to the data
 * (the licence register's termsEvidence quotes their requirement); the
 * card is CONTEXT ONLY (L3-03: never a signal, never a recommendation).
 *
 * Endpoint (verified live 2026-10-16):
 *   https://api.alternative.me/fng/?limit=N
 *   → { name: "Fear and Greed Index", data: [{ value: "63",
 *       value_classification: "Greed", timestamp: "1792108800" }, …],
 *       metadata: { error: null } }
 * The timestamp is the UTC midnight the daily reading belongs to (unix
 * seconds) — the SeriesPoint date is that UTC day, never the fetch instant.
 */

import { insightsFetch } from './fetch-policy';
import { z } from 'zod';
import type { SeriesPoint } from '../series';
import type { FetchDeps } from './types';

export const FNG_URL = 'https://api.alternative.me/fng/';

const FngResponseSchema = z.object({
  name: z.literal('Fear and Greed Index'),
  data: z
    .array(
      z.object({
        value: z.string().regex(/^\d+$/),
        value_classification: z.string().min(1),
        /** Unix seconds of the UTC midnight the reading belongs to. */
        timestamp: z.string().regex(/^\d+$/),
      }),
    )
    .min(1),
  metadata: z.object({ error: z.null() }),
});

/** Fetch the daily history (newest last) for the crypto-fng reading. */
export async function fetchCryptoFng(deps: FetchDeps = {}, limit = 400): Promise<SeriesPoint[]> {
  const res = await insightsFetch(`${FNG_URL}?limit=${limit}`, {}, deps);
  const body: unknown = await res.json();
  const parsed = FngResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error(`[fng] unexpected payload: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
  }
  const out: SeriesPoint[] = parsed.data.data.map((d) => ({
    date: new Date(Number(d.timestamp) * 1000).toISOString().slice(0, 10),
    value: Number(d.value),
  }));
  out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return out;
}
