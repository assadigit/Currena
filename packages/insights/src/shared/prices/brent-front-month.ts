/**
 * Brent front-month selection (2026-10-29 owner round — the wrong-contract
 * fix).
 *
 * THE BUG: the live refresh and the daily gap-fill both quote Yahoo's
 * continuous `BZ=F`, which is NOT the front month — it is Yahoo's own roll
 * and it can sit on a LATER contract while the true front month still
 * trades. Observed live 2026-10-29: `BZ=F` answered 110.51 (already rolled
 * onto the January contract `BZF27.NYM` = 110.50) while the real front
 * month, December `BZZ26.NYM`, traded 114.34 — a $3.83 gap the owner read
 * as "the app shows the wrong oil price" (their reference: ~$114).
 *
 * THE RULE: quote the FIRST ACTIVE specific contract month — probe the
 * individual month symbols (`BZ{month}{yy}.NYM`, the same codes Yahoo's own
 * search surfaces) from the current calendar month forward and take the
 * first one that answers with a live price. An expired month answers 404
 * (one wasted subrequest, once — the winner is remembered through the
 * stored entry's `sourceSymbol` and re-tried FIRST on the next rung), and
 * the continuous `BZ=F` stays as the LAST-RESORT fallback (a wrong-contract
 * quote beats no quote — the hold-the-line honesty of the job).
 *
 * Subrequest cost: the common case is ONE call (the remembered contract is
 * still active); a roll costs 2–3 (expired → next → hit). The prices rung
 * has the headroom (4 calls today, cap 50).
 *
 * Pure helpers exported for tests; the fetcher is the only async surface.
 */

import type { YahooQuote, YahooQuoteOptions } from '../adapters/yahoo';
import { BlockedError } from '../adapters/fetch-policy';
import { fetchYahooQuote, YahooQuoteError } from '../adapters/yahoo';

/** Yahoo's month codes, index 0 = January. */
const MONTH_CODES = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'] as const;

/** The continuous symbol — the last-resort fallback, never the primary. */
export const BRENT_CONTINUOUS_SYMBOL = 'BZ=F';

/** The specific-contract shape: BZ + month code + 2-digit year + .NYM. */
const BRENT_MONTH_RE = /^BZ[A-Z]\d{2}\.NYM$/;

/** True when `symbol` is a specific Brent month contract (not the continuous). */
export function isBrentMonthSymbol(symbol: string): boolean {
  return BRENT_MONTH_RE.test(symbol);
}

/**
 * The candidate month symbols from `now`'s calendar month forward
 * (`count` months, default 8 — far enough that an unusually early roll
 * still finds the front month, near enough to bound the probe cost).
 */
export function brentMonthSymbols(now: Date, count = 8): string[] {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-based
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const m = month + i;
    const yy = String((year + Math.floor(m / 12)) % 100).padStart(2, '0');
    out.push(`BZ${MONTH_CODES[m % 12]!}${yy}.NYM`);
  }
  return out;
}

/** A quote is USABLE when it carries a positive live price and at least one close. */
function usableQuote(quote: YahooQuote | undefined): quote is YahooQuote {
  return (
    quote !== undefined &&
    Number.isFinite(quote.livePrice) &&
    quote.livePrice > 0 &&
    quote.points.length >= 1
  );
}

/**
 * The pure selection over already-fetched candidates: the first usable
 * specific month in probe order; `undefined` when none answered. Tests
 * inject the candidate map directly.
 */
export function selectBrentFrontMonth(
  candidates: ReadonlyMap<string, YahooQuote | undefined>,
): { symbol: string; quote: YahooQuote } | undefined {
  for (const [symbol, quote] of candidates) {
    if (!isBrentMonthSymbol(symbol)) continue;
    if (usableQuote(quote)) return { symbol, quote };
  }
  return undefined;
}

/** True when the error is the EXPIRED-MONTH shape: Yahoo answers HTTP 404
 * (or 410 Gone) for a contract month that no longer trades — the one
 * failure that legitimately ADVANCES the probe to the next month. Every
 * other failure (a block, a bot-check, a malformed 200 = format change)
 * fails CLOSED through the rethrow below — the adapters discipline, rule #3. */
function isExpiredMonth(err: unknown): boolean {
  return err instanceof YahooQuoteError && /HTTP (404|410)/.test(err.message);
}

/**
 * Fetch the Brent front-month quote.
 *
 * Probe order: the remembered contract first (the stored entry's
 * `sourceSymbol` — one call in the steady state), then the calendar months
 * forward, then the continuous `BZ=F` as the documented last resort.
 *
 * Fail-closed discipline (the collect gates T-27/F-08 pin it): a BLOCK
 * (BlockedError — 403/429/999/bot-check) or a malformed 200 (a format
 * change) aborts the whole probe IMMEDIATELY — the site's answer IS the
 * answer; only the expired-month 404/410 advances to the next candidate.
 * Throws when every probe failed (the job's hold discipline takes over:
 * the last good quote survives).
 */
export async function fetchBrentFrontMonthQuote(
  opts: YahooQuoteOptions = {},
  now: Date = new Date(),
  rememberedSymbol?: string,
): Promise<YahooQuote> {
  const probeOrder: string[] = [];
  if (rememberedSymbol !== undefined && isBrentMonthSymbol(rememberedSymbol)) {
    probeOrder.push(rememberedSymbol);
  }
  for (const symbol of brentMonthSymbols(now)) {
    if (!probeOrder.includes(symbol)) probeOrder.push(symbol);
  }

  const failures: string[] = [];
  for (const symbol of probeOrder) {
    try {
      const quote = await fetchYahooQuote(symbol, '40d', opts);
      if (usableQuote(quote)) {
        // The echoed symbol (fetchYahooQuote stamps the requested one).
        return quote.symbol === symbol ? quote : { ...quote, symbol };
      }
      failures.push(`${symbol}: no usable price`);
    } catch (err) {
      if (err instanceof BlockedError) throw err; // a block is the answer — fail closed
      if (!isExpiredMonth(err)) throw err; // format change / transport — fail closed
      failures.push(`${symbol}: expired`); // the one probe-advancing failure
    }
  }

  // The continuous fallback — better a wrong-contract quote than none.
  try {
    const quote = await fetchYahooQuote(BRENT_CONTINUOUS_SYMBOL, '40d', opts);
    if (usableQuote(quote)) return quote;
    failures.push(`${BRENT_CONTINUOUS_SYMBOL}: no usable price`);
  } catch (err) {
    if (err instanceof BlockedError) throw err; // a block is the answer — fail closed
    failures.push(`${BRENT_CONTINUOUS_SYMBOL}: ${err instanceof Error ? err.message.slice(0, 80) : 'failed'}`);
  }

  throw new Error(`[brent front-month] every probe failed: ${failures.join(' | ')}`);
}
