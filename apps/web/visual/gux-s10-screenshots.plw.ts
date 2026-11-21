/**
 * gux-s10-screenshots.plw.ts — the Q3-A execution's visual evidence (GUX-S10:
 * the owner's answer A, the ratio-only home) over the visual harness's
 * fixture server (never a live site), en/fa × the light-desktop + dark-mobile
 * pairs (the S8+ pairing discipline, the REAL theme key per S8-D3).
 *
 * The set (the before = the S9 captures on record; these are the AFTER):
 *   - signals-{pair}.png — the CHANGED surface: the gold-only Signals card
 *     (the interactive chart + the measured note + the gold footing row +
 *     the lane drill) — no silver analysis card, no silver verdict
 *     sentence, no silver trend chart, no keep-small note, no silver
 *     footing row;
 *   - full-mobile-{locale}.png — the full 390 page (the section in its
 *     mobile context);
 *   - ratio-seat-{locale}.png — SURVIVOR SEAT 1: the gold-silver ratio's
 *     own seat (the stress lane's voter card — silver's canonical read on
 *     this page; rides the /api/insights snapshot fixture);
 *   - ifbought-{locale}.png — SURVIVOR SEAT 2: the if-you'd-bought row's
 *     silver asset row (the Zone O tail card, expanded — the plane rides
 *     an in-memory /api/insights/gold-ifbought interception, the gb-s4
 *     pattern: the fixture server has no route for this plane, and the
 *     loaded state is the seat the evidence documents);
 *   - vault-silver-row-{locale}.png — SURVIVOR SEAT 3: the London vault's
 *     silver row (the Zone K card, expanded — the plane rides the same
 *     in-memory /api/insights/gold-lbma interception).
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'docs',
  'gold-redesign',
  'baseline-screenshots',
  's10',
);

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function boot(
  page: import('@playwright/test').Page,
  opts: { locale: 'en' | 'fa'; theme: 'light' | 'dark'; width: number; height: number },
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      // THE REAL KEY (the S8 harness fix — S8-D3).
      window.localStorage.setItem('theme', theme);
    },
    [opts.locale, opts.theme],
  );
  await page.goto('/gold');
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
  await page.waitForTimeout(400);
}

const PAIRS = [
  { name: 'mobile', width: 390, height: 844, theme: 'dark' as const },
  { name: 'desktop', width: 1440, height: 1000, theme: 'light' as const },
];

/* ------------------------------------------------------------------ *
 * The survivor seats' data planes — in-memory interceptions (the gb-s4
 * pattern: the fixture server serves the snapshot/OHLC/expectations
 * planes the CHANGED surface reads, but not the if-bought and LBMA
 * planes; the seats' LOADED states are the evidence, so the payloads are
 * synthesized here exactly against the @currena/core schemas'
 * constraints — every field present, series ascending, `current` after
 * the last anchor, asOf agreeing with the running month, the vault's
 * 24+ rows and the clearing's 120+).
 * ------------------------------------------------------------------ */

const YM = (y: number, m: number): string => `${y}-${String(m).padStart(2, '0')}`;
const FETCHED_AT = '2026-11-19T04:49:00.000Z';

/** A minimal-but-real if-bought snapshot: 10 anchors per asset, the
 * running month 2026-11, asOf 2026-11-19 (its month == sp500's current). */
function ifBoughtPayload(): Record<string, unknown> {
  const series = (last: number, step: number): Record<string, unknown> => ({
    monthly: Array.from({ length: 10 }, (_, i) => ({
      ym: YM(2026, i + 1),
      close: Number((last - step * (9 - i)).toFixed(2)),
    })),
    current: { ym: YM(2026, 11), close: Number((last + step).toFixed(2)), updatedAt: FETCHED_AT },
  });
  return {
    v: 1,
    asOf: '2026-11-19',
    fetchedAt: FETCHED_AT,
    backfill: {
      from: '2016-11',
      to: '2026-10',
      months: 120,
      sp500Source: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?range=10y&interval=1d',
      fetchedAt: FETCHED_AT,
    },
    assets: {
      gold: series(3876, 9),
      silver: series(44.6, 0.3),
      btc: series(91200, 2600),
      sp500: series(5920, 15),
    },
  };
}

/** A minimal-but-real LBMA snapshot: the vault's 24 months + the
 * clearing's 120 months, the last vault month 2026-10 (the family the
 * snapshot's asOf names), realistic tonnage scales. */
function lbmaPayload(): Record<string, unknown> {
  const vaultRows = Array.from({ length: 24 }, (_, i) => {
    const m = i - 23; // -23..0 months back from 2026-10
    const base = new Date(Date.UTC(2026, 9 + m, 1));
    return {
      month: `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}`,
      goldKoz: Number((316682 + i * 210).toFixed(2)),
      silverKoz: Number((928810 + i * 410).toFixed(2)),
    };
  });
  const clearingRows = Array.from({ length: 120 }, (_, i) => {
    const m = i - 119; // -119..0 months back from 2026-09
    const base = new Date(Date.UTC(2026, 8 + m, 1));
    return {
      month: `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}`,
      goldMoz: Number((18.3 + (i % 7) * 0.4).toFixed(2)),
      goldValueBn: Number((76.2 + (i % 5) * 1.3).toFixed(2)),
      goldTransfers: Number((7438 + (i % 11) * 65).toFixed(1)),
      silverMoz: Number((145.2 + (i % 9) * 1.7).toFixed(2)),
      silverValueBn: Number((21.4 + (i % 6) * 0.8).toFixed(2)),
      silverTransfers: Number((1620 + (i % 13) * 41).toFixed(1)),
    };
  });
  return {
    v: 1,
    asOf: '2026-10',
    fetchedAt: FETCHED_AT,
    vault: {
      asOf: '2026-10',
      rows: vaultRows,
      sourceUrl: 'https://www.lbma.org.uk/data/prices-data',
    },
    clearing: {
      asOf: '2026-09',
      rows: clearingRows,
      sourceUrl: 'https://www.lbma.org.uk/data/clearing-data',
    },
  };
}

test.describe('the Q3-A gold-only Signals section (GUX-S10)', () => {
  for (const vp of PAIRS) {
    for (const locale of ['en', 'fa'] as const) {
      const tag = `${vp.name}-${locale}-${vp.theme}`;

      test(`the gold-only signals card — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        const signals = page.locator('#insights-signals');
        await signals.scrollIntoViewIfNeeded();
        await page.waitForTimeout(700);
        // THE CONTRACT (the option's own enumeration): the gold chart +
        // the measured note + the gold footing row render…
        await expect(page.locator('[data-signal-card="merged"] [data-verdict-chart="gold"]')).toBeVisible();
        await expect(page.locator('[data-balance-measured-note]')).toBeVisible();
        await expect(page.locator('[data-footing-metal="gold"]')).toBeVisible();
        // …and EVERY silver surface of the section is gone.
        await expect(page.locator('[data-verdict-metal="silver"]')).toHaveCount(0);
        await expect(page.locator('[data-verdict-chart="silver"]')).toHaveCount(0);
        await expect(page.locator('[data-silver-keep-small-note]')).toHaveCount(0);
        await expect(page.locator('[data-footing-metal="silver"]')).toHaveCount(0);
        await page.screenshot({ path: path.join(SHOT_DIR, `signals-${tag}.png`) });
      });
    }
  }

  for (const locale of ['en', 'fa'] as const) {
    test(`the full 390 page (the section in its mobile context) — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOT_DIR, `full-mobile-${locale}.png`), fullPage: true });
    });

    test(`SURVIVOR SEAT 1 — the gold-silver ratio's own seat (the stress lane voter) — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000 });
      const seat = page.locator('[data-seat="gold-silver"]').first();
      await seat.scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
      // Silver's canonical seat: the ratio card + its drill-in detail.
      await expect(seat).toBeVisible();
      await page.screenshot({ path: path.join(SHOT_DIR, `ratio-seat-${locale}.png`) });
    });

    test(`SURVIVOR SEAT 2 — the if-you'd-bought row's silver asset — ${locale}`, async ({ page }) => {
      // The plane rides an in-memory interception (the gb-s4 pattern) —
      // registered BEFORE the boot so the card's fetch resolves from it.
      await page.route('**/api/insights/gold-ifbought', (route) =>
        route.fulfill({ contentType: 'application/json', body: JSON.stringify(ifBoughtPayload()) }),
      );
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000 });
      // The card lives in the Zone O TAIL CHUNK (near-viewport lazy) —
      // scroll the page to the tail to mount it, then wait for the card.
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForSelector('[data-gold-ifbought]', { timeout: 20_000 });
      await page.waitForTimeout(800);
      // The card defaults collapsed — open it (the component's own test
      // selector: the section's single disclosure button).
      await page.locator('[data-gold-ifbought] button[aria-expanded]').click();
      await page.waitForSelector('[data-ib-rows]', { timeout: 10_000 });
      await expect(page.locator('[data-ib-row="silver"]')).toBeVisible();
      await page.screenshot({ path: path.join(SHOT_DIR, `ifbought-${locale}.png`) });
    });

    test(`SURVIVOR SEAT 3 — the London vault's silver row — ${locale}`, async ({ page }) => {
      await page.route('**/api/insights/gold-lbma', (route) =>
        route.fulfill({ contentType: 'application/json', body: JSON.stringify(lbmaPayload()) }),
      );
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000 });
      const vault = page.locator('[data-gold-lbma]');
      await vault.scrollIntoViewIfNeeded();
      await page.waitForSelector('[data-lbma-card="vault"]', { timeout: 10_000 });
      await page.waitForTimeout(500);
      // The vault rider defaults collapsed — expand it to reveal the
      // silver row (its only button is the disclosure toggle).
      await page.locator('[data-lbma-card="vault"] button[aria-expanded="false"]').click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOT_DIR, `vault-silver-row-${locale}.png`) });
    });
  }
});
