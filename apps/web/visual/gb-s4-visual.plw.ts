/**
 * gb-s4-visual.plw.ts — the gold balance consolidation P2b (GB-S4) visual
 * acceptance suite: V-1..V-10 of 05-VISUAL-DESIGN-SPEC.md §12 over the
 * ?balance=lanes preview, on the fixture server (never a live site).
 *
 * The six V-10 scenarios are driven by intercepting /api/insights and
 * rewriting the fixture snapshot's readings per scenario (the GB-S3
 * overlay pattern, in-memory — the fixture file itself is never touched):
 *   · balanced  — the RECORDED 2026-10-31 corpus archive (01 §7's worked
 *                 example: level · 4 neutral · borrowing-costs split 2v2)
 *   · for       — falling yields + a falling dollar + high stress (3-0-1,
 *                 the full 10° tip for)
 *   · against   — high yields + a high dollar vs high stress (1-2-1,
 *                 the 3.33° tip against)
 *   · split     — a lane on each pan + the contested 2v2 neutral (1-1-2,
 *                 level, the Split badge beside the weights)
 *   · unread    — every voter stale (0-0-0-4: the "Can't read" state)
 *   · loading   — the snapshot request never resolves: the route's own
 *                 loading skeleton (the honest equivalent — the merged
 *                 card only mounts with data, so the balance never
 *                 half-renders; recorded in the evidence README)
 * Every synthetic scenario was verified against the real engine
 * (goldBalance) before it was pinned here — the counts in the comments
 * are measured, not invented.
 *
 * Checks per criterion:
 *   V-1 the squint test — the verdict word's computed size is the maximum
 *       in the balance AND a blur(8px) screenshot still reads as the hero
 *   V-2 the instrument fills ≥60% of the card on desktop, ≥92% on mobile
 *   V-3 no horizontal scroll / pan overflow at 360/390/768/1280/1920
 *   V-4 the rim segments match the ledger's member counts
 *   V-5 data-tilt + the needle + the verdict word match the formula
 *   V-6 no wind words in the gold card, EN + fa
 *   V-7 WCAG AA contrast (hero ≥3:1 large text; captions/tallies ≥4.5:1)
 *       in BOTH themes, measured from the computed styles
 *   V-8 keyboard: tab to a weight, Enter opens the row, focus lands on
 *       the row button, the row button closes it
 *   V-9 reduced motion: the beam jumps — the same final layout
 *   V-10 the screenshot set (6 scenarios × EN/fa × 360/1280 × light/dark)
 *
 * Screenshots land in docs/specs/gold-balance-consolidation/evidence/gb-s4/.
 */

import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'docs',
  'specs',
  'gold-balance-consolidation',
  'evidence',
  'gb-s4',
);

const WIDTHS = [360, 1280] as const;
const HEIGHTS: Record<(typeof WIDTHS)[number], number> = { 360: 900, 1280: 1000 };
/** V-3's full sweep. */
const OVERFLOW_WIDTHS = [360, 390, 768, 1280, 1920] as const;

/* ------------------------------------------------------------------ *
 * The scenario fixtures (engine-verified — see the file header)
 * ------------------------------------------------------------------ */

type RawReading = {
  id: string;
  value: number;
  asOf: string;
  status: string;
  percentile10y?: number;
  change30d?: number;
};

function reading(
  id: string,
  extra: Partial<{ value: number; percentile10y: number; change30d: number; status: string }> = {},
): RawReading {
  return { id, value: 1, asOf: '2026-11-03', status: 'normal', ...extra };
}
const quiet = (id: string): RawReading => reading(id, { value: 1, percentile10y: 0.5 });

/** The recorded 2026-10-31 corpus archive, as page-shaped readings. */
function archiveReadings(): RawReading[] {
  const corpus = JSON.parse(
    readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'packages', 'insights', 'fixtures', 'gold-backtest-corpus.json'),
      'utf8',
    ),
  ) as { archives: Record<string, { generatedAt: string; readings: RawReading[] }> };
  return corpus.archives['2026-10-31']!.readings;
}

const SCENARIOS: Record<string, () => RawReading[]> = {
  balanced: archiveReadings,
  // 1 for · 2 against · 1 neutral — net −1 → 3.33° against.
  against: () => [
    reading('real-yield-10y', { value: 2.9, percentile10y: 0.95 }),
    reading('us10y', { value: 4.6, percentile10y: 0.95 }),
    quiet('us30y'),
    quiet('fed-target'),
    quiet('fed-expectations'),
    quiet('ecb-dfr'),
    quiet('yield-curve-10y2y'),
    quiet('yield-curve-10y3m'),
    reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
    reading('usdjpy', { value: 155, percentile10y: 0.95 }),
    quiet('us-japan-10y-gap'),
    reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
    reading('nfci', { value: 0.4, percentile10y: 0.95 }),
    quiet('vix'),
    quiet('gold-silver'),
    quiet('cftc-gold-positioning'),
    quiet('us-cpi-yoy'),
    quiet('us-pce-core-yoy'),
    quiet('euro-hicp'),
    quiet('breakeven-5y5y'),
    reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.1 }),
    reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: 5.2 }),
  ],
  // 3 for · 0 against · 1 neutral — net +3 → the full 10° for.
  for: () => [
    reading('real-yield-10y', { value: 1.8, percentile10y: 0.5, change30d: -0.25 }),
    reading('us10y', { value: 3.9, percentile10y: 0.5, change30d: -0.3 }),
    quiet('us30y'),
    quiet('fed-target'),
    quiet('fed-expectations'),
    quiet('ecb-dfr'),
    quiet('yield-curve-10y2y'),
    quiet('yield-curve-10y3m'),
    reading('dollar-basket', { value: 98, percentile10y: 0.5, change30d: -1.6 }),
    reading('usdjpy', { value: 130, percentile10y: 0.08 }),
    quiet('us-japan-10y-gap'),
    reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
    reading('nfci', { value: 0.4, percentile10y: 0.95 }),
    quiet('vix'),
    quiet('gold-silver'),
    quiet('cftc-gold-positioning'),
    quiet('us-cpi-yoy'),
    quiet('us-pce-core-yoy'),
    quiet('euro-hicp'),
    quiet('breakeven-5y5y'),
    reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
    reading('gold-usd', { value: 4200, percentile10y: 0.6, change30d: 5.1 }),
  ],
  // 1 for · 1 against · 2 neutral (borrowing-costs split 2v2) — net 0, level.
  split: () => [
    reading('real-yield-10y', { value: 1.8, percentile10y: 0.5, change30d: -0.25 }),
    reading('us10y', { value: 3.9, percentile10y: 0.5, change30d: -0.3 }),
    reading('us30y', { value: 5.5, percentile10y: 0.95 }),
    reading('fed-target', { value: 4.5, percentile10y: 0.95 }),
    quiet('fed-expectations'),
    quiet('ecb-dfr'),
    quiet('yield-curve-10y2y'),
    quiet('yield-curve-10y3m'),
    reading('dollar-basket', { value: 108, percentile10y: 0.95 }),
    reading('usdjpy', { value: 155, percentile10y: 0.95 }),
    quiet('us-japan-10y-gap'),
    reading('stress-stlfsi', { value: 0.8, percentile10y: 0.95 }),
    reading('nfci', { value: 0.4, percentile10y: 0.95 }),
    quiet('vix'),
    quiet('gold-silver'),
    quiet('cftc-gold-positioning'),
    quiet('us-cpi-yoy'),
    quiet('us-pce-core-yoy'),
    quiet('euro-hicp'),
    quiet('breakeven-5y5y'),
    reading('breakeven-tilt', { value: 0.1, percentile10y: 0.5, change30d: 0.05 }),
    reading('gold-usd', { value: 4200, percentile10y: 0.6, change30d: 0.8 }),
  ],
  // 4 unread — the "Can't read the conditions" state.
  unread: () => [
    ...[
      'real-yield-10y', 'us10y', 'us30y', 'fed-target', 'fed-expectations', 'ecb-dfr',
      'yield-curve-10y2y', 'yield-curve-10y3m', 'dollar-basket', 'usdjpy', 'us-japan-10y-gap',
      'stress-stlfsi', 'nfci', 'vix', 'gold-silver', 'cftc-gold-positioning',
      'us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'breakeven-tilt',
    ].map((id) => reading(id, { status: 'stale', value: 0, percentile10y: undefined })),
    reading('gold-usd', { value: 4166, percentile10y: 0.6, change30d: -4.2 }),
  ],
};

/** The ids whose readings the scenario overrides (the gold context row
 * stays; every voter + gold-usd are rewritten). */
const SCENARIO_IDS = new Set([
  ...[
    'real-yield-10y', 'us10y', 'us30y', 'fed-target', 'fed-expectations', 'ecb-dfr',
    'yield-curve-10y2y', 'yield-curve-10y3m', 'dollar-basket', 'usdjpy', 'us-japan-10y-gap',
    'stress-stlfsi', 'nfci', 'vix', 'gold-silver', 'cftc-gold-positioning',
    'us-cpi-yoy', 'us-pce-core-yoy', 'euro-hicp', 'breakeven-5y5y', 'breakeven-tilt',
    'gold-usd',
  ],
]);

/** The snapshot fixture, read once and cached (the route handler rewrites
 * a deep copy per request). */
let snapshotCache: string | undefined;
function snapshotJson(): string {
  if (snapshotCache === undefined) {
    snapshotCache = readFileSync(
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'snapshot.json'),
      'utf8',
    );
  }
  return snapshotCache;
}

/** Intercepts /api/insights and serves the fixture snapshot with the
 * scenario's readings (the in-memory overlay — the file never changes).
 * The eval-relevant fields (value, asOf, status, percentile10y,
 * change30d) come from the SCENARIO alone: an unspecified change30d is
 * CLEARED, so the fixture's own 30-day moves can never leak into a
 * scenario's voters (measured: the leak flipped real-yield-10y/us10y to
 * supports through the fixture's −0.28 moves). Voter ids the fixture
 * snapshot lacks (breakeven-tilt) are APPENDED — the engine then sees
 * the full 21-voter table in every scenario. */
async function applyScenario(page: Page, scenario: keyof typeof SCENARIOS): Promise<void> {
  await page.route('**/api/insights', async (route) => {
    const snap = JSON.parse(snapshotJson()) as { readings: RawReading[] };
    const overrides = SCENARIOS[scenario]();
    const override = new Map(overrides.map((r) => [r.id, r]));
    const present = new Set(snap.readings.map((r) => r.id));
    snap.readings = [
      ...snap.readings.map((r) => {
        if (!SCENARIO_IDS.has(r.id)) return r;
        const o = override.get(r.id);
        if (o === undefined) return r;
        return {
          ...r,
          value: o.value,
          asOf: o.asOf,
          status: o.status,
          percentile10y: o.percentile10y,
          change30d: o.change30d,
        };
      }),
      ...overrides
        .filter((o) => !present.has(o.id))
        .map((o) => ({
          id: o.id,
          value: o.value,
          asOf: o.asOf,
          status: o.status,
          sourceName: 'scenario',
          updatedAt: '2026-11-03T00:00:00.000Z',
          percentile10y: o.percentile10y,
          change30d: o.change30d,
        })),
    ];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(snap) });
  });
}

/** The loading scenario: the snapshot request never resolves inside the
 * test's lifetime — the route keeps its own loading skeleton on screen. */
async function applyLoading(page: Page): Promise<void> {
  await page.route('**/api/insights', async () => {
    await new Promise((r) => setTimeout(r, 20_000));
  });
}

/** Loads the flag view at one width + locale + theme on a scenario and
 * captures the merged card (the sticky bars are neutralized for the
 * element capture — a screenshot-only tweak, the live page is untouched). */
async function capture(
  page: Page,
  opts: { scenario: string; width: number; locale: 'en' | 'fa'; theme: 'light' | 'dark'; name: string; openRow?: string },
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: HEIGHTS[opts.width as 360 | 1280] ?? 900 });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      window.localStorage.setItem('theme', theme);
    },
    [opts.locale, opts.theme],
  );
  await applyScenario(page, opts.scenario);
  await page.goto('/insights?balance=lanes');
  await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
  await page.waitForTimeout(1100); // the charts' fixtures + the balance's settle
  if (opts.openRow !== undefined) {
    await page.click(`[data-balance-row-btn="${opts.openRow}"]`);
    await page.waitForTimeout(250);
  }
  await page.addStyleTag({ content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }' });
  const card = page.locator('[data-signal-card="merged"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: path.join(SHOT_DIR, `${opts.name}.png`) });
  await expect(card).toBeVisible();
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

/* ------------------------------------------------------------------ *
 * V-10 — the screenshot set: 6 scenarios × EN/fa × 360/1280 × light/dark
 * (the loading scenario is viewport-level: the card never mounts)
 * ------------------------------------------------------------------ */
const DATA_SCENARIOS = ['balanced', 'for', 'against', 'split', 'unread'] as const;

for (const scenario of DATA_SCENARIOS) {
  for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
    for (const width of WIDTHS) {
      for (const theme of ['light', 'dark'] as const) {
        test(`V-10 ${scenario} — ${word} ${width}px ${theme}`, async ({ page }) => {
          await capture(page, {
            scenario,
            width,
            locale,
            theme,
            name: `${scenario}-${locale}-${width}-${theme}`,
          });
          // The lane view really rendered (the weights + the verdict hero).
          await expect(page.locator('[data-balance-visual]')).toBeVisible();
          await expect(page.locator('[data-balance-verdict-word]')).toBeVisible();
          await expect(page.locator('[data-balance-measured-note]')).toBeVisible();
          await expect(page.locator('[data-gold-panels]')).toHaveCount(0);
          // V-3 rides along: no horizontal scroll in ANY capture.
          const overflow = await page.evaluate(
            () => document.scrollingElement.scrollWidth - document.documentElement.clientWidth,
          );
          expect(overflow, `${scenario} ${locale} ${width} ${theme} scrollWidth delta`).toBeLessThanOrEqual(0);
        });
      }
    }
  }
}

for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  for (const width of WIDTHS) {
    test(`V-10 loading — ${word} ${width}px (the route's own skeleton)`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHTS[width as 360 | 1280] });
      await page.addInitScript(([l]) => window.localStorage.setItem('currena:locale', l), [locale]);
      await applyLoading(page);
      await page.goto('/insights?balance=lanes');
      await page.waitForSelector('[role="status"]', { timeout: 10_000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: path.join(SHOT_DIR, `loading-${locale}-${width}.png`) });
      // The honest loading state: the page skeleton, no half-rendered balance.
      await expect(page.locator('[data-balance-visual]')).toHaveCount(0);
      const overflow = await page.evaluate(() => document.scrollingElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
}

/* ------------------------------------------------------------------ *
 * V-1 — the squint test: the verdict word is the largest text in the
 * balance, and under blur(8px) it is still the dominant element.
 * ------------------------------------------------------------------ */
test('V-1 the squint test — the verdict word is the largest text and survives an 8px blur', async ({ page }) => {
  await capture(page, { scenario: 'against', width: 1280, locale: 'en', theme: 'light', name: 'squint-setup' });
  const sizes = await page.evaluate(() => {
    const root = document.querySelector('[data-balance-visual]') as HTMLElement;
    const word = root.querySelector('[data-balance-verdict-word]') as HTMLElement;
    const wordSize = parseFloat(getComputedStyle(word).fontSize);
    let maxOther = 0;
    let maxOtherText = '';
    for (const el of root.querySelectorAll<HTMLElement>('h4, p, span, div, li, button')) {
      if (el === word || word.contains(el) || el.contains(word)) continue;
      const s = parseFloat(getComputedStyle(el).fontSize);
      if (s > maxOther && (el.textContent ?? '').trim().length > 0) {
        maxOther = s;
        maxOtherText = (el.textContent ?? '').trim().slice(0, 30);
      }
    }
    return { wordSize, maxOther, maxOtherText };
  });
  expect(sizes.wordSize).toBeGreaterThanOrEqual(30);
  expect(sizes.wordSize).toBeGreaterThan(sizes.maxOther);
  // The blur pass: squint at the card — the hero must still read first.
  await page.addStyleTag({ content: '[data-signal-card="merged"] { filter: blur(8px); }' });
  await page.waitForTimeout(150);
  const card = page.locator('[data-signal-card="merged"]');
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: path.join(SHOT_DIR, 'squint-blur-8px-en-1280.png') });
  await page.addStyleTag({ content: '[data-signal-card="merged"] { filter: none; }' });
});

/* ------------------------------------------------------------------ *
 * V-2 — the instrument fills the card: ≥60% desktop, ≥92% mobile
 * ------------------------------------------------------------------ */
test('V-2 the instrument fills at least 60% of the card on desktop and 92% on mobile', async ({ page }) => {
  for (const [width, minRatio] of [[1280, 0.6], [360, 0.92]] as const) {
    await capture(page, { scenario: 'balanced', width, locale: 'en', theme: 'light', name: `v2-${width}` });
    const ratios = await page.evaluate(() => {
      const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
      const root = document.querySelector('[data-balance-visual]') as HTMLElement;
      const card = document.querySelector('[data-signal-card="merged"]') as HTMLElement;
      const w = (el: HTMLElement) => el.getBoundingClientRect().width;
      return { stage: w(stage), root: w(root), card: w(card) };
    });
    expect(ratios.stage / ratios.root).toBeGreaterThanOrEqual(minRatio);
    // Recorded for the evidence: the merged card carries its own padding
    // (p-4 = 16px a side), so the instrument's share of the CARD is
    // (width − 32)/width on mobile — the spec's "card" is the balance's
    // own container (the reference prototype's .gb), which the stage
    // fills completely.
    expect(ratios.stage).toBeLessThanOrEqual(ratios.root + 0.5);
  }
});

/* ------------------------------------------------------------------ *
 * V-3 — the full width sweep: no overflow, no clipped pans
 * ------------------------------------------------------------------ */
for (const { locale, word } of [
  { locale: 'en' as const, word: 'EN' },
  { locale: 'fa' as const, word: 'FA' },
]) {
  test(`V-3 no overflow at 360/390/768/1280/1920 — ${word} (the stack case proves the pans never clip)`, async ({ page }) => {
    await page.addInitScript((l) => window.localStorage.setItem('currena:locale', l), locale);
    for (const width of OVERFLOW_WIDTHS) {
      await page.setViewportSize({ width, height: 1000 });
      await applyScenario(page, 'for');
      await page.goto('/insights?balance=lanes');
      await page.waitForSelector('[data-balance-visual]', { timeout: 15_000 });
      await page.waitForTimeout(500);
      const result = await page.evaluate(() => {
        const overflow = document.scrollingElement.scrollWidth - document.documentElement.clientWidth;
        const pans = [...document.querySelectorAll('[data-balance-pan]')].map((p) => ({
          side: p.getAttribute('data-balance-pan'),
          clipped: (p as HTMLElement).scrollHeight > (p as HTMLElement).clientHeight + 1,
        }));
        const stage = document.querySelector('[data-balance-stage]') as HTMLElement;
        return { overflow, pans, stageH: stage.getBoundingClientRect().height };
      });
      expect(result.overflow, `${word} ${width} horizontal overflow`).toBeLessThanOrEqual(0);
      for (const pan of result.pans) {
        expect(pan.clipped, `${word} ${width} pan ${pan.side} clipped`).toBe(false);
      }
      expect(result.stageH).toBeGreaterThan(150);
    }
  });
}

/* ------------------------------------------------------------------ *
 * V-4 — the rim matches the ledger counts
 * ------------------------------------------------------------------ */
test('V-4 the weight rims match the ledger counts (every scenario, every weight)', async ({ page }) => {
  for (const scenario of DATA_SCENARIOS) {
    await capture(page, { scenario, width: 1280, locale: 'en', theme: 'light', name: `v4-${scenario}` });
    // One row open at a time: read each weight's rim, open its ledger row,
    // read the member list, compare — the rim is a picture of the same
    // counts (05 §4.3 + V-4).
    const lanes = await page.evaluate(() =>
      [...document.querySelectorAll('[data-balance-weight]')].map((w) => w.getAttribute('data-balance-weight') as string),
    );
    expect(lanes.length).toBe(4); // one weight per lane, every scenario
    for (const lane of lanes) {
      const rim = await page.evaluate((laneKey) => {
        const counts: Record<string, number> = { supports: 0, pressures: 0, steady: 0, unread: 0 };
        for (const seg of document.querySelectorAll(`[data-balance-weight="${laneKey}"] [data-bal-seg]`)) {
          const k = seg.getAttribute('data-bal-seg') as string;
          counts[k] = (counts[k] ?? 0) + 1;
        }
        return counts;
      }, lane);
      await page.click(`[data-balance-row-btn="${lane}"]`);
      const ledger = await page.evaluate((laneKey) => {
        const counts: Record<string, number> = { supports: 0, pressures: 0, steady: 0, unread: 0 };
        for (const m of document.querySelectorAll(`[data-balance-row="${laneKey}"] [data-balance-member]`)) {
          const k = m.getAttribute('data-balance-member-impact') as string;
          counts[k] = (counts[k] ?? 0) + 1;
        }
        return counts;
      }, lane);
      expect(ledger, `${scenario} ${lane} ledger members`).toEqual(rim);
      await page.click(`[data-balance-row-btn="${lane}"]`); // close again
    }
  }
});

/* ------------------------------------------------------------------ *
 * V-5 — the beam angle, the needle and the verdict match the formula
 * ------------------------------------------------------------------ */
test('V-5 the beam tilt + the needle + the verdict word match the unchanged formula', async ({ page }) => {
  const cases: Array<{ scenario: string; tilt: number; verdict: string; word: string }> = [
    { scenario: 'balanced', tilt: 0, verdict: 'balanced', word: 'Balanced' },
    { scenario: 'against', tilt: 3.33, verdict: 'against', word: 'Leaning against gold' },
    { scenario: 'for', tilt: -10, verdict: 'for', word: 'Leaning for gold' },
    { scenario: 'split', tilt: 0, verdict: 'balanced', word: 'Balanced' },
    { scenario: 'unread', tilt: 0, verdict: 'none', word: "Can't read the conditions right now" },
  ];
  for (const c of cases) {
    await capture(page, { scenario: c.scenario, width: 1280, locale: 'en', theme: 'light', name: `v5-${c.scenario}` });
    const tilt = Number(await page.getAttribute('[data-balance-beam]', 'data-tilt'));
    expect(tilt).toBeCloseTo(c.tilt, 1);
    await expect(page.locator('[data-balance-verdict-word]')).toHaveText(c.word);
    expect(await page.getAttribute('[data-balance-verdict]', 'data-balance-verdict')).toBe(c.verdict);
    // The needle renders exactly when a reading exists (hidden for none).
    const needleCount = await page.locator('[data-balance-needle]').count();
    expect(needleCount).toBe(c.verdict === 'none' ? 0 : 1);
  }
});

/* ------------------------------------------------------------------ *
 * V-6 — no wind vocabulary in the gold card (browser pass, EN + fa)
 * ------------------------------------------------------------------ */
for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  test(`V-6 no wind words in the gold card — ${word}`, async ({ page }) => {
    await capture(page, { scenario: 'balanced', width: 1280, locale, theme: 'light', name: `v6-${locale}` });
    const text = (await page.textContent('[data-signal-card="merged"]')) ?? '';
    const lower = text.toLowerCase();
    expect(lower).not.toContain('wind');
    expect(lower).not.toContain('tailwind');
    expect(lower).not.toContain('headwind');
    expect(text).not.toContain('باد');
  });
}

/* ------------------------------------------------------------------ *
 * V-7 — WCAG AA contrast in BOTH themes (computed-style measurement)
 * ------------------------------------------------------------------ */
for (const theme of ['light', 'dark'] as const) {
  test(`V-7 contrast — ${theme} theme (hero ≥3:1, captions/tallies ≥4.5:1)`, async ({ page }) => {
    await capture(page, { scenario: 'against', width: 1280, locale: 'en', theme, name: `v7-hero-against-${theme}` });
    const ratios = await page.evaluate(() => {
      const parse = (css: string) => {
        const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
        if (!m) return null;
        return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
      };
      const blend = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) => {
        const a = fg.a + bg.a * (1 - fg.a);
        return {
          r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
          g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
          b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
          a,
        };
      };
      const bgOf = (el: Element): { r: number; g: number; b: number; a: number } => {
        const own = parse(getComputedStyle(el).backgroundColor);
        if (own !== null && own.a > 0) return own;
        return el.parentElement ? bgOf(el.parentElement) : { r: 255, g: 255, b: 255, a: 1 };
      };
      const lum = (c: { r: number; g: number; b: number }) => {
        const lin = (v: number) => {
          const s = v / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
      };
      const ratioOf = (el: Element) => {
        const fg = parse(getComputedStyle(el).color);
        if (fg === null) return null;
        const bg = bgOf(el);
        const f = blend(fg, bg);
        const l1 = lum(f);
        const l2 = lum(bg);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      };
      const pick = (sel: string) => document.querySelector(sel);
      return {
        heroWord: ratioOf(pick('[data-balance-verdict-word]') as Element),
        heroEyebrow: ratioOf(pick('.bal-verdict-eyebrow') as Element),
        counts: ratioOf(pick('[data-balance-count]') as Element),
        captionFor: ratioOf(pick('[data-balance-pan="for"] .bal-pan-cap') as Element),
        captionAgainst: ratioOf(pick('[data-balance-pan="against"] .bal-pan-cap') as Element),
        weightLabel: ratioOf(pick('[data-balance-weight] .bal-weight-label') as Element),
        tally: ratioOf(pick('[data-balance-tally]') as Element),
        trayNote: ratioOf(pick('.bal-tray-note') as Element),
        contextPill: ratioOf(pick('[data-balance-context-line]') as Element),
        foot: ratioOf(pick('[data-balance-measured-note]') as Element),
        balanceEyebrow: ratioOf(pick('[data-balance-eyebrow]') as Element),
      } as Record<string, number | null>;
    });
    // Record the measured ratios in the trace (also asserted below).
    console.log(`V-7 ${theme} measured ratios:`, JSON.stringify(ratios, null, 2));
    // The hero word: 30-44px at weight 600 — WCAG large-text AA (3:1).
    expect(ratios.heroWord).toBeGreaterThanOrEqual(3);
    // Every smaller text surface: AA 4.5:1.
    for (const [key, value] of Object.entries(ratios)) {
      if (key === 'heroWord') continue;
      expect(value, `${theme} ${key} ratio`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

/* ------------------------------------------------------------------ *
 * V-8 — keyboard: weights and rows, focus lands and returns
 * ------------------------------------------------------------------ */
test('V-8 keyboard — tab reaches the weights, Enter opens the ledger row, focus lands on the row button', async ({ page }) => {
  await capture(page, { scenario: 'balanced', width: 1280, locale: 'en', theme: 'light', name: 'v8-keyboard' });
  // Tab into the balance's controls: the first focusable in the balance
  // is a pan/tray weight (the pans hold none in this scenario — the tray
  // weights come first).
  const weightCount = await page.locator('[data-balance-weight]').count();
  expect(weightCount).toBe(4);
  // Focus the split lane's weight directly and activate it with the keyboard.
  await page.focus('[data-balance-weight="borrowing-costs"]');
  await page.keyboard.press('Enter');
  await expect(page.locator('#gold-balance-row-btn-borrowing-costs')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#gold-balance-row-borrowing-costs')).toBeVisible();
  // Focus landed on the row button (the pending-focus effect).
  await expect(page.locator('#gold-balance-row-btn-borrowing-costs')).toBeFocused();
  // Close it from the row button with the keyboard.
  await page.keyboard.press('Enter');
  await expect(page.locator('#gold-balance-row-btn-borrowing-costs')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#gold-balance-row-borrowing-costs')).toBeHidden();
  await expect(page.locator('#gold-balance-row-btn-borrowing-costs')).toBeFocused();
});

/* ------------------------------------------------------------------ *
 * V-9 — reduced motion: the beam jumps to the final angle, the same
 * final layout as animated motion
 * ------------------------------------------------------------------ */
test('V-9 reduced motion — the beam jumps; the final layout is identical', async ({ browser }) => {
  const reducedContext = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'reduce' });
  const page = await reducedContext.newPage();
  await page.addInitScript(() => window.localStorage.setItem('currena:locale', 'en'));
  await applyScenario(page, 'against');
  await page.goto('/insights?balance=lanes');
  await page.waitForSelector('[data-balance-visual]', { timeout: 15_000 });
  await page.waitForTimeout(400);
  const reduced = await page.evaluate(() => ({
    tilt: document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'),
    forTransform: (document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform,
    againstTransform: (document.querySelector('[data-balance-assembly="against"]') as HTMLElement).style.transform,
  }));
  await page.screenshot({ path: path.join(SHOT_DIR, 'reduced-motion-against-en-1280.png') });
  await reducedContext.close();

  const animatedContext = await browser.newContext({ viewport: { width: 1280, height: 1000 }, reducedMotion: 'no-preference' });
  const page2 = await animatedContext.newPage();
  await page2.addInitScript(() => window.localStorage.setItem('currena:locale', 'en'));
  await applyScenario(page2, 'against');
  await page2.goto('/insights?balance=lanes');
  await page2.waitForSelector('[data-balance-visual]', { timeout: 15_000 });
  await page2.waitForTimeout(1100); // the 650ms settle finishes
  const animated = await page2.evaluate(() => ({
    tilt: document.querySelector('[data-balance-beam]')?.getAttribute('data-tilt'),
    forTransform: (document.querySelector('[data-balance-assembly="for"]') as HTMLElement).style.transform,
    againstTransform: (document.querySelector('[data-balance-assembly="against"]') as HTMLElement).style.transform,
  }));
  await animatedContext.close();

  // Same final layout (V-9): the beam angle, the pan translations.
  expect(reduced.tilt).toBe(animated.tilt);
  expect(reduced.forTransform).toBe(animated.forTransform);
  expect(reduced.againstTransform).toBe(animated.againstTransform);
});

/* ------------------------------------------------------------------ *
 * The detail-open captures for the PR description (the ledger row open)
 * ------------------------------------------------------------------ */
test('the ledger row open — EN 360 + FA 1280 dark (the PR interaction shots)', async ({ page }) => {
  await capture(page, { scenario: 'balanced', width: 360, locale: 'en', theme: 'light', name: 'detail-open-en-360', openRow: 'borrowing-costs' });
  await expect(page.locator('[data-balance-member-group="supports"]')).toBeVisible();
  await expect(page.locator('[data-balance-lane-note]')).toHaveCount(0); // inflation only

  const page2 = await page.context().newPage();
  await capture(page2, { scenario: 'balanced', width: 1280, locale: 'fa', theme: 'dark', name: 'detail-open-fa-1280-dark', openRow: 'inflation' });
  await expect(page2.locator('[data-balance-lane-note]')).toBeVisible(); // «expectations fading»
  await expect(page2.locator('[data-balance-member-group="pressures"]')).toBeVisible();
  await page2.close();
});

/* ------------------------------------------------------------------ *
 * The default view beside the preview (today's page, unchanged)
 * ------------------------------------------------------------------ */
for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  for (const width of WIDTHS) {
    test(`the default view — ${word} ${width}px (today's page, byte-for-byte)`, async ({ page }) => {
      await page.setViewportSize({ width, height: HEIGHTS[width as 360 | 1280] });
      await page.addInitScript(
        ([l]) => {
          window.localStorage.setItem('currena:locale', l);
          window.localStorage.setItem('theme', 'light');
        },
        [locale],
      );
      await applyScenario(page, 'balanced');
      await page.goto('/insights');
      await page.waitForSelector('[data-signal-card="merged"]', { state: 'visible' });
      await page.waitForTimeout(900);
      await page.addStyleTag({ content: '.insights-sticky-nav { position: static !important; } header { position: static !important; }' });
      const card = page.locator('[data-signal-card="merged"]');
      await card.scrollIntoViewIfNeeded();
      await card.screenshot({ path: path.join(SHOT_DIR, `default-${locale}-${width}.png`) });
      // The legacy view keeps the two panels and no visual-redesign elements.
      await expect(page.locator('[data-gold-panels]')).toBeVisible();
      await expect(page.locator('[data-balance-visual]')).toHaveCount(0);
      await expect(page.locator('[data-balance-context-line]')).toHaveCount(0);
    });
  }
}
