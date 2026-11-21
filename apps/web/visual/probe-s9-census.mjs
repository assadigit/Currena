/**
 * Probe: the GUX-S9 canonical-rendering census — the final session's
 * indicator-inventory + duplicate-audit re-run (master plan Session 9
 * tasks 3/5: "Re-run the indicator inventory and duplicate audit" +
 * "each unique indicator appears in the intended location(s) only").
 *
 * Dev helper (not part of the suite): node visual/probe-s9-census.mjs
 * Run from apps/web with the fixture server free (it spawns its own on
 * 4050). One deterministic pass over the fixture-built /gold page (en,
 * light, 1440 — the census is a DOM-structure question, not a theme one),
 * walking the page first so the near-viewport lazy boundaries mount.
 *
 * What it censuses (the S1 04-duplicate-matrix's own method — every row
 * backed by live-DOM attribute evidence, never by name similarity):
 *   A. the voter seats: every [data-seat] id, grouped by its lane
 *      section (#lane-<lane>) — 37 expected, the five lanes;
 *   B. the context cards: every [data-context-card] id — the 11 context
 *      readings + the COT pair (their context-home), gold-usd ABSENT
 *      (F-06: the hero is the one price presentation);
 *   C. the positions bars: every [data-gold-position-card] id;
 *   D. the instrument census: the ONE BalanceScale assembly (the hero's
 *      CompositionStack) + every LaneBar surface + where they render
 *      (the one-renderer rule);
 *   E. the duplicate-audit families: the CFTC pair, real-yield-10y and
 *      gold-usd's full presentation lists (attribute evidence);
 *   F. the narrative family lines + the on-ramp closes (DUP-5's current
 *      state: link-or-LaneBar, never a parallel overview);
 *   G. the R10 anchor contract: every nav chip's target exists.
 *
 * Output: a structured JSON census on stdout.
 */

/* global console, setTimeout */
import { chromium } from '@playwright/test';

const { spawn } = await import('node:child_process');

const server = spawn('node', ['fixture-server.mjs'], {
  cwd: new URL('.', import.meta.url).pathname,
  stdio: 'pipe',
});
await new Promise((r) => setTimeout(r, 400));

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
await page.goto('http://localhost:4050/gold');
await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
await page.waitForSelector('[data-gold-signals]', { timeout: 20_000 });
await page.waitForTimeout(600);

// Walk the page: the tail + the explorer boundaries must mount.
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(500);

const census = await page.evaluate(() => {
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  /* A. the voter seats, grouped by lane section. */
  const lanes = {};
  for (const section of qsa('section[id^="lane-"]')) {
    const lane = section.id.replace('lane-', '');
    lanes[lane] = qsa(`#${section.id} [data-seat]`).map((s) => s.getAttribute('data-seat'));
  }
  const seats = qsa('[data-seat]').map((s) => s.getAttribute('data-seat'));
  const seatDuplicates = seats.filter((id, i) => seats.indexOf(id) !== i);

  /* B. the context cards. */
  const contextCards = qsa('[data-context-card]').map((c) => c.getAttribute('data-context-card'));
  const goldUsdContextCard = qsa('[data-context-card="gold-usd"]').length;

  /* C. the positions bars. */
  const positionCards = qsa('[data-gold-position-card]').map((c) =>
    c.getAttribute('data-gold-position-card'),
  );

  /* D. the instrument census. */
  const balanceAssemblies = qsa('[data-balance-assembly]').length; // the ONE instrument's pans
  const balanceScaleRoots = qsa('[data-balance-scale]').length;
  const lanebars = qsa('[data-lanebar]').map((b) => ({
    lane: b.getAttribute('data-lanebar'),
    where: b.closest('[data-composition-stack]')
      ? 'composition-stack'
      : b.closest('[data-gold-seats]')
        ? 'five-force-overview'
        : b.closest('[data-gold-onramp]')
          ? 'onramp'
          : b.closest('[data-gold-time-machine]')
            ? 'time-machine'
            : b.closest('[data-gold-episodes]')
                ? 'episodes'
                : 'other',
  }));
  const lanebarHomes = {};
  for (const bar of lanebars) {
    lanebarHomes[bar.where] = (lanebarHomes[bar.where] ?? 0) + 1;
  }

  /* E. the duplicate-audit families — full presentation lists. The
   * yield-decomposition legs ride the ENGINE's own leg ids
   * ('real-10y' — not the voter id 'real-yield-10y'); the family map
   * below joins them so the audit reads one row per input. */
  const yieldLegs = qsa('[data-yield-leg]').map((l) => l.getAttribute('data-yield-leg'));
  const surfacesOf = (id) => {
    const hits = [];
    for (const el of qsa(
      '[data-seat], [data-context-card], [data-gold-position-card], [data-yield-leg], [data-brief-reason], [data-episode-path]',
    )) {
      const attr =
        el.getAttribute('data-seat') ??
        el.getAttribute('data-context-card') ??
        el.getAttribute('data-gold-position-card') ??
        el.getAttribute('data-yield-leg') ??
        el.getAttribute('data-brief-reason') ??
        el.getAttribute('data-episode-path');
      if (attr === id) {
        hits.push(
          el.closest('[data-gold-seats]')
            ? 'seat'
            : el.closest('[data-gold-context]')
              ? 'context-card'
              : el.closest('[data-gold-positions]')
                ? 'positions-bar'
                : el.closest('[data-yield-decomposition]')
                  ? 'yield-decomposition'
                  : el.closest('[data-briefing-card]')
                    ? 'briefing-reason'
                    : el.closest('[data-corr-chart]')
                      ? 'correlation-axis'
                      : 'other',
        );
      }
    }
    return hits;
  };

  /* F. the narrative + the on-ramp (DUP-5's current state). */
  const narrativeFamilies = qsa('[data-narrative-family]').length;
  const onrampCloses = qsa('[data-gold-onramp] [data-lanebar]').length;
  const narrativeLanebars = qsa('[data-narrative-family] [data-lanebar]').length;

  /* G. the R10 anchor contract: every nav chip target exists. */
  const navTargets = qsa('[data-nav-chip]').map((chip) => chip.getAttribute('data-nav-chip'));
  const navResolved = navTargets.filter((id) => document.getElementById(id) !== null);

  return {
    seats: { total: seats.length, lanes, seatDuplicates, byLaneCounts: Object.fromEntries(Object.entries(lanes).map(([k, v]) => [k, v.length])) },
    contextCards: { total: contextCards.length, ids: contextCards, goldUsdContextCard },
    positionCards: { total: positionCards.length, ids: positionCards },
    instruments: { balanceAssemblies, balanceScaleRoots, lanebarHomes },
    duplicateFamilies: {
      'cftc-gold-positioning': surfacesOf('cftc-gold-positioning'),
      'cftc-gold-gross-long': surfacesOf('cftc-gold-gross-long'),
      'real-yield-10y': {
        seat: surfacesOf('real-yield-10y'),
        yieldDecompositionLeg: yieldLegs.filter((l) => l === 'real-10y'),
        correlationYieldAxis: qsa('[data-corr-chart]').length > 0 ? 'fetches /api/insights/real-yield-10y/history (the fetch audit)' : null,
      },
      'gold-usd': {
        surfaces: [
          qsa('[data-gold-hero]').length ? 'hero' : null,
          document.querySelector('[data-gold-signals]') ? 'signals-chip+footing' : null,
          qsa('[data-narrative-family]').length ? 'narrative-price-fact' : null,
        ].filter(Boolean),
        contextCards: goldUsdContextCard,
      },
    },
    dup5: { narrativeFamilies, onrampCloses, narrativeLanebars },
    nav: { chips: navTargets.length, resolved: navResolved.length },
  };
});

await browser.close();
server.kill();

console.log(JSON.stringify(census, null, 2));
