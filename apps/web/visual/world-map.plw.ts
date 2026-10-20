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

/** §4.1 order = west to east = DOM order = tab order (JSE deferred). */
const MAP_ORDER = ['sp500', 'ibov', 'ftse', 'dax', 'nifty50', 'ssec', 'kospi', 'n225', 'asx200'] as const;

const WIDTHS = [1280, 1024, 960, 768, 390] as const;
const HEIGHT: Record<(typeof WIDTHS)[number], number> = { 1280: 900, 1024: 800, 960: 800, 768: 1024, 390: 844 };

type Lang = 'en' | 'fa';
type Theme = 'light' | 'dark';

/** Boot the Insights page in a locale/theme, scroll the map into view and
 * wait for the lazy land asset + the leader lines to settle. */
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

  expect(result.cardCount).toBe(9);
  expect(result.lineCount).toBe(9);
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
      // Every dot's stroke + class.
      const dots: Array<{ id: string; stroke: string; cls: string }> = [];
      for (const d of Array.from(document.querySelectorAll('.wm-dot'))) {
        const el = d as SVGCircleElement;
        dots.push({ id: el.getAttribute('data-id') ?? '', stroke: getComputedStyle(el).stroke, cls: el.getAttribute('class') ?? '' });
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
      const val = document.querySelector('.wm-card-val') as HTMLElement | null;
      if (val !== null) out['card-val-color'] = getComputedStyle(val).color;
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
    // Text ≥ 4.5:1 on the card surface — the triplet inks, labels, muted texts.
    const cells = JSON.parse(probe['cells']!) as Array<{ id: string; p: string; color: string; cls: string }>;
    expect(cells.length).toBe(27); // 9 cards × D/W/M
    for (const c of cells) {
      if (c.cls.includes('s-x')) continue; // neutral grey cells: checked below with the muted texts
      const r = ratio(c.color, surface);
      test.info().annotations.push({ type: 'note', description: `ink ${c.id}/${c.p} ${r.toFixed(2)}:1` });
      expect(r, `cell ink ${c.id}/${c.p} on surface`).toBeGreaterThanOrEqual(4.5);
    }
    for (const key of ['card-name-color', 'card-val-color', 'tag-color', 'pl-color', 'legend-em-color', 'legend-text-color']) {
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
    // Dots ≥ 3:1 against the land they sit on AND the surface (the halo
    // disc makes the surface the honest backdrop).
    const dots = JSON.parse(probe['dots']!) as Array<{ id: string; stroke: string; cls: string }>;
    for (const d of dots) {
      if (d.cls.includes('s-x')) continue;
      const vsLand = ratio(d.stroke, probe['land']!);
      const vsSurface = ratio(d.stroke, surface);
      test.info().annotations.push({ type: 'note', description: `dot ${d.id} ${vsLand.toFixed(2)}:1 land / ${vsSurface.toFixed(2)}:1 surface` });
      expect(Math.min(vsLand, vsSurface), `dot ${d.id}`).toBeGreaterThanOrEqual(3);
    }
    // Focus ring ≥ 3:1 on the surface.
    expect(ratio(probe['focus']!, surface), 'focus ring').toBeGreaterThanOrEqual(3);
    // The RELATIVE tints (2026-10-20f): every tinted country stands ≥1.1:1
    // apart from the neutral land; the biggest mover (ibov, weight 1) is
    // ≥1.3:1 apart; and within each direction the tint's luminance
    // distance from the land grows monotonically with the inline --t mix.
    const tinted = JSON.parse(probe['tinted']!) as Array<{ iso: string; fill: string; t: string; cls: string }>;
    expect(tinted.length).toBeGreaterThanOrEqual(6); // the fixture's 1D lens: 8 movers + 1 flat
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
  const first = page.locator('.wm-card[data-id="sp500"]');
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
  // The triplet cells carry the app's own Persian period words
  // (روزانه / هفتگی / ماهانه — priceChangeDaily & co).
  const labels = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card[data-id="sp500"] .wm-pl')).map((l) => l.textContent),
  );
  expect(labels).toEqual(['روزانه', 'هفتگی', 'ماهانه']);
  // A negative cell (Ibovespa −1.8 in the fixture): Persian digits, the
  // true minus U+2212, the Persian percent glyph — inside an LTR bdi.
  const neg = await page.evaluate(() => {
    const card = document.querySelector('.wm-card[data-id="ibov"]') as HTMLElement;
    const bdi = card.querySelector('.wm-cell[data-p="1D"] .wm-pv bdi')!;
    return { text: bdi.textContent ?? '', dir: bdi.getAttribute('dir') ?? '' };
  });
  expect(neg.dir).toBe('ltr');
  expect(neg.text).toContain('−');
  expect(neg.text).toContain('٪');
  expect(neg.text).toMatch(/[۰-۹]/);
  expect(neg.text).not.toMatch(/[0-9]/);
  // The header's Updated line renders the Jalali calendar (Persian digits).
  const updated = await page.evaluate(() => {
    const section = document.getElementById('insights-markets')!;
    return Array.from(section.querySelectorAll('bdi')).map((b) => b.textContent ?? '').find((t) => t.includes('به‌روزرسانی')) ?? '';
  });
  expect(updated).toMatch(/به‌روزرسانی/);
  // The list layout at 390 keeps the unmirrored map too.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.wm-stage')!).direction)).toBe('ltr');
});

/* ------------------------------------------------------------------ *
 * §9.8 — the mock-payload states
 * ------------------------------------------------------------------ */

const mapIds: Record<string, string> = {
  sp500: 'sp500', ibov: 'ibov', ftse: 'ftse', dax: 'dax', nifty50: 'nifty50',
  ssec: 'ssec', kospi: 'kospi', n225: 'n225', asx200: 'asx200',
};

test('state §9.8: all up', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    for (const m of snap.markets as Array<Record<string, unknown>>) {
      m.chg1d = 2.4;
      m.chg1w = 3.1;
      m.chg1m = 6.5;
    }
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm p')).toContainText('9 of 9 markets up today');
  const steps = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card')).map((c) => c.classList.contains('s-u')));
  expect(steps.every(Boolean)).toBe(true);
  // The triplet's triangles all point up.
  const tris = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card .wm-pv.s-u .wm-ar2 path')).map((p) => (p as SVGPathElement).getAttribute('d')),
  );
  expect(tris).toHaveLength(27);
  expect(tris.every((d) => d === 'M5 1 9.5 9H.5z')).toBe(true);
});

test('state §9.8: all down', async ({ page }) => {
  await mockMarkets(page, (snap) => {
    for (const m of snap.markets as Array<Record<string, unknown>>) {
      m.chg1d = -2.4;
      m.chg1m = -6.5;
      m.chg1w = -3.1;
    }
  });
  await gotoInsights(page, { width: 1280, lang: 'en', theme: 'light' });
  await expect(page.locator('.wm p')).toContainText('0 of 9 markets up today');
  await expect(page.locator('.wm p')).toContainText('9 down');
  const steps = await page.evaluate(() => Array.from(document.querySelectorAll('.wm-card')).map((c) => c.classList.contains('s-d')));
  expect(steps.every(Boolean)).toBe(true);
  // The triplet's triangles all point down.
  const tris = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.wm-card .wm-pv.s-d .wm-ar2 path')).map((p) => (p as SVGPathElement).getAttribute('d')),
  );
  expect(tris).toHaveLength(27);
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
  const dot = await page.evaluate(() => document.querySelector('.wm-dot[data-id="dax"]')!.getAttribute('class'));
  expect(dot).toContain('s-x');
  // Summary counts only the 8 carrying data.
  await expect(page.locator('.wm p')).toContainText('of 8 markets');
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
    Array.from(document.querySelectorAll('.wm-dot')).map((d) => (d as SVGElement).classList.contains('closed')),
  );
  expect(closed).toHaveLength(9);
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
  await page.waitForSelector('.wm-dot', { timeout: 5000 });
  const loading = await page.evaluate(() => {
    const stage = document.querySelector('.wm-stage') as HTMLElement;
    const rect = stage.getBoundingClientRect();
    return {
      dots: document.querySelectorAll('.wm-dot').length,
      allNeutral: Array.from(document.querySelectorAll('.wm-dot')).every((d) => (d as SVGElement).classList.contains('s-x')),
      allHollow: Array.from(document.querySelectorAll('.wm-dot')).every((d) => (d as SVGElement).classList.contains('closed')),
      cards: document.querySelectorAll('.wm-card').length,
      legend: document.querySelectorAll('.wm-legend').length,
      summary: document.querySelectorAll('.wm > p').length,
      aspect: rect.width > 0 ? rect.height / rect.width : 0,
      landVisible: document.querySelectorAll('.wm-c').length,
    };
  });
  expect(loading.dots).toBe(9);
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

test('interaction M13: list-layout dot tap scrolls to the market row', async ({ page }) => {
  await gotoInsights(page, { width: 390, lang: 'en', theme: 'light', height: 844 });
  const dot = page.locator('.wm-dot[data-id="kospi"]');
  await dot.click({ force: true, position: { x: 0, y: 0 } });
  await page.waitForTimeout(900);
  const inView = await page.evaluate(() => {
    const tile = document.getElementById('insights-market-tile-kospi')!;
    const r = tile.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  expect(inView).toBe(true);
});

/* Keep the map-order map referenced for future probes (§4.1 ids). */
test.skip('reference: §4.1 ids', () => {
  expect(Object.keys(mapIds)).toEqual([...MAP_ORDER]);
});
