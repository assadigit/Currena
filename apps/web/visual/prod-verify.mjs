/**
 * prod-verify.mjs — the GB-S4 union/delivery production verification
 * (reused for GB-S5: the flag view now also probes the Outlook strip's
 * gold state — the lane-derived outlook beside the redesigned balance):
 * the flag view AND the default view, EN + fa, 360 + 1280, fresh
 * contexts, collecting console errors (the delivery discipline's
 * final gate). Run: node visual/prod-verify.mjs (from apps/web).
 *
 * The page.evaluate callbacks run IN THE BROWSER — window/document are
 * Playwright-injected page globals, declared for the Node linter here.
 */
/* global window, document, console */
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
    // GB-S5 (P3): the Outlook strip's gold chip — its state + sentence
    // (the lane-derived outlook beside the balance; the default view's
    // gold chip keeps the legacy derivation).
    goldOutlook: document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction') ?? null,
    goldOutlookSentence:
      document.querySelector('[data-verdict-metal="gold"]')?.textContent?.replace(/[\s\n]+/g, ' ').trim().slice(0, 90) ?? null,
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
