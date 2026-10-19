/**
 * Probe: which elements overflow the 360px viewport on the fixture page?
 *
 * Dev helper (not part of the suite):  node visual/probe-overflow.mjs
 * Run from apps/web with the fixture server free (it spawns its own on 4050).
 *
 * The visual/ directory has no eslint languageOptions block (the repo's flat
 * config maps node globals per-path) — declare the globals this script uses
 * inline so `pnpm lint` stays clean without touching the shared config.
 */
/* global console, setTimeout, URL, window, document */
import { chromium } from '@playwright/test';

const { spawn } = await import('node:child_process');
const server = spawn('node', ['fixture-server.mjs'], {
  cwd: new URL('.', import.meta.url).pathname,
  stdio: 'pipe',
});
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
await page.goto('http://localhost:4050/#/insights');
await page.waitForSelector('article[data-status]', { timeout: 15000 });
await page.waitForSelector('[id^="insights-market-tile-"]', { timeout: 15000 });
await page.waitForTimeout(500);

const offenders = await page.evaluate(() => {
  const iw = window.innerWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > iw + 1 || r.left < -1) {
      out.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} class="${(el.className + '').slice(0, 90)}" left=${Math.round(r.left)} right=${Math.round(r.right)} text="${(el.textContent || '').trim().slice(0, 40)}"`,
      );
    }
  }
  return { iw, scrollWidth: document.documentElement.scrollWidth, out: out.slice(0, 25) };
});
console.log(JSON.stringify(offenders, null, 2));
await browser.close();
server.kill();
