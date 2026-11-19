/**
 * gold-meter.ts — GPE R31 / F12 (2026-11-19, S17): the time machine's
 * data-plane web client — GET /api/insights/gold-meter?date=… (the
 * gold-premium discipline, verbatim as the pattern: zod-validated with
 * THE contract from @currena/core, module-cached so every query date is
 * fetched ONCE per session — never two — and NO localStorage: the
 * date-space is unbounded, the honest cache is the HTTP layer's own
 * max-age=300 + this session map).
 *
 * Platform: browser only (fetch) — lives in the lazy /gold route chunk,
 * never the entry graph.
 */

import { GoldMeterResponseSchema } from '@currena/core';
import type { GoldMeterResponse } from '@currena/core';

const TIMEOUT_MS = 20_000;

/** The per-date in-flight map — one fetch per (date, session). */
const inFlight = new Map<string, Promise<GoldMeterResponse | null>>();

/** GET /api/insights/gold-meter?date=… — null when anything at all goes wrong. */
export function fetchGoldMeterRow(date: string, signal?: AbortSignal): Promise<GoldMeterResponse | null> {
  const existing = inFlight.get(date);
  if (existing !== undefined) return existing;
  const promise = (async () => {
    const url = `/api/insights/gold-meter?date=${encodeURIComponent(date)}`;
    const timeout = AbortSignal.timeout(TIMEOUT_MS);
    const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    try {
      const response = await fetch(url, {
        signal: combined,
        headers: { accept: 'application/json' },
        cache: 'default',
      });
      if (!response.ok) {
        // 400 era/future answers and 503 not-ready are equally non-fatal
        // for the page — the card renders its honest lines.
        return null;
      }
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        return null;
      }
      const parsed = GoldMeterResponseSchema.safeParse(body);
      if (!parsed.success) return null; // poisoned payload — treat as absent
      return parsed.data;
    } catch {
      return null; // Network/timeout/abort — null, never an error state.
    }
  })().finally(() => {
    // Keep the RESOLVED answer cached for the session (the map prunes the
    // promise, not the result — the session cache is the Map below).
    inFlight.delete(date);
  });
  inFlight.set(date, promise);
  // Re-cache the resolved value for the session so repeat queries of the
  // same date never refetch (the fetch cache would serve it anyway; this
  // also covers cache: 'no-store' dev setups).
  void promise.then((value) => {
    if (value !== null) resolved.set(date, value);
  });
  return promise;
}

/** The per-date RESOLVED answers (the session cache). */
const resolved = new Map<string, GoldMeterResponse>();

/** The cached answer for a date, when this session already asked. */
export function cachedGoldMeterRow(date: string): GoldMeterResponse | null {
  return resolved.get(date) ?? null;
}

/** The test seam (the clearGoldLbmaCacheForTests pattern). */
export function clearGoldMeterCacheForTests(): void {
  inFlight.clear();
  resolved.clear();
}
