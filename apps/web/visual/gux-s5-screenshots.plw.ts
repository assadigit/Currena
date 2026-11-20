/**
 * gux-s5-screenshots.plw.ts — the S5 screenshot set (GUX-S5 M6): the
 * redesigned /gold page over the visual harness's fixture server (never
 * a live site) — en/fa × desktop-1440/mobile-390 × light/dark, the hero
 * + the five-force section + the record sheet open + the sticky nav.
 *
 * The fixture: visual/fixtures/gold-projection.json (built by
 * scripts/build-gold-fixture.mjs from the harness's own snapshot — the
 * synthetic corpus, the same data the component tests render) + the
 * gold-ohlc leg. The locale persists under `currena:locale`; the theme
 * under `currena:theme`.
 *
 * A screenshot-only neutralization (the gb-s3 pattern): the sticky nav
 * is made static for FULL-PAGE captures only (a sticky bar riding every
 * scrolled pass reads as broken overlap in stitched captures); the
 * viewport captures keep it sticky as designed.
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
  's5',
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
  // The hero's data arrives with the projection; wait for the briefing card.
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
  await page.waitForSelector('[data-composition-stack]', { timeout: 20_000 });
  // The OHLC spark may land a beat later (its own module-cached fetch).
  await page.waitForFunction(
    () => document.querySelector('[data-price-spark]') !== null,
    { timeout: 20_000 },
  ).catch(() => undefined); // the honest waiting line is also a valid capture state
  // The seats render below; give the LaneBars a frame.
  await page.waitForSelector('[data-lanebar]', { timeout: 20_000 });
}

/** Makes the sticky elements static (full-page capture only). */
async function unstick(page): Promise<void> {
  await page.addStyleTag({ content: '[data-gold-section-nav]{position:static !important}' });
}

test.describe('the S5 gold page (the fixture corpus)', () => {
  for (const vp of VIEWPORTS) {
    for (const locale of LOCALES) {
      for (const theme of THEMES) {
        const tag = `${vp.name}-${locale}-${theme}`;

        test(`hero — ${tag}`, async ({ page }) => {
          await boot(page, { locale, theme, width: vp.width, height: vp.height });
          await page.screenshot({ path: path.join(SHOT_DIR, `hero-${tag}.png`) });
        });

        test(`five-force overview — ${tag}`, async ({ page }) => {
          await boot(page, { locale, theme, width: vp.width, height: vp.height });
          await page.locator('#gold-seats').scrollIntoViewIfNeeded();
          await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(SHOT_DIR, `seats-${tag}.png`) });
        });

        test(`record sheet open — ${tag}`, async ({ page }) => {
          await boot(page, { locale, theme, width: vp.width, height: vp.height });
          await page.locator('[data-seat-open]').first().click();
          await page.waitForSelector('[data-gold-record-sheet]', { timeout: 20_000 });
          // The lazy deep tier lands after the dynamic import.
          await page.waitForSelector('[data-sheet-whatwhy]', { timeout: 20_000 });
          await page.waitForTimeout(200);
          await page.screenshot({ path: path.join(SHOT_DIR, `sheet-${tag}.png`) });
        });

        // The full-page + the console check ride the LIGHT desktop + the DARK mobile pairs
        // (the two extremes the owner actually reads).
        if ((vp.name === 'desktop' && theme === 'light') || (vp.name === 'mobile' && theme === 'dark')) {
          test(`full page — ${tag}`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (e) => errors.push(String(e)));
            page.on('console', (m) => {
              if (m.type() !== 'error') return;
              // The fixture server's designed feed 404s (the gold page's
              // optional legs — gold-cb · gold-episodes · gold-premium ·
              // ifbought — not part of the fixture set) surface as
              // resource-load console errors; the page renders their calm
              // unavailable states BY DESIGN. Only real JS errors fail.
              if (m.text().includes('404') && m.text().includes('Failed to load resource')) return;
              errors.push(m.text());
            });
            await boot(page, { locale, theme, width: vp.width, height: vp.height });
            await unstick(page);
            await page.waitForTimeout(400);
            await page.screenshot({ path: path.join(SHOT_DIR, `full-${tag}.png`), fullPage: true });
            if (errors.length > 0) throw new Error(`console errors on ${tag}: ${errors.slice(0, 3).join(' | ')}`);
          });
        }
      }
    }
  }
});
