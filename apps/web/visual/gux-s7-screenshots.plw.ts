/**
 * gux-s7-screenshots.plw.ts — the S7 screenshot set (GUX-S7 M6): the
 * session's surfaces over the visual harness's fixture server (never a
 * live site) — the five-state briefing word (Q1-B) + the bridge's
 * regional chrome + the on-ramp's LaneBar closes + the time machine's
 * lane grammar + the expectations' probability bars. en/fa × the
 * light-desktop + dark-mobile pairs (the S5/S6 pairing discipline),
 * with a /global tile capture for the five-state fold's second surface.
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
  's7',
);

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

async function boot(page, opts: { locale: 'en' | 'fa'; theme: 'light' | 'dark'; width: number; height: number; path?: string }): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      window.localStorage.setItem('currena:theme', theme);
    },
    [opts.locale, opts.theme],
  );
  await page.goto(opts.path === '/global' ? '/' : '/gold');
  await page.waitForSelector(opts.path === '/global' ? '[data-global-board]' : '[data-briefing-card]', { timeout: 20_000 });
}

const PAIRS = [
  { name: 'desktop', width: 1440, height: 1000, theme: 'light' as const },
  { name: 'mobile', width: 390, height: 844, theme: 'dark' as const },
];

test.describe('the S7 gold page (the answered Q1 + the S4 patterns)', () => {
  for (const vp of PAIRS) {
    for (const locale of ['en', 'fa'] as const) {
      const tag = `${vp.name}-${locale}-${vp.theme}`;

      test(`briefing five-state word — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.waitForSelector('[data-briefing-five-state]', { timeout: 20_000 });
        await page.screenshot({ path: path.join(SHOT_DIR, `briefing-${tag}.png`) });
      });

      test(`bridge regional chrome — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.locator('#gold-zone-f').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-bridge-region-chip]', { timeout: 20_000 });
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(SHOT_DIR, `bridge-${tag}.png`) });
      });

      test(`on-ramp LaneBar closes — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.locator('[data-gold-onramp]').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-gold-onramp] button', { timeout: 20_000 });
        await page.locator('[data-gold-onramp] button').first().click();
        await page.waitForSelector('[data-onramp-driver="1"] [data-lanebar]', { timeout: 20_000 });
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(SHOT_DIR, `onramp-${tag}.png`) });
      });

      test(`time machine lanes — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.locator('[data-gold-time-machine]').scrollIntoViewIfNeeded();
        await page.locator('[data-gold-time-machine] button').first().click();
        await page.waitForSelector('[data-tm-body]', { timeout: 20_000 });
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(SHOT_DIR, `timemachine-${tag}.png`) });
      });

      test(`expectations probability rows — ${tag}`, async ({ page }) => {
        await boot(page, { locale, theme: vp.theme, width: vp.width, height: vp.height });
        await page.locator('[data-gold-expectations]').scrollIntoViewIfNeeded();
        await page.waitForSelector('[data-gold-expectations] button', { timeout: 20_000 });
        await page.locator('[data-gold-expectations] button').first().click();
        // The bars render inside the expanded detail (the venue fixture
        // answers on the fixture server).
        await page.waitForSelector('[data-expect-prob-row]', { timeout: 20_000 }).catch(() => undefined);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(SHOT_DIR, `expectations-${tag}.png`) });
      });
    }
  }

  // The five-state fold's second surface: the /global Gold Balance tile.
  for (const locale of ['en', 'fa'] as const) {
    test(`global tile five-state — desktop-${locale}-light`, async ({ page }) => {
      await boot(page, { locale, theme: 'light', width: 1440, height: 1000, path: '/global' });
      await page.waitForSelector('[data-tile="gold-balance"]', { timeout: 20_000 });
      await page.screenshot({ path: path.join(SHOT_DIR, `global-tile-desktop-${locale}-light.png`) });
    });
  }
});
