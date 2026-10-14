/**
 * Isolate-local defense primitives (Phase 3 split of the former index.ts
 * monolith): the best-effort rate limiter for the two secret-guessing
 * surfaces and the constant-time-ish secret comparison.
 *
 * Token bucket per (IP, surface), PER ISOLATE: Workers isolates are
 * ephemeral and per-PoP, so a patient attacker rotating PoPs can exceed
 * this — it is defense-in-depth on top of the real gates (constant-time
 * secret compare, uniform 401-before-render, body cap), not a hard
 * guarantee. Zero dependencies, no external state; the map is capped so
 * a hostile IP spray cannot grow isolate memory unboundedly.
 */

import type { Context } from 'hono';
import type { Bindings } from './index';

const RATE_LIMIT_CAPACITY = 10; // burst size
const RATE_LIMIT_REFILL_PER_MIN = 5; // sustained attempts/minute
const RATE_LIMIT_MAP_MAX = 10_000;

interface RateBucket {
  tokens: number;
  lastRefillMs: number;
}

const rateBuckets = new Map<string, RateBucket>();

/** Client IP as seen by the edge (absent in tests/local dev → 'unknown'). */
export function clientIp(c: Context<{ Bindings: Bindings }>): string {
  return c.req.header('CF-Connecting-IP') ?? 'unknown';
}

/** Take one token; false = the bucket is empty (429). */
export function rateLimitTake(key: string, nowMs: number): boolean {
  const bucket = rateBuckets.get(key) ?? { tokens: RATE_LIMIT_CAPACITY, lastRefillMs: nowMs };
  const elapsedMs = Math.max(0, nowMs - bucket.lastRefillMs);
  bucket.tokens = Math.min(
    RATE_LIMIT_CAPACITY,
    bucket.tokens + (elapsedMs / 60_000) * RATE_LIMIT_REFILL_PER_MIN,
  );
  bucket.lastRefillMs = nowMs;
  const allowed = bucket.tokens >= 1;
  if (allowed) bucket.tokens -= 1;
  rateBuckets.set(key, bucket);
  // Opportunistic eviction: keep the map bounded (oldest-refill first).
  if (rateBuckets.size > RATE_LIMIT_MAP_MAX) {
    const entries = [...rateBuckets.entries()].sort((a, b) => a[1].lastRefillMs - b[1].lastRefillMs);
    for (const [k] of entries.slice(0, Math.floor(RATE_LIMIT_MAP_MAX / 10))) rateBuckets.delete(k);
  }
  return allowed;
}

/** Seconds until one token is available again (for Retry-After). */
export function rateLimitRetryAfterSec(key: string): number {
  const bucket = rateBuckets.get(key);
  if (!bucket) return 1;
  const deficit = 1 - bucket.tokens;
  if (deficit <= 0) return 1;
  return Math.max(1, Math.ceil((deficit / RATE_LIMIT_REFILL_PER_MIN) * 60));
}

/** Test-only: reset the isolate-local buckets between test cases. */
export function __resetRateLimiterForTests(): void {
  rateBuckets.clear();
}

/** Constant-time-ish string comparison (early length check is unavoidable). */
export function secretMatches(provided: string, expected: string): boolean {
  const len = Math.max(provided.length, expected.length);
  let diff = provided.length === expected.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    diff |= (provided.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}
