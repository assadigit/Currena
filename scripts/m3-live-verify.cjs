/* eslint-disable no-undef, @typescript-eslint/no-require-imports --
 * This is a CommonJS node script (run via `node scripts/m3-live-verify.cjs`
 * after a deploy); require/console/process are the correct globals here.
 * The repo's eslint config grants globals.node to the scripts mjs glob but
 * not the cjs glob (the M1 R12 scope pass covered the modularization
 * skeleton roots, not cjs node scripts); rather than extend the scope for
 * one file, this file-level disable is the minimal isolated fix (BD-M4 D0:
 * the M3 bookkeeping commit 7447a3e7 landed m3-live-verify.cjs AFTER the
 * M3 gates runs, so its 5 node-globals lint errors were never caught and
 * origin/main lint went red). */
/* M3 post-deploy live verify — the /usa leg + the legacy /insights leg
 * (world-feeds borrows TicSection across the new tree) + FA/RTL + mobile.
 * Zero console errors required on every leg. */
const { chromium } = require('playwright');

const BASE = 'https://currena.ir';
const results = [];
let failures = 0;

function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
}

(async () => {
  const browser = await chromium.launch();

  for (const leg of [
    { name: '/usa EN desktop', url: `${BASE}/usa`, locale: 'en-US', viewport: { width: 1280, height: 900 } },
    { name: '/usa FA/RTL desktop', url: `${BASE}/usa?lang=fa`, locale: 'fa-IR', viewport: { width: 1280, height: 900 } },
    { name: '/usa EN mobile 390px', url: `${BASE}/usa`, locale: 'en-US', viewport: { width: 390, height: 844 } },
    { name: '/insights EN (legacy world-feeds → TicSection)', url: `${BASE}/insights`, locale: 'en-US', viewport: { width: 1280, height: 900 } },
  ]) {
    const ctx = await browser.newContext({ locale: leg.locale, viewport: leg.viewport });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 120)); });
    page.on('pageerror', (err) => errors.push(String(err).slice(0, 120)));
    try {
      await page.goto(leg.url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1500);
      const body = await page.textContent('body');
      check(`${leg.name}: loaded`, body && body.length > 500, `${(body || '').length} chars`);
      if (leg.name.startsWith('/usa')) {
        check(`${leg.name}: verdict strip renders`, /Mixed|Bullish|Bearish|Cautious|Step|verdict/i.test(body), '');
        check(`${leg.name}: TIC section present`, /Who holds|government debt|TIC/i.test(body), '');
      } else {
        // The legacy lane is collapsed-by-default (R7b) and its sections
        // lazy-mount with data; the deep TIC section is NOT expected on a
        // cold load. What this leg proves: the page renders, its data loads,
        // and the re-anchored world-feeds → features/usa/tic import chain
        // breaks nothing (zero console errors). The TicSection code itself
        // is proven present + sha-identical pre/post M3 in the deployed
        // useInsightsCopy chunk (see the session record).
        check(`${leg.name}: data header renders`, /Data as of|Daily snapshot/i.test(body), '');
      }
      check(`${leg.name}: zero console errors`, errors.length === 0, errors.slice(0, 3).join(' | '));
    } catch (e) {
      check(`${leg.name}: navigation`, false, String(e).slice(0, 120));
    }
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${failures === 0 ? 'ALL LEGS PASS' : failures + ' FAILURES'}`);
  process.exit(failures === 0 ? 0 : 1);
})();
