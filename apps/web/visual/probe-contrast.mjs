/* One-off verification probe for the U-03 baseline: which key text pairs sit
 * below 4.5:1 in the LIGHT theme? (Dev helper — mirrors u-tests keyPairs.) */
/* global console, setTimeout, URL, window, document, getComputedStyle, HTMLElement */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const server = spawn('node', ['fixture-server.mjs'], {
  cwd: new URL('.', import.meta.url).pathname,
  stdio: 'pipe',
});
await new Promise((r) => setTimeout(r, 400));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 900 } });
await page.addInitScript(() => {
  window.localStorage.setItem('theme', 'light');
});
await page.goto('http://localhost:4050/#/insights');
await page.waitForSelector('article[data-status]', { timeout: 15000 });

const failing = await page.evaluate(() => {
  const parse = (css) => {
    const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
    if (!m) return null;
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
  };
  const WHITE = { r: 255, g: 255, b: 255, a: 1 };
  const blendFg = (fg, bg) => {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
      g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
      b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
      a,
    };
  };
  const effectiveBg = (el) => {
    const own = parse(getComputedStyle(el).backgroundColor);
    if (el instanceof HTMLElement && el.parentElement) {
      const parent = effectiveBg(el.parentElement);
      return own && own.a > 0 ? blendFg(own, parent) : parent;
    }
    if (own && own.a > 0) return own;
    return WHITE;
  };
  const pairs = [];
  const ratioOf = (el, label) => {
    const fg = parse(getComputedStyle(el).color);
    if (!fg) return;
    const bg = effectiveBg(el);
    const lum = (c) => {
      const lin = (v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    };
    const l1 = lum(fg);
    const l2 = lum(bg);
    const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
    pairs.push({ label, ratio: (hi + 0.05) / (lo + 0.05) });
  };
  for (const card of document.querySelectorAll('article[data-status]')) {
    for (const span of card.querySelectorAll('span.rounded-full')) {
      if (!span.querySelector('svg')) continue;
      const word = (span.textContent ?? '').trim();
      if (word) ratioOf(span, `chip "${word}" (${card.id})`);
    }
  }
  for (const h of document.querySelectorAll('h2')) ratioOf(h, `heading "${(h.textContent ?? '').trim().slice(0, 24)}"`);
  const alert = document.querySelector('article.alert-card span.font-bold');
  if (alert) ratioOf(alert, 'card title');
  const caption = document.querySelector('article[data-status] span[class*="text-secondary"]');
  if (caption) ratioOf(caption, 'card meta');
  return pairs.filter((p) => p.ratio < 4.5).map((p) => `${p.label}: ${p.ratio.toFixed(2)}:1`);
});
console.log(JSON.stringify(failing, null, 2));
await browser.close();
server.kill();
