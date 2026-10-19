/* One-off verification probe for the U-02 baseline: which non-menu element
 * pushes document.scrollWidth to 370 at a 360px viewport? (Dev helper.) */
/* global console, setTimeout, URL, window, document */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

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
await page.waitForTimeout(400);

const found = await page.evaluate(() => {
  const iw = window.innerWidth;
  const out = [];
  for (const el of document.querySelectorAll('body *')) {
    // skip the off-canvas side menu (transform-hidden; never affects scrollWidth)
    if (el.closest('nav.side-menu')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > iw + 1) {
      out.push(
        `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} class="${(el.className + '').slice(0, 70)}" right=${Math.round(r.right)} text="${(el.textContent || '').trim().slice(0, 60)}"`,
      );
    }
  }
  return { iw, scrollWidth: document.documentElement.scrollWidth, out: out.slice(0, 12) };
});
console.log(JSON.stringify(found, null, 2));
await browser.close();
server.kill();
