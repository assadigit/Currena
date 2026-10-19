/**
 * access-mode.ts — M-5 (RULES.md §3, T-24): the PANIC SWITCH. One resolved
 * mode, 'public' | 'private', gates every Insights data endpoint through the
 * EXISTING password session (insights-auth's requireInsightsAuth) and drives
 * every public-mode behaviour (the boards' 404s, the live-prices merge skip,
 * the public status trim, the bounded public history).
 *
 * Signals, in the order they are consulted:
 *
 *   1. `PANIC_PRIVATE` env — 'true' | '1' (case-insensitive) → ALWAYS private.
 *      Checked FIRST and short-circuits before any KV read: the hard panic
 *      has no KV dependency and can be cleared only by a redeploy.
 *   2. KV `insights:access-mode:v1` — 'public' | 'private', zod-validated;
 *      missing/invalid → fall through. Read through a per-isolate 60-second
 *      memo (bounded KV cost: at most one read per minute per isolate). This
 *      is the owner's minutes-level runtime switch (POST /api/insights/mode).
 *   3. `ACCESS_MODE` env — 'public' | 'private' (M-5's deploy-time var).
 *      Invalid/absent → fall through (never opens the gate on garbage).
 *   4. Back-compat `SITE_MODE` — the 2026-10-19 var keeps working: 'private'
 *      (or absent — the legacy default) → private, exactly 'public' → public.
 *   5. Default: 'public'.
 *
 * ANY private signal wins over a public one ("any private wins"): a layer
 * that resolves 'public' never overrides a private signal from another
 * layer — the fail-closed reading of the back-compat promise. The practical
 * consequence: with the default deployment (SITE_MODE=public, nothing else
 * set) the KV switch flips the site BOTH ways within the 60s memo bound
 * (immediately on the isolate that served the POST — see primeAccessModeMemo).
 *
 * KV failure handling: a read that THROWS is not memoized (the next request
 * retries) and degrades calmly to the env chain — a KV blip must not take
 * the public site down, and the hard panic (PANIC_PRIVATE) still works with
 * KV fully broken. A missing/invalid VALUE is memoized like any other value.
 *
 * Pure + platform-free: the KV access itself lives behind the injected
 * `readKv` callback (adapters/access-mode-store.ts) so this module unit-tests
 * with plain fakes.
 */

import { z } from 'zod';
import { siteModeOf } from './public-mode';

export type AccessMode = 'public' | 'private';

/** The runtime override key (written by POST /api/insights/mode). */
export const ACCESS_MODE_KV_KEY = 'insights:access-mode:v1';

/** Per-isolate KV read bound: one access-mode read per minute at most. */
export const ACCESS_MODE_CACHE_TTL_MS = 60_000;

/** The stored override's wire form (a plain 'public'/'private' string). */
export const AccessModeValueSchema = z.enum(['public', 'private']);

/** The env signals (a subset of Bindings — tests pass plain objects). */
export interface AccessModeEnv {
  PANIC_PRIVATE?: string;
  ACCESS_MODE?: string;
  SITE_MODE?: string;
}

/** True when PANIC_PRIVATE arms the hard panic ('true' | '1', case-insensitive). */
export function isPanicPrivate(raw: string | undefined): boolean {
  if (raw === undefined) return false;
  const value = raw.trim().toLowerCase();
  return value === 'true' || value === '1';
}

/** Parse a stored KV value → the override; missing/invalid → undefined (fall through). */
export function parseAccessModeValue(raw: string | null | undefined): AccessMode | undefined {
  if (raw === null || raw === undefined) return undefined;
  const parsed = AccessModeValueSchema.safeParse(raw.trim().toLowerCase());
  return parsed.success ? parsed.data : undefined;
}

/**
 * The pure precedence core (fully unit-testable). `kvLookup` is consulted
 * only when `cached` (the fresh per-isolate memo) is absent — the cache
 * short-circuits the lookup, bounding KV cost.
 */
export function resolveAccessMode(
  env: AccessModeEnv,
  kvLookup: () => AccessMode | undefined,
  cached: AccessMode | undefined,
): AccessMode {
  // 1. The hard panic wins over everything — no KV read needed at all.
  if (isPanicPrivate(env.PANIC_PRIVATE)) return 'private';
  // 2. The KV runtime override: the fresh memo when present, else one lookup.
  const override = cached ?? kvLookup();
  if (override === 'private') return 'private';
  // 3. The ACCESS_MODE deploy-time var.
  if (parseAccessModeValue(env.ACCESS_MODE) === 'private') return 'private';
  // 4. Back-compat SITE_MODE (private unless exactly 'public'), else the
  //    public default. A 'public' value from any layer above never re-opens
  //    a gate a lower layer closed — any private wins.
  return siteModeOf(env);
}

/* ------------------------------------------------------------------ *
 * The per-isolate memo + the request-time resolution.
 * ------------------------------------------------------------------ */

interface AccessModeMemo {
  /** The validated override — undefined = the key is absent/invalid. */
  override: AccessMode | undefined;
  readAtMs: number;
}

let accessModeMemo: AccessModeMemo | undefined;

/** Test-only: reset the per-isolate memo between test cases. */
export function __resetAccessModeMemoForTests(): void {
  accessModeMemo = undefined;
}

/**
 * Prime the memo after the mode endpoint WRITES the key — the flip becomes
 * visible on the very next request of this isolate (no 60-second blind
 * window). Other isolates converge within the TTL bound.
 */
export function primeAccessModeMemo(override: AccessMode, nowMs: number): void {
  accessModeMemo = { override, readAtMs: nowMs };
}

/**
 * Resolve the mode for one request: the hard panic short-circuits (no KV),
 * otherwise the memo answers when fresh and ONE KV read refills it when
 * stale. `readKv` is the injected KV access (adapters/access-mode-store.ts).
 */
export async function resolveAccessModeForRequest(
  env: AccessModeEnv,
  readKv: () => Promise<string | null>,
  nowMs: number,
): Promise<AccessMode> {
  if (isPanicPrivate(env.PANIC_PRIVATE)) return 'private';
  if (accessModeMemo === undefined || nowMs - accessModeMemo.readAtMs >= ACCESS_MODE_CACHE_TTL_MS) {
    let override: AccessMode | undefined;
    try {
      override = parseAccessModeValue(await readKv());
      accessModeMemo = { override, readAtMs: nowMs };
    } catch {
      // A KV read failure is NOT memoized (retry next request) and never
      // throws: the env chain answers, and PANIC_PRIVATE already returned.
      return resolveAccessMode(env, () => undefined, undefined);
    }
  }
  const memo = accessModeMemo;
  return resolveAccessMode(env, () => memo!.override, memo!.override);
}
