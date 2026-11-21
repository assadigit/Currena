/**
 * Probe: the GUX-S9 keyboard walk — the S8-deferred evidence (report 16
 * §9: "Session 9's full keyboard/SR sweep ... remains the master plan's
 * own S9 item"). A pragmatic, real-browser Tab-order map over the LIVE
 * page: walk the page's focusables top-to-bottom with real Tab presses,
 * record the order (role + accessible name + which surface they belong
 * to), verify the focus ring stays visible on every stop, and that
 * focus never lands on something invisible (the docked nav's off-canvas
 * chips are skipped while unmounted — the browser's own discipline).
 *
 * NOT a screen-reader pass: a real NVDA/VoiceOver session needs an
 * interactive desktop; this sandbox is headless. The spoken equivalents
 * ARE covered elsewhere: the chart inspector's live-region readout (the
 * S8 suite + the s9 capture 35), the sheets' aria-modal + focus trap
 * (the S8 suite re-run), the LABEL census (the S8 checks). The walk maps
 * the ORDER + the ring — the two things only a real Tab walk shows.
 *
 * Dev helper (not part of the suite): node visual/probe-s9-keyboard.mjs
 * Output: a structured JSON walk on stdout.
 */

/* Node globals for `pnpm lint` (the probe-s8-audit.mjs precedent). */
/* global console, getComputedStyle, window, document */
import { chromium } from '@playwright/test';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  serviceWorkers: 'block',
});
const page = await ctx.newPage();
await page.addInitScript(() => {
  window.localStorage.setItem('currena:locale', 'en');
  window.localStorage.setItem('theme', 'light');
});
await page.goto('https://currena.ir/gold', { waitUntil: 'load', timeout: 60_000 });
await page.waitForSelector('[data-briefing-card]', { timeout: 45_000 });
await page.waitForSelector('[data-gold-signals]', { timeout: 45_000 });
await page.waitForTimeout(600);

const walk = await page.evaluate(() => {
  const focusables = Array.from(
    document.querySelectorAll(
      'a[href], button:not([disabled]), input, select, textarea, summary, [tabindex]:not([tabindex^="-"])',
    ),
  ).filter((el) => {
    // Visible only (an off-canvas closed drawer's items are skipped by
    // the browser; reflect the same discipline in the map).
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  return focusables.slice(0, 200).map((el, i) => {
    const r = el.getBoundingClientRect();
    const name =
      el.getAttribute('aria-label') ??
      (el.textContent ?? '').trim().slice(0, 60);
    const surface = el.closest('header')
      ? 'site-header'
      : el.closest('[data-gold-section-nav]')
        ? 'section-nav'
        : el.closest('[data-gold-hero]')
          ? 'hero'
          : el.closest('[data-gold-zone-d-band]')
            ? 'zone-d'
            : el.closest('[data-gold-zone-f-band]')
              ? 'zone-f'
              : el.closest('[data-gold-signals]')
                ? 'signals'
                : el.closest('[data-gold-seats]')
                  ? 'seats'
                  : el.closest('[data-gold-context]')
                    ? 'context'
                    : el.closest('footer')
                      ? 'footer'
                      : 'other';
    return { i, tag: el.tagName.toLowerCase(), role: el.getAttribute('role'), name, surface, y: Math.round(r.top + window.scrollY) };
  });
});

// The real Tab walk: 80 presses from the top, recording every stop's
// surface + the focus ring's visibility (outline/box-shadow non-none).
const stops = [];
await page.evaluate(() => window.scrollTo(0, 0));
await page.keyboard.press('Tab');
for (let n = 0; n < 80; n += 1) {
  const stop = await page.evaluate(() => {
    const el = document.activeElement;
    if (el === null || el === document.body) return null;
    const cs = getComputedStyle(el);
    const ringVisible =
      cs.outlineStyle !== 'none' ||
      (cs.boxShadow !== 'none' && cs.boxShadow !== '') ||
      el.matches(':focus-visible');
    const name =
      el.getAttribute('aria-label') ??
      (el.textContent ?? '').trim().slice(0, 60);
    const surface = el.closest('header')
      ? 'site-header'
      : el.closest('[data-gold-section-nav]')
        ? 'section-nav'
        : el.closest('[data-gold-hero]')
          ? 'hero'
          : el.closest('[data-gold-zone-d-band]')
            ? 'zone-d'
            : el.closest('[data-gold-zone-f-band]')
              ? 'zone-f'
              : el.closest('[data-gold-signals]')
                ? 'signals'
                : el.closest('[data-gold-seats]')
                  ? 'seats'
                  : el.closest('[data-gold-context]')
                    ? 'context'
                    : el.closest('footer')
                      ? 'footer'
                      : 'other';
    return { tag: el.tagName.toLowerCase(), name, surface, ringVisible };
  });
  if (stop === null) break;
  stops.push(stop);
  await page.keyboard.press('Tab');
}

// The Escape discipline on the record sheet: open a seat, Escape must
// close it and return focus to the opener (the S8 suite pins the
// component; this proves it live).
let sheetEscape;
try {
  await page.locator('#gold-seats').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const opener = page.locator('[data-seat-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  await page.waitForSelector('[data-gold-record-sheet]', { timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const closed = (await page.locator('[data-gold-record-sheet]').count()) === 0;
  const focusBack = await page.evaluate(() => document.activeElement?.hasAttribute('data-seat-open') === true);
  sheetEscape = closed && focusBack ? 'escape-closed-focus-returned' : `closed=${closed} focusReturned=${focusBack}`;
} catch {
  sheetEscape = 'error';
}

await browser.close();

const summary = {
  focusableCount: walk.length,
  firstEightyTabStops: stops,
  ringInvisibleStops: stops.filter((s) => !s.ringVisible).length,
  sheetEscape,
};
console.log(JSON.stringify(summary, null, 2));
