/**
 * gux-s8-screenshots.plw.ts — the S8 screenshot set (GUX-S8 M6): the
 * mobile-first remediation's visual evidence over the visual harness's
 * fixture server (never a live site), en/fa × the light-desktop +
 * dark-mobile pairs (the S5–S7 pairing discipline).
 *
 * THE HARNESS FIX THIS SESSION OWNS: the boot writes the app's REAL
 * theme key — the LEGACY 'theme' (lib/theme.ts + the index.html
 * pre-paint script). The S5–S7 suites wrote 'currena:theme', an inert
 * key: every "dark" capture in those sets is a LIGHT render (the S8
 * audit's finding, recorded in the report §2). This set's dark pairs
 * are the first genuinely dark captures of the program.
 *
 * The set (the states evidence rides gux-s8-states.plw.ts's own seven
 * captures):
 *   - nav-{pair}.png — the REBUILT one-row chip-scroller stuck mid-page
 *     (44px chips, the active chip centered, the direction-aware edge
 *     fade) — the M1 remediation's own surface;
 *   - mobile-full-{locale}.png — the full 390 page (the deliberate
 *     mobile layout end-to-end);
 *   - hero-{pair}.png — the page head (the briefing hierarchy);
 *   - fiveforces-mobile-{locale}.png — the lane stack + seat cards at
 *     the narrow width;
 *   - sheet-mobile-{locale}-dark.png + sheet-desktop-{locale}.png — the
 *     record sheet's TWO geometries (the same component);
 *   - inspector-desktop-{locale}.png — the interactive chart with the
 *     keyboard crosshair parked on a point (the spoken readout's
 *     visible twin).
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
  's8',
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
      // THE REAL KEY (the S8 harness fix — see the file header).
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

test.describe('the S8 gold page (the mobile-first remediation)', () => {
  for (const vp of PAIRS) {
    for (const locale of ['en', 'fa'] as const) {
      const tag = `${vp.name}-${locale}-${vp.theme}`;

      test(`the rebuilt section nav — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        // Scroll until the nav is STUCK (past the hero), with a section
        // active so the highlighted chip renders.
        await page.evaluate(() => window.scrollTo(0, 2600));
        await page.waitForTimeout(700);
        const nav = page.locator('[data-gold-section-nav]');
        await expect(nav).toBeVisible();
        await expect(page.locator('[data-nav-chip][data-nav-active]').first()).toBeVisible();
        await page.screenshot({ path: path.join(SHOT_DIR, `nav-${tag}.png`) });
      });

      test(`the hero (the briefing hierarchy) — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.screenshot({ path: path.join(SHOT_DIR, `hero-${tag}.png`) });
      });
    }
  }

  for (const locale of ['en', 'fa'] as const) {
    test(`the full 390 page (the deliberate mobile layout) — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 390, height: 844 });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(SHOT_DIR, `mobile-full-${locale}.png`), fullPage: true });
    });

    test(`the five forces at the narrow width — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 390, height: 844 });
      await page.evaluate(() => document.getElementById('gold-seats')?.scrollIntoView());
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SHOT_DIR, `fiveforces-mobile-${locale}.png`) });
    });

    test(`the record sheet — the mobile bottom sheet — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'dark', width: 390, height: 844 });
      const opener = page.locator('[data-seat-open]').first();
      await opener.scrollIntoViewIfNeeded();
      await opener.click();
      await expect(page.locator('[data-gold-record-sheet]')).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOT_DIR, `sheet-mobile-${locale}-dark.png`) });
    });

    test(`the record sheet — the desktop inline-end sheet — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000 });
      const opener = page.locator('[data-seat-open]').first();
      await opener.scrollIntoViewIfNeeded();
      await opener.click();
      await expect(page.locator('[data-gold-record-sheet]')).toBeVisible();
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(SHOT_DIR, `sheet-desktop-${locale}.png`) });
    });

    test(`the chart inspector (the keyboard crosshair + its readout) — ${locale}`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000 });
      const plot = page.locator('[data-chart-plot]').first();
      await plot.scrollIntoViewIfNeeded();
      await plot.focus();
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await expect(page.locator('[data-chart-inspector-readout]')).not.toBeEmpty();
      await page.screenshot({ path: path.join(SHOT_DIR, `inspector-desktop-${locale}.png`) });
    });
  }
});
