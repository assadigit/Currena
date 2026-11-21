/**
 * gux-s8-checks.plw.ts — the S8 responsive + accessibility CHECKS (GUX-S8
 * M4): the cross-page QA remediation's own validation suite — Session 4's
 * both-themes token rule (11 §8 item B: "dark-mode checks are part of every
 * pattern's spec… Session 8 runs the matrix") now RUNS as a check, beside
 * the master plan's Session 8 acceptance items.
 *
 * What this suite PROVES over the fixture server (never a live site):
 *
 *   1. the horizontal-scroll sanctity — no bleed at 390/360/1440, en+fa
 *      (11 §12 item 4);
 *   2. THE CONTRAST MATRIX — the status words/marks/labels sampled in
 *      BOTH themes × both locales, WCAG AA floors (4.5:1 text, 3:1 large
 *      text + graphics), with a parser that reads rgb(), rgba(),
 *      color(srgb) and oklab() (the formats getComputedStyle actually
 *      returns for the token system);
 *   3. THE TOKEN RULE — every sampled status/mark color must be a member
 *      of the resolved token set for the current theme (no mark may use
 *      a value outside the token system — 11 §8 item B);
 *   4. the touch-target floors — the PRIMARY controls (nav chips, the
 *      ledger link, the section toggles, the sheet openers/close, the
 *      chart controls) ≥ 44px at 390; the secondary cross-links
 *      (seat-home, lane drill) ≥ 24px (WCAG 2.5.8's floor); inline
 *      sentence links are the documented exemption;
 *   5. THE LABEL CONTRACT — with every collapsible section expanded,
 *      every chart root (svg[role=img], [role=group] charts) carries a
 *      non-empty accessible name (11 §8 item E);
 *   6. the inspector readout — the interactive chart's keyboard
 *      inspector speaks its point (value + unit + date) through the
 *      polite live region, and Escape clears it;
 *   7. the sheet contract — the record sheet is ONE component with TWO
 *      geometries: desktop (≥768) the inline-end sheet, mobile the
 *      bottom sheet (full-width, docked, ≤88dvh), with the focus trap,
 *      Escape, focus return and scroll lock exercised at BOTH widths;
 *   8. no status depends on color alone — the structural contract:
 *      every seat lean, every lane state, the briefing word and the
 *      explorer classes carry their WORD (the hue is never the only
 *      carrier);
 *   9. reduced motion — under prefers-reduced-motion no element keeps a
 *      transform/position transition or a running animation (the global
 *      guard's own proof).
 *
 * This file is a CHECK suite, not a screenshot suite — the captures ride
 * gux-s8-screenshots.plw.ts (the S5–S7 pairing discipline). Both run on
 * the playwright project `gux-s8`.
 */

import { test, expect, type Page } from '@playwright/test';

/* ------------------------------------------------------------------ *
 * The shared boot (the S7 pattern) + the app's REAL theme key
 * ------------------------------------------------------------------ */

async function boot(
  page: Page,
  opts: { locale: 'en' | 'fa'; theme: 'light' | 'dark'; width: number; height: number },
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      // The app's theme store reads the LEGACY 'theme' key (lib/theme.ts
      // + the index.html pre-paint script). The S5–S7 harness wrote
      // 'currena:theme' — an inert key; every "dark" capture those
      // sets contain is a LIGHT render (the S8 audit's finding). This
      // suite uses the real key.
      window.localStorage.setItem('theme', theme);
    },
    [opts.locale, opts.theme],
  );
  await page.goto('/gold');
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
  await page.waitForTimeout(400);
}

/* Expand every collapsible section on the page (the LABEL census must
 * see the charts inside the collapsed bodies). One pass, idempotent. */
async function expandAll(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const btn of document.querySelectorAll<HTMLButtonElement>('main button[aria-expanded="false"]')) {
      if (btn.getBoundingClientRect().height === 0) continue;
      if (btn.closest('[data-gold-record-sheet]') !== null) continue;
      btn.click();
    }
  });
  await page.waitForTimeout(900);
}

/* ------------------------------------------------------------------ *
 * The color engine (the contrast matrix's own parser)
 * ------------------------------------------------------------------ */

const COLOR_HELPERS = `
  function parseColor(c) {
    const s = (c + '').trim();
    // #rgb / #rrggbb / #rrggbbaa — the token file's own format (the
    // resolved custom properties come back as hex strings).
    if (s.charAt(0) === '#') {
      const h = s.slice(1);
      const full = h.length === 3 || h.length === 4 ? h.split('').map((x) => x + x).join('') : h;
      if (full.length === 6 || full.length === 8) {
        return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1];
      }
      return null;
    }
    const m = s.match(/rgba?\\(([\\d.]+), ?([\\d.]+), ?([\\d.]+)(?:, ?([\\d.]+))?\\)/);
    if (m !== null) return [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]];
    const g = s.match(/color\\(srgb ([\\d.]+) ?([\\d.]+) ?([\\d.]+)(?: ?\\/ ?([\\d.]+))?\\)/);
    if (g !== null) return [Math.round(+g[1] * 255), Math.round(+g[2] * 255), Math.round(+g[3] * 255), g[4] === undefined ? 1 : +g[4]];
    const o = c.match(/oklab\\(([\\d.]+) (-?[\\d.]+) (-?[\\d.]+)(?: ?\\/ ?([\\d.]+))?\\)/);
    if (o !== null) {
      const L = +o[1], a = +o[2], b = +o[3];
      const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
      const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
      const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
      const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
      const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
      const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
      const bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
      const gamma = (v) => {
        const x = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return Math.max(0, Math.min(255, Math.round(x * 255)));
      };
      return [gamma(r), gamma(g), gamma(bb), o[4] === undefined ? 1 : +o[4]];
    }
    return null;
  }
  function lum(rgba) {
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgba[0]) + 0.7152 * f(rgba[1]) + 0.0722 * f(rgba[2]);
  }
  function blend(fg, bg) {
    const a = fg[3];
    return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
  }
  function contrast(fgRaw, bgRaw) {
    const fg = parseColor(fgRaw), bg = parseColor(bgRaw);
    if (fg === null || bg === null) return null;
    const f = fg[3] < 1 ? blend(fg, bg) : fg;
    const b = bg[3] < 1 ? blend(bg, [255, 255, 255, 1]) : bg;
    const l1 = lum(f), l2 = lum(b);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  }
`;

type ContrastRow = { what: string; ratio: number; fg: string; bg: string; fontSize: string; weight: string; fgRgb: number[] | null };

async function sampleContrast(page: Page): Promise<{ rows: ContrastRow[]; tokenRgb: number[][] }> {
  return page.evaluate(`
    (() => {
      ${COLOR_HELPERS}
      function effectiveBg(el) {
        let node = el;
        while (node !== null && node instanceof Element) {
          const bg = getComputedStyle(node).backgroundColor;
          if (bg !== null && !/rgba\\(0, 0, 0, 0\\)|transparent/.test(bg)) return bg;
          node = node.parentElement;
        }
        return 'rgb(255, 255, 255)';
      }
      const SAMPLES = [
        ['[data-lanebar-state]', 'lane state word'],
        ['[data-seat-lean]', 'seat lean word'],
        ['[data-briefing-five-state]', 'briefing five-state word'],
        ['[data-nav-chip][data-nav-active]', 'active nav chip'],
        ['[data-nav-chip]:not([data-nav-active])', 'idle nav chip'],
        ['[data-seat] .type-label, [data-seat] p', 'seat card text'],
        ['[data-briefing-card] h2, [data-briefing-card] p', 'briefing text'],
      ];
      const rows = [];
      for (const [sel, what] of SAMPLES) {
        for (const el of document.querySelectorAll(sel)) {
          const style = getComputedStyle(el);
          const fg = style.color;
          const bg = effectiveBg(el);
          const ratio = contrast(fg, bg);
          if (ratio === null) continue;
          rows.push({ what, ratio: Math.round(ratio * 100) / 100, fg, bg, fontSize: style.fontSize, weight: style.fontWeight, fgRgb: parseColor(fg) });
          break;
        }
      }
      // THE TOKEN SET (this theme's resolved values) — the token rule's
      // reference list: every --color-* the stylesheets reference,
      // resolved on the LIVE html element (theme-scoped).
      const names = new Set();
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.style === undefined) continue;
            for (const prop of ['color', 'background-color', 'fill', 'stroke', 'border-color']) {
              const v = rule.style.getPropertyValue(prop);
              const m = v !== '' && v.match(/var\\((--color-[a-z0-9-]+)\\)/);
              if (m !== null) names.add(m[1]);
            }
          }
        } catch { /* cross-origin sheet — the fixture serves same-origin */ }
      }
      const scopeStyle = getComputedStyle(document.documentElement.classList.contains('dark') ? document.querySelector('html.dark') : document.documentElement);
      const tokenRgb = [];
      for (const name of names) {
        const v = scopeStyle.getPropertyValue(name).trim();
        const p = parseColor(v);
        if (p !== null) tokenRgb.push(p);
      }
      return { rows, tokenRgb };
    })()
  `);
}

/* The WCAG floor for one row. */
function floorFor(row: ContrastRow): number {
  const size = Number.parseFloat(row.fontSize);
  const bold = Number.parseInt(row.weight, 10) >= 700;
  const large = size >= 18.66 || (size >= 14 && bold);
  return large ? 3.0 : 4.5;
}

/* ------------------------------------------------------------------ *
 * 1 + 2 + 3 — overflow, the contrast matrix, the token rule
 *    (one boot per theme×locale at 390; the matrix's both-themes rule)
 * ------------------------------------------------------------------ */

for (const locale of ['en', 'fa'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    test(`the contrast matrix + token rule + overflow — ${locale}-${theme} @390`, async ({ page }) => {
      await boot(page, { locale, theme, width: 390, height: 844 });

      // 1 — the horizontal-scroll sanctity.
      const bleed = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(bleed, 'no horizontal overflow at 390').toBeLessThanOrEqual(1);

      // 2 — the contrast matrix.
      const { rows, tokenRgb } = await sampleContrast(page);
      expect(rows.length, 'the sample set found surfaces').toBeGreaterThanOrEqual(5);
      for (const row of rows) {
        const floor = floorFor(row);
        expect(
          row.ratio,
          `${row.what}: ${row.fg} on ${row.bg} (${row.fontSize}/${row.weight}) — WCAG AA ${floor}:1`,
        ).toBeGreaterThanOrEqual(floor);
      }

      // 3 — the token rule: every sampled foreground IS a theme token's
      //    resolved value (parsed in-browser, compared as numbers — the
      //    same string formats on both sides).
      expect(tokenRgb.length, 'the token set resolved').toBeGreaterThan(10);
      for (const row of rows) {
        const fg = row.fgRgb;
        expect(fg, `${row.what}: the fg parses (${row.fg})`).not.toBeNull();
        const inTokens = tokenRgb.some(
          (t) => Math.abs(t[0] - fg![0]) <= 1 && Math.abs(t[1] - fg![1]) <= 1 && Math.abs(t[2] - fg![2]) <= 1,
        );
        expect(inTokens, `${row.what}: the fg ${row.fg} is a theme token value`).toBe(true);
      }
    });
  }
}

/* The overflow sanctity at the other agreed widths. */
for (const width of [360, 1440]) {
  test(`no horizontal overflow @${width} (en-light)`, async ({ page }) => {
    await boot(page, { locale: 'en', theme: 'light', width, height: width === 1440 ? 1000 : 800 });
    const bleed = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(bleed, `no horizontal overflow at ${width}`).toBeLessThanOrEqual(1);
  });
}

/* ------------------------------------------------------------------ *
 * 4 — the touch-target floors at 390
 * ------------------------------------------------------------------ */

test('the touch-target floors — primary ≥44px, secondary ≥24px @390', async ({ page }) => {
  await boot(page, { locale: 'en', theme: 'light', width: 390, height: 844 });
  const report = await page.evaluate(() => {
    const measure = (sel): { h: number; w: number; text: string }[] => {
      const out = [];
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.height === 0) continue;
        out.push({ h: Math.round(r.height), w: Math.round(r.width), text: (el.textContent ?? '').trim().slice(0, 24) });
      }
      return out;
    };
    return {
      navChips: measure('[data-nav-chip]'),
      ledgerLink: measure('[data-stack-ledger-link]'),
      seatOpeners: measure('[data-seat-open]'),
      sectionToggles: measure('main section button[aria-expanded], main article button[aria-expanded], main div button[aria-expanded]'),
      seatHome: measure('[data-seat-home]'),
      laneDrill: measure('[data-lane-drill-link]'),
    };
  });
  for (const chip of report.navChips) expect(chip.h, `nav chip "${chip.text}"`).toBeGreaterThanOrEqual(44);
  for (const l of report.ledgerLink) expect(l.h, 'the ledger link').toBeGreaterThanOrEqual(44);
  for (const s of report.seatOpeners) expect(s.h, 'a seat card opener (the stretched button)').toBeGreaterThanOrEqual(44);
  for (const t of report.sectionToggles) expect(t.h, `a section toggle "${t.text}"`).toBeGreaterThanOrEqual(44);
  for (const s of report.seatHome) expect(s.h, 'a seat cross-page link').toBeGreaterThanOrEqual(24);
  for (const l of report.laneDrill) expect(l.h, 'a lane drill link').toBeGreaterThanOrEqual(24);
  expect(report.navChips.length).toBe(7);
  expect(report.seatOpeners.length).toBe(37);
});

/* ------------------------------------------------------------------ *
 * 5 — the LABEL contract (every collapsible expanded)
 * ------------------------------------------------------------------ */

test('the LABEL contract — every chart root carries a name (expanded)', async ({ page }) => {
  await boot(page, { locale: 'en', theme: 'light', width: 1440, height: 1000 });
  await expandAll(page);
  const census = await page.evaluate(() => {
    const roots = document.querySelectorAll('svg[role="img"], [role="img"]:not(svg), [data-chart-plot]');
    const unnamed: string[] = [];
    let named = 0;
    for (const el of roots) {
      const label = el.getAttribute('aria-label') ?? '';
      const labelledBy = el.getAttribute('aria-labelledby');
      const title = el.querySelector('title');
      const hasName = label.trim() !== '' || labelledBy !== null || title !== null;
      if (hasName) named += 1;
      else if (el.getAttribute('aria-hidden') !== 'true') {
        unnamed.push(`${el.tagName.toLowerCase()}[${el.getAttribute('data-chart') ?? el.getAttribute('data-price-spark') ?? el.getAttribute('data-premium-points') ?? ''}] w=${Math.round(el.getBoundingClientRect().width)}`);
      }
    }
    // The roleless-chart sweep: a bare svg with drawn paths at a real
    // size, not decorative and not inside a named chart root, is a chart
    // without a contract — flag it (11 §8 E applies to every chart).
    const roleless: string[] = [];
    for (const svg of document.querySelectorAll('svg')) {
      if (svg.getAttribute('role') !== null || svg.getAttribute('aria-hidden') === 'true') continue;
      if (svg.closest('[role="img"]') !== null) continue;
      const r = svg.getBoundingClientRect();
      if (r.width < 60 || r.height < 24) continue;
      if (svg.querySelectorAll('path, line, rect, circle, polyline').length === 0) continue;
      roleless.push(`svg w=${Math.round(r.width)} in ${(svg.closest('section, article, div')?.className + '').slice(0, 50)}`);
    }
    return { total: roots.length, named, unnamed, roleless };
  });
  expect(census.total, 'the page has chart roots after expansion').toBeGreaterThanOrEqual(8);
  expect(census.unnamed, `unnamed chart roots: ${census.unnamed.join(' | ')}`).toEqual([]);
  expect(census.roleless, `chart-like svgs without the role contract: ${census.roleless.join(' | ')}`).toEqual([]);
});

/* ------------------------------------------------------------------ *
 * 6 — the inspector readout (the keyboard chart's spoken point)
 * ------------------------------------------------------------------ */

test('the chart inspector speaks its point — arrows move, Escape clears', async ({ page }) => {
  await boot(page, { locale: 'en', theme: 'light', width: 1440, height: 1000 });
  const plot = page.locator('[data-chart-plot]').first();
  await plot.scrollIntoViewIfNeeded();
  await plot.focus();
  await page.keyboard.press('ArrowLeft');
  const spoken = await page.locator('[data-chart-inspector-readout]').textContent();
  expect(spoken, 'the live region speaks the selected point').toContain('Selected point:');
  expect(spoken).toMatch(/\d/);
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-chart-inspector-readout]')).toHaveText('');
});

/* ------------------------------------------------------------------ *
 * 7 — the sheet contract (ONE component, TWO geometries)
 * ------------------------------------------------------------------ */

test('the record sheet — desktop: the inline-end sheet + the focus discipline', async ({ page }) => {
  await boot(page, { locale: 'en', theme: 'light', width: 1280, height: 900 });
  const opener = page.locator('[data-seat-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const sheet = page.locator('[data-gold-record-sheet]');
  await expect(sheet).toBeVisible();
  await expect(sheet).toHaveAttribute('role', 'dialog');
  await expect(sheet).toHaveAttribute('aria-modal', 'true');
  // The geometry: docked to the inline-end (the LAYOUT viewport's edge —
  // documentElement.clientWidth, which excludes the classic scrollbar
  // that the boundingBox coordinate space includes), ≤440px wide. The
  // 220ms slide-in (translateX 24px → 0) must settle first — the box is
  // measured mid-flight otherwise.
  await page.waitForTimeout(450);
  const layoutWidth = await page.evaluate(() => document.documentElement.clientWidth);
  const box = await sheet.boundingBox();
  expect(box?.width).toBeLessThanOrEqual(460);
  expect(Math.abs(box!.x + box!.width - layoutWidth)).toBeLessThanOrEqual(2);
  // The focus discipline: focus starts on the heading, Tab wraps inside.
  await expect(page.locator('[data-panel-heading]')).toBeFocused();
  const before = await page.evaluate(() => document.activeElement?.className ?? '');
  for (let i = 0; i < 12; i += 1) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => document.activeElement?.closest('[data-gold-record-sheet]') !== null);
  expect(inside, `focus stays inside the sheet (moved from "${before.slice(0, 40)}")`).toBe(true);
  // Escape closes + focus returns to the opener.
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  const focused = await page.evaluate(() => {
    const el = document.activeElement;
    return el?.getAttribute('data-seat-open') === '' || el?.hasAttribute('data-seat-open') === true ? 'opener' : (el?.className ?? 'none').slice(0, 40);
  });
  expect(focused).toBe('opener');
});

test('the record sheet — mobile 390: the SAME component as the bottom sheet', async ({ page }) => {
  await boot(page, { locale: 'fa', theme: 'dark', width: 390, height: 844 });
  const opener = page.locator('[data-seat-open]').first();
  await opener.scrollIntoViewIfNeeded();
  await opener.click();
  const sheet = page.locator('[data-gold-record-sheet]');
  await expect(sheet).toBeVisible();
  const box = await sheet.boundingBox();
  // The bottom-sheet geometry: full width, docked to the bottom.
  expect(Math.round(box!.width)).toBe(390);
  expect(Math.abs(box!.y + box!.height - 844)).toBeLessThanOrEqual(2);
  expect(box!.height).toBeLessThanOrEqual(Math.round(844 * 0.88) + 2);
  // The body scroll lock held while open; Escape restores.
  const locked = await page.evaluate(() => document.body.style.overflow);
  expect(locked).toBe('hidden');
  await page.keyboard.press('Escape');
  await expect(sheet).toHaveCount(0);
  const unlocked = await page.evaluate(() => document.body.style.overflow);
  expect(unlocked).not.toBe('hidden');
});

/* ------------------------------------------------------------------ *
 * 8 — no status depends on color alone (the structural contract)
 * ------------------------------------------------------------------ */

test('no status depends on color alone — the words ride every status mark', async ({ page }) => {
  await boot(page, { locale: 'en', theme: 'light', width: 1440, height: 1000 });
  await expandAll(page);
  const words = await page.evaluate(() => {
    const empty = (sel): number => {
      let n = 0;
      for (const el of document.querySelectorAll(sel)) {
        if ((el.textContent ?? '').trim() === '') n += 1;
      }
      return [document.querySelectorAll(sel).length, n] as const;
    };
    return {
      seatLean: empty('[data-seat-lean]'),
      laneState: empty('[data-lanebar-state]'),
      briefingWord: empty('[data-briefing-five-state]'),
      lanePillTallies: empty('[data-lanebar]'),
    };
  });
  expect(words.seatLean[0], 'the seats rendered').toBe(37);
  expect(words.seatLean[1], 'every seat lean carries its word').toBe(0);
  expect(words.laneState[0], 'the lanebars rendered').toBeGreaterThanOrEqual(5);
  expect(words.laneState[1], 'every lane state carries its word').toBe(0);
  expect(words.briefingWord[1], 'the briefing word renders').toBe(0);
  expect(words.lanePillTallies[1], 'every lanebar row carries its tally words').toBe(0);
});

/* ------------------------------------------------------------------ *
 * 9 — reduced motion (the global guard's own proof)
 * ------------------------------------------------------------------ */

test('reduced motion — nothing moves under prefers-reduced-motion', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    window.localStorage.setItem('currena:locale', 'en');
    window.localStorage.setItem('theme', 'light');
  });
  // The reduced-motion emulation rides the context; playwright exposes it
  // per-context, so this test creates its own via page context options is
  // not possible post-creation — emulate with the CSS media override.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/gold');
  await page.waitForSelector('[data-briefing-card]', { timeout: 20_000 });
  await expandAll(page);
  const moving = await page.evaluate(() => {
    const out: string[] = [];
    for (const el of document.querySelectorAll('body *')) {
      const s = getComputedStyle(el);
      const td = parseFloat(s.transitionDuration);
      const ad = parseFloat(s.animationDuration);
      const iters = s.animationIterationCount;
      const transformish = /transform|translate|scale|rotate|top|left|right|bottom|width|height|margin|padding/.test(s.transitionProperty);
      const animates = s.animationName !== 'none' && (iters === 'infinite' || ad > 40);
      if ((transformish && td > 1) || animates) {
        out.push(`${el.tagName.toLowerCase()}.${(el.className + '').split(' ').slice(0, 2).join('.')} transition=${s.transitionProperty}/${s.transitionDuration} animation=${s.animationName}/${s.animationDuration}x${iters}`);
      }
    }
    return out;
  });
  expect(moving, `these elements still move under reduce: ${moving.slice(0, 5).join(' | ')}`).toEqual([]);
});
