/**
 * prod-verify.mjs — the GB-S4 union/delivery production verification:
 * the flag view AND the default view, EN + fa, 360 + 1280, fresh
 * contexts, collecting console errors (the delivery discipline's
 * final gate). Run: node scripts/prod-verify.mjs (from repo root).
 */
import { chromium } from '@playwright/test';

const BASE = 'https://currena.ir';
const results = [];
const errors = [];

async function pass(browser, { flag, locale, width }) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 360 ? 800 : 1000 } });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`[${flag ? 'flag' : 'default'} ${locale} ${width}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[${flag ? 'flag' : 'default'} ${locale} ${width}] PAGEERROR ${err.message}`));
  await page.addInitScript((l) => window.localStorage.setItem('currena:locale', l), locale);
  await page.goto(flag ? `${BASE}/insights?balance=lanes` : `${BASE}/insights`);
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page.waitForTimeout(2500);
  const dom = await page.evaluate(() => ({
    laneVisual: document.querySelector('[data-balance-visual]') !== null,
    beam: document.querySelector('[data-balance-beam]') !== null,
    weights: document.querySelectorAll('[data-balance-weight]').length,
    rows: document.querySelectorAll('[data-balance-row]').length,
    verdict: document.querySelector('[data-balance-verdict-word]')?.textContent ?? null,
    splitBadge: document.querySelector('[data-balance-split-badge]')?.textContent ?? null,
    panels: document.querySelector('[data-gold-panels]') !== null,
    windPanel: document.querySelector('#insights-gold-tailwind') !== null,
    legacyChips: document.querySelectorAll('[data-balance-tile]').length,
    overflow: document.documentElement.scrollWidth - window.innerWidth,
    dir: document.documentElement.dir,
  }));
  results.push({ flag, locale, width, ...dom });
  await ctx.close();
}

const browser = await chromium.launch();
for (const locale of ['en', 'fa']) {
  for (const width of [1280, 360]) {
    await pass(browser, { flag: true, locale, width });
    await pass(browser, { flag: false, locale, width });
  }
}
await browser.close();
console.log(JSON.stringify(results, null, 1));
console.log('CONSOLE ERRORS:', errors.length, JSON.stringify(errors.slice(0, 8)));
