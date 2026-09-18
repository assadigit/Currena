/**
 * Frankfurter scraper — international pairs (ECB reference rates).
 * `https://api.frankfurter.dev/v1/latest?base=USD` → Snapshot with base 'USD'
 * and Frankfurter's native rate convention (units of `code` per 1 USD), so
 * values pass through unchanged (schemas.ts rate convention).
 *
 * Known limitation (verified 2026-09-16): Frankfurter serves ~31 currencies
 * and NOT AED or VND — international pairs involving those fail cleanly with
 * `currency_not_supported` at the API layer; their IRR pairs still work via
 * TGJU. Never fall IRR pairs back to Frankfurter (AGENTS.md rule 8).
 */

import { getCurrency } from '@currena/core';
import type { Rate, Snapshot } from '@currena/core';
import { z } from 'zod';
import { ScraperError } from './errors';
import { fetchWithRetry } from './http';
import type { FetchRetryOptions } from './http';
import { validateSnapshot } from './tgju';
export const FRANKFURTER_LATEST_URL = 'https://api.frankfurter.dev/v1/latest?base=USD';

/** zod view of the Frankfurter /latest payload — only the fields we consume. */
const FrankfurterLatestSchema = z.object({
  amount: z.number(),
  base: z.string(),
  date: z.string(),
  rates: z.record(z.string(), z.number()),
});

export interface FrankfurterScrapeOptions extends FetchRetryOptions {
  /** Clock for `fetchedAt` (tests). Default: real time. */
  now?: () => Date;
}

/** Display name for an arbitrary ISO code: core table → CLDR en → the code itself. */
export function currencyDisplayName(code: string): string {
  const known = getCurrency(code);
  if (known) return known.name;
  try {
    // Intl.DisplayNames construction is expensive — memoize the single
    // instance this helper ever needs (locale + type are constant here).
    displayNames ??= new Intl.DisplayNames(['en'], { type: 'currency' });
    const display = displayNames.of(code);
    if (display && display !== code) return display;
  } catch {
    // invalid code for Intl — fall through
  }
  return code;
}

let displayNames: Intl.DisplayNames | undefined;

/**
 * Build the USD-base Snapshot from a parsed Frankfurter payload (pure —
 * fixture-testable). Adds the USD self-rate (convert() looks up BOTH sides).
 */
export function buildFrankfurterSnapshot(payload: unknown, now: Date = new Date()): Snapshot {
  const parsed = FrankfurterLatestSchema.safeParse(payload);
  if (!parsed.success) {
    throw new ScraperError(
      'frankfurter_bad_payload',
      `Frankfurter /latest has an unexpected shape: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  if (parsed.data.base !== 'USD') {
    throw new ScraperError('frankfurter_bad_base', `Frankfurter returned base '${parsed.data.base}', expected 'USD'`);
  }

  const usd = getCurrency('USD');
  if (!usd) throw new ScraperError('frankfurter_internal', "Core currency table has no 'USD' entry");

  const rates: Rate[] = [
    { code: 'USD', name: usd.name, symbol: usd.symbol, rate: 1 }, // self-rate
  ];
  for (const [code, rate] of Object.entries(parsed.data.rates)) {
    if (!(rate > 0) || !Number.isFinite(rate)) {
      throw new ScraperError('frankfurter_bad_rate', `Frankfurter rate for '${code}' is not a positive finite number: ${rate}`);
    }
    const meta = getCurrency(code);
    rates.push(
      // Symbol only where core provides one (Frankfurter serves no symbols).
      meta
        ? { code, name: meta.name, symbol: meta.symbol, rate }
        : { code, name: currencyDisplayName(code), rate },
    );
  }

  return validateSnapshot({
    base: 'USD',
    source: 'frankfurter',
    fetchedAt: now.toISOString(),
    rates,
  });
}

/** Scrape Frankfurter /latest (base USD) and build the zod-validated Snapshot. */
export async function scrapeFrankfurter(opts: FrankfurterScrapeOptions = {}): Promise<Snapshot> {
  const res = await fetchWithRetry(FRANKFURTER_LATEST_URL, {}, opts);
  const json: unknown = await res.json();
  return buildFrankfurterSnapshot(json, (opts.now ?? (() => new Date()))());
}