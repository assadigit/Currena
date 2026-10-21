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
 * Baseline semantics (Phase 1 of the runbook — measured 2026-10-19;
 * Phase-6 flips recorded 2026-10-20):
 *  - Tests for what the page does right are normal tests and MUST PASS
 *    (U-03 dark, U-05, U-06, U-08a, U-10, U-11, U-12, U-13).
 *  - Tests for v3 UI that does not exist yet are marked `test.fail(...)`
 *    with "v3 target — Phase 6 turns this green": they are EXPECTED to
 *    fail, so the suite stays green while pinning the target behaviour.
 *    Phase 6 flips each to a passing assertion as it implements the UI.
 *
 * PHASE 6 (2026-10-20, task PH6-A) — turned GREEN by the v3 rebuild, each
 * pin updated with its measured before-state in the test's own comment:
 *    · U-01 hero answers three questions (verdict + why-3 rows + what-next)
 *    · U-02 no overflow at 360px — was scrollWidth 370 (the stale row's
 *      nowrap meta line); the v3 UI-20 meta row WRAPS (CardMeta.tsx)
 *    · U-03 light — was "Normal" 3.35:1 / "Unusual" 1.61:1; the chip text
 *      inks moved to the .chip-* classes (index.css, UI-15)
 *    · U-04 — ONE six-word vocabulary test now (the 8-word U-04a retired
 *      with the display words Unusual / Check pending / Limited history /
 *      No data — the v3 §4 table: Normal, Needs attention, Context, Stale,
 *      Delayed, Can't tell right now)
 *    · U-07 — the unavailable face shows the v3 one-line reason; the value
 *      bdi stays absent (the meta row's fetch-time digits are UI-20's meta
 *      row, not a value — the pin asserts the VALUE stays hidden)
 * PHASE 6 (2026-10-20, task PH6-B) — turned GREEN, each with its own note:
 *    · U-08b the v3 neutral summary lines (N-of-M / Trigger not present /
 *      Pass-through pending / Not enough fresh data) replace the chips
 *    · U-09 the gold/silver balance visual (beam + fulcrum + factor
 *      columns + readable-count line) at 360px in LTR and RTL
 *    · U-09a the low-readable variant keeps the beam level (UI-40)
 * All 19 tests now PASS — U-14 was the last expected-fail; Phase 9 wired
 *   it to the REAL Worker booted locally (wrangler dev, playwright.config.ts
 *   webServer on :8799), never a live deployment.
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
 * U-01 — The owner-restored editorial hero (world + Australia header)
 * ------------------------------------------------------------------ */

test('U-01 hero: the restored editorial region cards (verdict + tiles + gauges + signals)', async ({ page }) => {
  // OWNER DIRECTIVE (2026-10-20, post-v3-merge): "I liked the previous UI
  // more, especially for the world and australia header sections… keep the
  // new data, connections etc. … in the PREVIOUS UI." The v3 UI-01..UI-14
  // hero (verdict sentence / reading bar / why-3 rows / what-next line /
  // freshness chip) is RETIRED by that directive. This test pins the
  // RESTORED editorial hero (main@1e39a24): the two art-band region cards
  // — Global first, then Australia — each with the tinted verdict pill +
  // the four-step meter (never colour alone), THREE needs-attention tiles
  // with numbers (the fixture plants 3 warnings per section), the compact
  // gauge rows with their state badges, the R4 biggest-move card with its
  // reason, and — once the markets feed lands — the Global card's raised
  // world-section bullets (§5.3/§6.11 returned with the restore). The v3
  // DATA layer (readings, state words, delayed tier) feeds it unchanged.
  await gotoInsights(page);
  const hero = page.locator('#insights-hero');

  // D7: the two region cards, Global FIRST (DOM order never swaps).
  const cards = hero.locator('[data-region-card]');
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toHaveAttribute('data-region-card', 'global');
  await expect(cards.nth(1)).toHaveAttribute('data-region-card', 'australia');

  for (const card of await cards.all()) {
    // The verdict word rides the tinted pill; the four-step meter stays
    // beside it (word + meter, never colour alone — the LARGE instrument;
    // the gauge rows below carry their own small meters).
    await expect(card.locator('[data-verdict-pill]')).toContainText(/Stable|Cautious|Stressed|Critical/);
    await expect(card.locator('.verdict-meter-lg')).toBeVisible();

    // Needs-attention tiles WITH NUMBERS: three per card (fixture), each
    // a button that opens the indicator's card.
    const tiles = card.locator('[data-attention-tiles] > li');
    await expect(tiles).toHaveCount(3);
    for (const tile of await tiles.all()) {
      await expect(tile.locator('button')).toBeVisible();
      await expect(tile).toContainText(/[+-]?\d/); // the value (or the rule's)
    }

    // The flagged-list heading carries the FULL count (3), and the
    // compact gauge rows speak their state badges.
    await expect(card.locator('[data-flagged-list] > p')).toContainText('3');
    await expect(card.locator('[data-hero-gauges] [data-gauge]').first()).toBeVisible();
  }

  // R4: ONE biggest-move card, its "unusually large" reason on the line.
  await expect(hero.locator('[data-biggest-move]')).toBeVisible();
  await expect(hero.locator('[data-biggest-move]')).toContainText(/unusually large/);

  // §5.3 returned with the restore: once the markets feed lands (the
  // fixture has corrections + bears → attention), the Global card raises
  // the world-markets bullet inside the always-open signals box.
  await waitForMarketsBoard(page);
  const global = cards.nth(0);
  await expect(global.locator('[data-ei-panel][data-ei-panel-kind="signals"]')).toBeVisible();
  await expect(global.locator('[data-markets-signal]')).toContainText(/8 of 16/);
});

/* ------------------------------------------------------------------ *
 * U-02 — No overflow at 360 / 768 / 1200
 * ------------------------------------------------------------------ */

test('U-02 no overflow at 360, 768, 1200', async ({ page }) => {
  // PHASE 6 GREEN (2026-10-20, was the Phase-1 expected-fail). Measured
  // baseline: at 360px the STALE dollar-basket compact row overflowed — its
  // nowrap "data for …, not updated since" meta line pushed the card's right
  // edge to 370px against a 360px viewport (scrollWidth 370 > 360; fa-RTL
  // 403px). The v3 UI-20 meta row (CardMeta.tsx) WRAPS — flex-wrap, no
  // whitespace-nowrap anywhere — so scrollWidth === innerWidth at 360.
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
  // PHASE 6 GREEN (2026-10-20, was the Phase-1 expected-fail). Measured
  // baseline: the LIGHT-theme chips sat under the 4.5:1 text floor — the
  // "Normal" chip (Carbon Green 50 #24a148 on its 15% tint) at 3.35:1 and
  // the "Unusual" chip (Carbon Yellow 30 #f1c21b) at 1.61:1. The v3 UI-15
  // rework moved every chip's TEXT ink to the darker sibling of its pinned
  // hue (.chip-* classes, index.css): Normal #0E6027 7.71:1 white / 6.70:1
  // tint · attention #B91C1C 6.47/5.57 · watch #7A5D00 6.19/5.87 (the
  // Delayed word's slot; "Unusual" retired from display) · context #245E9F
  // 6.63/6.23 · muted #46505C 8.20/6.80 — the owner-pinned palette itself
  // (meters, icons, instruments) is untouched.
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

test('U-04 every status chip shows one of the v3 six-word state vocabulary', async ({ page }) => {
  // PHASE 6 GREEN (2026-10-20). UI_SPEC §4: exactly six words — Normal,
  // Needs attention, Context, Stale, Delayed, Can't tell right now — every
  // state with its word AND icon, never colour alone. This ONE test replaces
  // the retired 8-word U-04a (Unusual / Check pending / Limited history /
  // No data left the display vocabulary: the unusual tier now shows the
  // Normal word, no-history shows Context, and both held/failed readings
  // read "Can't tell right now" — UI-17).
  await gotoInsights(page);
  await revealAllIndicators(page); // the collapsed tail carries the held/unavailable rows
  const chips = await chipWords(page);
  expect(chips.length).toBeGreaterThan(10);

  const V3 = ['Normal', 'Needs attention', 'Context', 'Stale', 'Delayed', "Can't tell right now"];
  for (const chip of chips) {
    expect(V3, `v3 vocabulary must cover the chip on ${chip.card}`).toContain(chip.word);
  }

  // The word matches the reading's internal status (normal-status cards may
  // wear the Delayed tier word — one trading day behind their peers — or
  // the Normal word of the unusual tier; no-history reads Context, v3 §4).
  const EXPECTED: Record<string, string[]> = {
    warning: ['Needs attention'],
    normal: ['Normal', 'Delayed'],
    context: ['Context'],
    'no-history': ['Context'],
    stale: ['Stale'],
    'check-pending': ["Can't tell right now"],
    unavailable: ["Can't tell right now"],
  };
  for (const chip of chips) {
    expect(EXPECTED[chip.status] ?? [], `chip word for data-status "${chip.status}" on ${chip.card}`).toContain(chip.word);
  }

  // Coverage: the fixture renders every internal status class AND every
  // one of the six words (delayed = usdjpy, can't-tell = china-pmi +
  // stress-stlfsi, stale = dollar-basket, the fixture guarantee).
  const statuses = new Set(chips.map((c) => c.status));
  for (const required of ['warning', 'normal', 'context', 'stale', 'check-pending', 'unavailable', 'no-history']) {
    expect(statuses.has(required as string), `a card with data-status ${required} renders a chip`).toBe(true);
  }
  const words = new Set(chips.map((c) => c.word));
  for (const required of V3) {
    expect(words.has(required), `the six-word vocabulary must render "${required}"`).toBe(true);
  }
  // And the retired display words are gone from every chip.
  for (const retired of ['Unusual', 'Check pending', 'Limited history', 'No data']) {
    expect(words.has(retired), `"${retired}" is retired from the display vocabulary`).toBe(false);
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
  // PHASE 6 GREEN (2026-10-20, pin updated with the v3 anatomy). UI-17: the
  // unavailable card hides its VALUE — the face shows the one-line reason
  // instead ("The source did not update on the last refresh." — the retired
  // "No data right now" line). The value rows are bdis, so zero bdis means
  // no value; the meta row's "updated {HH:mm} UTC" digits are UI-20's FETCH
  // TIME (item 6), not a value, so the old blanket no-digits-anywhere pin is
  // replaced by the honest value-hiding assertions below.
  await gotoInsights(page);
  await revealAllIndicators(page); // china-pmi sits in growth-health's collapsed tail
  const card = page.locator('#insights-card-china-pmi');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-status', 'unavailable');
  // No value bdi anywhere on the face; the honest v3 reason line is there.
  await expect(card.locator('bdi')).toHaveCount(0);
  await expect(card.locator('[data-face-reason]')).toBeVisible();
  const text = (await card.textContent()) ?? '';
  expect(text).toMatch(/did not update on the last refresh/);
  // No data date either (asOf is null on an unavailable reading) — and the
  // VALUE stays hidden: nothing but the fetch time carries a digit.
  expect(text).not.toMatch(/data for|as of/i);
  const withoutFetchTime = text.replace(/\d\d:\d\d/, '');
  expect(withoutFetchTime, 'no numeric value may leak onto an unavailable card face').not.toMatch(/\d/);
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
  // PHASE 6 GREEN (2026-10-20, was the Phase-1 expected-fail; task PH6-B).
  // UI_SPEC UI-33/35/37: the verdict chip is replaced by a NEUTRAL summary
  // line — every card renders exactly one (data-connection-summary). On the
  // fixture: the disagree card (oil jumped, borrowing costs moved against
  // the chain) reads "1 of 2 readings match the usual pattern", the two
  // quiet cards read "Trigger not present", the RBA card reads
  // "Pass-through pending" with its decided-date line, and the two
  // stale/unavailable-driver cards read "Not enough fresh data to read".
  // The v2 Showing-family state words are retired from display entirely.
  await page.addInitScript(() => window.localStorage.setItem('currena.insights.together-open.v1', 'open'));
  await gotoInsights(page);
  await page.getByRole('button', { name: /See all \d+ connections/ }).click();
  const cards = page.locator('[data-connection]');
  await expect(cards).toHaveCount(6);
  await expect(cards.locator('[data-connection-summary]')).toHaveCount(6);
  const text = (await cards.allTextContents()).join('\n');
  expect(text, 'the disagree card carries the match count').toMatch(/1 of 2 readings match the usual pattern/);
  expect(text, 'a quiet card reads the UI-35 line').toMatch(/Trigger not present/);
  expect(text, 'the RBA card reads the UI-37 line').toMatch(/Pass-through pending/);
  expect(text, 'an unreadable card reads the UI-33 line').toMatch(/Not enough fresh data to read/);
  // UI-33 retirement: the v2 state words are gone from the whole section.
  expect(text).not.toMatch(/Partly showing|Not showing/);
  expect(text).not.toMatch(/\bShowing\b/);
});

/* ------------------------------------------------------------------ *
 * U-09 — Gold/silver balance visual (UI-39..UI-45)
 * ------------------------------------------------------------------ */

test('U-09 balance visual is legible at 360px in LTR and RTL', async ({ page }) => {
  // v3-merge re-pin (2026-10-19): the merged card renders the owner's v7
  // BalanceScale machinery PER METAL (UI-45 — gold AND silver), carrying
  // the v3 honesty contract on top: the readable-count line (UI-39.5),
  // the level beam + refusal wording when the conditions are too sparse
  // (UI-40), and the metal's own copy. The old pins (one circle per
  // token, [data-token-*]) described the retired rebuild-only drawing.
  await page.setViewportSize({ width: 360, height: 900 });
  // One REAL document load per locale: the persisted `currena:locale` key is
  // re-read at boot (src/lib/locale.ts), while addInitScript cannot be
  // re-armed per iteration on the same page — a same-URL hash goto never
  // re-runs it (measured: the fa iteration kept rendering EN text).
  await gotoInsights(page);
  for (const locale of ['en', 'fa'] as const) {
    await page.evaluate((l) => window.localStorage.setItem('currena:locale', l), locale);
    await page.reload();
    await page.waitForSelector('#insights-hero', { state: 'visible' });
    await page.waitForSelector('article[data-status]', { state: 'visible' });
    // UI-45: each metal gets its own balance inside the merged card.
    const gold = page.locator('[data-balance="gold"]');
    const silver = page.locator('[data-balance="silver"]');
    await expect(gold).toBeVisible();
    await expect(silver).toBeVisible();
    // The beam + its bar render; the readable-count line speaks in the
    // locale's own words (fa: «… مورد از … شرط قابل خواندن»).
    await expect(gold.locator('[data-balance-beam]')).toBeVisible();
    await expect(gold.locator('[data-balance-beam-bar]')).toBeVisible();
    await expect(gold.locator('[data-balance-readable-line]')).toContainText(
      locale === 'en' ? /\d+ of \d+ conditions readable/ : /\S+ مورد از \S+ شرط قابل خواندن/,
    );
    await expect(silver.locator('[data-balance-readable-line]')).toContainText(
      locale === 'en' ? /\d+ of \d+ conditions readable/ : /\S+ مورد از \S+ شرط قابل خواندن/,
    );
    // The old grouped lists never come back (UI_SPEC §9 owner decision).
    const mergedCard = page.locator('[data-signal-card="merged"]');
    await expect(mergedCard).not.toContainText(locale === 'en' ? /Works against|Sitting neutral/ : /عوامل مخالف|بی‌طرف می‌ماند/);
    // UI-43: nothing inside either balance clips the 360px viewport.
    for (const box of [gold, silver]) {
      const clipped = await box.evaluate((el) => {
        const iw = window.innerWidth;
        const bad: string[] = [];
        for (const child of el.querySelectorAll('*')) {
          const r = child.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.left < -1 || r.right > iw + 1) {
            bad.push(`${child.tagName}: ${Math.round(r.left)}..${Math.round(r.right)} vs ${iw}`);
          }
        }
        return bad;
      });
      expect(clipped, `no balance element may clip at 360px (${locale})`).toEqual([]);
    }
  }
});

test('U-09a fewer than 3 readable conditions keeps the beam level', async ({ page }) => {
  // v3-merge re-pin (2026-10-19): UI-40 on the merged BalanceScale — the
  // fixture server keeps serving the full board, so this test serves the
  // BUILDER'S low-readable variant (real yields → stale, breakeven → held
  // check-pending, on top of the base snapshot's held STLFSI + stale dollar
  // basket + unavailable China PMI). The v7 driver set excludes the price
  // footing (never a driver), so gold reads 0 of 4 and silver 0 of 5 —
  // both beams LEVEL with the honest readable-count line and the refusal
  // wording, never a direction from too-sparse data. (The readable-1
  // sparse case — the explicit "Not enough readable conditions to weigh"
  // line — is unit-pinned in balance.test.tsx §9.)
  await page.route('**/api/insights', async (route) => {
    const body = readFileSync(path.join(HERE, 'fixtures', 'snapshot-low-readable.json'), 'utf8');
    await route.fulfill({ status: 200, contentType: 'application/json', body });
  });
  await gotoInsights(page);
  const gold = page.locator('[data-balance="gold"]');
  const silver = page.locator('[data-balance="silver"]');
  await expect(gold.locator('[data-balance-readable-line]')).toContainText(/0 of 4 conditions readable/);
  await expect(silver.locator('[data-balance-readable-line]')).toContainText(/0 of 5 conditions readable/);
  const goldTilt = await gold.locator('[data-balance-beam]').evaluate((el) => el.getAttribute('data-tilt'));
  expect(goldTilt, 'the gold beam must stay level (data-tilt 0)').toBe('0');
  const silverTilt = await silver.locator('[data-balance-beam]').evaluate((el) => el.getAttribute('data-tilt'));
  expect(silverTilt, 'unreadable conditions never tilt the silver beam').toBe('0');
  // No directional verdict word from too-sparse data (UI-40: the gauge
  // hides and the assessment refuses direction).
  await expect(gold).not.toContainText(/Leaning for gold|Leaning against gold/);
  await expect(silver).not.toContainText(/Leaning for silver|Leaning against silver/);
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
    // [data-balance-beam] (PH6-B, UI-42): the gold/silver balance beam's
    // tilt rides a CSS transition that motion-reduce:transition-none must
    // switch off under reduced motion — the beam is always mounted (the
    // signals card opens by default), so this loop now holds it honest.
    const segs = document.querySelectorAll('.verdict-meter-seg');
    if (segs.length === 0) offenders.push('.verdict-meter-seg: no element mounted — the hero meter must exist');
    const beams = document.querySelectorAll('[data-balance-beam]');
    if (beams.length === 0) offenders.push('[data-balance-beam]: no element mounted — both balances must render');
    for (const sel of ['.verdict-meter-seg', '.connection-arrow', '[data-balance-beam]']) {
      for (const el of document.querySelectorAll(sel)) {
        const cs = getComputedStyle(el);
        // v3-merge note: the merged BalanceScale beam rides a rAF timeline
        // whose reduced-motion path LANDS at the verdict angle immediately
        // (no frames) and computes `transition all 0s` — motionless. The
        // check is DURATION-based: a non-0s transition would animate; a
        // property name like `all` with 0s duration never does.
        if (cs.transitionProperty !== 'none' && cs.transitionDuration !== '0s') {
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

test('U-11 stock table: the restored full lens columns + L2-01 words + the note', async ({ page }) => {
  // OWNER DIRECTIVE (2026-10-20, post-v3-merge): "keep the new data… in the
  // PREVIOUS UI" — the PREVIOUS full table (main@1e39a24) is restored: the
  // round-46/47 lens columns (1 week · 1 month · 1 year beside Today and
  // 3 months) and the Trend column (Step-1 F2: the trend word AND arrow come
  // from the same 3-month number the row shows) return; the v3 UI-27 column
  // cut is retired. The lens data never left the payload (the v3 merge kept
  // it for the exports). ONE v3 honesty addition is KEPT: UI-27's
  // local-currency note renders with the table.
  await page.setViewportSize({ width: 1200, height: 900 });
  await gotoInsights(page);
  await waitForMarketsBoard(page);

  const section = page.locator('#insights-markets');
  // Open the full table (disclosed by default-closed per §6.3).
  await section.getByRole('button', { name: /Show full table/ }).click();
  const table = page.locator('#insights-markets-table');
  await expect(table).toBeVisible();

  // UI-27 (kept through the restore): the table's ONE header note — returns
  // are in each market's own currency.
  await expect(table.getByText(/Returns in each market.s local currency/)).toBeVisible();

  // The restored column set — Market | Today | 1 week | 1 month | 3 months |
  // 1 year | From 52-week high | Trend | Status | Last close.
  const headerText = (await table.locator('thead').textContent()) ?? '';
  for (const header of ['Market', 'Today', '1 week', '1 month', '3 months', '1 year', 'From 52-week high', 'Trend', 'Status', 'Last close']) {
    expect(headerText, `the restored table must keep its column "${header}"`).toContain(header);
  }

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

  // v3 UI-47: the strip shows the NEXT FIVE events (was three), each with
  // its Gregorian date on the date span's title attribute ("Gregorian date:
  // YYYY-MM-DD") and — when the event carries a mapped tz — its zone label.
  const strip = section.locator('ul > li');
  await expect(strip).toHaveCount(5);
  const todayIso = new Date().toISOString().slice(0, 10);
  const tzLabels = [/Sydney time/, /US Eastern/, /Frankfurt time/];
  let tzSeen = 0;
  for (const item of await strip.all()) {
    const title = (await item.locator('[title]').first().getAttribute('title')) ?? '';
    const iso = title.match(/(\d{4}-\d{2}-\d{2})/)?.[1];
    expect(iso, 'strip items carry their Gregorian date').toBeTruthy();
    // ISO dates compare lexically — a past event would fail this.
    expect(iso !== undefined && iso >= todayIso, `no past event may render in the strip (${iso} < ${todayIso})`).toBe(true);
    const text = (await item.textContent()) ?? '';
    if (tzLabels.some((re) => re.test(text))) tzSeen += 1;
  }
  // The fixture's five strip events all carry mapped zones (Sydney /
  // New York / Frankfurt) — every strip item shows its zone label.
  expect(tzSeen, 'every mapped-zone strip item renders its tz label').toBe(5);

  // Expand the full calendar: all seven fixture events, all Today/Tomorrow/N days away.
  await section.getByRole('button', { name: /Full calendar/ }).click();
  const fullList = section.locator('div.mt-2 ul li');
  await expect(fullList).toHaveCount(7);
  for (const row of await fullList.all()) {
    const text = (await row.textContent()) ?? '';
    expect(text, 'full-list rows must show a future day-count').toMatch(/(Today|Tomorrow|\d+ days away)/);
    expect(text).not.toMatch(/[-−]\d+ days away/);
  }
});

/* ------------------------------------------------------------------ *
 * UI-50 + UI-49 (v3 §10, PH6-C) — the data-health chip and the About
 * rework. The fixture board carries 2 stale readings (dollar-basket,
 * au-household-debt-arrears) and 2 can't-tell readings (stress-stlfsi
 * held, china-pmi unavailable), so the chip's honest worst-wins state is
 * "2 unavailable" with the stale count in its title.
 * ------------------------------------------------------------------ */

test('UI-50 the data-health chip speaks the honest counts and opens About', async ({ page }) => {
  await gotoInsights(page);
  const chip = page.locator('[data-health-kind]');
  await expect(chip).toBeVisible();
  // Worst wins: the unavailable group outranks the stale one.
  await expect(chip).toHaveAttribute('data-health-kind', 'unavailable');
  await expect(chip).toContainText('2 unavailable');
  // Both counts honestly: the title carries the stale count beside the
  // visible unavailable one (the same two numbers About lists).
  const title = (await chip.getAttribute('title')) ?? '';
  expect(title).toMatch(/2 stale, 2 unavailable/);
  // Word + icon, never colour alone: one aria-hidden state shape.
  await expect(chip.locator('svg')).toHaveCount(1);
  // Static per snapshot: no aria-live on the chip.
  expect(await chip.getAttribute('aria-live')).toBeNull();
  // ≥44px touch target (UI-53) beside the "Data as of" line.
  const height = (await chip.boundingBox())?.height ?? 0;
  expect(height).toBeGreaterThanOrEqual(44);
  // Clicking it expands + scrolls to the About section (expandToken).
  await chip.click();
  await expect(page.locator('#insights-about-body')).toBeVisible();
});

test('UI-49 About rework: source table + card lists + rule version + contact', async ({ page }) => {
  await gotoInsights(page);
  // Open via the chip — the same path a reader takes.
  await page.locator('[data-health-kind]').click();
  const about = page.locator('#insights-about');
  await expect(page.locator('#insights-about-body')).toBeVisible();

  // (c) The stale + can't-tell card lists from the page's OWN readings —
  // every listed card links to its card (44px tappable chips).
  await expect(about.locator('[data-about-stale-cards] > li')).toHaveCount(2);
  await expect(about.locator('[data-about-unavailable-cards] > li')).toHaveCount(2);

  // (a) The per-source table — one row per provider (11 in the sidecar:
  // abs, alternative-me, derived, ecb, frankfurter, fred, gold-api,
  // manual, rba, shiller, world-bank), the five columns, level badges with
  // their tooltips, and the kill-switch words. Loaded lazily on expand —
  // expect() waits for the sidecar chunk to resolve.
  await expect(about.locator('[data-about-sources] tbody tr')).toHaveCount(11);
  const headerText = (await about.locator('[data-about-sources] thead').textContent()) ?? '';
  for (const col of ['Source', 'Attribution', 'Licence', 'Level', 'Enabled']) {
    expect(headerText, `the About table must keep its "${col}" column`).toContain(col);
  }
  // The mirror rows render display names + terms links (M-1/M-9).
  const bodyText = (await about.locator('[data-about-sources] tbody').textContent()) ?? '';
  expect(bodyText).toContain('Reserve Bank of Australia');
  expect(bodyText).toContain('FRED, Federal Reserve Bank of St. Louis');
  // The M-6 kill switch is honest: the disabled shiller feed reads Off,
  // the partly-disabled derived feed reads "n of m switched off".
  expect(bodyText).toMatch(/Off/);
  expect(bodyText).toMatch(/\d+ of \d+ switched off/);
  // The level badge carries its ladder tooltip (L0..L3 explanation).
  const badge = about.locator('[data-about-sources] tbody span[title]').first();
  expect((await badge.getAttribute('title')) ?? '').toMatch(/^L\d/);

  // (d) Rule version + the PLAIN repository path (no invented hosted URL).
  const ruleLine = about.locator('[data-about-rule-version]');
  await expect(ruleLine).toContainText('Rule version 2');
  await expect(ruleLine).toContainText('packages/insights/src/ruleVersion.ts');

  // (f) M-7: the contact line names the owner's public contact surface.
  await expect(about.locator('[data-about-contact]')).toContainText('https://github.com/assadigit/Currena');

  // The M-7 URL is a real link (data owners can click it from the copy).
  await expect(about.locator('[data-about-contact] a')).toHaveAttribute('href', 'https://github.com/assadigit/Currena');
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
  // Phase 9: the export lives on the REAL Worker (RULES.md M-3) — the
  // config boots a local wrangler-dev instance on :8799 for this test
  // (CURRENA_WORKER_URL overridable). It refuses anonymous callers before
  // any KV read: 401 with the owner token secret set (the repo's
  // gitignored .dev.vars), 403 owner_disabled without it — both designed.
  // The fixture server keeps 404ing the path on purpose; this test
  // deliberately bypasses it.
  const workerUrl = process.env.CURRENA_WORKER_URL ?? 'http://localhost:8799';
  const response = await request.get(`${workerUrl}/api/insights/export`);
  expect([401, 403], 'the export must refuse anonymous callers').toContain(response.status());
});

/* ------------------------------------------------------------------ *
 * U-15 (2026-10-21 owner round) — the prices board's period switch:
 * the SAME lenses the world map speaks, one selection, every movement
 * surface on every card follows. 2026-10-27 owner round ("add five year
 * and 3 months to all view points"): the switch grows to SIX lenses
 * (Today | 1 week | 1 month | 3 months | 1 year | 5 years).
 * ------------------------------------------------------------------ */

test('U-15 prices: the board\'s six-lens switch re-measures every card (trend, chart, word, briefing)', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 900 });
  await gotoInsights(page);

  const section = page.locator('#insights-prices');
  // The switch renders centred above the grid, speaking the map's lenses.
  const grp = section.locator('[role="radiogroup"]');
  await expect(grp).toBeVisible();
  await expect(grp.getByRole('radio')).toHaveCount(6);
  await expect(grp.getByRole('radio', { name: 'Today' })).toBeVisible();
  await expect(grp.getByRole('radio', { name: '1 year' })).toBeVisible();
  // The two new lenses (2026-10-27) speak the same pill family.
  await expect(grp.getByRole('radio', { name: '3 months' })).toBeVisible();
  await expect(grp.getByRole('radio', { name: '5 years' })).toBeVisible();
  // The classic lens opens the board (the card's established primary story).
  await expect(grp.getByRole('radio', { name: '1 week' })).toHaveAttribute('aria-checked', 'true');

  // The 1-week lens: the trend row names the seven-day window and every
  // card carries a sparkline (its aria names the asset + window) + a
  // trend word.
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Past 7 days');
  await expect(section.locator('#insights-card-gold-usd [aria-label*="price movement"]')).toBeVisible();

  // Switch to 1 month: the row label, the briefing's period phrase and the
  // daily-change row all follow the SAME window.
  await grp.getByRole('radio', { name: '1 month' }).click();
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Past 30 days');
  await expect(section.locator('#insights-card-gold-usd')).toContainText(/over the past 30 days/);
  // The daily change stays as its own supporting row outside the Today lens.
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Daily change');

  // Switch to 1 year.
  await grp.getByRole('radio', { name: '1 year' }).click();
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Past 1 year');
  await expect(section.locator('#insights-card-gold-usd')).toContainText(/over the past year/);

  // 2026-10-27: switch to 3 months — the row label and the briefing's
  // period phrase follow the 90-day window (fixture series are dense
  // dailies, so the window anchors exactly).
  await grp.getByRole('radio', { name: '3 months' }).click();
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Past 3 months');
  await expect(section.locator('#insights-card-gold-usd')).toContainText(/over the past 3 months/);

  // 2026-10-27: switch to 5 years — the 1,826-day window anchors on the
  // deep fixture history (1,901 dense dailies ≈ 5.2 years).
  await grp.getByRole('radio', { name: '5 years' }).click();
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Past 5 years');
  await expect(section.locator('#insights-card-gold-usd')).toContainText(/over the past 5 years/);

  // Switch to Today: the row becomes the daily story with its explicit
  // basis, the sparkline and the trend word retire (a one-day window has
  // no path), and the separate daily-change row hides (never twice).
  await grp.getByRole('radio', { name: 'Today' }).click();
  await expect(section.locator('#insights-card-gold-usd')).toContainText('Today');
  await expect(section.locator('#insights-card-gold-usd')).toContainText('vs the previous stored close');
  await expect(section.locator('#insights-card-gold-usd').locator('[aria-label*="price movement"]')).toHaveCount(0);

  // Arrow keys rove focus + selection (the ARIA radiogroup pattern).
  await grp.getByRole('radio', { name: 'Today' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(grp.getByRole('radio', { name: '1 week' })).toBeFocused();
  await expect(grp.getByRole('radio', { name: '1 week' })).toHaveAttribute('aria-checked', 'true');
});
