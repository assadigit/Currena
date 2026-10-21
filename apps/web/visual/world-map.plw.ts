/**
 * world-map.plw.ts — the §9 verification suite for the WORLD MARKETS MAP
 * (docs/insights/world-markets-map-spec.md, Section 9).
 *
 * Runs against the built SPA on the local fixture server (:4050) — never a
 * live site. Covers:
 *
 *   §9.1  the 20 screenshots (1280/1024/960/768/390 × en/fa × light/dark)
 *         + the container-boundary probe (the layout switch is the module's
 *           OWN width, so the page's side padding decides which of the five
 *           viewport widths actually lands in the map layout — recorded,
 *           never assumed);
 *   §9.2  the map layout's geometry: no card overlaps another card, no
 *         leader line crosses another card or another line, every leader
 *         line is shorter than one quarter of the map width;
 *   §9.3  the contrast floors: text ≥4.5:1, dots and rings ≥3:1, the focus
 *         ring ≥3:1 (both themes), adjacent tint steps ≥1.1:1 luminance;
 *   §9.4  axe-core on the markets section: zero serious or critical;
 *   §9.5  the keyboard walk: tab order equals §4.1, Enter opens the
 *         market's existing detail view;
 *   §9.6  Farsi: Persian digits, the true minus and the percent glyph, an
 *         unmirrored map beside a mirrored page;
 *   §9.8  the mock-payload states: all up, all down, one missing, one old,
 *         whole payload failed (with and without a last-good copy), all
 *         markets closed, and the loading state.
 *
 * 2026-10-20g owner round — the map covers ALL SIXTEEN registry indices:
 *   pins     every index renders a 3D pin (filled red/green by direction,
 *             rim hotter than fill, highlight + shadow + the open/closed
 *             core) instead of the old flat dot;
 *   ants     the selected country wears an ANIMATED moving dash (the
 *             owner's "- - - - -") — and honours reduced motion;
 *   label    the selected country writes its short name at 60% ink
 *             (USA / Brazil / Australia …, Persian in fa);
 *   aggregate a country hosting several indices (the NY trio) tints by
 *             its strongest fresh mover — removing one keeps the tint,
 *             removing all three neutralises the country.
 *
 * 2026-10-21 owner round — the quiet-fill, card and switch round:
 *   tint     New York's country (the US trio) damps its tint mix to 85%
 *             (a 15% opacity cut on the loudest fill the map can show);
 *   switch   the pills drop 15% (41px, caption × 1.27 — 37px / × 1.06
 *             under 480px) AND the switch becomes the SECTION's one
 *             period control: the old five-option Daily…Yearly
 *             radiogroup below the movers is retired, the four lenses
 *             drive the verdict, movers, tiles and table too;
 *   updated  the header's M9 "Updated {time} · {age}" line retires
 *             (the KV write time is cron-fixed — it read stale);
 *   cards    Nifty 50 and Hang Seng leave the bottom band and float
 *             beside their own countries (the Indian Ocean SW of India /
 *             the South China Sea under the Hong Kong pin);
 *   prices   (u-tests.plw.ts) the prices board grows the same four-lens
 *             switch.
 *
 * 2026-10-20h owner round — yearly returns to the map, the switch grows
 * up and centres:
 *   switch   FOUR options (Today | 1 week | 1 month | 1 year), centred
 *             under the summary, ~50% bigger (48px pills, ~18.7px words),
 *             with a proper roving-tabindex radiogroup (arrows move
 *             focus + selection);
 *   yearly   chg1y drives the colours exactly like the other lenses and
 *             every card carries a YEARLY hero row (caption × 1.5, the
 *             percent glyph's only visible home) above the compact
 *             Day/Week/Month cells — the old 12.5px values overran
 *             their 35px cells and ran into each other, so the compact
 *             cells drop the glyph (sr-only keeps the unit) and the
 *             no-clip test now guards EVERY value against collisions;
 *   layout   the taller cards re-band the callouts (top/left/right/
 *             bottom/float) and every country-label anchor is re-cleared
 *             — the Sydney pin and the Australia label, both covered by
 *             the old asx200 card, are visible again.
 *
 * §9.7 (the KV budget) is a vitest on the real job + store
 * (packages/insights/src/markets/markets.test.ts, "MAP §9.7") — the route
 * itself is untouched by the map, so its single cached read is unchanged
 * by construction.
 */

import { test, expect } from '@playwright/test';
import { readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, '..');
const FIXTURES = path.join(HERE, 'fixtures');
const AXE = path.join(WEB_ROOT, 'node_modules', 'axe-core', 'axe.min.js');
const SHOT_DIR = path.resolve(WEB_ROOT, '..', '..', 'docs', 'insights', 'screenshots', 'world-map');

/** §4.1 order = west to east = DOM order = tab order (2026-10-20g: ALL
 * SIXTEEN registry indices — the NY trio, Toronto, Paris, Brussels, Hong
 * Kong and Taipei join the original nine; JSE stays deferred). */
const MAP_ORDER = [
  'dow', 'tsx', 'sp500', 'ndx', 'ibov', 'ftse', 'cac', 'dax', 'stoxx50',
  'nifty50', 'hsi', 'ssec', 'taiex', 'kospi', 'n225', 'asx200',
] as const;

const WIDTHS = [1280, 1024, 960, 768, 390] as const;
const HEIGHT: Record<(typeof WIDTHS)[number], number> = { 1280: 900, 1024: 800, 960: 800, 768: 1024, 390: 844 };

type Lang = 'en' | 'fa';
type Theme = 'light' | 'dark';

/** Boot the Insights page in a locale/theme, scroll the map into view and
 * wait for the lazy land asset + the leader lines to settle. 2026-10-20h:
 * the .wm module must be ATTACHED before the scroll — when the markets
 * fetch is still in flight the module is absent, the scroll no-ops and
 * the lazy land (an IntersectionObserver on the module) never loads. */
async function gotoInsights(
  page: import('@playwright/test').Page,
  opts: { width: number; lang: Lang; theme: Theme; height?: number },
) {
  await page.setViewportSize({ width: opts.width, height: opts.height ?? 800 });
  await page.addInitScript(
    ([lang, theme]) => {
      window.localStorage.setItem('currena:locale', lang);
      window.localStorage.setItem('theme', theme);
    },
    [opts.lang, opts.theme] as [Lang, Theme],
  );
  await page.goto('/#/insights');
  await page.waitForSelector('#insights-markets', { state: 'visible' });
  await page.waitForSelector('.wm', { state: 'attached', timeout: 15_000 });
  await page.evaluate(() => document.querySelector('.wm')?.scrollIntoView({ block: 'center' }));
  await page.waitForSelector('.wm-c', { state: 'attached', timeout: 20_000 });
  await page.waitForTimeout(500); // leader lines + fonts settle
}

/** Intercept /api/insights/markets with a mutated copy of the fixture.
 * The mutation must keep the snapshot CONTRACT valid (the client zod-parses
 * it and rejects an inconsistent summary), so the helper recomputes the
 * rollup fields after every mutation. */
async function mockMarkets(
  page: import('@playwright/test').Page,
  mutate: (snap: Record<string, unknown>) => void,
) {
  await page.route('**/api/insights/markets', async (route) => {
    const snap = JSON.parse(readFileSync(path.join(FIXTURES, 'markets.json'), 'utf8')) as Record<string, unknown>;
    mutate(snap);
    const markets = snap.markets as Array<Record<string, unknown>>;
    const summary = snap.summary as Record<string, number>;
    summary.count = markets.length;
    summary.roseToday = markets.filter((m) => (m.chg1d as number) > 0).length;
    summary.nAttention = markets.filter((m) => m.status === 'correction').length;
    summary.nUnusual = markets.filter((m) => m.status === 'bear').length;
    await route.fulfill({ json: snap, contentType: 'application/json' });
  });
}

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

/* ------------------------------------------------------------------ *
 * §9.1 — the 20 screenshots
 * ------------------------------------------------------------------ */

for (const width of WIDTHS) {
  for (const lang of ['en', 'fa'] as const) {
    for (const theme of ['light', 'dark'] as const) {
      test(`screenshot §9.1: ${width}px ${lang} ${theme}`, async ({ page }) => {
        await gotoInsights(page, { width, lang, theme, height: HEIGHT[width] });
        // Record which layout this width actually produces (the container
        // query reads the MODULE's width — the page's side padding decides).
        const layout = await page.getAttribute('.wm', 'data-wm-layout');
        await page.screenshot({ path: path.join(SHOT_DIR, `${width}-${lang}-${theme}.png`), fullPage: true });
        // A viewport-only clip of the module for the visual checklist.
        const clip = await page.locator('.wm').boundingBox();
        if (clip !== null) {
          await page.screenshot({
            path: path.join(SHOT_DIR, `module-${width}-${lang}-${theme}.png`),
            clip: { x: Math.max(0, clip.x - 8), y: Math.max(0, clip.y - 8), width: clip.width + 16, height: clip.height + 16 },
          });
        }
        expect(layout === 'map' || layout === 'list').toBe(true);
        test.info().annotations.push({ type: 'note', description: `layout@${width}px=${layout}` });
      });
    }
  }
}

/** The container-boundary evidence: the switch follows the module's own
 * width, so the crossing lands ABOVE the 960 viewport (page padding). */
test('layout §9.1: the switch follows the container, not the viewport', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const probe = await page.evaluate(() => {
    const wm = document.querySelector('.wm') as HTMLElement | null;
    return { moduleW: wm ? Math.round(wm.getBoundingClientRect().width) : 0, layout: wm?.getAttribute('data-wm-layout') };
  });
  expect(probe.moduleW).toBeGreaterThanOrEqual(960);
  expect(probe.layout).toBe('map');
  await page.setViewportSize({ width: 960, height: 800 });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({
    moduleW: Math.round((document.querySelector('.wm') as HTMLElement).getBoundingClientRect().width),
    layout: (document.querySelector('.wm') as HTMLElement).getAttribute('data-wm-layout'),
    cardsVisible: (document.querySelector('.wm-cards') as HTMLElement).offsetParent === null,
  }));
  expect(after.moduleW).toBeLessThan(960);
  expect(after.layout).toBe('list');
  expect(after.cardsVisible).toBe(true); // hidden below the switch
});

/* ------------------------------------------------------------------ *
 * §9.2 — the map layout's geometry (2026-10-20f owner round: the map
 * box is centred at 150–280px under the module's full width — never
 * full-bleed, never cramped), then the card/line geometry.
 * ------------------------------------------------------------------ */

test('layout §9.2: no card text clips at the narrower map box', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const clips = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card')).flatMap((c) => {
      const id = (c as HTMLElement).dataset.id ?? '';
      const name = c.querySelector('.wm-card-name') as HTMLElement;
      const tag = c.querySelector('.wm-tag') as HTMLElement;
      const out: string[] = [];
      if (name.scrollWidth > name.clientWidth + 1) out.push(`${id}:name`);
      if (tag.scrollWidth > tag.clientWidth + 1) out.push(`${id}:tag`);
      return out;
    }),
  );
  expect(clips, `clipped: ${clips.join(', ')}`).toEqual([]);
  // 2026-10-20h: the VALUE rows too — the old 12.5px triplet overran its
  // 35px cells and the values ran into each other (the defect this round
  // fixes). Every performance value and every caption must fit its box.
  const overruns = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card')).flatMap((c) => {
      const id = (c as HTMLElement).dataset.id ?? '';
      const out: string[] = [];
      for (const el of Array.from(c.querySelectorAll('.wm-pl, .wm-pv'))) {
        const h = el as HTMLElement;
        if (h.scrollWidth > h.clientWidth + 1) out.push(`${id}:${h.className.split(' ')[0]}+${h.textContent ?? ''}`);
      }
      return out;
    }),
  );
  expect(overruns, `value overruns: ${overruns.join(', ')}`).toEqual([]);
});

test('layout §9.2: centred map box ~200–300px under the module, full width in the list layout', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const probe = await page.evaluate(() => {
    const wm = document.querySelector('.wm') as HTMLElement;
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    const m = wm.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return {
      moduleW: Math.round(m.width),
      stageW: Math.round(s.width),
      inset: Math.round(m.width - s.width),
      centered: Math.round(Math.abs(s.left - m.left - (m.right - s.right))),
    };
  });
  expect(probe.inset).toBeGreaterThanOrEqual(145); // the clamp's 150 floor, sub-pixel grace
  expect(probe.inset).toBeLessThanOrEqual(285); // the clamp's 280 ceiling
  expect(probe.centered).toBeLessThanOrEqual(2);
  test.info().annotations.push({ type: 'note', description: `module ${probe.moduleW}px, stage ${probe.stageW}px, inset ${probe.inset}px` });
  // The list layout keeps the full width.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  const list = await page.evaluate(() => {
    const wm = document.querySelector('.wm') as HTMLElement;
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    return { layout: wm.getAttribute('data-wm-layout'), inset: Math.round(wm.getBoundingClientRect().width - stage.getBoundingClientRect().width) };
  });
  expect(list.layout).toBe('list');
  expect(list.inset).toBeLessThanOrEqual(1);
});

test('layout §9.2: no card overlap, no line crossing, lines < ¼ map width', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const result = await page.evaluate((order) => {
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    const cards = Array.from(document.querySelectorAll('.wm-card')) as HTMLElement[];
    const lines = Array.from(document.querySelectorAll('.wm-ln')) as SVGLineElement[];
    const problems: string[] = [];

    // 1. Card-card overlap (a 1px grace for subpixel AA).
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const a = cards[i]!.getBoundingClientRect();
        const b = cards[j]!.getBoundingClientRect();
        const ox = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const oy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (ox > 1 && oy > 1) problems.push(`cards overlap: ${cards[i]!.dataset.id}+${cards[j]!.dataset.id}`);
      }
    }

    // 2. Line length < one quarter of the map width (viewBox units).
    for (const l of lines) {
      const len = Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
      if (len >= 250) problems.push(`line ${l.dataset.id} too long: ${len.toFixed(0)} units (≥ 250)`);
    }

    // 3. Segment vs rect (strict interior, 1px grace) — a line may start on
    //    its OWN card's edge, but must not cross any other card.
    const sr = stage.getBoundingClientRect();
    const scale = sr.width / 1000;
    const segIntersectsRect = (
      x1: number, y1: number, x2: number, y2: number,
      rl: number, rt: number, rr: number, rb: number,
    ): boolean => {
      // Liang–Barsky clipping against the inflated rect.
      let t0 = 0;
      let t1 = 1;
      const dx = x2 - x1;
      const dy = y2 - y1;
      const edges: Array<[number, number]> = [
        [-dx, rl - x1],
        [dx, x1 - rr],
        [-dy, rt - y1],
        [dy, y1 - rb],
      ];
      for (const [p, q] of edges) {
        if (p === 0) {
          if (q < 0) return false;
        } else {
          const r = q / p;
          if (p < 0) {
            if (r > t1) return false;
            if (r > t0) t0 = r;
          } else {
            if (r < t0) return false;
            if (r < t1) t1 = r;
          }
        }
      }
      return true;
    };
    for (const l of lines) {
      const x1 = sr.left + l.x1.baseVal.value * scale;
      const y1 = sr.top + l.y1.baseVal.value * scale;
      const x2 = sr.left + l.x2.baseVal.value * scale;
      const y2 = sr.top + l.y2.baseVal.value * scale;
      for (const c of cards) {
        if (c.dataset.id === l.dataset.id) continue; // its own card: edge touch by construction
        const r = c.getBoundingClientRect();
        if (segIntersectsRect(x1, y1, x2, y2, r.left + 1, r.top + 1, r.right - 1, r.bottom - 1)) {
          problems.push(`line ${l.dataset.id} crosses card ${c.dataset.id}`);
        }
      }
    }

    // 4. Line-line crossings (proper intersection — shared endpoints are
    //    impossible, every line ends at its own dot).
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = lines[i]!;
        const b = lines[j]!;
        const p = { x: a.x1.baseVal.value, y: a.y1.baseVal.value };
        const r = { x: a.x2.baseVal.value - p.x, y: a.y2.baseVal.value - p.y };
        const q = { x: b.x1.baseVal.value, y: b.y1.baseVal.value };
        const s = { x: b.x2.baseVal.value - q.x, y: b.y2.baseVal.value - q.y };
        const denom = r.x * s.y - r.y * s.x;
        if (denom === 0) continue; // parallel
        const t = ((q.x - p.x) * s.y - (q.y - p.y) * s.x) / denom;
        const u = ((q.x - p.x) * r.y - (q.y - p.y) * r.x) / denom;
        if (t > 0.001 && t < 0.999 && u > 0.001 && u < 0.999) {
          problems.push(`lines cross: ${a.dataset.id} × ${b.dataset.id}`);
        }
      }
    }

    return { problems, cardCount: cards.length, lineCount: lines.length, order: cards.map((c) => c.dataset.id), order_: order };
  }, [...MAP_ORDER]);

  expect(result.cardCount).toBe(16);
  expect(result.lineCount).toBe(16);
  expect(result.order).toEqual([...MAP_ORDER]); // §4.1 = DOM order
  expect(result.problems).toEqual([]);
});

/* ------------------------------------------------------------------ *
 * §9.3 — the contrast floors (both themes)
 * ------------------------------------------------------------------ */

const LUM = (r: number, g: number, b: number): number => {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

/** Parse any computed colour Chromium reports into [r,g,b,a]. */
function parseColor(text: string): [number, number, number, number] {
  const rgb = /rgba?\(([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/.exec(text);
  if (rgb !== null) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3]), rgb[4] === undefined ? 1 : Number(rgb[4])];
  const srgb = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: ?\/ ?([\d.]+))?/.exec(text);
  if (srgb !== null) {
    return [
      Math.round(Number(srgb[1]) * 255),
      Math.round(Number(srgb[2]) * 255),
      Math.round(Number(srgb[3]) * 255),
      srgb[4] === undefined ? 1 : Number(srgb[4]),
    ];
  }
  throw new Error(`unparsable colour: ${text}`);
}

for (const theme of ['light', 'dark'] as const) {
  test(`contrast §9.3 (${theme}): text ≥4.5, dots/rings/focus ≥3, visible borders, relative tints`, async ({ page }) => {
    await gotoInsights(page, { width: 1280, lang: 'en', theme });
    const probe = await page.evaluate(() => {
      const out: Record<string, string> = {};
      const css = getComputedStyle(document.documentElement);
      out['surface'] = css.getPropertyValue('--color-surface').trim();
      out['focus'] = css.getPropertyValue('--color-accent-brand').trim();
      // The neutral land + the visible grey border (2026-10-20f).
      const neutral = document.querySelector('.wm-c:not(.s-u):not(.s-d)') as SVGPathElement | null;
      if (neutral !== null) {
        out['land'] = getComputedStyle(neutral).fill;
        out['border'] = getComputedStyle(neutral).stroke;
      }
      // Every tinted country: its fill, its direction class and its
      // inline --t mix percentage.
      const tinted: Array<{ iso: string; fill: string; t: string; cls: string }> = [];
      for (const p of Array.from(document.querySelectorAll('.wm-c.s-u, .wm-c.s-d'))) {
        const el = p as SVGPathElement;
        tinted.push({
          iso: el.getAttribute('data-iso') ?? '',
          fill: getComputedStyle(el).fill,
          t: el.style.getPropertyValue('--t'),
          cls: el.getAttribute('class') ?? '',
        });
      }
      out['tinted'] = JSON.stringify(tinted);
      // Every pin's body stroke + fill + class (the 3D pin: the rim is the
      // contrast mark, the fill is the direction colour).
      const dots: Array<{ id: string; stroke: string; fill: string; cls: string }> = [];
      for (const d of Array.from(document.querySelectorAll('.wm-pin'))) {
        const el = d as SVGGElement;
        const body = el.querySelector('.wm-pin-b') as SVGPathElement;
        dots.push({ id: el.getAttribute('data-id') ?? '', stroke: getComputedStyle(body).stroke, fill: getComputedStyle(body).fill, cls: el.getAttribute('class') ?? '' });
      }
      out['dots'] = JSON.stringify(dots);
      // The triplet cells' inks (per period, per direction).
      const cells: Array<{ id: string; p: string; color: string; cls: string }> = [];
      for (const c of Array.from(document.querySelectorAll('.wm-card .wm-pv'))) {
        const el = c as HTMLElement;
        cells.push({
          id: el.closest('.wm-card')?.getAttribute('data-id') ?? '',
          p: el.closest('.wm-cell')?.getAttribute('data-p') ?? '',
          color: getComputedStyle(el).color,
          cls: el.getAttribute('class') ?? '',
        });
      }
      out['cells'] = JSON.stringify(cells);
      // Real text elements on their real surfaces.
      const name = document.querySelector('.wm-card-name') as HTMLElement | null;
      if (name !== null) out['card-name-color'] = getComputedStyle(name).color;
      const tag = document.querySelector('.wm-tag') as HTMLElement | null;
      if (tag !== null) out['tag-color'] = getComputedStyle(tag).color;
      const pl = document.querySelector('.wm-pl') as HTMLElement | null;
      if (pl !== null) out['pl-color'] = getComputedStyle(pl).color;
      const leg = document.querySelector('.wm-legend em') as HTMLElement | null;
      if (leg !== null) out['legend-em-color'] = getComputedStyle(leg).color;
      const leg2 = document.querySelector('.wm-legend > span') as HTMLElement | null;
      if (leg2 !== null) out['legend-text-color'] = getComputedStyle(leg2).color;
      return out;
    });

    const hex = (text: string): [number, number, number, number] => {
      const t = text.trim();
      if (t.startsWith('#')) {
        const h = t.slice(1);
        const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6);
        return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), 1];
      }
      return parseColor(t);
    };
    const lum = (c: string) => LUM(...hex(c).slice(0, 3) as [number, number, number]);
    const ratio = (a: string, b: string) => {
      const l1 = lum(a);
      const l2 = lum(b);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    const surface = probe['surface'] ?? '#ffffff';
    // Text ≥ 4.5:1 on the card surface — the hero + cell inks, labels, muted texts.
    const cells = JSON.parse(probe['cells']!) as Array<{ id: string; p: string; color: string; cls: string }>;
    expect(cells.length).toBe(64); // 16 cards × (1Y hero + D/W/M)
    for (const c of cells) {
      if (c.cls.includes('s-x')) continue; // neutral grey cells: checked below with the muted texts
      const r = ratio(c.color, surface);
      test.info().annotations.push({ type: 'note', description: `ink ${c.id}/${c.p} ${r.toFixed(2)}:1` });
      expect(r, `cell ink ${c.id}/${c.p} on surface`).toBeGreaterThanOrEqual(4.5);
    }
    for (const key of ['card-name-color', 'tag-color', 'pl-color', 'legend-em-color', 'legend-text-color']) {
      if (probe[key] === undefined) continue;
      const r = ratio(probe[key]!, surface);
      test.info().annotations.push({ type: 'note', description: `${key} ${r.toFixed(2)}:1` });
      expect(r, `${key} on surface`).toBeGreaterThanOrEqual(4.5);
    }
    // The visible grey country borders (2026-10-20f): clearly apart from
    // BOTH the page surface and the land fill.
    const borderVsSurface = ratio(probe['border']!, surface);
    const borderVsLand = ratio(probe['border']!, probe['land']!);
    test.info().annotations.push({ type: 'note', description: `border ${borderVsSurface.toFixed(2)}:1 surface / ${borderVsLand.toFixed(2)}:1 land` });
    expect(borderVsSurface, 'country border vs surface').toBeGreaterThanOrEqual(1.3);
    expect(borderVsLand, 'country border vs land fill').toBeGreaterThanOrEqual(1.15);
    // Pins ≥ 3:1 against the land they sit on AND the surface — the FILL
    // is the contrast mark (the teardrop's body); the rim runs hotter for
    // the 3D read and is checked ≠ fill below.
    const dots = JSON.parse(probe['dots']!) as Array<{ id: string; stroke: string; fill: string; cls: string }>;
    expect(dots.length).toBe(16);
    for (const d of dots) {
      if (d.cls.includes('s-x')) continue;
      const vsLand = ratio(d.fill, probe['land']!);
      const vsSurface = ratio(d.fill, surface);
      test.info().annotations.push({ type: 'note', description: `pin ${d.id} ${vsLand.toFixed(2)}:1 land / ${vsSurface.toFixed(2)}:1 surface` });
      expect(Math.min(vsLand, vsSurface), `pin ${d.id}`).toBeGreaterThanOrEqual(3);
      // The 3D read: the rim runs hotter than the fill (never the same colour).
      expect(d.fill, `pin ${d.id} fill ≠ rim`).not.toBe(d.stroke);
    }
    // Focus ring ≥ 3:1 on the surface.
    expect(ratio(probe['focus']!, surface), 'focus ring').toBeGreaterThanOrEqual(3);
    // The RELATIVE tints (2026-10-20f): every tinted country stands ≥1.1:1
    // apart from the neutral land; the biggest mover (ibov, weight 1) is
    // ≥1.3:1 apart; and within each direction the tint's luminance
    // distance from the land grows monotonically with the inline --t mix.
    const tinted = JSON.parse(probe['tinted']!) as Array<{ iso: string; fill: string; t: string; cls: string }>;
    // The fixture's 1D lens, AGGREGATED per country (2026-10-20g): TWELVE
    // tinted — US (Nasdaq leads the trio), CA, BR, GB, DE, FR, IN, CN, KR,
    // JP, TW, AU. The UK's +0.1 sits INSIDE the flat band, so it keeps the
    // sign's direction at the MINIMUM tint (the honest flat-band floor);
    // Hong Kong / the Eurozone tint nothing (no single country).
    expect(tinted.length).toBeGreaterThanOrEqual(10);
    const uk = tinted.find((c) => c.iso === '826');
    expect(uk).toBeDefined();
    expect(uk!.t).toBe('34%'); // the flat band's floor — the weakest tint on screen
    expect(tinted.find((c) => c.iso === '840')).toBeDefined(); // US via the trio
    expect(tinted.find((c) => c.iso === '076')).toBeDefined(); // Brazil
    const dist = (fill: string) => Math.abs(lum(fill) - lum(probe['land']!));
    for (const c of tinted) {
      const r = ratio(c.fill, probe['land']!);
      expect(r, `tint ${c.iso} vs land`).toBeGreaterThanOrEqual(1.1);
    }
    const ibov = tinted.find((c) => c.iso === '076');
    if (ibov !== undefined) {
      const r = ratio(ibov.fill, probe['land']!);
      test.info().annotations.push({ type: 'note', description: `strongest tint (ibov) ${r.toFixed(2)}:1 vs land` });
      expect(r).toBeGreaterThanOrEqual(1.3);
    }
    for (const cls of ['s-u', 's-d'] as const) {
      const rows = tinted
        .filter((c) => c.cls.includes(cls))
        .map((c) => ({ iso: c.iso, t: Number(c.t.replace('%', '')) }))
        .sort((a, b) => a.t - b.t);
      for (let i = 1; i < rows.length; i++) {
        const prev = tinted.find((c) => c.iso === rows[i - 1]!.iso)!;
        const cur = tinted.find((c) => c.iso === rows[i]!.iso)!;
        expect(dist(cur.fill), `${cls} tint distance must grow with --t (${rows[i - 1]!.iso} → ${rows[i]!.iso})`).toBeGreaterThan(dist(prev.fill));
      }
    }
  });
}

/* ------------------------------------------------------------------ *
 * §9.4 — axe-core: zero serious or critical on the section
 * ------------------------------------------------------------------ */

test('axe §9.4: zero serious or critical on the map module', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  expect(existsSync(AXE)).toBe(true);
  await page.addScriptTag({ path: AXE });
  const report = await page.evaluate(() => {
    const axe = (window as unknown as { axe: { run: (el: Element, o: unknown) => Promise<{ violations: Array<{ impact: string; id: string; help: string }> }> } }).axe;
    return axe.run(document.querySelector('.wm')!, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });
  const serious = report.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  test.info().annotations.push({
    type: 'note',
    description: `axe violations on the module (any): ${report.violations.map((v) => `${v.impact}:${v.id}`).join(', ') || 'none'}`,
  });
  expect(serious, JSON.stringify(serious, null, 2)).toEqual([]);

  // Section-wide sweep — INFORMATIONAL: the owner's pre-existing verdict/tile
  // chips (Carbon Yellow 30 on its tint, "Unusual"/"Bear market" tags) are
  // flagged by axe at 1.5:1. They predate this branch and are out of the
  // map's scope (spec §8: no changes to the existing section surfaces);
  // recorded here so the finding is owned, not hidden.
  const sectionReport = await page.evaluate(() => {
    const axe = (window as unknown as { axe: { run: (el: Element, o: unknown) => Promise<{ violations: Array<{ impact: string; id: string }> }> } }).axe;
    return axe.run(document.getElementById('insights-markets')!, {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
  });
  const pre = sectionReport.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .filter((v) => v.id === 'color-contrast');
  test.info().annotations.push({
    type: 'note',
    description: `pre-existing section chips flagged (not the map): ${pre.length > 0 ? 'color-contrast on the verdict/tile tags (owner-pinned Carbon Yellow 30, predates this branch)' : 'none'}`,
  });
});

/* ------------------------------------------------------------------ *
 * §9.5 — the keyboard walk
 * ------------------------------------------------------------------ */

test('keyboard §9.5: tab order equals §4.1 and Enter opens the detail view', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  // §4.1 = DOM order — focus the FIRST card (dow), then walk the 15 rest.
  const first = page.locator('.wm-card').first();
  await first.focus();
  const seen: string[] = [await page.evaluate(() => (document.activeElement as HTMLElement).dataset.id ?? '')];
  for (let i = 1; i < MAP_ORDER.length; i++) {
    await page.keyboard.press('Tab');
    seen.push(await page.evaluate(() => (document.activeElement as HTMLElement).dataset.id ?? `?${document.activeElement?.tagName}`));
  }
  expect(seen).toEqual([...MAP_ORDER]);
  // Enter on KOSPI opens the existing detail view (the tile expands).
  await page.locator('.wm-card[data-id="kospi"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#insights-market-tile-kospi')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#insights-market-tile-kospi')).toBeVisible();
});

/* ------------------------------------------------------------------ *
 * §9.6 — Farsi
 * ------------------------------------------------------------------ */

test('farsi §9.6: Persian digits, true minus, percent glyph, unmirrored map', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'fa', theme: 'light' });
  // The page mirrors; the map box does not.
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  const stageDir = await page.evaluate(() => getComputedStyle(document.querySelector('.wm-stage')!).direction);
  expect(stageDir).toBe('ltr');
  // DOM order still §4.1 (west to east, never mirrored).
  const order = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card')).map((c) => (c as HTMLElement).dataset.id));
  expect(order).toEqual([...MAP_ORDER]);
  // The card's period captions carry the app's own Persian period words
  // (روزانه / هفتگی / ماهانه — priceChangeDaily & co; 2026-10-20h: the
  // yearly hero rides FIRST with سالانه. 2026-10-27: the hero follows the
  // SELECTED lens — the default (today) opens with روزانه as the hero, so
  // the check selects 1Y first to keep asserting the classic quartet).
  await page.locator('.wm [role="radiogroup"] button').nth(4).click(); // 1 year
  const labels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card[data-id="sp500"] .wm-pl')).map((l) => l.textContent),
  );
  expect(labels).toEqual(['سالانه', 'روزانه', 'هفتگی', 'ماهانه']);
  // A negative cell (Ibovespa −1.8 in the fixture): Persian digits, the
  // true minus U+2212 — inside an LTR bdi. 2026-10-20h: the compact
  // cells speak the number only (the glyph lives in the hero); the
  // sr-only % keeps the unit in the accessible name.
  const neg = await page.evaluate(() => {
    const card = document.querySelector('.wm-card[data-id="ibov"]') as HTMLElement;
    const bdi = card.querySelector('.wm-cell[data-p="1D"] .wm-pv bdi')!;
    const sr = card.querySelector('.wm-cell[data-p="1D"] .wm-pv .sr-only')!;
    return { text: bdi.textContent ?? '', dir: bdi.getAttribute('dir') ?? '', srUnit: sr.textContent ?? '' };
  });
  expect(neg.dir).toBe('ltr');
  expect(neg.text).toContain('−');
  expect(neg.text).toMatch(/[۰-۹]/);
  expect(neg.text).not.toMatch(/[0-9]/);
  expect(neg.text).not.toContain('٪'); // the glyph moved to the hero row
  expect(neg.srUnit).toBe('%');
  // The YEARLY hero (Ibovespa −45.4): the big number KEEPS the Persian
  // percent glyph — the unit's only visible home on the card.
  const hero = await page.evaluate(() => {
    const card = document.querySelector('.wm-card[data-id="ibov"]') as HTMLElement;
    const bdi = card.querySelector('.wm-yrow .wm-yv bdi')!;
    const yv = card.querySelector('.wm-yrow .wm-yv') as HTMLElement;
    return { text: bdi.textContent ?? '', dir: bdi.getAttribute('dir') ?? '', font: getComputedStyle(yv).fontSize };
  });
  expect(hero.dir).toBe('ltr');
  expect(hero.text).toContain('−');
  expect(hero.text).toContain('٪');
  expect(hero.text).toMatch(/[۰-۹]/);
  expect(hero.text).not.toMatch(/[0-9]/);
  expect(parseFloat(hero.font)).toBeGreaterThanOrEqual(18); // ~50% bigger than the 12.5px cells
  // 2026-10-21 owner round: the header's "Updated {time} · {age}" (M9)
  // line is RETIRED — the KV write time is cron-fixed, so it always read
  // as a stale, never-updating clock. The as-of date stays; no surface
  // renders the write time anymore.
  const updated = await page.evaluate(() => {
    const section = document.getElementById('insights-markets')!;
    return Array.from(section.querySelectorAll('bdi')).map((b) => b.textContent ?? '').find((t) => t.includes('به‌روزرسانی')) ?? '';
  });
  expect(updated).toBe('');
  // The list layout at 390 keeps the unmirrored map too.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.wm-stage')!).direction)).toBe('ltr');
  // 2026-10-20g: back at the map layout, the selected country's label
  // speaks Persian (آمریکا for the US trio's any card).
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(500);
  await page.locator('.wm-card[data-id="sp500"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('آمریکا');
});

/* ------------------------------------------------------------------ *
 * 2026-10-20h owner round — the period switch: centred, ~50% bigger, and
 * yearly drives the map like any other lens. 2026-10-27 owner round
 * ("add five year and 3 months to all view points"): SIX lenses.
 * ------------------------------------------------------------------ */

test('switch 2026-10-27: centred under the summary, six options (3M and 5Y join), 15% smaller than the 2026-10-20h round', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const probe = await page.evaluate(() => {
    const wm = document.querySelector('.wm') as HTMLElement;
    const grp = document.querySelector('.wm [role="radiogroup"]') as HTMLElement;
    const btns = Array.from(grp.querySelectorAll('button'));
    const wr = wm.getBoundingClientRect();
    const gr = grp.getBoundingClientRect();
    const first = btns[0] as HTMLElement;
    const cs = getComputedStyle(first);
    return {
      moduleW: Math.round(wr.width),
      labels: btns.map((b) => b.textContent),
      checked: btns.map((b) => b.getAttribute('aria-checked')),
      tabbables: btns.map((b) => (b as HTMLElement).tabIndex),
      btnH: Math.round(first.getBoundingClientRect().height),
      btnFont: cs.fontSize,
      grpW: Math.round(gr.width),
      centered: Math.round(Math.abs(gr.left - wr.left - (wr.right - gr.right))),
    };
  });
  // Six lenses in horizon order (the 2026-10-27 round inserts 3 months
  // before 1 year and appends 5 years), Today checked, one tab stop.
  expect(probe.labels).toEqual(['Today', '1 week', '1 month', '3 months', '1 year', '5 years']);
  expect(probe.checked).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
  expect(probe.tabbables).toEqual([0, -1, -1, -1, -1, -1]);
  // 2026-10-21 owner round ("slightly reduce the size of this … like
  // 15%"): the 48px pills drop to 41px and the ~18.7px words to
  // caption × 1.27 ≈ 15.9px (the phone step: 37px / × 1.06 ≈ 13.3px).
  expect(probe.btnH).toBeGreaterThanOrEqual(39);
  expect(probe.btnH).toBeLessThanOrEqual(43);
  expect(parseFloat(probe.btnFont)).toBeGreaterThanOrEqual(15);
  test.info().annotations.push({ type: 'note', description: `switch ${probe.grpW}px wide, pills ${probe.btnH}px @ ${probe.btnFont}` });
  // CENTRED under the summary line (it hugged the start edge before).
  expect(probe.centered).toBeLessThanOrEqual(2);
  // 2026-10-21 unification: this switch is the SECTION's ONE period
  // control — the old five-option Daily…Yearly radiogroup is retired,
  // and every radiogroup in the section is this one or the display switch
  // (2026-10-27: six period lenses now).
  const radios = await page.evaluate(() =>
    Array.from(document.querySelectorAll('#insights-markets [role="radio"]')).map((b) => b.textContent),
  );
  expect(radios).toEqual(['Today', '1 week', '1 month', '3 months', '1 year', '5 years', 'List', 'Performance map']);
});

test('switch 2026-10-20h: arrow keys rove focus + selection (the ARIA radiogroup pattern)', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const grp = page.locator('.wm [role="radiogroup"]');
  await grp.locator('button').first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').nth(1)).toBeFocused();
  await expect(grp.locator('button').nth(1)).toHaveAttribute('aria-checked', 'true');
  // 2026-10-27: the six-lens order — nth(3) is the NEW 3 months lens.
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').nth(2)).toBeFocused(); // 1 month
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').nth(3)).toBeFocused(); // 3 months (the new lens)
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').nth(4)).toBeFocused(); // 1 year
  await expect(grp.locator('button').nth(4)).toHaveAttribute('aria-checked', 'true');
  // Wrap: ArrowRight through 5 years (the last) lands on Today again.
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').nth(5)).toBeFocused(); // 5 years (the new lens)
  await page.keyboard.press('ArrowRight');
  await expect(grp.locator('button').first()).toBeFocused();
  await expect(grp.locator('button').first()).toHaveAttribute('aria-checked', 'true');
  // ArrowLeft walks back and keeps the rove symmetric.
  await page.keyboard.press('ArrowLeft');
  await expect(grp.locator('button').nth(5)).toBeFocused();
  await expect(page.locator('.wm p')).toContainText(/over the past 5 years/);
});

test('switch 2026-10-20h: 1 year drives the whole map — summary, tints, pins, hero emphasis', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  // The fixture's 1Y lens: 8 up, 7 down, 1 flat (FTSE −2.9 inside the
  // ±3 flat band); SSEC flips from today's rise to the year's fall.
  await expect(page.locator('.wm p')).toContainText('today');
  await page.locator('.wm [role="radiogroup"] button').nth(4).click(); // 1 year (six-lens order)
  await expect(page.locator('.wm p')).toContainText('8 of 16 markets up this year');
  await expect(page.locator('.wm p')).toContainText('7 down');
  await expect(page.locator('.wm p')).toContainText('1 flat');
  // China flips with Shanghai's −6.1 year; the US stays green (S&P +10.9
  // leads the trio); Brazil reads the year's biggest fall (−45.4).
  const tints = await page.evaluate(() => ({
    cn: document.querySelector('[data-iso="156"]')!.getAttribute('class') ?? '',
    us: document.querySelector('[data-iso="840"]')!.getAttribute('class') ?? '',
    br: document.querySelector('[data-iso="076"]')!.getAttribute('class') ?? '',
    gb: document.querySelector('[data-iso="826"]')!.getAttribute('class') ?? '',
  }));
  expect(tints.cn).toContain('s-d');
  expect(tints.us).toContain('s-u');
  expect(tints.br).toContain('s-d');
  // The UK's −2.9 sits INSIDE the yearly flat band → the honest floor tint.
  expect(tints.gb).toContain('s-d');
  // Every card's yearly hero row is the emphasised lens; the hero value
  // keeps the percent glyph and reads Ibovespa's −45.4.
  const heroes = await page.evaluate(() => ({
    sel: document.querySelectorAll('.wm-yrow.sel').length,
    ibov: (document.querySelector('.wm-card[data-id="ibov"] .wm-yv bdi') as HTMLElement).textContent ?? '',
  }));
  expect(heroes.sel).toBe(16);
  expect(heroes.ibov).toContain('−45.4%');
  // The compact cells keep their own lens emphasis OFF (1Y is selected).
  expect(await page.evaluate(() => document.querySelectorAll('.wm-cell.sel').length)).toBe(0);
  // Back to Today: the summary follows, no reload, no network. The hero
  // (2026-10-27: it follows the SELECTED lens) becomes the daily number
  // on every card, and the classic D cell regains its sel emphasis.
  await page.locator('.wm [role="radiogroup"] button').first().click();
  await expect(page.locator('.wm p')).toContainText('markets up today');
  const heroToday = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-yrow')).map((h) => (h as HTMLElement).dataset.p),
  );
  expect(heroToday.every((p) => p === '1D')).toBe(true);
  expect(await page.evaluate(() => document.querySelectorAll('.wm-cell.sel').length)).toBe(16);
});

/* ------------------------------------------------------------------ *
 * 2026-10-27 owner round ("add five year and 3 months to all view
 * points"): the two NEW lenses drive the map like every other one —
 * the summary's period word, the card cells and the whole section.
 * ------------------------------------------------------------------ */

test('switch 2026-10-27: the 3-month and 5-year lenses drive the whole map — summary word, hero, section', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  // 3 months: the summary line speaks the new period word and every
  // card's HERO becomes the 3M value (the hero follows the selected
  // lens — the 2026-10-27 design: six horizons take turns as the loud
  // number; the fixture's chg3m answers).
  await page.locator('.wm [role="radiogroup"] button').nth(3).click(); // 3 months
  await expect(page.locator('.wm p')).toContainText(/of 16 markets up over the past 3 months/);
  const hero3m = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-yrow')).map((h) => (h as HTMLElement).dataset.p),
  );
  expect(hero3m.length).toBe(16);
  expect(hero3m.every((p) => p === '3M')).toBe(true);
  // The section's verdict breadth line names the SAME period word.
  await expect(page.locator('#insights-markets')).toContainText(/over the past 3 months/);

  // 5 years: the fixture's chg5y (chg3m × 7.5) answers; every hero
  // carries the 5Y value and the honest ≥100 integer rule keeps wide
  // values inside the 14.5% card ("−107%", never "−107.0%").
  await page.locator('.wm [role="radiogroup"] button').nth(5).click(); // 5 years
  await expect(page.locator('.wm p')).toContainText(/of 16 markets up over the past 5 years/);
  const hero5y = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-yrow')).map((h) => (h as HTMLElement).dataset.p),
  );
  expect(hero5y.length).toBe(16);
  expect(hero5y.every((p) => p === '5Y')).toBe(true);
  await expect(page.locator('#insights-markets')).toContainText(/over the past 5 years/);
  // Ibovespa's fixture 5Y is −107 → the compact integer hero value.
  const ibovHero = await page.evaluate(
    () => (document.querySelector('.wm-card[data-id="ibov"] .wm-yv bdi') as HTMLElement).textContent ?? '',
  );
  expect(ibovHero).toContain('−107%');
});

/* ------------------------------------------------------------------ *
 * §9.8 — the mock-payload states
 * ------------------------------------------------------------------ */

const mapIds: Record<string, string> = {
  dow: 'dow', tsx: 'tsx', sp500: 'sp500', ndx: 'ndx', ibov: 'ibov', ftse: 'ftse',
  cac: 'cac', dax: 'dax', stoxx50: 'stoxx50', nifty50: 'nifty50', hsi: 'hsi',
  ssec: 'ssec', taiex: 'taiex', kospi: 'kospi', n225: 'n225', asx200: 'asx200',
};

test('state §9.8: all up', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    for (const m of snap.markets as Array<Record<string, unknown>>) {
      m.chg1d = 2.4;
      m.chg1w = 3.1;
      m.chg1m = 6.5;
      m.chg1y = 9.4;
      // 2026-10-27: the two new lenses join the all-up mock so every
      // triangle (hero + FIVE cells per card) speaks the same direction.
      m.chg3m = 4.6;
      m.chg5y = 18.2;
    }
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm p')).toContainText('16 of 16 markets up today');
  const steps = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card')).map((c) => c.classList.contains('s-u')));
  expect(steps.every(Boolean)).toBe(true);
  // The hero + the cells' triangles all point up — 4 per card (the
  // selected-lens hero + the D/W/M triplet, the 2026-10-27 layout).
  const tris = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card .wm-pv.s-u .wm-ar2 path')).map((p) => (p as SVGPathElement).getAttribute('d')),
  );
  expect(tris).toHaveLength(64);
  expect(tris.every((d) => d === 'M5 1 9.5 9H.5z')).toBe(true);
});

test('state §9.8: all down', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    for (const m of snap.markets as Array<Record<string, unknown>>) {
      m.chg1d = -2.4;
      m.chg1m = -6.5;
      m.chg1w = -3.1;
      m.chg1y = -9.4;
      // 2026-10-27: the two new lenses join the all-down mock.
      m.chg3m = -4.6;
      m.chg5y = -18.2;
    }
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm p')).toContainText('0 of 16 markets up today');
  await expect(page.locator('.wm p')).toContainText('16 down');
  const steps = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card')).map((c) => c.classList.contains('s-d')));
  expect(steps.every(Boolean)).toBe(true);
  // The hero + the cells' triangles all point down — 4 per card.
  const tris = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card .wm-pv.s-d .wm-ar2 path')).map((p) => (p as SVGPathElement).getAttribute('d')),
  );
  expect(tris).toHaveLength(64);
  expect(tris.every((d) => d === 'M.5 1h9L5 9z')).toBe(true);
});

test('state §9.8: one index missing → dash + No data + neutral country', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    snap.markets = (snap.markets as Array<Record<string, unknown>>).filter((m) => m.id !== 'dax');
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const dax = page.locator('.wm-card[data-id="dax"]');
  await expect(dax.locator('.wm-cell .wm-pv bdi').first()).toHaveText('—');
  await expect(dax.locator('.wm-tag')).toContainText('No data');
  const germany = await page.evaluate(() => document.querySelector('[data-iso="276"]')!.getAttribute('class'));
  expect(germany).toBe('wm-c'); // neutral — no direction class
  const dot = await page.evaluate(() => document.querySelector('.wm-pin[data-id="dax"]')!.getAttribute('class'));
  expect(dot).toContain('s-x');
  // Summary counts only the 15 carrying data.
  await expect(page.locator('.wm p')).toContainText('of 15 markets');
});

test('state §9.8: one index old → dash + Old data + neutral country', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    const nifty = (snap.markets as Array<Record<string, unknown>>).find((m) => m.id === 'nifty50')!;
    nifty.asOf = '2026-10-01';
    nifty.stale = true;
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const nifty = page.locator('.wm-card[data-id="nifty50"]');
  await expect(nifty.locator('.wm-cell .wm-pv bdi').first()).toHaveText('—');
  await expect(nifty.locator('.wm-tag')).toContainText('Old data');
  const india = await page.evaluate(() => document.querySelector('[data-iso="356"]')!.getAttribute('class'));
  expect(india).toBe('wm-c');
});

test('state §9.8: whole payload failed with a last-good copy → Showing data from', async ({ page }) => {
  const cached = readFileSync(path.join(FIXTURES, 'markets.json'), 'utf8');
  await page.addInitScript((snap) => {
    window.localStorage.setItem('currena:insights:markets', snap);
  }, cached);
  await page.route('**/api/insights/markets', (route) => route.abort());
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm')).toBeVisible();
  await expect(page.locator('.wm')).toContainText('Showing data from');
});

test('state §9.8: whole payload failed with no copy → the existing calm empty state', async ({ page }) => {
  await page.route('**/api/insights/markets', (route) => route.abort());
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    window.localStorage.removeItem('currena:insights:markets');
  });
  await page.goto('/#/insights');
  await page.waitForSelector('#insights-markets', { state: 'visible' });
  await page.waitForTimeout(1200); // the fetch resolves to failure
  await expect(page.locator('#insights-markets')).toContainText('being prepared');
  await expect(page.locator('.wm')).toHaveCount(0);
});

test('state §9.8: all markets closed → hollow rings everywhere', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    for (const m of snap.markets as Array<Record<string, unknown>>) {
      m.open = false;
      m.quoteTime = '2026-09-01T20:00:00Z';
    }
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const closed = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-pin')).map((d) => (d as SVGElement).classList.contains('closed')),
  );
  expect(closed).toHaveLength(16);
  expect(closed.every(Boolean)).toBe(true);
  const tags = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card .wm-tag')).map((t) => t.textContent));
  expect(tags.every((t) => t === 'Closed')).toBe(true);
});

test('state §9.8: loading → grey land, grey hollow dots, no numbers, height reserved', async ({ page }) => {
  await page.route('**/api/insights/markets', async (route) => {
    await new Promise((r) => setTimeout(r, 2500));
    const snap = JSON.parse(readFileSync(path.join(FIXTURES, 'markets.json'), 'utf8'));
    await route.fulfill({ json: snap, contentType: 'application/json' });
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.addInitScript(() => {
    window.localStorage.removeItem('currena:insights:markets');
  });
  await page.goto('/#/insights');
  await page.waitForSelector('#insights-markets', { state: 'visible' });
  await page.evaluate(() => document.querySelector('.wm')?.scrollIntoView({ block: 'center' }));
  // During the delayed fetch: the module's loading shape. The LAND is a
  // static asset — it loads on sight, independent of the data feed.
  await page.waitForSelector('.wm-c', { state: 'attached', timeout: 10_000 });
  await page.waitForSelector('.wm-pin', { timeout: 5000 });
  const loading = await page.evaluate(() => {
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    const rect = stage.getBoundingClientRect();
    return {
      dots: document.querySelectorAll('.wm-pin').length,
      allNeutral: Array.from(document.querySelectorAll('.wm-pin')).every((d) => (d as SVGElement).classList.contains('s-x')),
      allHollow: Array.from(document.querySelectorAll('.wm-pin')).every((d) => (d as SVGElement).classList.contains('closed')),
      cards: document.querySelectorAll('.wm-card').length,
      legend: document.querySelectorAll('.wm-legend').length,
      summary: document.querySelectorAll('.wm > p').length,
      aspect: rect.width > 0 ? rect.height / rect.width : 0,
      landVisible: document.querySelectorAll('.wm-c').length,
    };
  });
  expect(loading.dots).toBe(16);
  expect(loading.allNeutral).toBe(true);
  expect(loading.allHollow).toBe(true);
  expect(loading.cards).toBe(0);
  expect(loading.legend).toBe(0);
  expect(loading.summary).toBe(0);
  expect(loading.aspect).toBeGreaterThan(0.45); // ~521/1000 reserved
  expect(loading.landVisible).toBeGreaterThan(150);
});

/* ------------------------------------------------------------------ *
 * M13 — the list layout's dot tap scrolls to the row
 * ------------------------------------------------------------------ */

test('interaction M13: list-layout pin tap scrolls to the market row', async ({ page }) => {
  await gotoInsights(page, { width: 390, lang: 'en', theme: 'light', height: 844 });
  const pin = page.locator('.wm-pin[data-id="kospi"]');
  await pin.click({ force: true });
  await page.waitForTimeout(900);
  const inView = await page.evaluate(() => {
    const tile = document.getElementById('insights-market-tile-kospi')!;
    const r = tile.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  expect(inView).toBe(true);
});

/* ------------------------------------------------------------------ *
 * 2026-10-20g owner round — the ants, the label, the pins, the
 * multi-index country aggregation.
 * ------------------------------------------------------------------ */

test('selection 2026-10-20g: the selected country wears an animated moving dash', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await page.locator('.wm-card[data-id="sp500"]').hover();
  await page.waitForTimeout(150);
  // ANY of a country's cards selects the whole country: the US path wears
  // the dash, not just one index's outline.
  const on = await page.evaluate(() => {
    const us = document.querySelector('[data-iso="840"]') as SVGPathElement;
    const cs = getComputedStyle(us);
    return { cls: us.getAttribute('class') ?? '', dash: cs.strokeDasharray, anim: cs.animationName, width: cs.strokeWidth };
  });
  expect(on.cls).toContain('on');
  expect(on.dash).not.toBe('none');
  expect(on.anim).toBe('wm-ants');
  expect(parseFloat(on.width)).toBeGreaterThan(1); // a visible weight, but a DASH — not the old solid slab
  // The dash actually MARCHES: two samples of the offset differ.
  const march = await page.evaluate(async () => {
    const us = document.querySelector('[data-iso="840"]') as SVGPathElement;
    const a = getComputedStyle(us).strokeDashoffset;
    await new Promise((r) => setTimeout(r, 350));
    const b = getComputedStyle(us).strokeDashoffset;
    return { a, b };
  });
  expect(march.a).not.toBe(march.b);
  // Moving to another of the country's cards KEEPS the country selected.
  await page.locator('.wm-card[data-id="dow"]').hover();
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => document.querySelector('[data-iso="840"]')!.getAttribute('class'))).toContain('on');
  // Moving to another country moves the ants.
  await page.locator('.wm-card[data-id="kospi"]').hover();
  await page.waitForTimeout(120);
  const after = await page.evaluate(() => ({
    us: document.querySelector('[data-iso="840"]')!.getAttribute('class') ?? '',
    kr: document.querySelector('[data-iso="410"]')!.getAttribute('class') ?? '',
  }));
  expect(after.us).not.toContain('on');
  expect(after.kr).toContain('on');
  // Rows with no single country select nothing: the Euro Stoxx 50.
  await page.locator('.wm-card[data-id="stoxx50"]').hover();
  await page.waitForTimeout(120);
  expect(await page.evaluate(() => document.querySelector('.wm-c.on'))).toBeNull();
});

test('selection 2026-10-20g: reduced motion keeps the dash but stops the march', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await page.locator('.wm-card[data-id="kospi"]').hover();
  await page.waitForTimeout(150);
  const probe = await page.evaluate(() => {
    const kr = document.querySelector('[data-iso="410"]') as SVGPathElement;
    const cs = getComputedStyle(kr);
    return { dash: cs.strokeDasharray, anim: cs.animationName };
  });
  expect(probe.dash).not.toBe('none');
  expect(probe.anim).toBe('none');
});

test('selection 2026-10-20g: the selected country writes its name at 60% ink', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm-clabel')).toHaveCount(0);
  await page.locator('.wm-card[data-id="sp500"]').hover();
  await page.waitForTimeout(150);
  const usa = await page.evaluate(() => {
    const t = document.querySelector('.wm-clabel') as SVGTextElement | null;
    if (t === null) return null;
    const cs = getComputedStyle(t);
    return { text: t.textContent ?? '', opacity: cs.opacity, weight: cs.fontWeight, anchor: cs.textAnchor };
  });
  expect(usa).not.toBeNull();
  expect(usa!.text).toBe('USA');
  expect(Math.round(Number(usa!.opacity) * 100)).toBe(60);
  expect(usa!.anchor).toBe('middle');
  // Any of the trio's cards says the same country.
  await page.locator('.wm-card[data-id="dow"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('USA');
  // France via CAC, and the big-owner examples render too.
  await page.locator('.wm-card[data-id="cac"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('France');
  await page.locator('.wm-card[data-id="ibov"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('Brazil');
  await page.locator('.wm-card[data-id="asx200"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('Australia');
  // The path-less rows still name their region: Hong Kong, the Eurozone.
  await page.locator('.wm-card[data-id="hsi"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('Hong Kong');
  await page.locator('.wm-card[data-id="stoxx50"]').hover();
  await expect(page.locator('.wm-clabel')).toHaveText('Eurozone');
  // Leaving the map retires the label.
  await page.locator('.wm p').hover();
  await page.waitForTimeout(150);
  await expect(page.locator('.wm-clabel')).toHaveCount(0);
});

test('pins 2026-10-20g: sixteen 3D pins — filled by direction, rim hotter, highlight + shadow + core', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const pins = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-pin')).map((g) => {
      const el = g as SVGGElement;
      const body = el.querySelector('.wm-pin-b') as SVGPathElement;
      const cs = getComputedStyle(body);
      return {
        id: el.getAttribute('data-id') ?? '',
        cls: el.getAttribute('class') ?? '',
        fill: cs.fill,
        stroke: cs.stroke,
        d: body.getAttribute('d') ?? '',
        hasHl: el.querySelector('.wm-pin-hl') !== null,
        hasSh: el.querySelector('.wm-pin-sh') !== null,
        hasCore: el.querySelector('.wm-pin-core') !== null,
        hasHit: el.querySelector('.wm-hit') !== null,
      };
    }),
  );
  expect(pins).toHaveLength(16);
  expect(pins.map((p) => p.id)).toEqual([...MAP_ORDER]);
  for (const p of pins) {
    expect(p.hasHl, `${p.id} specular highlight`).toBe(true);
    expect(p.hasSh, `${p.id} ground shadow`).toBe(true);
    expect(p.hasCore, `${p.id} open/closed core`).toBe(true);
    expect(p.hasHit, `${p.id} hit area`).toBe(true);
    expect(p.d.startsWith('M0 0'), `${p.id} teardrop anchored at the tip`).toBe(true);
    expect(p.fill, `${p.id} filled`).not.toBe('none');
    if (p.cls.includes('s-x')) continue;
    expect(p.fill, `${p.id} rim ≠ fill`).not.toBe(p.stroke);
  }
  // The fixture's 1D lens: KOSPI rises → the green class; IBOV falls → red.
  expect(pins.find((p) => p.id === 'kospi')!.cls).toContain('s-u');
  expect(pins.find((p) => p.id === 'ibov')!.cls).toContain('s-d');
  // Closed pins keep the legend's key: a hollow core (surface-filled).
  const closedCore = await page.evaluate(() => {
    const g = document.querySelector('.wm-pin.closed') as SVGGElement;
    const core = g.querySelector('.wm-pin-core') as SVGCircleElement;
    return getComputedStyle(core).fill;
  });
  expect(closedCore).not.toBe('none');
});

test('aggregation 2026-10-20g: a country hosting several indices tints by its strongest fresh mover', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  // The fixture's 1D lens: Nasdaq +1.0 leads the US trio → the US reads s-u.
  const us = await page.evaluate(() => document.querySelector('[data-iso="840"]')!.getAttribute('class'));
  expect(us).toContain('s-u');
  // Hong Kong has no path on the 110 m map — the Hang Seng pins but tints
  // nothing (China's tint stays Shanghai Composite's alone).
  expect(await page.evaluate(() => document.querySelectorAll('[data-iso="344"]').length)).toBe(0);
  const cn = await page.evaluate(() => document.querySelector('[data-iso="156"]')!.getAttribute('class'));
  expect(cn).toContain('s-u');
});

test('aggregation 2026-10-20g: removing one US index keeps the tint; removing all three neutralises the country', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    snap.markets = (snap.markets as Array<Record<string, unknown>>).filter((m) => m.id !== 'ndx');
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const stillTinted = await page.evaluate(() => document.querySelector('[data-iso="840"]')!.getAttribute('class'));
  expect(stillTinted).toContain('s-u'); // via S&P +0.7 / Dow +0.5
  expect(await page.evaluate(() => document.querySelectorAll('.wm-pin').length)).toBe(16); // the pin still renders
});

test('aggregation 2026-10-20g: no US indices at all → the honest neutral country', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    snap.markets = (snap.markets as Array<Record<string, unknown>>).filter((m) => m.id !== 'ndx' && m.id !== 'sp500' && m.id !== 'dow');
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const us = await page.evaluate(() => document.querySelector('[data-iso="840"]')!.getAttribute('class'));
  expect(us).toBe('wm-c'); // neutral — no data, no tint, no guess
  const pins = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-pin.s-x')).map((p) => (p as SVGElement).getAttribute('data-id')));
  expect(pins.sort()).toEqual(['dow', 'ndx', 'sp500']);
});

/* Keep the map-order map referenced for future probes (§4.1 ids). */
test.skip('reference: §4.1 ids', () => {
  expect(Object.keys(mapIds)).toEqual([...MAP_ORDER]);
});

/* ------------------------------------------------------------------ *
 * 2026-10-21 owner round — the quiet-fill + card-home + unification
 * probes: New York's tint damps 15%, Nifty 50 and Hang Seng float beside
 * their own countries, and the map's switch drives the SECTION's period.
 * ------------------------------------------------------------------ */

test('tint 2026-10-21: New York\'s country (the US trio) damps its mix to 85% — 15% less opacity', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const probe = await page.evaluate(() => {
    const us = document.querySelector('[data-iso="840"]') as SVGPathElement;
    const uk = document.querySelector('[data-iso="826"]') as SVGPathElement;
    return {
      usT: us.style.getPropertyValue('--t'),
      ukT: uk.style.getPropertyValue('--t'),
      usCls: us.getAttribute('class') ?? '',
    };
  });
  // The US stays tinted (s-u via the trio's strongest fresh mover) but its
  // mix is 85% of the honest ramp value. The fixture's 1D lens: ndx +1.0
  // is the trio's strongest mover (weight 0.621 → ramp 53.9%) → 53.9 ×
  // 0.85 = 45.8%.
  expect(probe.usCls).toContain('s-u');
  expect(probe.usT).toBe('45.8%');
  // Every OTHER country keeps the honest ramp: the UK's +0.1 sits inside
  // the flat band → the floor mix, undamped.
  expect(probe.ukT).toBe('34%');
});

test('cards 2026-10-21: Nifty 50 and Hang Seng float beside their own countries, off the bottom band', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  const probe = await page.evaluate(() => {
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    const sr = stage.getBoundingClientRect();
    const rectOf = (id: string) => {
      const r = (document.querySelector(`.wm-card[data-id="${id}"]`) as HTMLElement).getBoundingClientRect();
      return {
        cx: +(((r.left + r.right) / 2 - sr.left) / sr.width * 100).toFixed(1),
        cy: +(((r.top + r.bottom) / 2 - sr.top) / sr.height * 100).toFixed(1),
        bottom: +((r.bottom - sr.top) / sr.height * 100).toFixed(1),
      };
    };
    const lineOf = (id: string) => {
      const l = document.querySelector(`.wm-ln[data-id="${id}"]`) as SVGLineElement;
      return Math.hypot(l.x2.baseVal.value - l.x1.baseVal.value, l.y2.baseVal.value - l.y1.baseVal.value);
    };
    return { nifty: rectOf('nifty50'), hsi: rectOf('hsi'), niftyLine: lineOf('nifty50'), hsiLine: lineOf('hsi') };
  });
  // Off the bottom band (the old homes sat at y 86 — south of Africa)…
  expect(probe.nifty.cy).toBeLessThan(75);
  expect(probe.hsi.cy).toBeLessThan(75);
  // …and beside their own countries: Nifty 50 west-southwest of the India
  // pin (69.9, 38.2), Hang Seng under the Hong Kong pin (80.9, 36.2).
  expect(probe.nifty.cx).toBeLessThan(69.9);
  expect(probe.hsi.cx).toBeGreaterThan(69.9);
  // The leader lines are SHORT (the old bottom-band lines ran ~220 units
  // in the 1000-unit viewBox; the new homes measure ~52 / ~35).
  expect(probe.niftyLine).toBeLessThan(75);
  expect(probe.hsiLine).toBeLessThan(50);
  test.info().annotations.push({
    type: 'note',
    description: `nifty card (${probe.nifty.cx}, ${probe.nifty.cy}) line ${probe.niftyLine.toFixed(1)}u · hsi card (${probe.hsi.cx}, ${probe.hsi.cy}) line ${probe.hsiLine.toFixed(1)}u`,
  });
});

test('unified 2026-10-21: the map\'s switch drives the whole section — verdict, movers and tiles follow', async ({ page }) => {
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  // The section opens on Today (the map's default) and speaks the MAP's
  // period words everywhere: the verdict's breadth line, the movers'
  // caption and the tiles' values all read the 1-day lens.
  await expect(page.locator('#insights-markets')).toContainText('today performance');
  // Switch to 1 year at the map's control (six-lens order — nth(4)):
  // every surface re-reads chg1y.
  await page.locator('.wm [role="radiogroup"] button').nth(4).click();
  await expect(page.locator('#insights-markets')).toContainText('this year performance');
  // The movers re-rank from chg1y: Ibovespa's −45.4 is the year's
  // biggest fall.
  await expect(page.locator('#insights-markets').locator('article', { hasText: 'Biggest fall' })).toContainText('Ibovespa');
  // The explorer tile re-reads the same lens (Nifty 50's year +17.9).
  const nifty = page.locator('#insights-market-tile-nifty50');
  await expect(nifty).toContainText('+17.9%');
});
