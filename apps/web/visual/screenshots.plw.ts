/**
 * screenshots.plw.ts — the screenshot capture spec (PH1-VISUAL).
 *
 * Renders the Insights page from the FIXTURE snapshot at the three UI_SPEC
 * widths (360 / 768 / 1200) and writes one full-page + one viewport capture
 * each into docs/insights/screenshots/, plus the Farsi (RTL) capture at 360
 * for the U-09 legibility criteria (UI-43: LTR and RTL). Phase 6's UI_REPORT
 * (runbook Phase 8) links exactly these files.
 *
 * The locale persists under `currena:locale` (src/lib/locale.ts) and the
 * theme under `theme` (src/lib/theme.ts) — both set before first paint.
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
  'insights',
  'screenshots',
);

const WIDTHS = [360, 768, 1200] as const;
const HEIGHTS: Record<(typeof WIDTHS)[number], number> = { 360: 780, 768: 1024, 1200: 900 };

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

for (const width of WIDTHS) {
  test(`screenshot: insights at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: HEIGHTS[width] });
    await page.addInitScript(() => window.localStorage.setItem('currena:locale', 'en'));
    await page.goto('/#/insights');
    await page.waitForSelector('#insights-hero', { state: 'visible' });
    await page.waitForSelector('article[data-status]', { state: 'visible' });
    await page.waitForSelector('[id^="insights-market-tile-"]', { state: 'visible' });
    // Let sparklines / charts request their history fixtures and settle.
    await page.waitForTimeout(700);
    await expect(page.locator('#insights-hero')).toBeVisible();
    await page.screenshot({ path: path.join(SHOT_DIR, `insights-${width}.png`), fullPage: true });
    await page.screenshot({ path: path.join(SHOT_DIR, `insights-${width}-viewport.png`) });
  });
}

test('screenshot: insights (fa, RTL) at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: HEIGHTS[360] });
  await page.addInitScript(() => window.localStorage.setItem('currena:locale', 'fa'));
  await page.goto('/#/insights');
  await page.waitForSelector('#insights-hero', { state: 'visible' });
  await page.waitForSelector('article[data-status]', { state: 'visible' });
  await page.waitForSelector('[id^="insights-market-tile-"]', { state: 'visible' });
  await page.waitForTimeout(700);
  await expect(page.locator('#insights-hero')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.screenshot({ path: path.join(SHOT_DIR, 'insights-fa-360.png'), fullPage: true });
});
