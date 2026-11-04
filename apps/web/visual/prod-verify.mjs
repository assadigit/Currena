/**
 * prod-verify.mjs — the GB-S4 union/delivery production verification,
 * reused through GB-S5 and CONVERTED at the GB-S6 flip: the lane
 * balance is THE default for every visitor, so both matrix legs now
 * read the SAME flipped view — the "default" leg (no parameter) pins
 * the page every visitor sees, the "flag" leg proves the retired
 * ?balance=lanes parameter is INERT (byte-identical DOM). Probes the
 * Outlook strip's gold state (the lane-derived outlook beside the
 * balance), the honesty elements, and the wind scan; EN + fa,
 * 360 + 1280, fresh contexts, collecting console errors (the delivery
 * discipline's final gate). Run: node visual/prod-verify.mjs (from apps/web).
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
    if (msg.type() === 'error') errors.push(`[${flag ? 'param' : 'default'} ${locale} ${width}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`[${flag ? 'param' : 'default'} ${locale} ${width}] PAGEERROR ${err.message}`));
  await page.addInitScript((l) => window.localStorage.setItem('currena:locale', l), locale);
  // GB-S6: the parameter is INERT — both legs render the flipped view.
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
    // GB-S6 (AC-1): the panels are retired EVERYWHERE (both legs read the
    // flipped view; the parameter is inert).
    panels: document.querySelector('[data-gold-panels]') !== null,
    windPanel: document.querySelector('#insights-gold-tailwind') !== null,
    goldLabel: document.querySelector('[data-gold-label]') !== null,
    legacyChips: document.querySelectorAll('[data-balance-tile]').length,
    // GB-S5 (P3) + GB-S6: the Outlook strip's gold chip — its state +
    // sentence (the lane-derived outlook beside the balance, THE
    // derivation since the flip).
    goldOutlook: document.querySelector('[data-verdict-metal="gold"]')?.getAttribute('data-verdict-direction') ?? null,
    goldOutlookSentence:
      document.querySelector('[data-verdict-metal="gold"]')?.textContent?.replace(/[\s\n]+/g, ' ').trim().slice(0, 90) ?? null,
    // AC-8: the honesty elements visible without a tap.
    contextLine: document.querySelector('[data-balance-context-line]')?.textContent ?? null,
    measuredNote: document.querySelector('[data-balance-measured-note]')?.textContent ?? null,
    backtestLink: document.querySelector('[data-balance-measured-note] a')?.getAttribute('href') ?? null,
    // The summary prose (the collapsed-corner decision at the flip).
    headerGoldLine: document.querySelector('[data-signal-card="merged"] [data-signal-metal="gold"]')?.textContent ?? null,
    // V-6: the wind scan over the whole gold card.
    windWords: (() => {
      const card = document.querySelector('[data-signal-card="merged"]');
      const text = (card?.textContent ?? '').toLowerCase();
      return ['tailwind', 'headwind', 'wind'].filter((w) => text.includes(w));
    })(),
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
