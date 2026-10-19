/**
 * u-tests.plw.ts — the U-01..U-14 visual acceptance suite (PH1-VISUAL).
 *
 * Implements UI_SPEC.md §12 against the CURRENT page structure
 * (apps/web/src/routes/Insights.tsx + components/insights/*), rendered from
 * the FIXTURE snapshot served by visual/fixture-server.mjs — NEVER from a
 * live site and never from production data.
 *
 * Naming/vitest note: this file is `*.plw.ts` on purpose. Vitest's default
 * include is every file ending in .test or .spec — a `*.spec.ts` Playwright
 * file would be picked up by `pnpm -r test` and crash (no Playwright runner
 * there). The Playwright config pins testMatch to `*.plw.ts`; vitest never
 * matches it.
 *
 * Baseline semantics (Phase 1 of the runbook — measured 2026-10-19):
 *  - Tests for what the CURRENT v2 page already does right are normal tests
 *    and MUST PASS today (U-03 dark, U-04a, U-05, U-06, U-07, U-08a, U-10,
 *    U-11, U-12, U-13).
 *  - Tests for v3 UI that does not exist yet (hero why-list/what-next,
 *    balance visual, six-word state vocabulary, "N of M" relationship
 *    summaries, owner-only export endpoint) are marked `test.fail(...)` with
 *    "v3 target — Phase 6 turns this green": they are EXPECTED to fail, so
 *    the suite stays green while pinning the target behaviour. Phase 6
 *    flips each to a passing assertion as it implements the UI.
 *  - Two targets the prior pass believed already green are ALSO test.fail at
 *    the measured baseline, with the exact numbers in the comment (the
 *    runbook's Phase-1 rule: a defect test must fail, proving it catches
 *    the defect):
 *      · U-02 — at 360px the stale dollar-basket row's nowrap meta line
 *        pushes its card 10px past the viewport (scrollWidth 370),
 *      · U-03 light — the light-theme state tokens measure below 4.5:1
 *        ("Normal" chip 3.35:1, "Unusual" chip 1.61:1); the dark-theme
 *        variant passes and stays a normal test.
 */

import { test, expect, type Page } from '@playwright/test';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, '..');

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

const WIDTHS = [360, 768, 1200] as const;

/** Key sections for the overflow / clipping checks (real DOM ids). */
const KEY_SECTIONS = [
  'insights-hero',
  'insights-prices',
  'insights-markets',
  'insights-money',
  'insights-together',
  'insights-section-lane',
  'insights-coming-up',
  'insights-about',
] as const;

async function gotoInsights(page: Page, opts: { locale?: 'en' | 'fa'; theme?: 'light' | 'dark' } = {}): Promise<void> {
  // The app persists locale under `currena:locale` and theme under `theme`
  // (src/lib/locale.ts / src/lib/theme.ts) — set them BEFORE the first paint.
  await page.addInitScript(
    ([locale, theme]) => {
      if (locale) window.localStorage.setItem('currena:locale', locale);
      if (theme) window.localStorage.setItem('theme', theme);
    },
    [opts.locale ?? null, opts.theme ?? null],
  );
  await page.goto('/#/insights');
  await page.waitForSelector('#insights-hero', { state: 'visible' });
  await page.waitForSelector('article[data-status]', { state: 'visible' });
}

/** The markets board renders from its own fixture feed — wait for the tiles. */
async function waitForMarketsBoard(page: Page): Promise<void> {
  await page.waitForSelector('#insights-markets', { state: 'visible' });
  await page.waitForSelector('[id^="insights-market-tile-"]', { state: 'visible' });
}

/**
 * Round-2 R7: every question group keeps rows past its first three collapsed
 * behind "Show all {n} hidden indicators". The full-board tests (U-04a, U-05,
 * U-06, U-07) assert against every fixture card, so expand every group first —
 * the same clicks a reader makes.
 */
async function revealAllIndicators(page: Page): Promise<void> {
  const reveal = page.getByRole('button', { name: /Show (?:all \d+|1) hidden indicator/ });
  for (let guard = 0; guard < 12; guard += 1) {
    if ((await reveal.count()) === 0) return;
    await reveal.first().click();
    await page.waitForTimeout(50); // re-render before the next group's button
  }
}

/** Every rendered StatusChip (svg + word, never colour alone) on the page. */
async function chipWords(page: Page): Promise<{ word: string; status: string; card: string }[]> {
  return page.evaluate(() => {
    const chips: { word: string; status: string; card: string }[] = [];
    for (const card of document.querySelectorAll('article[data-status]')) {
      for (const span of card.querySelectorAll('span.rounded-full')) {
        if (!span.querySelector('svg')) continue;
        chips.push({
          word: (span.textContent ?? '').trim(),
          status: card.getAttribute('data-status') ?? '',
          card: card.id,
        });
      }
    }
    return chips;
  });
}

/* ------------------------------------------------------------------ *
 * Contrast — small in-spec checker (U-03)
 *
 * NOTE (UI_SPEC §12 / U-03): the full axe pass can come later — axe-core is a
 * heavy dependency and this harness must stay one devDependency. Until then
 * this checker covers the KEY text pairs: every status chip word on its own
 * tinted background, and the page's primary/secondary body text, in both
 * themes. Alpha backgrounds are composited over their parents so chip tints
 * (Tailwind /15 alphas) are measured against what the reader actually sees.
 *
 * The WCAG math lives INSIDE keyPairs' page.evaluate — getComputedStyle only
 * exists in the page, so there are no node-side copies of it here.
 * ------------------------------------------------------------------ */

/** Collect the key text pairs + their effective fg/bg colours from the live page. */
async function keyPairs(page: Page): Promise<{ label: string; ratio: number }[]> {
  return page.evaluate(() => {
    const parse = (css: string): { r: number; g: number; b: number; a: number } | null => {
      const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)/);
      if (!m) return null;
      return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]), a: m[4] === undefined ? 1 : Number(m[4]) };
    };
    const WHITE = { r: 255, g: 255, b: 255, a: 1 };
    const blendFg = (fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number; a: number }) => {
      const a = fg.a + bg.a * (1 - fg.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      return {
        r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
        g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
        b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a,
        a,
      };
    };
    const effectiveBg = (el: Element): { r: number; g: number; b: number; a: number } => {
      const own = parse(getComputedStyle(el).backgroundColor);
      if (el instanceof HTMLElement && el.parentElement) {
        const parent = effectiveBg(el.parentElement);
        return own && own.a > 0 ? blendFg(own, parent) : parent;
      }
      if (own && own.a > 0) return own;
      return WHITE; // the page renders over white (project base)
    };

    const pairs: { label: string; ratio: number }[] = [];
    const ratioOf = (el: Element, label: string): void => {
      const fg = parse(getComputedStyle(el).color);
      if (!fg) return;
      const bg = effectiveBg(el);
      const lum = (c: { r: number; g: number; b: number }) => {
        const lin = (v: number): number => {
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

    // 1. Every status chip word on its own tint.
    for (const card of document.querySelectorAll('article[data-status]')) {
      for (const span of card.querySelectorAll('span.rounded-full')) {
        if (!span.querySelector('svg')) continue;
        const word = (span.textContent ?? '').trim();
        if (word) ratioOf(span, `chip "${word}" (${card.id})`);
      }
    }
    // 2. Section headings + one card's primary/secondary body text.
    for (const h of document.querySelectorAll('h2')) ratioOf(h, `section heading "${(h.textContent ?? '').trim().slice(0, 30)}"`);
    const alert = document.querySelector('article.alert-card span.font-bold');
    if (alert) ratioOf(alert, 'card title (primary text)');
    const caption = document.querySelector('article[data-status] span[class*="text-secondary"]');
    if (caption) ratioOf(caption, 'card meta (secondary text)');
    return pairs;
  });
}

async function assertKeyContrast(page: Page): Promise<void> {
  const pairs = await keyPairs(page);
  expect(pairs.length, 'key text pairs were found').toBeGreaterThan(10);
  const failing = pairs.filter((p) => p.ratio < 4.5);
  expect(
    failing.map((p) => `${p.label}: ${p.ratio.toFixed(2)}:1`),
    'text pairs at least 4.5:1 against their effective background',
  ).toEqual([]);
}

/* ------------------------------------------------------------------ *
 * U-01 — Hero answers three questions (verdict word + why list + what-next)
 * ------------------------------------------------------------------ */

test('U-01 hero answers three questions (verdict + why + what-next)', async ({ page }) => {
  // v3 target — Phase 6 turns this green. UI_SPEC §3.1: the hero card carries
  // the verdict word (exists today), a "why" list of THREE indicator rows
  // (name + value + change + status chip), and a "what is next" line naming
  // the next calendar event with its days away. The v2 hero has verdict +
  // gauges + attention tiles, but NO three-row why list with chips and NO
  // next-event line ("Next up" lives below the indicators, R16) — so the
  // composite assertion below fails today, as expected.
  test.fail();
  await gotoInsights(page);
  const hero = page.locator('#insights-hero');

  await expect(hero).toContainText(/Stable|Cautious|Stressed|Critical/);

  // Why (UI-03): three rows, each with a name, a value, a change and a chip.
  const whyRows = hero.locator('[data-hero-why] > *');
  await expect(whyRows).toHaveCount(3);
  for (const row of await whyRows.all()) {
    await expect(row.locator('span.rounded-full')).toBeVisible(); // status chip
    await expect(row).toContainText(/[+-]?\d/); // value or change digit
  }

  // What is next (UI-05): the next calendar event with its days away.
  await expect(hero).toContainText(/(Today|Tomorrow|\d+ days away)/);
  await expect(hero).toContainText(/RBA|Fed|ABS|ECB|CPI/);
});

/* ------------------------------------------------------------------ *
 * U-02 — No overflow at 360 / 768 / 1200
 * ------------------------------------------------------------------ */

test('U-02 no overflow at 360, 768, 1200', async ({ page }) => {
  // v3 target — Phase 6 turns this green. Measured baseline (2026-10-19): at
  // 360px the STALE dollar-basket compact row overflows — its nowrap
  // "data for …, not updated since" meta line pushes the card's right edge to
  // 370px against a 360px viewport, so document.scrollWidth is 370 > 360.
  // No key section clips at any width and 768/1200 are clean; the UI-20 card
  // anatomy rework (meta row that wraps) must clear the 360px failure.
  test.fail();
  await gotoInsights(page);
  await waitForMarketsBoard(page);
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150); // let reflow settle
    const overflow = await page.evaluate(
      ({ ids }) => {
        const iw = window.innerWidth;
        const clipped: string[] = [];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          if (rect.left < -1 || rect.right > iw + 1) clipped.push(`${id}: ${Math.round(rect.left)}..${Math.round(rect.right)} vs ${iw}`);
        }
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: iw,
          clipped,
        };
      },
      { ids: [...KEY_SECTIONS] },
    );
    expect(overflow.clipped, `key sections must fit the viewport at ${width}px`).toEqual([]);
    expect(
      overflow.scrollWidth,
      `document must not scroll horizontally at ${width}px (scrollWidth ${overflow.scrollWidth} > innerWidth ${overflow.innerWidth})`,
    ).toBeLessThanOrEqual(overflow.innerWidth);
  }
});

/* ------------------------------------------------------------------ *
 * U-03 — Contrast (light + dark)
 * ------------------------------------------------------------------ */

test('U-03 contrast: key text pairs pass 4.5:1 (light)', async ({ page }) => {
  // v3 target — Phase 6 turns this green. Measured baseline (2026-10-19):
  // the LIGHT-theme state tokens sit below the 4.5:1 text floor — the
  // "Normal" chip words (Carbon Green 50 #24a148 on their 15% green tint)
  // measure 3.35:1 and the "Unusual" chip (Carbon Yellow 30 #f1c21b on its
  // 10% amber tint) measures 1.61:1. The dark-theme tokens hold — that
  // variant below stays a normal passing test. The UI-15 token rework must
  // lift the light-theme words to ≥4.5:1 (darker green + a brown/bronze
  // watch ink), never by hiding the words.
  test.fail();
  await gotoInsights(page, { theme: 'light' });
  await assertKeyContrast(page);
});

test('U-03 contrast: key text pairs pass 4.5:1 (dark)', async ({ page }) => {
  await gotoInsights(page, { theme: 'dark' });
  await assertKeyContrast(page);
});

/* ------------------------------------------------------------------ *
 * U-04 — State language
 * ------------------------------------------------------------------ */

test('U-04a every status chip shows one of today\'s state words', async ({ page }) => {
  await gotoInsights(page);
  await revealAllIndicators(page); // the collapsed tail includes check-pending/unavailable rows
  const chips = await chipWords(page);
  expect(chips.length).toBeGreaterThan(10);

  // Today's vocabulary (copy.status + the unusual tier word).
  const TODAY = [
    'Normal',
    'Needs attention',
    'Unusual',
    'Context',
    'Stale',
    'Check pending',
    'Limited history',
    'No data',
  ];
  for (const chip of chips) {
    expect(TODAY, `chip on ${chip.card} (data-status ${chip.status})`).toContain(chip.word);
  }

  // The word matches the reading's status (normal-status cards may wear the
  // unusual tier word instead — percentile ≥ 0.9, see config/movers.ts).
  const EXPECTED: Record<string, string[]> = {
    warning: ['Needs attention'],
    normal: ['Normal', 'Unusual'],
    context: ['Context'],
    stale: ['Stale'],
    'check-pending': ['Check pending'],
    'no-history': ['Limited history'],
    unavailable: ['No data'],
  };
  for (const chip of chips) {
    expect(EXPECTED[chip.status] ?? [], `chip word for data-status "${chip.status}" on ${chip.card}`).toContain(chip.word);
  }

  // Coverage: the fixture renders every status class (fixture guarantee).
  const statuses = new Set(chips.map((c) => c.status));
  for (const required of ['warning', 'normal', 'context', 'stale', 'check-pending', 'unavailable']) {
    expect(statuses.has(required), `a card with data-status ${required} renders a chip`).toBe(true);
  }
});

test('U-04b every status chip shows one of the v3 six-word vocabulary', async ({ page }) => {
  // v3 target — Phase 6 turns this green. UI_SPEC §4: exactly six words —
  // Normal, Needs attention, Context, Stale, Delayed, Can't tell right now.
  // Today's page still renders Unusual / Check pending / Limited history /
  // No data, so this fails until the Phase 6 state-language rename lands.
  test.fail();
  await gotoInsights(page);
  await revealAllIndicators(page);
  const chips = await chipWords(page);
  expect(chips.length).toBeGreaterThan(10);
  const V3 = ['Normal', 'Needs attention', 'Context', 'Stale', 'Delayed', "Can't tell right now"];
  for (const chip of chips) {
    expect(V3, `v3 vocabulary must cover the chip on ${chip.card}`).toContain(chip.word);
  }
});

/* ------------------------------------------------------------------ *
 * U-05 — Source and date: every card face shows its data date
 * ------------------------------------------------------------------ */

test('U-05 every card face shows a data date', async ({ page }) => {
  await gotoInsights(page);
  await revealAllIndicators(page); // assert against the FULL board, not the R7 first-three preview
  const cards = page.locator('article[data-status]');
  const count = await cards.count();
  expect(count).toBeGreaterThan(20);

  const dated: string[] = [];
  const undated: string[] = [];
  for (const card of await cards.all()) {
    const status = await card.getAttribute('data-status');
    const text = (await card.textContent()) ?? '';
    // Lane cards say "data for {date}" (B5); price tiles say "as of {date}".
    // Unavailable cards hide the value AND the date by design (U-07).
    if (status === 'unavailable') continue;
    if (/data for|as of/i.test(text)) dated.push(await card.getAttribute('id').then((id) => id ?? ''));
    else undated.push((await card.getAttribute('id')) ?? '');
  }
  expect(undated, 'cards whose face shows no data date').toEqual([]);
  expect(dated.length).toBeGreaterThan(10);
});

/* ------------------------------------------------------------------ *
 * U-06 — Quarterly labels: quarter words, never bare months
 * ------------------------------------------------------------------ */

test('U-06 quarterly cards name the quarter, never a bare month', async ({ page }) => {
  await gotoInsights(page);
  await revealAllIndicators(page); // the quarterly rows sit in the collapsed tail
  // Every genuinely QUARTERLY fixture card (cadence 'quarterly' in the
  // DEFINITIONS table; the fixture builder stamps periodStart/periodEnd on
  // exactly these): govt-interest-revenue, au-wage-growth, au-home-values,
  // terms-of-trade, au-household-debt-arrears. NOTE: au-cpi and
  // au-trimmed-mean are ABS MONTHLY series — "data for July 2026" is the
  // correct label there, so they are deliberately NOT in this list.
  const QUARTERLY = [
    'insights-card-govt-interest-revenue',
    'insights-card-au-wage-growth',
    'insights-card-au-home-values',
    'insights-card-terms-of-trade',
    'insights-card-au-household-debt-arrears',
  ];
  const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
  for (const id of QUARTERLY) {
    const card = page.locator(`#${id}`);
    await expect(card).toBeVisible();
    // The data-date line renders "data for {Month} quarter {year}" (B-07,
    // via the stored periodEnd — defect E-07).
    const dateLine = card.getByText(/data for/i).first();
    const text = (await dateLine.textContent()) ?? '';
    expect(text, `${id} must name a quarter`).toMatch(/data for [A-Za-z]+ quarter \d{4}/i);
    // And it is never a bare "Month YYYY" label (defect E-07's whole point).
    expect(text).not.toMatch(new RegExp(`data for (${MONTHS}) \\d{4}`, 'i'));
  }
});

/* ------------------------------------------------------------------ *
 * U-07 — Unavailable cards hide their value
 * ------------------------------------------------------------------ */

test('U-07 the unavailable card renders no value', async ({ page }) => {
  await gotoInsights(page);
  await revealAllIndicators(page); // china-pmi sits in growth-health's collapsed tail
  const card = page.locator('#insights-card-china-pmi');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-status', 'unavailable');
  // No value bdi / no digits on the face; the honest "No data right now" line.
  await expect(card.locator('bdi')).toHaveCount(0);
  const text = (await card.textContent()) ?? '';
  expect(text).toMatch(/No data/);
  expect(text, 'no numeric value may leak onto an unavailable card face').not.toMatch(/\d/);
});

/* ------------------------------------------------------------------ *
 * U-08 — Relationship cards
 * ------------------------------------------------------------------ */

test('U-08a relationship cards contain no Active/Partly active/Signals disagree', async ({ page }) => {
  // Expand "Together" (R7b collapsed default) via its remembered-open key.
  await page.addInitScript(() => window.localStorage.setItem('currena.insights.together-open.v1', 'open'));
  await gotoInsights(page);
  const together = page.locator('#insights-together');
  await expect(together).toBeVisible();
  const text = (await together.textContent()) ?? '';
  // v2 already retired these verdict badges (L3-02): the words must be gone.
  expect(text).not.toMatch(/\bActive\b/);
  expect(text).not.toMatch(/Partly active/);
  expect(text).not.toMatch(/Signals disagree/);
  // And ANYWHERE on the page (U-08's own words): the retired badges must not
  // survive in any other section either. (The fx patterns' own "Active"
  // chip vocabulary lives in the World currencies section, which stays in
  // its calm empty state on the fixture — /api/insights/fx answers 404 —
  // so the word cannot leak in from there.)
  const pageText = (await page.locator('body').textContent()) ?? '';
  expect(pageText, 'no "Active" verdict badge may render anywhere').not.toMatch(/\bActive\b/);
  expect(pageText, 'no "Partly active" verdict badge may render anywhere').not.toMatch(/Partly active/);
  expect(pageText, 'no "Signals disagree" verdict badge may render anywhere').not.toMatch(/Signals disagree/);
});

test('U-08b relationship cards carry the v3 "N of M" match summary', async ({ page }) => {
  // v3 target — Phase 6 turns this green. UI_SPEC UI-33: a neutral summary
  // line "N of M readings match the usual pattern" on every relationship
  // card. Today's cards show Showing/Partly showing/Not showing states with
  // no match count, so this fails until the Phase 6 rebuild lands.
  test.fail();
  await page.addInitScript(() => window.localStorage.setItem('currena.insights.together-open.v1', 'open'));
  await gotoInsights(page);
  const cards = page.locator('[data-connection]');
  await expect(cards.first()).toBeVisible();
  await expect(cards.first()).toContainText(/\d+ of \d+ readings match the usual pattern/);
});

/* ------------------------------------------------------------------ *
 * U-09 — Gold/silver balance visual (UI-39..UI-45)
 * ------------------------------------------------------------------ */

test('U-09 balance visual is legible at 360px in LTR and RTL', async ({ page }) => {
  // v3 target — Phase 6 turns this green. UI_SPEC §9: a balance beam with
  // two factor columns, a fulcrum, one equal token per condition, tilt by
  // readable conditions, and the missing-data line. None of it exists today
  // (the merged gold/silver card still renders grouped lists), so the
  // structure assertions below fail until Phase 6 builds the visual.
  test.fail();
  await gotoInsights(page);
  for (const locale of ['en', 'fa'] as const) {
    await page.evaluate((l) => window.localStorage.setItem('currena:locale', l), locale);
    await page.reload();
    await page.waitForSelector('#insights-hero', { state: 'visible' });
    await page.waitForSelector('article[data-status]', { state: 'visible' });
    const gold = page.locator('#insights-conditions-gold, [data-balance="gold-usd"]');
    await expect(gold).toBeVisible();
    // The readable-count line (UI-39.5 / UI-45a): "N of M conditions readable".
    await expect(gold).toContainText(/\d+ of \d+ conditions readable/);
    // The beam itself: a fulcrum element with tilted ends.
    await expect(gold.locator('[data-balance-beam]')).toBeVisible();
  }
});

test('U-09a fewer than 3 readable conditions keeps the beam level', async ({ page }) => {
  // v3 target — Phase 6 turns this green. UI-40: with <3 readable
  // conditions the beam stays level and shows the "not enough readable
  // conditions" line; unreadable conditions never tilt it. Needs the Phase 6
  // balance component plus a low-readable fixture variant.
  test.fail();
  await gotoInsights(page);
  const balance = page.locator('#insights-conditions-gold, [data-balance="gold-usd"]');
  await expect(balance).toContainText(/Not enough readable conditions/);
  const tilt = await balance.locator('[data-balance-beam]').evaluate((el) => el.getAttribute('data-tilt'));
  expect(tilt).toBe('0');
});

/* ------------------------------------------------------------------ *
 * U-10 — Reduced motion
 * ------------------------------------------------------------------ */

test('U-10 prefers-reduced-motion: no animation runs', async ({ browser, baseURL }) => {
  // reducedMotion is a CONTEXT option (test.use() may not run inside a test
  // body) — so this test builds its own reduced-motion context.
  const context = await browser.newContext({ reducedMotion: 'reduce', baseURL });
  const page = await context.newPage();
  // The Together section's connection arrows carry reduced-motion CSS but
  // the section is collapsed by default (R7b) — open it via its
  // remembered-open key, the same way U-08a does.
  await page.addInitScript(() => window.localStorage.setItem('currena.insights.together-open.v1', 'open'));
  await gotoInsights(page);
  await waitForMarketsBoard(page);
  // Open one Details panel so the .insights-panel + scrim surfaces (the
  // third reduced-motion selector family) are mounted too.
  await page.getByRole('button', { name: /^Details: / }).first().click();
  await page.waitForSelector('.insights-panel', { state: 'visible' });
  const animated = await page.evaluate(() => {
    const offenders: string[] = [];
    const check = (el: Element, label: string): void => {
      const cs = getComputedStyle(el);
      if (cs.animationName !== 'none' && cs.animationPlayState !== 'paused') {
        offenders.push(`${label}: animation-name ${cs.animationName}`);
      }
    };
    check(document.querySelector('#insights-hero article') ?? document.body, 'hero verdict card');
    const alert = document.querySelector('article.alert-card');
    if (alert) check(alert, 'alert card');
    const row = document.querySelector('article[data-status="normal"]');
    if (row) check(row, 'compact row');
    const tile = document.querySelector('[id^="insights-market-tile-"]');
    if (tile) check(tile, 'market tile');
    const calendar = document.getElementById('insights-coming-up');
    if (calendar) check(calendar, 'calendar section');
    const chip = document.querySelector('article[data-status] span.rounded-full svg');
    if (chip) check(chip, 'status chip icon');
    // The app's own reduced-motion handling (apps/web/src/index.css): every
    // selector that carries a prefers-reduced-motion block there must show
    // its motion switched off in the computed style — the hero meter's
    // segments and the connection arrows lose their transitions entirely,
    // the details panel + its scrim lose their entrance animation:
    //
    //   @media (prefers-reduced-motion: reduce) {
    //     .verdict-meter-seg            { transition: none; }
    //     .insights-panel,
    //     .insights-panel-scrim         { animation: none; }
    //     .connection-arrow            { transition: none; }
    //   }
    //
    // .verdict-meter-seg is REQUIRED (the hero always carries the meter).
    // .connection-arrow is asserted only when an element carries it: the
    // class is defined in index.css but no component mounts it today
    // (grep over src: ConnectionCard renders "no arrows between chips —
    // arrows implied"), so there is nothing to measure until Phase 6 puts
    // an element inside it — from then on this same loop holds it honest.
    const segs = document.querySelectorAll('.verdict-meter-seg');
    if (segs.length === 0) offenders.push('.verdict-meter-seg: no element mounted — the hero meter must exist');
    for (const sel of ['.verdict-meter-seg', '.connection-arrow']) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.transitionProperty !== 'none' || cs.transitionDuration !== '0s') {
          offenders.push(`${sel}: transition ${cs.transitionProperty} ${cs.transitionDuration}`);
        }
      }
    }
    for (const sel of ['.insights-panel', '.insights-panel-scrim']) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        if (cs.animationName !== 'none') offenders.push(`${sel}: animation-name ${cs.animationName}`);
      }
    }
    return offenders;
  });
  expect(animated, 'no CSS animation may run under prefers-reduced-motion').toEqual([]);
  await context.close();
});

/* ------------------------------------------------------------------ *
 * U-11 — Stock table: no "Normal" state word + local-currency note
 * ------------------------------------------------------------------ */

test('U-11 stock table uses the L2-01 state words and the local-currency note', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await gotoInsights(page);
  await waitForMarketsBoard(page);

  const section = page.locator('#insights-markets');
  // UI-27: the header note "Returns in each market's local currency."
  await expect(section.getByText(/Returns in each market.s local currency/)).toBeVisible();

  // Open the full table (disclosed by default-closed per §6.3).
  await section.getByRole('button', { name: /Show full table/ }).click();
  const table = page.locator('#insights-markets-table');
  await expect(table).toBeVisible();

  // UI-28 / L2-01: the four state words; "Normal" is retired as a stock state.
  const L201 = ['Near its high', 'Pullback', 'Correction', 'Bear market'];
  const stateCells = table.locator('tbody td span.rounded-full');
  const words: string[] = [];
  for (const cell of await stateCells.all()) words.push(((await cell.textContent()) ?? '').trim());
  expect(words.length).toBeGreaterThan(10);
  for (const w of words) {
    expect(L201, `state cell "${w}" must use an L2-01 word`).toContain(w);
  }
  // The fixture covers all four bands — assert they all render.
  for (const w of L201) expect(words).toContain(w);
  expect(words, '"Normal" must not appear as a stock state').not.toContain('Normal');

  // Section-level sweep too (tiles + sr-only labels): no standalone "Normal".
  const sectionText = (await section.textContent()) ?? '';
  expect(sectionText).not.toMatch(/\bNormal\b/);
});

/* ------------------------------------------------------------------ *
 * U-12 — Calendar shows no past events
 * ------------------------------------------------------------------ */

test('U-12 calendar shows no past events', async ({ page }) => {
  await gotoInsights(page);
  const section = page.locator('#insights-coming-up');
  await expect(section).toBeVisible();

  // The strip shows the NEXT three events, each with its Gregorian date on
  // the date span's title attribute ("Gregorian date: YYYY-MM-DD").
  const strip = section.locator('ul > li');
  await expect(strip).toHaveCount(3);
  const todayIso = new Date().toISOString().slice(0, 10);
  for (const item of await strip.all()) {
    const title = (await item.locator('[title]').first().getAttribute('title')) ?? '';
    const iso = title.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    expect(iso, 'strip items carry their Gregorian date').toBeTruthy();
    // ISO dates compare lexically — a past event would fail this.
    expect(iso !== undefined && iso >= todayIso, `no past event may render in the strip (${iso} < ${todayIso})`).toBe(true);
  }

  // Expand the full calendar: all five fixture events, all Today/Tomorrow/N days away.
  await section.getByRole('button', { name: /Full calendar/ }).click();
  const fullList = section.locator('div.mt-2 ul li');
  await expect(fullList).toHaveCount(5);
  for (const row of await fullList.all()) {
    const text = (await row.textContent()) ?? '';
    expect(text, 'full-list rows must show a future day-count').toMatch(/(Today|Tomorrow|\d+ days away)/);
    expect(text).not.toMatch(/[-−]\d+ days away/);
  }
});

/* ------------------------------------------------------------------ *
 * U-13 — Strings: no hard-coded user-visible text outside the string table
 *
 * A NODE-side source scan (no browser): JSX text literals in the Insights
 * components must not carry the page's copy sentences — every user-visible
 * sentence belongs in apps/web/src/i18n/*.ts (AGENTS.md rule 5). TWO
 * deliberately conservative tiers, both of which pass against today's
 * sources and catch a hard-coded sentence when one appears:
 *
 *   1. DENY LIST — full copy phrases that only ever come from the string
 *      table (state words, section titles, card lines), and
 *   2. LONG-SENTENCE — a JSX literal that reads like an English sentence:
 *      capital start, ONLY sentence-safe characters (no code glyphs), at
 *      least 5 words and at least 2 lowercase English words. Calibrated
 *      against every Insights component today: 0 hits (the regex also
 *      skips comments and {braced}/<tagged> runs first).
 *
 * aria-hidden glyphs, separators, numbers and units are allowed.
 * ------------------------------------------------------------------ */

const COPY_DENY_LIST = [
  'Needs attention',
  'No data right now',
  'Check pending',
  'Limited history',
  'General information only',
  'Not financial advice',
  'Returns in each market',
  'Show full table',
  'Show all currency pairs',
  'Download calendar',
  'Full calendar',
  'Data as of',
  'Reading progress',
  'About this data',
  'World stock markets',
  'Near its high',
  'Pullback',
  'Bear market',
  'Not enough fresh data',
  'Pass-through pending',
  'Next up',
];

/** A JSX text run that looks like a hard-coded English SENTENCE. */
function looksLikeSentence(text: string): boolean {
  const flat = text.replace(/\s+/g, ' ').trim();
  // Capital start, sentence-safe characters only — code between > and <
  // (generic params, callbacks, operators) always trips one of these.
  if (!/^[A-Z][A-Za-z0-9 ,.;:'’!?%()\-&]*$/.test(flat)) return false;
  const words = flat.split(' ');
  if (words.length < 5) return false;
  const lowerWords = words.filter((w) => /^[a-z][a-z’']*$/.test(w)).length;
  return lowerWords >= 2;
}

function listTsxDirectories(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) listTsxDirectories(full, out);
    else if (entry.endsWith('.tsx')) out.push(full);
  }
  return out;
}

test('U-13 no hard-coded copy outside the string table (source scan)', () => {
  const roots = [
    path.join(WEB_ROOT, 'src', 'components', 'insights'),
    path.join(WEB_ROOT, 'src', 'routes', 'insights-sections'),
  ];
  const files = roots.flatMap((r) => (existsSync(r) ? listTsxDirectories(r) : []));
  files.push(path.join(WEB_ROOT, 'src', 'routes', 'Insights.tsx'));
  expect(files.length, 'the Insights component sources exist').toBeGreaterThan(20);

  const violations: string[] = [];
  const sentences: string[] = [];
  for (const file of files) {
    let src = readFileSync(file, 'utf8');
    // Strip comments first — the repo's comments QUOTE copy by design.
    src = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    // JSX text nodes: literal runs between tags, without braces/children tags.
    for (const match of src.matchAll(/>\s*([^<>{}]+?)\s*</g)) {
      const text = match[1]!.trim();
      if (!text) continue;
      // Allow aria-hidden glyphs, separators, numbers and units.
      if (!/[A-Za-z]{3}/.test(text)) continue;
      for (const denied of COPY_DENY_LIST) {
        if (text.includes(denied)) violations.push(`${path.relative(WEB_ROOT, file)}: "${text}"`);
      }
      // Tier 2 — the long-English-sentence shape (copy lives in i18n files).
      if (looksLikeSentence(text)) sentences.push(`${path.relative(WEB_ROOT, file)}: "${text.replace(/\s+/g, ' ').slice(0, 90)}"`);
    }
  }
  expect(violations, 'copy sentences must come from the string table, never JSX literals').toEqual([]);
  expect(sentences, 'no long English sentence literal may sit in JSX text (move it to the i18n copy files)').toEqual([]);
});

/* ------------------------------------------------------------------ *
 * U-14 — Owner-only export returns 401/403 without the owner's token
 * ------------------------------------------------------------------ */

test('U-14 owner-only export is 401/403 without the owner token', async ({ request }) => {
  // TODO(Phase 3 wiring): point this at the real Worker route the api agent
  // is building (GET /api/insights/export gated by INSIGHTS_OWNER_TOKEN,
  // RULES.md M-3). Until that endpoint exists the fixture server answers
  // 404 — so this assertion fails, as expected. When Phase 3 lands, replace
  // the fixture check with the deploy-preview check (or point the harness
  // server at a proxy of the real Worker) and drop the test.fail marker.
  test.fail();
  const response = await request.get('/api/insights/export');
  expect([401, 403], 'the export must refuse anonymous callers').toContain(response.status());
});
