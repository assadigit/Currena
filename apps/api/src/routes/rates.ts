/**
 * The money routes (Phase 3 split of the former index.ts monolith):
 *
 *   GET  /api/rates?source=           — the fallback ladder (mission §6)
 *   GET  /api/history?source=         — rolling rate history for sparklines (Task 24)
 *   GET  /api/convert?from&to&amount  — server-side math via @currena/core
 *
 * Routing rule (AGENTS.md rule 8): either side IRR → TGJU ladder; otherwise
 * Frankfurter ladder. Never mix sources within one conversion.
 */

import { convert, CoreError, sourceForPair } from '@currena/core';
import type { ConversionResult, SnapshotSource } from '@currena/core';
import { Hono } from 'hono';
import { recordHistory, readHistory } from '../history';
import { errorResponse, MAX_AMOUNT, NO_STORE, parseSourceParam } from '../http';
import { RatesService, RatesServiceError } from '../rates-service';
import type { Bindings } from '../index';

interface RatesRouteDeps {
  /** Service construction (route tests inject a fake ladder). */
  makeService: (env: Bindings) => RatesService;
}

export function createRatesRoutes(deps: RatesRouteDeps): Hono<{ Bindings: Bindings }> {
  const app = new Hono<{ Bindings: Bindings }>();

  app.get('/api/rates', async (c) => {
    const source = parseSourceParam(c.req.query('source'));
    if (!source) {
      return errorResponse(
        c,
        400,
        'invalid_source',
        `Invalid 'source' parameter ${JSON.stringify(c.req.query('source'))} — must be 'tgju' or 'frankfurter'`,
      );
    }
    try {
      const response = await deps.makeService(c.env).getRates(source);
      // Task 24: a LIVE scrape means fresh market data — record it as a
      // history generation (content-deduped inside; no-op when unchanged).
      // A direct await (not waitUntil) keeps this test-safe — Hono's
      // c.executionCtx throws outside a real Workers context; the write rides
      // on a response that already paid for the scrape, so latency is fine.
      if (response.servedFrom === 'live') {
        try {
          await recordHistory(c.env.RATES, source, response.snapshot);
        } catch (err) {
          console.warn(`[history] record ${source} failed:`, err);
        }
      }
      // Content-addressed ETag: the snapshot identity is (source, fetchedAt),
      // so a conditional re-poll within the same generation is a tiny 304
      // instead of a full payload (the SPA polls every 30s per source).
      const etag = `"${response.snapshot.source}:${response.snapshot.fetchedAt}"`;
      if (c.req.header('if-none-match') === etag) {
        return c.body(null, 304, { ...NO_STORE, ETag: etag });
      }
      return c.json(response, 200, { ...NO_STORE, ETag: etag });
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      throw err; // app.onError backstop
    }
  });

  /* ----------------------------- rate history ---------------------------- */

  // Task 24 (sparkline honesty): the recorded server-side generations feed
  // the client rate-history hydration so sparklines draw REAL per-currency
  // movement (days of diverging re-quotes) instead of each device's own
  // handful of app-seen checks. 60s browser cache — the payload only changes
  // when a rate actually moves — plus a content-addressed ETag for 304s.
  app.get('/api/history', async (c) => {
    const source = parseSourceParam(c.req.query('source'));
    if (!source) {
      return errorResponse(
        c,
        400,
        'invalid_source',
        `Invalid 'source' parameter ${JSON.stringify(c.req.query('source'))} — must be 'tgju' or 'frankfurter'`,
      );
    }
    // KV-failure honesty (QA audit A-1): a read failure here surfaces as the
    // calm 503 "temporarily unavailable" — the SPA's hydrateServerHistory()
    // is already silent on any failure and keeps serving the local-only
    // window, so sparklines degrade to fewer-but-real points, never lies.
    let generations: Awaited<ReturnType<typeof readHistory>>;
    try {
      generations = await readHistory(c.env.RATES, source);
    } catch (err) {
      console.warn(`[history] read ${source} failed:`, err instanceof Error ? err.message : err);
      return errorResponse(
        c,
        503,
        'history_unavailable',
        'Rate history is temporarily unavailable — please retry shortly.',
      );
    }
    const newest = generations[generations.length - 1];
    const etag = `"history:${source}:${generations.length}:${newest?.at ?? 'empty'}"`;
    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304, { 'Cache-Control': 'public, max-age=60', ETag: etag });
    }
    return c.json(
      { source, count: generations.length, generations },
      200,
      { 'Cache-Control': 'public, max-age=60', ETag: etag },
    );
  });

  /* ------------------------------- convert ------------------------------- */

  app.get('/api/convert', async (c) => {
    const rawFrom = c.req.query('from');
    const rawTo = c.req.query('to');
    const rawAmount = c.req.query('amount');

    // Case-normalizing validation: codes are 3 uppercase letters (ISO 4217).
    const from = (rawFrom ?? '').trim().toUpperCase();
    const to = (rawTo ?? '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(from)) {
      return errorResponse(
        c,
        400,
        'invalid_currency',
        `Invalid 'from' parameter ${JSON.stringify(rawFrom ?? '')} — must be exactly 3 letters`,
      );
    }
    if (!/^[A-Z]{3}$/.test(to)) {
      return errorResponse(
        c,
        400,
        'invalid_currency',
        `Invalid 'to' parameter ${JSON.stringify(rawTo ?? '')} — must be exactly 3 letters`,
      );
    }

    // Positive finite amount (reject 0 / negative / NaN / > 1e15).
    const amount = Number(rawAmount);
    if (
      rawAmount === undefined ||
      rawAmount.trim() === '' ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > MAX_AMOUNT
    ) {
      return errorResponse(
        c,
        400,
        'invalid_amount',
        `Invalid 'amount' parameter ${JSON.stringify(rawAmount ?? '')} — must be a positive finite number no greater than 1e15`,
      );
    }

    // Same-currency short-circuit (Gate 1 decision #5): local, rate 1, no network.
    if (from === to) {
      const result: ConversionResult = { amount, rate: 1, source: 'local', fetchedAt: new Date().toISOString() };
      return c.json(result, 200, NO_STORE);
    }

    // Routing rule (AGENTS.md rule 8) — shared with the SPA via @currena/core.
    const source: SnapshotSource = sourceForPair(from, to);

    try {
      const rates = await deps.makeService(c.env).getRates(source);
      const result = convert(rates.snapshot, from, to, amount);
      // Propagate the ladder's staleness so clients can banner stale math
      // exactly like they do for /api/rates (additive fields).
      return c.json(
        {
          ...result,
          ...(rates.stale ? { stale: true, notice: rates.notice } : {}),
        },
        200,
        NO_STORE,
      );
    } catch (err) {
      if (err instanceof RatesServiceError) {
        return errorResponse(c, 503, err.code, err.message, err.retryAfterSec);
      }
      if (err instanceof CoreError && err.code === 'rate_not_found') {
        const unsupported = [from, to].some((code) => code === 'AED' || code === 'VND');
        const hint =
          source === 'frankfurter' && unsupported
            ? ' — Frankfurter does not serve AED or VND; pairs against IRR remain available via TGJU'
            : '';
        return errorResponse(
          c,
          503,
          'currency_not_supported',
          `Currency pair ${from}→${to} is not supported by source '${source}'${hint}`,
        );
      }
      throw err;
    }
  });

  return app;
}
