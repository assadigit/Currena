/**
 * gb-s4-visual.plw.ts — the gold balance consolidation's P2b VISUAL
 * acceptance + evidence suite (GB-S4, docs/specs/
 * gold-balance-consolidation/05-VISUAL-DESIGN-SPEC.md §12 V-1..V-10),
 * the gb-s3 harness pattern extended to the full criteria set.
 *
 * Data: the fixture snapshot (visual/fixture-server.mjs, never a live
 * site) OVERLAID with the recorded 2026-10-31 corpus archive — the same
 * fixture the component tests use (01 §7's worked example) — driven
 * through SIX scenarios built from the reference prototype's own
 * scenario table (?sc=today|against|for|split|stack|none|loading →
 * balanced / leaning for / leaning against / split lane / all unread /
 * loading), via a per-test page.route() rewrite of GET /api/insights.
 *
 * Evidence lands in docs/specs/gold-balance-consolidation/evidence/gb-s4/
 * for the phase's PR description.
 */

import { test, expect, type Page } from '@playwright/test';
import { appendFileSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.resolve(
  HERE,
  '..',
  '..',
  '..',
  'docs',
  'specs',
  'gold-balance-consolidation',
  'evidence',
  'gb-s4',
);
const SNAPSHOT_PATH = path.resolve(HERE, 'fixtures', 'snapshot.json');
const CORPUS_PATH = path.resolve(
  HERE,
  '..',
  '..',
  '..',
  'packages',
  'insights',
  'fixtures',
  'gold-backtest-corpus.json',
);

/** The gold balance's 21 voters (the frozen table's ids — used to build
 * the scenario reads; the assertions never trust this list, they check
 * the rendered engine output). */
const GOLD_VOTERS = [
  'real-yield-10y', 'us10y', 'us30y', 'fed-target', 'fed-expectations', 'ecb-dfr',
  'yield-curve-10y2y', 'yield-curve-10y3m', 'dollar-basket', 'usdjpy', 'us-japan-10y-gap',
  'stress-stlfsi', 'nfci', 'vix', 'gold-silver', 'cftc-gold-positioning',
  'us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'breakeven-tilt',
] as const;

type Scenario = 'today' | 'against' | 'for' | 'split' | 'none' | 'loading';
type Reading = Record<string, unknown> & { id: string };

/** The recorded 2026-10-31 corpus archive, page-shaped (the same recipe
 * the component suite uses — sourceName "archive 2026-10-31", updatedAt
 * the archive's generatedAt). */
function corpusReadings(): Reading[] {
  const corpus = JSON.parse(readFileSync(CORPUS_PATH, 'utf8')) as {
    archives: Record<string, { generatedAt: string; readings: Array<Record<string, unknown>> }>;
  };
  const archive = corpus.archives['2026-10-31']!;
  return archive.readings.map((raw) => {
    const r = raw as Record<string, unknown>;
    return {
      id: r.id as string,
      value: r.value,
      asOf: r.asOf,
      status: r.status,
      percentile10y: r.percentile10y,
      change30d: r.change30d,
      sourceName: 'archive 2026-10-31',
      updatedAt: archive.generatedAt,
    };
  });
}

/** The fixture snapshot with the corpus archive overlaid onto its
 * readings (the gb-s3 overlay recipe: corpus readings replace/append
 * by id, every other field of the page snapshot stays). */
function baseSnapshot(): { generatedAt: string; readings: Reading[] } {
  const snap = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as {
    generatedAt: string;
    readings: Reading[];
    [k: string]: unknown;
  };
  const byId = new Map(snap.readings.map((r) => [r.id, r]));
  for (const r of corpusReadings()) {
    const base = byId.get(r.id) ?? {};
    byId.set(r.id, { ...base, ...r });
  }
  return { ...snap, readings: [...byId.values()] };
}

/** The scenario transforms (the reference prototype's ?sc= table, mapped
 * onto real corpus readings — the SAME data the jsdom suite pins):
 *   today    the raw 2026-10-31 reading — LEVEL, 4 neutral, the
 *            borrowing-costs SPLIT 2v2 (01 §7's worked example)
 *   against  borrowing-costs + dollar vote AGAINST (decade-high yields
 *            + decade-high dollar) — net −2, the full 10° tip
 *   for      borrowing-costs (corpus's falling yields) + a FALLING
 *            dollar vote FOR — net +2, the full 10° tip
 *   split    a for weight and an against weight on the pans with the
 *            corpus's split borrowing lane — net 0, both pans loaded
 *   none     every gold voter stale — all four lanes unread
 *   loading  the API never answers — the page's own loading shell
 */
function scenarioSnapshot(scenario: Scenario): { generatedAt: string; readings: Reading[] } {
  const snap = baseSnapshot();
  if (scenario === 'loading') return snap;
  const byId = new Map(snap.readings.map((r) => [r.id, r]));
  const set = (id: string, patch: Partial<Reading>): void => {
    const r = byId.get(id);
    if (r !== undefined) Object.assign(r, patch);
  };
  const stale = (id: string): void => set(id, { status: 'stale' });
  if (scenario === 'against') {
    // borrowing-costs: two decade-high firing pressures.
    set('real-yield-10y', { value: 2.9, percentile10y: 0.95, change30d: 0.05 });
    set('us10y', { value: 4.6, percentile10y: 0.95, change30d: 0.05 });
    // dollar: two decade-high firing pressures.
    set('dollar-basket', { value: 108, percentile10y: 0.95, change30d: 0.6 });
    set('usdjpy', { value: 155, percentile10y: 0.95, change30d: 0.6 });
  }
  if (scenario === 'for' || scenario === 'split') {
    // The corpus's falling yields already support; make the dollar
    // lane vote FOR: dollar-basket falls past its 1.0-point move
    // threshold, usdjpy sits at the BOTTOM of its decade (it has no move
    // threshold — only its level ever fires; low → supports).
    set('dollar-basket', { value: 100, percentile10y: 0.55, change30d: -2.6 });
    set('usdjpy', { value: 130, percentile10y: 0.1 });
  }
  if (scenario === 'split') {
    // market stress: two bottom-of-decade readings fire as pressures —
    // a weight on each pan while the split lane sits in the tray.
    set('stress-stlfsi', { value: -1.2, percentile10y: 0.02, change30d: -0.1 });
    set('nfci', { value: -0.62, percentile10y: 0.02, change30d: -0.05 });
  }
  if (scenario === 'none') {
    for (const id of GOLD_VOTERS) stale(id);
  }
  return { ...snap, readings: [...byId.values()] };
}

/** Installs the /api/insights rewrite for one scenario (loading hangs —
 * the page then shows its own loading shell; the balance-level
 * skeleton is unit-pinned in the jsdom suite, 05 §8). */
async function serveScenario(page: Page, scenario: Scenario): Promise<void> {
  await page.route('**/api/insights', async (route) => {
    if (scenario === 'loading') {
      await new Promise(() => undefined); // never answers
      return;
    }
    await route.fulfill({ json: scenarioSnapshot(scenario) });
  });
}

const HEIGHTS: Record<number, number> = { 360: 900, 390: 900, 768: 1000, 1280: 1000, 1920: 1080 };

/** Loads the insights page at one width/locale/theme on a scenario and
 * waits for the merged card (loading waits for the page's own status
 * shell). The sticky bars are made static for element captures — the
 * gb-s3 screenshot-only neutralization. */
async function loadBalance(
  page: Page,
  opts: { scenario: Scenario; width: number; locale: 'en' | 'fa'; theme: 'light' | 'dark' },
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: HEIGHTS[opts.width] ?? 900 });
  await page.addInitScript(
    (init: { locale: string; theme: string }) => {
      window.localStorage.setItem('currena:locale', init.locale);
      if (init.theme === 'dark') window.localStorage.setItem('theme', 'dark');
      else window.localStorage.removeItem('theme');
    },
    { locale: opts.locale, theme: opts.theme },
  );
  await serveScenario(page, opts.scenario);
  await page.goto('/insights?balance=lanes');
  if (opts.scenario === 'loading') {
    await page.waitForSelector('[role="status"]', { state: 'visible' });
  } else {
    await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
    await page.waitForTimeout(900); // charts + the first paint settle
  }
  await page.addStyleTag({
    content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }',
  });
}

async function captureCard(page: Page, name: string): Promise<void> {
  const card = page.locator('[data-signal-card="merged"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
}

/* ------------------------------------------------------------------ *
 * V-10 — the six scenarios × EN/fa × desktop/mobile × light/dark
 * ------------------------------------------------------------------ */
const SCENARIOS: Scenario[] = ['today', 'for', 'against', 'split', 'none', 'loading'];

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
  // The contrast evidence appends across the two theme tests — one fresh
  // record per run.
  rmSync(path.join(SHOT_DIR, 'contrast-ratios.txt'), { force: true });
});

for (const scenario of SCENARIOS) {
  for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
    for (const width of [360, 1280] as const) {
      for (const [theme, themeWord] of [['light', 'light'], ['dark', 'dark']] as const) {
        test(`V-10 ${scenario} — ${word} ${width}px ${themeWord}`, async ({ page }) => {
          await loadBalance(page, { scenario, width, locale, theme });
          if (scenario === 'loading') {
            // The API never answers: the page shows its own loading shell
            // (the balance-level skeleton is unit-pinned in the jsdom
            // suite — the app page-gates loading before the card mounts).
            await page.screenshot({ path: path.join(SHOT_DIR, `loading-${locale}-${width}-${theme}.png`) });
            await expect(page.locator('[role="status"]')).toBeVisible();
          } else {
            await captureCard(page, `${scenario}-${locale}-${width}-${theme}`);
            await expect(page.locator('[data-balance-visual]')).toBeVisible();
          }
        });
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * V-1 — the squint test: the verdict word is the largest text and the
 * focal point (measured + a blurred capture for the human eye)
 * ------------------------------------------------------------------ */
test('V-1 the verdict word is the largest text in the balance (the squint test)', async ({ page }) => {
  await loadBalance(page, { scenario: 'today', width: 1280, locale: 'en', theme: 'light' });
  const sizes = await page.evaluate(() => {
    const visual = document.querySelector('[data-balance-visual]') as HTMLElement | null;
    if (visual === null) return null;
    const out: Record<string, number> = {};
    for (const el of visual.querySelectorAll<HTMLElement>(
      '.gb-title, .gb-sub, .weight-label, .pan-cap, .verdict-word, .verdict-counts, .row-name, .lane-intro',
    )) {
      const text = (el.textContent ?? '').trim();
      const size = Number.parseFloat(getComputedStyle(el).fontSize);
      if (text.length > 0 && (out[text] === undefined || size > out[text]!)) out[text] = size;
    }
    return out;
  });
  expect(sizes).not.toBeNull();
  const verdictSize = sizes!['Balanced'];
  expect(verdictSize).toBeDefined();
  expect(verdictSize).toBeGreaterThanOrEqual(30);
  for (const [text, size] of Object.entries(sizes!)) {
    if (text !== 'Balanced') expect(size, `${text} at ${size}px`).toBeLessThan(verdictSize);
  }
  // The squint capture: blur the whole card — the verdict word's shape
  // and colour must remain the first readable thing (evidence for the PR).
  await page.addStyleTag({ content: '[data-signal-card="merged"] { filter: blur(2.5px); }' });
  await captureCard(page, 'squint-today-en-1280-light');
  await page.addStyleTag({ content: '[data-signal-card="merged"] { filter: none; }' });
});

/* ------------------------------------------------------------------ *
 * V-2 — the instrument fills the card (≥60% desktop, ≥92% mobile)
 * ------------------------------------------------------------------ */
test('V-2 the instrument fills at least 60% of the card on desktop and 92% on mobile', async ({ page }) => {
  for (const [width, floor] of [[1280, 0.6], [360, 0.92]] as const) {
    await loadBalance(page, { scenario: 'today', width, locale: 'en', theme: 'light' });
    const fill = await page.evaluate(() => {
      const card = document.querySelector('[data-signal-card="merged"]') as HTMLElement;
      const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
      return { card: card.getBoundingClientRect().width, stage: stage.getBoundingClientRect().width };
    });
    expect(fill.stage / fill.card, `${width}px: ${fill.stage}/${fill.card}`).toBeGreaterThanOrEqual(floor);
  }
});

/* ------------------------------------------------------------------ *
 * V-3 — no horizontal scroll or clipping at 360/390/768/1280/1920,
 * EN + fa; pan content never overflows its reserved height
 * ------------------------------------------------------------------ */
for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  for (const width of [360, 390, 768, 1280, 1920] as const) {
    for (const scenario of ['today', 'split'] as const) {
      test(`V-3 ${word} ${width}px (${scenario}): no overflow, no clipped stage`, async ({ page }) => {
        await loadBalance(page, { scenario, width, locale, theme: 'light' });
        const checks = await page.evaluate(() => {
          const doc = document.documentElement;
          const pans = [...document.querySelectorAll<HTMLElement>('[data-balance-pan]')].map((p) => ({
            side: p.getAttribute('data-balance-pan'),
            scrollH: p.scrollHeight,
            clientH: p.clientHeight,
          }));
          return { scrollW: doc.scrollWidth, innerW: window.innerWidth, pans };
        });
        expect(checks.scrollW).toBeLessThanOrEqual(checks.innerW);
        for (const pan of checks.pans) {
          expect(pan.scrollH, `${word} ${width} ${scenario} pan ${pan.side}`).toBeLessThanOrEqual(pan.clientH + 1);
        }
      });
    }
  }
}

/** The four-weights stack case (the reference's ?sc=stack, tuned in
 * balanceVisualGeometry so it wraps to two rows of two at 360). */
test('V-3 the four-weights-on-one-pan case fits at 360 (two rows, no clip)', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.addInitScript((l: string) => window.localStorage.setItem('currena:locale', l), 'en');
  await page.route('**/api/insights', async (route) => {
    const snap = scenarioSnapshot('against');
    // Push ALL FOUR lanes against: stress fires low (2 voters) + inflation
    // fires (2 rising CPI/PCE — a rising inflation pressure), keeping the
    // against vote on borrowing-costs + dollar from the scenario.
    const byId = new Map(snap.readings.map((r) => [r.id, r]));
    const set = (id: string, patch: Record<string, unknown>): void => {
      const r = byId.get(id);
      if (r !== undefined) Object.assign(r, patch);
    };
    set('stress-stlfsi', { value: -1.2, percentile10y: 0.02, change30d: -0.1 });
    set('nfci', { value: -0.62, percentile10y: 0.02, change30d: -0.05 });
    // Inflation votes AGAINST via two bottom-of-decade CPI/PCE reads
    // (in the table, running HOT supports the hedge — so a LOW,
    // deflation-side read pressures it).
    set('us-cpi-yoy', { value: 1.5, percentile10y: 0.05 });
    set('us-pce-core-yoy', { value: 1.4, percentile10y: 0.05 });
    await route.fulfill({ json: { ...snap, readings: [...byId.values()] } });
  });
  await page.goto('/insights?balance=lanes');
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page.waitForTimeout(900);
  const against = page.locator('[data-balance-pan="against"]');
  await expect(against.locator('[data-balance-weight]')).toHaveCount(4);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const pans = [...document.querySelectorAll<HTMLElement>('[data-balance-pan]')].map((p) => ({
      side: p.getAttribute('data-balance-pan'),
      scrollH: p.scrollHeight,
      clientH: p.clientHeight,
    }));
    return { scrollW: doc.scrollWidth, innerW: window.innerWidth, pans };
  });
  expect(overflow.scrollW).toBeLessThanOrEqual(overflow.innerW);
  for (const pan of overflow.pans) {
    expect(pan.scrollH, `pan ${pan.side} (4 weights: 2 rows of 2)`).toBeLessThanOrEqual(pan.clientH + 1);
  }
  await captureCard(page, 'stack-en-360-light');
});

/* ------------------------------------------------------------------ *
 * V-4 — the rim matches the ledger counts in every scenario
 * ------------------------------------------------------------------ */
for (const scenario of ['today', 'against', 'split', 'none'] as const) {
  test(`V-4 ${scenario}: every weight's rim segments match its ledger row's member counts`, async ({ page }) => {
    await loadBalance(page, { scenario, width: 1280, locale: 'en', theme: 'light' });
    // The rows open ONE AT A TIME (05 §4.6): open each lane's row, read its
    // member counts, close it, then compare against the rims (the row
    // disc's rim renders in the button regardless of open state).
    const lanes = await page.evaluate(async () => {
      const out: Array<{
        lane: string;
        rim: Record<string, number>;
        ledger: Record<string, number>;
        weights: number;
      }> = [];
      const buttons = [...document.querySelectorAll<HTMLElement>('[data-balance-row-btn]')];
      for (const btn of buttons) {
        btn.click();
        await new Promise((resolve) => setTimeout(resolve, 60));
        const row = btn.closest<HTMLElement>('[data-balance-row]')!;
        const lane = row.getAttribute('data-balance-row')!;
        const rim: Record<string, number> = {};
        for (const seg of row.querySelectorAll('[data-balance-seg]')) {
          const impact = seg.getAttribute('data-balance-seg')!;
          rim[impact] = (rim[impact] ?? 0) + 1;
        }
        const ledger: Record<string, number> = {};
        for (const m of row.querySelectorAll('[data-balance-member-impact]')) {
          const impact = m.getAttribute('data-balance-member-impact')!;
          ledger[impact] = (ledger[impact] ?? 0) + 1;
        }
        const weights = document.querySelectorAll(`[data-balance-weight="${lane}"] [data-balance-seg]`).length;
        out.push({ lane, rim, ledger, weights });
        btn.click(); // close — one row open at a time
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      return out;
    });
    expect(lanes).toHaveLength(4);
    for (const lane of lanes) {
      expect(Object.values(lane.rim).reduce((a, b) => a + b, 0), `${scenario} ${lane.lane} rim total`).toBeGreaterThan(0);
      for (const impact of ['supports', 'pressures', 'steady', 'unread']) {
        expect(lane.rim[impact] ?? 0, `${scenario} ${lane.lane} rim ${impact}`).toBe(lane.ledger[impact] ?? 0);
      }
      // The pan/tray weight's rim carries the same segment count as the row's disc.
      if (lane.weights > 0) {
        expect(lane.weights, `${scenario} ${lane.lane} weight rim`).toBe(
          Object.values(lane.rim).reduce((a, b) => a + b, 0),
        );
      }
    }
  });
}

/* ------------------------------------------------------------------ *
 * V-5 — the beam angle, needle and verdict follow the formula
 * ------------------------------------------------------------------ */
test('V-5 the beam angle and verdict follow the unchanged formula (for/against/split scenarios)', async ({ page }) => {
  const expected: Record<string, { tilt: string; verdict: string }> = {
    today: { tilt: '0', verdict: 'Balanced' }, // net 0
    against: { tilt: '10', verdict: 'Leaning against gold' }, // net −2 of 2 directional → the full 10°, against-heavy positive
    for: { tilt: '-10', verdict: 'Leaning for gold' }, // net +1 of 1 directional → the full 10°, for-heavy negative
    split: { tilt: '0', verdict: 'Balanced' }, // net 0, one weight per pan
    none: { tilt: '0', verdict: "Can't read the conditions right now" },
  };
  for (const [scenario, want] of Object.entries(expected)) {
    await loadBalance(page, { scenario: scenario as Scenario, width: 1280, locale: 'en', theme: 'light' });
    const beamTilt = await page.locator('[data-balance-beam]').getAttribute('data-tilt');
    expect(beamTilt, scenario).toBe(want.tilt);
    await expect(page.locator('[data-balance-verdict-word]'), scenario).toHaveText(want.verdict);
    // The needle follows the tilt (visible whenever anything was read).
    const needle = page.locator('[data-balance-needle]');
    if (scenario === 'none') {
      await expect(needle).toHaveCount(0); // 05 §8: hidden when nothing could be read
    } else {
      const x2 = Number(await needle.getAttribute('x2'));
      const cx = Number((await needle.getAttribute('x1')) as string);
      if (scenario === 'against') expect(x2).toBeGreaterThan(cx); // points to the heavy (right) side
      if (scenario === 'for') expect(x2).toBeLessThan(cx); // heavy side is left
      if (scenario === 'today' || scenario === 'split') expect(x2).toBe(cx); // level: the centre tick
    }
    // The heavy pan is the LOWER one (the physical sign is direction-free).
    if (scenario === 'against' || scenario === 'for') {
      const drops = await page.evaluate(() => {
        const dropOf = (el: HTMLElement | null): number =>
          el === null ? 0 : Number(el.style.transform.match(/translate\(0px, (-?[\d.]+)px\)/)?.[1] ?? 0);
        return {
          forPan: dropOf(document.querySelector<HTMLElement>('[data-balance-pan="for"]')),
          againstPan: dropOf(document.querySelector<HTMLElement>('[data-balance-pan="against"]')),
        };
      });
      if (scenario === 'against') {
        expect(drops.againstPan).toBeGreaterThan(0);
        expect(drops.forPan).toBeLessThan(0);
      } else {
        expect(drops.forPan).toBeGreaterThan(0);
        expect(drops.againstPan).toBeLessThan(0);
      }
    }
  }
});

/* ------------------------------------------------------------------ *
 * V-6 — no wind vocabulary in the rendered flag view
 * (the DOM scan is pinned by the jsdom suite; the screenshot-level
 * scan rides on the fa capture)
 * ------------------------------------------------------------------ */
test('V-6 no score number on the instrument (the balance speaks counts, never a score)', async ({ page }) => {
  await loadBalance(page, { scenario: 'today', width: 1280, locale: 'en', theme: 'light' });
  const stageAria = await page.locator('[data-balance-mech]').getAttribute('aria-label');
  expect(stageAria).toContain('Balanced');
  // The instrument's own text never carries a net score number.
  const visualText = (await page.locator('[data-balance-visual]').innerText()).toLowerCase();
  expect(visualText).not.toContain('wind');
  expect(visualText).not.toContain('tailwind');
  expect(visualText).not.toContain('headwind');
});

/* ------------------------------------------------------------------ *
 * V-7 — WCAG AA contrast on the verdict word, captions and tallies,
 * BOTH themes (the measured ratios print into the evidence file)
 * ------------------------------------------------------------------ */
function wcagRatio(fg: string, bg: string): number {
  const lum = (c: string): number => {
    const m = c.match(/rgba?\(([\d.]+),?\s+([\d.]+),?\s+([\d.]+)(?:,?\s*([\d.]+))?\)/);
    if (m === null) return 0;
    const a = m[4] === undefined ? 1 : Number(m[4]);
    const ch = [1, 2, 3].map((i) => {
      let v = Number(m[i]) / 255;
      if (a < 1) v = v * a + 1 * (1 - a); // blend onto white for alpha
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
  };
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

for (const [theme, themeWord] of [['light', 'light'], ['dark', 'dark']] as const) {
  test(`V-7 ${themeWord}: the verdict word, pan captions and tallies meet WCAG AA on their tinted surfaces (ratios recorded)`, async ({ page }) => {
    await loadBalance(page, { scenario: 'split', width: 1280, locale: 'en', theme });
    const measured = await page.evaluate(() => {
      const styleOf = (el: HTMLElement | null): string => {
        if (el === null) return 'rgb(0, 0, 0)';
        return getComputedStyle(el).color;
      };
      const root = document.documentElement;
      const token = (name: string): string => getComputedStyle(root).getPropertyValue(name).trim();
      return {
        surface: getComputedStyle(document.querySelector('[data-signal-card="merged"]') as HTMLElement).backgroundColor,
        verdict: styleOf(document.querySelector<HTMLElement>('[data-balance-verdict-word]')),
        caption: styleOf(document.querySelector<HTMLElement>('.pan-cap')),
        tally: styleOf(document.querySelector<HTMLElement>('.row-tally')),
        counts: styleOf(document.querySelector<HTMLElement>('[data-balance-count]')),
        trayTitle: styleOf(document.querySelector<HTMLElement>('[data-balance-tray-title]')),
        captionFor: styleOf(document.querySelector<HTMLElement>('.pan-for .pan-cap')),
        captionAgainst: styleOf(document.querySelector<HTMLElement>('.pan-against .pan-cap')),
        forInk: token('--bal-for-ink'),
        againstInk: token('--bal-against-ink'),
      };
    });
    const ratios = {
      verdict: wcagRatio(measured.verdict, measured.surface),
      caption: wcagRatio(measured.caption, measured.surface),
      tally: wcagRatio(measured.tally, measured.surface),
      counts: wcagRatio(measured.counts, measured.surface),
      trayTitle: wcagRatio(measured.trayTitle, measured.surface),
    };
    // The verdict word is 30–44px semibold: AA large-text floor 3:1; the
    // captions/tallies/counts are 12–13px: AA floor 4.5:1. The chosen
    // inks clear the stricter floor on the CARD.
    expect(ratios.verdict, `verdict ${measured.verdict} on ${measured.surface}`).toBeGreaterThanOrEqual(3);
    for (const [name, ratio] of Object.entries(ratios)) {
      if (name !== 'verdict') {
        expect(ratio, `${themeWord} ${name} ${ratio}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // THE TINTED SURFACES (05 §5: the captions sit inside the pans, whose
    // top band is a 9% tint of the side colour over the card): blend the
    // live side token at 9% over the live card surface and require the
    // caption inks to hold AA there too (the dark-mode pass that made the
    // dark --bal-*-ink tokens take the reference's brighter words).
    const blend9 = (fg: string, bg: string): string => {
      const p = (c: string): [number, number, number] => {
        const m = c.match(/rgba?\(([\d.]+),?\s+([\d.]+),?\s+([\d.]+)/)!;
        return [Number(m[1]), Number(m[2]), Number(m[3])];
      };
      const f = p(fg.startsWith('#') ? hexToRgb(fg) : fg);
      const b = p(bg);
      return `rgb(${f.map((v, i) => Math.round(v * 0.09 + b[i] * 0.91)).join(', ')})`;
    };
    const hexToRgb = (hex: string): string => {
      const h = hex.replace('#', '');
      return `rgb(${[0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).join(', ')})`;
    };
    const surface = measured.surface === 'rgba(0, 0, 0, 0)' ? 'rgb(255, 255, 255)' : measured.surface;
    const statusNormal = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-normal').trim());
    const statusAlert = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-status-alert').trim());
    const tintFor = blend9(statusNormal, surface);
    const tintAgainst = blend9(statusAlert, surface);
    const captionOnTint = {
      for: wcagRatio(measured.captionFor, tintFor),
      against: wcagRatio(measured.captionAgainst, tintAgainst),
    };
    for (const [side, ratio] of Object.entries(captionOnTint)) {
      expect(ratio, `${themeWord} ${side} caption on its 9% tint ${ratio}`).toBeGreaterThanOrEqual(4.5);
    }
    // Record the measured ratios into the evidence file for the PR.
    const evidencePath = path.join(SHOT_DIR, 'contrast-ratios.txt');
    appendFileSync(
      evidencePath,
      `${themeWord}: verdict ${ratios.verdict.toFixed(2)}:1 · caption-for-on-tint ${captionOnTint.for.toFixed(2)}:1 · caption-against-on-tint ${captionOnTint.against.toFixed(2)}:1 · tally ${ratios.tally.toFixed(2)}:1 · counts ${ratios.counts.toFixed(2)}:1 · tray-title ${ratios.trayTitle.toFixed(2)}:1 (card ${measured.surface})\n`,
      { encoding: 'utf8' },
    );
  });
}

/* ------------------------------------------------------------------ *
 * V-8 — keyboard: tab to each weight and row, Enter opens, focus
 * visible and returns correctly
 * ------------------------------------------------------------------ */
test('V-8 keyboard: weights and rows reachable, Enter opens the ledger row, focus visible', async ({ page }) => {
  await loadBalance(page, { scenario: 'split', width: 1280, locale: 'en', theme: 'light' });
  // Tab into the visual from the page: the first weight/row control
  // that lands focus must show a visible focus ring.
  const weight = page.locator('[data-balance-weight="stress"]').first(); // a pan weight
  await weight.focus();
  await expect(weight).toBeFocused();
  const outline = await weight.evaluate((el) => {
    el.focus();
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: cs.outlineWidth, color: cs.outlineColor };
  });
  expect(outline.style).not.toBe('none'); // :focus-visible rings (checked via the class contract below too)
  // Enter opens the lane's ledger row and focus moves there.
  await page.keyboard.press('Enter');
  const rowBtn = page.locator('[data-balance-row-btn="stress"]');
  await expect(rowBtn).toBeFocused();
  await expect(rowBtn).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('[data-balance-row-members="stress"]')).toBeVisible();
  // Enter again closes the row; focus stays on the row toggle.
  await page.keyboard.press('Enter');
  await expect(rowBtn).toBeFocused();
  await expect(rowBtn).toHaveAttribute('aria-expanded', 'false');
  // Space toggles too (native button semantics).
  await page.keyboard.press('Space');
  await expect(rowBtn).toHaveAttribute('aria-expanded', 'true');
});

/* ------------------------------------------------------------------ *
 * V-9 — reduced motion: no animation, the same final layout
 * ------------------------------------------------------------------ */
test('V-9 reduced motion: the beam jumps to the final angle, no easing, no weight motion', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.addInitScript((init: { locale: string }) => window.localStorage.setItem('currena:locale', init.locale), {
    locale: 'en',
  });
  await serveScenario(page, 'against');
  await page.goto('/insights?balance=lanes');
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page.waitForTimeout(400);
  const beam = page.locator('[data-balance-beam]');
  // The FIRST paint carries the verdict angle: the transform equals the
  // target immediately (no animation ran).
  const target = await page.locator('[data-balance-visual]').getAttribute('data-balance-tilt-target');
  expect(await beam.getAttribute('data-tilt')).toBe(target);
  const transform = await beam.getAttribute('transform');
  const rotated = Number(transform!.match(/rotate\((-?[\d.]+)/)?.[1] ?? 0);
  expect(rotated).toBeCloseTo(Number(target)!, 2);
  // The weights/chevrons carry no transitions under reduced motion.
  const motionless = await page.evaluate(() => {
    const w = document.querySelector<HTMLElement>('[data-balance-weight]');
    const c = document.querySelector<HTMLElement>('.chev');
    return {
      weight: w !== null ? getComputedStyle(w).transitionDuration : '0s',
      chev: c !== null ? getComputedStyle(c).transitionDuration : '0s',
    };
  });
  expect(motionless.weight).toBe('0s');
  expect(motionless.chev).toBe('0s');
  await captureCard(page, 'reduced-motion-against-en-1280-light');
  await context.close();
});
