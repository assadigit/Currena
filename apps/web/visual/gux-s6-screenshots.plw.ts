/**
 * gux-s6-screenshots.plw.ts — the S6 screenshot set (GUX-S6 M6): the
 * session's new surfaces over the visual harness's fixture server
 * (never a live site) — the relationship explorer (the list + the
 * canvas open + a filter active) + the re-scoped context cards (the
 * RatioCards' bands) + the fa explorer, en/fa × desktop-1440/mobile-390
 * × light/dark for the explorer's list, and the light-desktop +
 * dark-mobile pairs for the focused surfaces (the S5 set's own pairing
 * discipline).
 *
 * The fixture: visual/fixtures/gold-projection.json + gold-ohlc.json
 * (the S5 set's own corpus — unchanged). The explorer's lazy boundary
 * mounts near-viewport; the captures scroll to it first.
 */

import { test } from '@playwright/test';
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
  's6',
);

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 },
] as const;
const THEMES = ['light', 'dark'] as const;
const LOCALES = ['en', 'fa'] as const;

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function boot(page, opts: { locale: 'en' | 'fa'; theme: 'light' | 'dark'; width: number; height: number }): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      window.localStorage.setItem('currena:theme', theme);
    },
    [opts.locale, opts.theme],
  );
  await page.goto('/gold');
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
}

/** Scrolls to the explorer and waits for its lazy boundary to mount. */
async function openExplorer(page): Promise<void> {
  await page.locator('#gold-relationships, [data-gold-relationships-probe]').first().scrollIntoViewIfNeeded();
  await page.waitForSelector('#gold-relationships [data-rel-row]', { timeout: 20_000 });
  await page.waitForTimeout(250);
}

test.describe('the S6 gold page (the explorer + the re-scoped cards)', () => {
  // The explorer list — the full matrix (the session's centerpiece).
  for (const vp of VIEWPORTS) {
    for (const locale of LOCALES) {
      for (const theme of THEMES) {
        const tag = `${vp.name}-${locale}-${theme}`;

        test(`explorer list — ${tag}`, async ({ page }) => {
          const errors: string[] = [];
          page.on('pageerror', (e) => errors.push(String(e)));
          await boot(page, { locale, theme, width: vp.width, height: vp.height });
          await openExplorer(page);
          await page.screenshot({ path: path.join(SHOT_DIR, `explorer-${tag}.png`) });
          if (errors.length > 0) throw new Error(`console errors on ${tag}: ${errors.slice(0, 3).join(' | ')}`);
        });
      }
    }
  }

  // The canvas open + a filter active — the light-desktop + dark-mobile pairs.
  for (const pair of [
    { vp: VIEWPORTS[0], theme: 'light' as const },
    { vp: VIEWPORTS[1], theme: 'dark' as const },
  ]) {
    for (const locale of LOCALES) {
      const tag = `${pair.vp.name}-${locale}-${pair.theme}`;

      test(`explorer canvas — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: pair.theme, width: pair.vp.width, height: pair.vp.height });
        await openExplorer(page);
        const toggle = page.locator('[data-rel-canvas-toggle]');
        if ((await toggle.count()) > 0 && (await toggle.isVisible())) {
          await toggle.click();
          await page.waitForSelector('[data-rel-canvas]', { timeout: 10_000 });
          await page.waitForTimeout(200);
        }
        // Mobile: the toggle is hidden by design (12 §5.1's list-first
        // rule) — the capture is the list-only mobile explorer.
        await page.screenshot({ path: path.join(SHOT_DIR, `canvas-${tag}.png`) });
      });

      test(`explorer filter C — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: pair.theme, width: pair.vp.width, height: pair.vp.height });
        await openExplorer(page);
        await page.locator('[data-rel-filter="C"]').click();
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(SHOT_DIR, `filter-c-${tag}.png`) });
      });

      test(`context bands — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: pair.theme, width: pair.vp.width, height: pair.vp.height });
        await page.locator('#gold-context').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-context-mark="band"]', { timeout: 20_000 });
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(SHOT_DIR, `context-bands-${tag}.png`) });
      });
    }
  }
});
