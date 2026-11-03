/**
 * gb-s3-screenshots.plw.ts — the gold balance consolidation P2 (GB-S3)
 * screenshot set for the phase's PR description (03 §7's checklist scoped
 * to this session: EN + fa × 360 + 1280, the FLAG view — the recorded
 * 2026-10-31 corpus data, which renders the spec's level case with the
 * borrowing-costs SPLIT lane — and the DEFAULT view, which must look
 * exactly like today's page).
 *
 * The fixture snapshot is served by visual/fixture-server.mjs (never a
 * live site); this run's snapshot carries the 2026-10-31 archive overlay
 * (the same fixture the component tests use — 01 §7's worked example).
 * The locale persists under `currena:locale` (src/lib/locale.ts).
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
  'specs',
  'gold-balance-consolidation',
  'evidence',
  'gb-s3',
);

const WIDTHS = [360, 1280] as const;
const HEIGHTS: Record<(typeof WIDTHS)[number], number> = { 360: 900, 1280: 1000 };

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

/** Loads the insights page at one width + locale, waits for the gold card,
 * and captures the merged card element. The site's sticky bars are made
 * static for the capture — element screenshots of a card taller than the
 * viewport stitch scrolled passes, and a sticky header riding on top of
 * every pass reads as broken overlap (a screenshot-only neutralization;
 * the live page is untouched). */
async function capture(
  page: import('@playwright/test').Page,
  opts: { width: number; locale: 'en' | 'fa'; flag: boolean; name: string },
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: HEIGHTS[opts.width as 360 | 1280] ?? 900 });
  await page.addInitScript((locale) => window.localStorage.setItem('currena:locale', locale), opts.locale);
  await page.goto(opts.flag ? '/insights?balance=lanes' : '/insights');
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  // Let the charts' history fixtures + the balance's first paint settle.
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }' });
  const card = page.locator('[data-signal-card="merged"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: path.join(SHOT_DIR, `${opts.name}.png`) });
  await expect(card).toBeVisible();
}

for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  for (const width of WIDTHS) {
    test(`flag view — ${word} ${width}px (the level case + the split lane)`, async ({ page }) => {
      await capture(page, { width, locale, flag: true, name: `flag-${locale}-${width}` });
      // The lane view really rendered: the split badge + the measured note.
      await expect(page.locator('[data-balance-split-badge]')).toBeVisible();
      await expect(page.locator('[data-balance-measured-note]')).toBeVisible();
      // The two gold panels are retired from the preview.
      await expect(page.locator('[data-gold-panels]')).toHaveCount(0);
    });

    test(`default view — ${word} ${width}px (today's page, byte-for-byte)`, async ({ page }) => {
      await capture(page, { width, locale, flag: false, name: `default-${locale}-${width}` });
      // The legacy view keeps the two panels and no lane-view elements.
      await expect(page.locator('[data-gold-panels]')).toBeVisible();
      await expect(page.locator('[data-balance-context-line]')).toHaveCount(0);
    });
  }
}

test('flag view — the split lane detail panel open (EN 360 + FA 1280)', async ({ page }) => {
  // EN 360: open the split lane's detail panel, then capture the VIEWPORT
  // around it (the panel is the interaction being shown; a viewport shot
  // reads cleaner than a stitched whole-card element capture).
  await page.setViewportSize({ width: 360, height: 900 });
  await page.addInitScript(() => window.localStorage.setItem('currena:locale', 'en'));
  await page.goto('/insights?balance=lanes');
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }' });
  await page.locator('[data-balance-chip="borrowing-costs"]').click();
  await page.evaluate(() => {
    document.getElementById('gold-balance-detail')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -170); // breathing room: the measured note + panel top both in view
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(SHOT_DIR, 'flag-en-360-detail-open.png') });
  await expect(page.locator('[data-balance-member-group="supports"]')).toBeVisible();

  // FA 1280: the same interaction in Persian (RTL) at desktop width.
  const page2 = await page.context().newPage();
  await page2.setViewportSize({ width: 1280, height: 1000 });
  await page2.addInitScript(() => window.localStorage.setItem('currena:locale', 'fa'));
  await page2.goto('/insights?balance=lanes');
  await page2.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page2.waitForTimeout(900);
  await page2.addStyleTag({ content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }' });
  await page2.locator('[data-balance-chip="borrowing-costs"]').click();
  await page2.evaluate(() => {
    document.getElementById('gold-balance-detail')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -170); // breathing room: the measured note + panel top both in view
  });
  await page2.waitForTimeout(300);
  await page2.screenshot({ path: path.join(SHOT_DIR, 'flag-fa-1280-detail-open.png') });
  await expect(page2.locator('[data-balance-member-group="pressures"]')).toBeVisible();
});
