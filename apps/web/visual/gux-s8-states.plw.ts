/**
 * gux-s8-states.plw.ts — the S8 honest-states evidence (GUX-S8 M5): the
 * master plan's Session 8 task 8 — "Test loading, stale, unavailable,
 * insufficient-history, error, and partial-data states" — rendered,
 * asserted, and CAPTURED over the fixture server, with the states
 * forced through in-memory route interception (the GB-S4 overlay
 * pattern: the fixture files themselves never change; route.fetch()
 * bypasses the interception for the underlying truth).
 *
 * The states and their honest contracts:
 *
 *   LOADING — a deferred projection: the page-level loader (role=status,
 *   "Reading the gold meter…" + the three dots) paints; no fake content;
 *   releasing the gate completes the load (no stuck state).
 *   ERROR (no data, no cache) — the 503 projection: the honest error
 *   title + the retry button; the retry recovers when the route heals.
 *   STALE/CACHED (the outage path) — a good first load (the cache
 *   written), then a 503 reload: the LAST GOOD copy keeps rendering,
 *   clearly labelled («نمایش آخرین نسخهٔ سالم — داده‌های …», BD-S5a).
 *   UNAVAILABLE — the premium + vault + OHLC planes 503'd: their
 *   "could not be read" lines render (never zeros, never blanks).
 *   INSUFFICIENT HISTORY — the if-you'd-bought calculator without its
 *   series and the Episode Explorer's drop-gated halves: the waiting
 *   lines render (never an interim number).
 *   PARTIAL DATA — a projection with a slice of readings removed: the
 *   dark seats state WHY they are dark (the cause-class why-lines) and
 *   the publication-notes' absent-count line counts what is missing.
 *
 * Plus the discoverability contract: the technical tiers stay one tap
 * away without cluttering the default (the record sheet's technical
 * <details> collapsed; the publication-notes disclosure collapsed).
 */

import { test, expect, type Page, type Route } from '@playwright/test';
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
  's8',
);

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function boot(page: Page, opts: { locale: 'en' | 'fa'; theme?: 'light' | 'dark'; width: number; height: number }): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      window.localStorage.setItem('theme', theme);
    },
    [opts.locale, opts.theme ?? 'light'],
  );
}

/** The never-resolving route (the loading state's deferred answer). */
function defer(): { route: (r: Route) => void; release: (body: unknown) => void } {
  let release: (body: unknown) => void = () => undefined;
  const gate = new Promise<unknown>((resolve) => {
    release = resolve;
  });
  return {
    route: (r) => {
      void gate.then((body) => r.fulfill({ json: body as object }));
    },
    release,
  };
}

const FORCED_503 = { status: 503, json: { error: { code: 'upstream_unavailable', message: 'forced for the state test' } } };

/* ------------------------------------------------------------------ */

test('LOADING — the deferred projection paints the honest loader', async ({ page }) => {
  await boot(page, { locale: 'en', width: 390, height: 844 });
  // Capture the real fixture body first (route.fetch bypasses routes).
  const truth = await (await page.request.get('http://localhost:4050/api/insights/pages/gold')).json();
  const gate = defer();
  await page.route('**/api/insights/pages/gold', (r) => gate.route(r));
  await page.goto('/gold');
  // The loader: role=status + the honest loading line + the dots.
  await expect(page.locator('main [role="status"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('main')).toContainText('Reading the gold meter', { timeout: 5_000 });
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-loading-mobile-en.png') });
  // Heal: the loader gives way to the real page (no stuck state).
  await gate.release(truth);
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 15_000 });
});

test('ERROR — no data, no cache: the honest error + the working retry', async ({ page }) => {
  await boot(page, { locale: 'en', width: 390, height: 844 });
  let fail = true;
  await page.route('**/api/insights/pages/gold', (r) => {
    if (fail) r.fulfill(FORCED_503);
    else r.fallback();
  });
  await page.goto('/gold');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('unavailable right now', { timeout: 10_000 });
  const retry = page.getByRole('button', { name: /try again/i });
  await expect(retry).toBeVisible();
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-error-mobile-en.png') });
  // The retry recovers when the route heals.
  fail = false;
  await retry.click();
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 15_000 });
});

test('STALE/CACHED — the outage keeps the last good copy, clearly labelled', async ({ page }) => {
  await boot(page, { locale: 'fa', width: 390, height: 844 });
  await page.goto('/gold');
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The cache is now written; break the route and reload.
  await page.route('**/api/insights/pages/gold', (r) => r.fulfill(FORCED_503));
  await page.reload();
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The fromCache sentence replaces the plain data-as-of line (BD-S5a).
  await expect(page.locator('main header').first()).toContainText('آخرین نسخهٔ سالم', { timeout: 5_000 });
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-cached-mobile-fa.png') });
});

test('UNAVAILABLE — the unreadable planes say so, never zero', async ({ page }) => {
  await boot(page, { locale: 'en', width: 1440, height: 1000 });
  await page.route(/\/api\/insights\/(gold-premium|gold-lbma|gold-ohlc|gold-cb)$/, (r) => r.fulfill(FORCED_503));
  await page.goto('/gold');
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The premium + vault cards: their "none" states with the honest line.
  await expect(page.locator('[data-gold-premium="none"]')).toBeVisible();
  await expect(page.locator('[data-gold-lbma="none"]')).toBeVisible();
  // The Signals section is OPEN BY DEFAULT (the owner's round-27
  // decision — the detail is the content); the chart's own honest none
  // (the OHLC leg is 503) states it could not be read, in place.
  await expect(page.locator('[data-gold-price-chart="none"]').first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-unavailable-desktop-en.png') });
});

test('INSUFFICIENT HISTORY — the waiting lines, never interim numbers', async ({ page }) => {
  await boot(page, { locale: 'fa', width: 390, height: 844 });
  await page.goto('/gold');
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The tail is near-viewport lazy — scroll the page to its foot so the
  // boundary mounts (the zone-o ids do not exist before it does).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await page.locator('[data-gold-ifbought] button[aria-expanded]').first().click();
  // The if-bought without its series: the waiting line renders.
  await expect(page.locator('[data-ib-waiting]')).toBeVisible({ timeout: 10_000 });
  // The Episode Explorer: open the band, then a record — its price-path
  // half renders the drop-gated waiting state (the WGC workbook has not
  // landed), never an interim number.
  await page.locator('[data-gold-zone-o-band] button[aria-expanded]').first().click();
  await expect(page.locator('[data-episodes-list]')).toBeVisible({ timeout: 10_000 });
  await page.locator('[data-episode] > button').first().click();
  await expect(page.locator('[data-episode-path="waiting"]').first()).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-waiting-mobile-fa.png') });
});

test('PARTIAL DATA — the dark seats say why; the absent count renders', async ({ page }) => {
  await boot(page, { locale: 'en', width: 1440, height: 1000 });
  // The partial projection: keep the shape, drop a slice of readings —
  // declared HONESTLY in absentIds (the server's own shape), the seats
  // whose readings vanished render DARK with their why-lines.
  await page.route('**/api/insights/pages/gold', async (r) => {
    const response = await r.fetch();
    const body = (await response.json()) as { readings?: Array<{ id: string }>; absentIds?: string[] };
    const dropped = (body.readings ?? []).filter((_, i) => i % 3 === 0);
    const kept = (body.readings ?? []).filter((_, i) => i % 3 !== 0);
    await r.fulfill({
      json: { ...body, readings: kept, absentIds: [...(body.absentIds ?? []), ...dropped.map((x) => x.id)] },
    });
  });
  await page.goto('/gold');
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The why-lines on the dark seats.
  const whyCount = await page.locator('[data-seat-why]').count();
  expect(whyCount, 'the dark seats state why they are dark').toBeGreaterThan(0);
  // The absent-count line in the publication notes (the tail is lazy —
  // the page's foot mounts it).
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  await page.locator('[data-gold-publication-notes] button[aria-expanded], [data-pubnotes-toggle]').first().click();
  await expect(page.locator('[data-absent-note]')).toBeVisible({ timeout: 10_000 });
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-partial-desktop-en.png') });
});

test('DISCOVERABILITY — the technical tiers stay one tap away, collapsed', async ({ page }) => {
  await boot(page, { locale: 'en', width: 1440, height: 1000 });
  await page.goto('/gold');
  await expect(page.locator('[data-briefing-card]')).toBeVisible({ timeout: 20_000 });
  // The publication-notes disclosure: mounted by the tail's near-viewport
  // boundary (scroll to the page's foot), then asserted COLLAPSED.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1500);
  const pubToggle = page.locator('[data-pubnotes-toggle]');
  await expect(pubToggle).toBeVisible({ timeout: 10_000 });
  await expect(pubToggle).toHaveAttribute('aria-expanded', 'false');
  // The record sheet's technical tier: open a seat, the <details>
  // inside renders collapsed — the technical depth is one more tap.
  await page.evaluate(() => document.getElementById('gold-seats')?.scrollIntoView());
  const opener = page.locator('[data-seat-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const sheet = page.locator('[data-gold-record-sheet]');
  await expect(sheet).toBeVisible();
  const details = sheet.locator('details');
  await expect(details.first()).toBeVisible({ timeout: 10_000 });
  await expect(details.first()).not.toHaveAttribute('open');
  await page.screenshot({ path: path.join(SHOT_DIR, 'state-sheet-technical-desktop-en.png') });
});
