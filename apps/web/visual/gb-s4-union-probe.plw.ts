/**
 * gb-s4-union-probe.plw.ts — the SECOND GB-S4 variant's independent
 * cross-checks against the MERGED implementation (the union record's
 * robustness pass): the two acceptance areas the merged suite does not
 * cover — the FOUR-weights-on-one-pan worst case at mobile (05 §4.3:
 * "Maximum 4 per pan by construction"; §9 at 360: "verify all four
 * weights in one pan (two rows)"), and the caption AA measured ON the
 * 9% pan TINT (05 §5) rather than on the card surface.
 *
 * A verification-only harness (adds no product state); its results are
 * recorded in PROGRESS.md's union section.
 */

import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The fixture resolves from THIS file's own directory (the GB-S4c
 * environment note: a CWD-relative read passed from apps/web — the
 * documented invocation — but failed from apps/web/visual, where the
 * config file lives). */
const SNAPSHOT_PATH = resolve(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'snapshot.json');

const OVER = (side: string) => `pan ${side} clipped`;

/** Serve a snapshot whose four lanes ALL vote against (the reference
 * prototype's own ?sc=stack scenario, on real corpus-shaped readings):
 * borrowing-costs 2 decade-high pressures, dollar 2 decade-high, stress
 * 2 bottom-of-decade, inflation 2 bottom-of-decade (the table reads
 * running-HOT as the hedge's support — so the LOW side pressures). */
async function serveStack(page: Page): Promise<void> {
  await page.route('**/api/insights', async (route) => {
    const snap = readFileSync(SNAPSHOT_PATH, 'utf8');
    const parsed = JSON.parse(snap) as { generatedAt: string; readings: Array<Record<string, unknown>> };
    const byId = new Map(parsed.readings.map((r) => [r.id as string, r]));
    const set = (id: string, patch: Record<string, unknown>): void => {
      const r = byId.get(id);
      if (r !== undefined) Object.assign(r, patch);
    };
    const quiet = (id: string): void => set(id, { status: 'normal', percentile10y: 0.5, change30d: 0 });
    // All four lanes vote AGAINST (the reference's ?sc=stack on page-shaped
    // readings): every patched voter also gets status normal (the fixture
    // carries its own statuses — e.g. a check-pending stress index would
    // stay unread), and every voter that must NOT fire is quieted.
    set('real-yield-10y', { status: 'normal', value: 2.9, percentile10y: 0.95, change30d: 0.05 });
    set('us10y', { status: 'normal', value: 4.6, percentile10y: 0.95, change30d: 0.05 });
    set('dollar-basket', { status: 'normal', value: 108, percentile10y: 0.95, change30d: 0.6 });
    set('usdjpy', { status: 'normal', value: 155, percentile10y: 0.95, change30d: 0.6 });
    set('stress-stlfsi', { status: 'normal', value: -1.2, percentile10y: 0.02, change30d: -0.1 });
    set('nfci', { status: 'normal', value: -0.62, percentile10y: 0.02, change30d: -0.05 });
    set('us-cpi-yoy', { status: 'normal', value: 1.5, percentile10y: 0.05, change30d: 0 });
    set('us-pce-core-yoy', { status: 'normal', value: 1.4, percentile10y: 0.05, change30d: 0 });
    for (const id of [
      'us30y', 'fed-target', 'fed-expectations', 'ecb-dfr', 'yield-curve-10y2y', 'yield-curve-10y3m',
      'us-japan-10y-gap', 'vix', 'gold-silver', 'cftc-gold-positioning', 'euro-hicp', 'breakeven-5y5y',
    ]) quiet(id);
    await route.fulfill({ json: { ...parsed, readings: [...byId.values()] } });
  });
}

for (const [locale, word] of [['en', 'EN'], ['fa', 'FA']] as const) {
  for (const width of [360, 390] as const) {
    test(`union probe: FOUR weights on one pan fit at ${width} (${word}) — no clip, no scroll`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript((l: string) => window.localStorage.setItem('currena:locale', l), locale);
      await serveStack(page);
      await page.goto('/insights?balance=lanes');
      await page.waitForSelector('[data-balance-visual]', { state: 'visible' });
      await page.waitForTimeout(900);
      await expect(page.locator('[data-balance-pan="against"] [data-balance-weight]')).toHaveCount(4);
      const result = await page.evaluate(() => {
        const overflow = document.scrollingElement.scrollWidth - document.documentElement.clientWidth;
        const pans = [...document.querySelectorAll<HTMLElement>('[data-balance-pan]')].map((p) => ({
          side: p.getAttribute('data-balance-pan'),
          scrollH: p.scrollHeight,
          clientH: p.clientHeight,
        }));
        return { overflow, pans };
      });
      expect(result.overflow).toBeLessThanOrEqual(0);
      for (const pan of result.pans) {
        expect(pan.scrollH, OVER(pan.side ?? '?')).toBeLessThanOrEqual(pan.clientH + 1);
      }
    });
  }
}

/** The caption AA on the 9% pan TINT: the merged suite measures against
 * the card (its background climb skips the pans' background-image
 * gradient); this probe blends the live side token at 9% over the live
 * card surface at the CSS's own alpha and requires AA there too. */
for (const [theme, themeWord] of [['light', 'light'], ['dark', 'dark']] as const) {
  test(`union probe: the pan captions hold AA on the 9% TINT (${themeWord})`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 1000 });
    await page.addInitScript((t: string) => {
      window.localStorage.setItem('currena:locale', 'en');
      if (t === 'dark') window.localStorage.setItem('theme', 'dark');
      else window.localStorage.removeItem('theme');
    }, theme);
    await serveStack(page);
    await page.goto('/insights?balance=lanes');
    await page.waitForSelector('[data-balance-visual]', { state: 'visible' });
    await page.waitForTimeout(600);
    const measured = await page.evaluate(() => {
      const rgb = (css: string): [number, number, number] | null => {
        const hex = css.trim().match(/^#([0-9a-f]{6})$/i);
        if (hex !== null) {
          return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)];
        }
        const m = css.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
        return m === null ? null : [Number(m[1]), Number(m[2]), Number(m[3])];
      };
      const capFor = document.querySelector<HTMLElement>('[data-balance-pan="for"] [class*="pan-cap"]');
      const capAgainst = document.querySelector<HTMLElement>('[data-balance-pan="against"] [class*="pan-cap"]');
      const card = document.querySelector<HTMLElement>('[data-signal-card="merged"]');
      const root = document.documentElement;
      const tok = (name: string): [number, number, number] | null => rgb(getComputedStyle(root).getPropertyValue(name).trim());
      return {
        capFor: capFor !== null ? rgb(getComputedStyle(capFor).color) : null,
        capAgainst: capAgainst !== null ? rgb(getComputedStyle(capAgainst).color) : null,
        card: card !== null ? rgb(getComputedStyle(card).backgroundColor) : null,
        statusNormal: tok('--color-status-normal'),
        statusAlert: tok('--color-status-alert'),
      };
    });
    expect(measured.card).not.toBeNull();
    expect(measured.capFor).not.toBeNull();
    expect(measured.capAgainst).not.toBeNull();
    expect(measured.statusNormal).not.toBeNull();
    expect(measured.statusAlert).not.toBeNull();
    const lum = (c: [number, number, number]): number => {
      const ch = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * ch[0]! + 0.7152 * ch[1]! + 0.0722 * ch[2]!;
    };
    const ratio = (fg: [number, number, number], bg: [number, number, number]): number => {
      const l1 = lum(fg);
      const l2 = lum(bg);
      return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const blend9 = (fg: [number, number, number], bg: [number, number, number]): [number, number, number] =>
      fg.map((v, i) => v * 0.09 + bg[i]! * 0.91) as [number, number, number];
    const card = measured.card!;
    const tintFor = blend9(measured.statusNormal!, card);
    const tintAgainst = blend9(measured.statusAlert!, card);
    const forRatio = ratio(measured.capFor!, tintFor);
    const againstRatio = ratio(measured.capAgainst!, tintAgainst);
    expect(forRatio, `${themeWord} for caption on tint ${forRatio}`).toBeGreaterThanOrEqual(4.5);
    expect(againstRatio, `${themeWord} against caption on tint ${againstRatio}`).toBeGreaterThanOrEqual(4.5);
  });
}
