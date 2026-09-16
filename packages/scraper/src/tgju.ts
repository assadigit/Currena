/**
 * TGJU scraper — Iranian open-market rates (Path A, Gate 2: the Worker scrapes
 * TGJU directly).
 *
 * PRIMARY: one GET to `https://call1.tgju.org/ajax.json` (1 request instead of
 * 16 profile pages) → `current[<slug>].p` for the 16 legacy profile slugs.
 * FALLBACK (only when ajax.json fails): the 16 `https://www.tgju.org/profile/<slug>`
 * pages, parsed via `<span data-col="info.last_trade.PDrCotVal">…</span>`
 * (~4 pages in flight at a time).
 *
 * ⚠️ UNIT FACT (verified 2026-09-16): TGJU `p` values are RIAL-denominated
 * with thousands commas (price_dollar_rl p="2,305,000"). The legacy app served
 * TOMAN (live: 1 USD = 230,500 Toman), so the normalizer strips separators
 * (ASCII + Persian-digit tolerant) and divides by 10 → Toman. This
 * Rial→Toman conversion happens ONLY here (AGENTS.md §6).
 *
 * Snapshot convention: base `IRR`, rates = units of `code` per 1 IRR — i.e.
 * the INVERSE of the Toman quote — plus the IRR self-rate (rate 1, unit
 * 'TOMAN') so @currena/core's convert() can look up BOTH sides of a pair.
 */

import { CURRENCIES, getCurrency, SnapshotSchema } from '@currena/core';
import type { Rate, Snapshot } from '@currena/core';
import { z } from 'zod';
import { fetchWithRetry, mapWithConcurrency } from './http';
import type { FetchRetryOptions } from './http';
import { ScraperError } from './errors';

/** Primary endpoint: one JSON document covering every TGJU symbol. */
export const TGJU_AJAX_URL = 'https://call1.tgju.org/ajax.json';

/** Profile-page fallback base (legacy per-currency pages). */
export const TGJU_PROFILE_BASE = 'https://www.tgju.org/profile/';

/** Pages fetched concurrently in the fallback path. */
export const TGJU_PROFILE_CONCURRENCY = 4;

/** The 16 legacy TGJU profile slugs, derived from core's currency table. */
export const TGJU_PROFILES: readonly { code: string; slug: string }[] = Object.freeze(
  CURRENCIES.filter((c) => c.tgjuProfile).map((c) => ({ code: c.code, slug: c.tgjuProfile as string })),
);

export function tgjuProfilePageUrl(slug: string): string {
  return `${TGJU_PROFILE_BASE}${slug}`;
}

/* ------------------------------------------------------------------ *
 * Normalization
 * ------------------------------------------------------------------ */

/**
 * Parse a TGJU price string into a number: ASCII or Persian/Arabic-Indic
 * digits, thousands separators (`,`, `٬` U+066C, `،` U+060C) stripped.
 * Throws a typed error for anything that is not a positive finite number —
 * upstream changes must fail loudly, never render garbage.
 */
export function normalizeTgjuNumber(raw: string): number {
  let ascii = '';
  for (const ch of raw.trim()) {
    const cp = ch.codePointAt(0) as number;
    if (cp >= 0x06f0 && cp <= 0x06f9) {
      ascii += String.fromCharCode(cp - 0x06f0 + 0x30); // ۰-۹ (Persian)
    } else if (cp >= 0x0660 && cp <= 0x0669) {
      ascii += String.fromCharCode(cp - 0x0660 + 0x30); // ٠-٩ (Arabic-Indic)
    } else if (ch === ',' || cp === 0x066c || cp === 0x060c) {
      continue; // thousands separators
    } else {
      ascii += ch;
    }
  }
  const value = Number(ascii);
  if (ascii === '' || !Number.isFinite(value) || value <= 0) {
    throw new ScraperError('tgju_bad_number', `Cannot parse TGJU price ${JSON.stringify(raw)} into a positive number`);
  }
  return value;
}

/** Rial → Toman (the ONLY place this conversion exists, AGENTS.md §6). */
export function rialToToman(rial: number): number {
  return rial / 10;
}

/** zod view of the ajax.json payload — only the fields we consume. */
const TgjuAjaxSchema = z.object({
  current: z.record(z.string(), z.object({ p: z.string() })),
});

/**
 * Build the IRR-base Snapshot from Rial quotes keyed by TGJU slug.
 * zod-validates the result — a malformed build throws a typed error.
 */
export function buildTgjuSnapshot(rialBySlug: ReadonlyMap<string, number>, now: Date = new Date()): Snapshot {
  const irr = getCurrency('IRR');
  if (!irr) throw new ScraperError('tgju_internal', "Core currency table has no 'IRR' entry");

  const rates: Rate[] = [
    {
      code: 'IRR',
      name: irr.name, // 'Iranian Rial' — international common name (Gate 1 #4)
      symbol: irr.symbol,
      rate: 1, // self-rate: convert() looks up BOTH sides (core math.ts)
      unit: 'TOMAN', // canonical unit under code IRR (AGENTS.md §6)
    },
  ];

  for (const { code, slug } of TGJU_PROFILES) {
    const rial = rialBySlug.get(slug);
    if (rial === undefined) {
      throw new ScraperError('tgju_missing_slug', `No TGJU quote collected for slug '${slug}'`);
    }
    const meta = getCurrency(code);
    if (!meta) throw new ScraperError('tgju_internal', `Core currency table has no '${code}' entry`);
    const tomanPerUnit = rialToToman(rial);
    rates.push({
      code,
      name: meta.name,
      symbol: meta.symbol,
      // Convention: rate = units of `code` per 1 unit of base (IRR) → invert.
      rate: 1 / tomanPerUnit,
    });
  }

  return validateSnapshot({ base: 'IRR', source: 'tgju', fetchedAt: now.toISOString(), rates });
}

/** Parse an ajax.json payload into a Snapshot (pure — fixture-testable). */
export function parseTgjuAjax(json: unknown, now: Date = new Date()): Snapshot {
  const parsed = TgjuAjaxSchema.safeParse(json);
  if (!parsed.success) {
    throw new ScraperError(
      'tgju_bad_payload',
      `TGJU ajax.json has an unexpected shape: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }

  const rialBySlug = new Map<string, number>();
  for (const { code, slug } of TGJU_PROFILES) {
    const entry = parsed.data.current[slug];
    if (!entry) {
      throw new ScraperError('tgju_missing_slug', `TGJU ajax.json has no '${slug}' entry (upstream layout change?)`);
    }
    rialBySlug.set(slug, normalizeTgjuNumber(entry.p));
  }
  return buildTgjuSnapshot(rialBySlug, now);
}

/** Value span on profile pages: `<span data-col="info.last_trade.PDrCotVal">2,305,000</span>` (Rial). */
const PDR_COT_VAL_RE = /data-col="info\.last_trade\.PDrCotVal">\s*([0-9۰-۹٠-٩][0-9۰-۹٠-٩,،٬]*)\s*</;

/** Extract the Rial price from a profile page's HTML (pure — fixture-testable). */
export function parseTgjuProfilePrice(html: string): number {
  const match = PDR_COT_VAL_RE.exec(html);
  if (!match || !match[1]) {
    throw new ScraperError(
      'tgju_profile_parse_failed',
      "TGJU profile HTML has no 'info.last_trade.PDrCotVal' value span (upstream layout change?)",
    );
  }
  return normalizeTgjuNumber(match[1]);
}

/* ------------------------------------------------------------------ *
 * Scrapers
 * ------------------------------------------------------------------ */

export interface TgjuScrapeOptions extends FetchRetryOptions {
  /** Clock for `fetchedAt` (tests). Default: real time. */
  now?: () => Date;
}

function httpOpts(opts: TgjuScrapeOptions): FetchRetryOptions {
  const { now: _now, ...http } = opts;
  return http;
}

/** Fetch all 16 profile pages (fallback path) and build the Snapshot. */
export async function scrapeTgjuProfiles(opts: TgjuScrapeOptions = {}): Promise<Snapshot> {
  const rialBySlug = new Map<string, number>();
  await mapWithConcurrency(TGJU_PROFILES, TGJU_PROFILE_CONCURRENCY, async ({ slug }) => {
    const res = await fetchWithRetry(tgjuProfilePageUrl(slug), {}, httpOpts(opts));
    const html = await res.text();
    rialBySlug.set(slug, parseTgjuProfilePrice(html));
  });
  return buildTgjuSnapshot(rialBySlug, (opts.now ?? (() => new Date()))());
}

/**
 * Scrape TGJU: try ajax.json first (1 request); on ANY failure fall back to the
 * 16 profile pages. Both paths failing throws a typed ScraperError that the
 * API ladder turns into a 503 + status record.
 */
export async function scrapeTgju(opts: TgjuScrapeOptions = {}): Promise<Snapshot> {
  let ajaxError: unknown;
  try {
    const res = await fetchWithRetry(TGJU_AJAX_URL, {}, httpOpts(opts));
    const json: unknown = await res.json();
    return parseTgjuAjax(json, (opts.now ?? (() => new Date()))());
  } catch (err) {
    ajaxError = err; // fall through to the profile-page fallback
  }

  try {
    return await scrapeTgjuProfiles(opts);
  } catch (profileError) {
    throw new ScraperError(
      'tgju_scrape_failed',
      `TGJU scrape failed — ajax.json: ${errorMessage(ajaxError)}; profile fallback: ${errorMessage(profileError)}`,
      { cause: profileError },
    );
  }
}

/** Shared: zod-validate a built Snapshot; throw typed on failure. */
export function validateSnapshot(candidate: unknown): Snapshot {
  const parsed = SnapshotSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new ScraperError(
      'snapshot_validation_failed',
      `Scraper produced an invalid snapshot: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}`,
    );
  }
  return parsed.data;
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
