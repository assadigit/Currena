/**
 * collect-gates.test.ts — the v3 fetch gates as seen from the collect layer
 * (SCRAPING_SPEC §3/§5, tests T-27, T-30, T-31, T-32, F-08, F-16, F-18).
 *
 * collectAllSources hits live sites by design, so the global fetch is
 * STUBBED here (AGENTS.md rule 7): every URL is answered locally and
 * counted — no request ever leaves the test runner.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { collectAllSources } from './collect';
import { SOURCE_RISK_REGISTER } from '../sources';

interface Stub {
  calls: Map<string, number>;
  restore(): void;
}

/** A counting stub: FRED URLs get CSV, everything else gets plain JSON/text. */
function stubFetch(override?: (url: string) => Response | undefined): Stub {
  const calls = new Map<string, number>();
  const original = globalThis.fetch;
  const impl = (async (input: RequestInfo | URL) => {
    const url = String(input);
    calls.set(url, (calls.get(url) ?? 0) + 1);
    const custom = override?.(url);
    if (custom) return custom;
    if (url.includes('fredgraph')) {
      return new Response('observation_date,T10Y2Y\n2026-10-05,0.37\n', { status: 200, headers: { 'content-type': 'text/csv' } });
    }
    return new Response('{"ok":1}', { status: 200, headers: { 'content-type': 'application/json' } });
  }) as typeof fetch;
  globalThis.fetch = impl;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('T-32 + F-08: one request per source per refresh, no retries', () => {
  it('every URL the collect touches is requested exactly once (a retry would double it)', async () => {
    const s = stubFetch();
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      expect(s.calls.size).toBeGreaterThan(10); // a real orchestration shape
      for (const [url, count] of s.calls) {
        expect(count, `${url} requested ${count} times`).toBe(1); // F-11: single attempt
      }
      // The report has one row per fetch attempt — none doubled.
      expect(result.reports.length).toBeGreaterThanOrEqual(s.calls.size);
    } finally {
      s.restore();
    }
  }, 30_000);
});

describe('T-27: a block is recorded as blocked, never retried, never circumvented', () => {
  it('a 403 from Yahoo fails those legs closed, one request only, the rest continue', async () => {
    const s = stubFetch((url) => {
      if (url.includes('finance.yahoo.com')) return new Response('no', { status: 403 });
      return undefined;
    });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const yahooRows = result.reports.filter((r) => r.source === 'yahoo');
      expect(yahooRows.length).toBeGreaterThan(0);
      for (const row of yahooRows) {
        expect(row.ok).toBe(false);
        expect(row.kind).toBe('blocked');
        expect(row.detail).toContain('blocked by the site');
      }
      for (const [url, count] of s.calls) {
        if (url.includes('finance.yahoo.com')) expect(count, `${url} — a block is never retried`).toBe(1);
      }
      // The other sources are unaffected.
      const fredRows = result.reports.filter((r) => r.source === 'fred');
      expect(fredRows.length).toBeGreaterThan(0);
      for (const row of fredRows) expect(row.ok, `${row.detail}`).toBe(true);
    } finally {
      s.restore();
    }
  }, 30_000);

  it('a bot-check HTML page (200) is classified blocked', async () => {
    const s = stubFetch((url) => {
      if (url.includes('finance.yahoo.com')) {
        return new Response('<html><title>Just a moment...</title>verify you are human</html>', {
          status: 200,
          headers: { 'content-type': 'text/html' },
        });
      }
      return undefined;
    });
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      const yahooRows = result.reports.filter((r) => r.source === 'yahoo' && !r.ok);
      expect(yahooRows.length).toBeGreaterThan(0);
      expect(yahooRows.some((r) => r.kind === 'blocked' && r.detail.includes('bot-check'))).toBe(true);
    } finally {
      s.restore();
    }
  }, 30_000);
});

describe('T-30/T-31: disabled sources are never requested (M-6 kill switch)', () => {
  it('flipping the gold-api kill switch skips every gold-api fetch and records the skip', async () => {
    const row = SOURCE_RISK_REGISTER['gold-api']!;
    const before = row.enabled;
    row.enabled = false; // the owner's kill switch (M-6)
    const s = stubFetch();
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      for (const [url] of s.calls) {
        expect(url, 'a disabled source is never requested').not.toContain('gold-api');
      }
      const gaRows = result.reports.filter((r) => r.source === 'gold-api');
      expect(gaRows.length).toBe(4); // XAU, XAG, BTC, HG — all skipped
      for (const r of gaRows) {
        expect(r.ok).toBe(false);
        expect(r.kind).toBe('disabled');
        expect(r.detail).toContain('kill switch');
      }
    } finally {
      row.enabled = before; // never leave the register mutated
      s.restore();
    }
  }, 30_000);

  it('the new L2 rows (shiller, cnn, asx, westpac-mi, nab, aip) are disabled, so nothing could ever request them', () => {
    for (const id of ['shiller', 'cnn-fng', 'asx-rate-tracker', 'westpac-mi', 'nab-survey', 'aip-petrol']) {
      const row = SOURCE_RISK_REGISTER[id]!;
      expect(row.enabled, id).toBe(false);
      expect(row.ownerAccepts, id).toBe(false); // T-30
    }
  });
});

describe('F-16/F-18: rows carry the classification and the content hash', () => {
  it('every row has a kind; fetched rows (outside cross-check) carry a stable 8-hex hash', async () => {
    const s = stubFetch();
    try {
      const result = await collectAllSources({ bitstampCandles: 2 });
      for (const row of result.reports) {
        if (row.ok && row.source !== 'cross-check') {
          expect(row.kind).toBe('fetched');
          expect(row.hash).toMatch(/^[0-9a-f]{8}$/); // F-18
        } else if (!row.ok) {
          expect(row.kind).toBeOneOf(['blocked', 'format-changed', 'failed', 'disabled']);
        }
      }
    } finally {
      s.restore();
    }
  }, 30_000);
});
