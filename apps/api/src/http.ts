/**
 * Shared HTTP plumbing for every /api route module (Phase 3 split of the
 * former index.ts monolith): the RatesError envelope with correct status +
 * no-store + Retry-After, the ?source= validator, and the shared constants.
 *
 * Lives in its own module so routes/rates.ts, routes/admin.ts,
 * routes/internal.ts and routes/insights.ts all answer errors through ONE
 * implementation (audit B-1 — the insights routes used to carry a private
 * copy that could drift).
 */

import { SnapshotSourceSchema } from '@currena/core';
import type { RatesError, SnapshotSource } from '@currena/core';
import type { Context } from 'hono';
import type { Bindings } from './index';

export const NO_STORE: Readonly<Record<string, string>> = { 'Cache-Control': 'no-store' };

/** /api/convert amount cap — 1e15 keeps doubles exact through every math path. */
export const MAX_AMOUNT = 1e15;

export type ErrorStatus = 400 | 401 | 404 | 413 | 429 | 500 | 501 | 503;

/** RatesError envelope with the right status + no-store (+ Retry-After). */
export function errorResponse(
  c: Context<{ Bindings: Bindings }>,
  status: ErrorStatus,
  code: string,
  message: string,
  retryAfterSec?: number,
) {
  const body: RatesError = {
    error: { code, message, ...(retryAfterSec !== undefined ? { retryAfterSec } : {}) },
  };
  return c.json(body, status, {
    ...NO_STORE,
    // Standards-level retry hint mirroring the body's retryAfterSec (503s).
    ...(retryAfterSec !== undefined ? { 'Retry-After': String(retryAfterSec) } : {}),
  });
}

/** Validate the ?source= query param; empty/absent → default 'tgju'. */
export function parseSourceParam(raw: string | undefined): SnapshotSource | undefined {
  if (raw === undefined || raw === '') return 'tgju';
  const parsed = SnapshotSourceSchema.safeParse(raw);
  return parsed.success ? parsed.data : undefined;
}
