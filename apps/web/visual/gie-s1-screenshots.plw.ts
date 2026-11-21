/**
 * gie-s1-screenshots.plw.ts — Gold Intelligence & Visual Explanation
 * Session 1 (the current-state and evidence audit): the LIVE baseline
 * capture over production (https://currena.ir/gold), read-only.
 *
 * The programme's S1 spec (01-GOLD_INTELLIGENCE_AND_VISUAL_EXPLANATION_
 * UPGRADE.md §15 S1 M1): "Capture desktop/mobile screenshots in EN and
 * fa RTL; record route, viewport, date and build/commit" — plus the
 * section-by-section and expanded-state passes the comprehension-gap
 * audit walks (M3).
 *
 * THE S8 HARNESS DISCIPLINE (S8-D3): the boot writes the app's REAL
 * theme key — the LEGACY 'theme' (lib/theme.ts + the index.html
 * pre-paint script) — never the inert 'currena:theme'.
 *
 * READ-ONLY: every capture is a visitor's plain GET of the live page.
 * No interaction with providers, no admin surface, no POST anywhere.
 * Live data is what it is at capture time — the run records the live
 * state (verdict / lanes / price / as-of) inside fetch-audit.json.
 *
 * The set (every shot records route, viewport, locale, theme, date):
 *   - 00 — the network audit + the live-state record (fetch-audit.json);
 *   - 01..10 — en desktop 1440 light: the full page + every section;
 *   - 11..14 — en desktop expanded states (on-ramp, expectations,
 *     a seat lane drill, the record sheet);
 *   - 20..23 — fa desktop RTL (full + hero + seats + tail);
 *   - 30..33 — en mobile 390 (full + hero + seats + nav);
 *   - 40..41 — fa mobile RTL (full + hero);
 *   - 50..51 — the dark-theme pair (en desktop full + hero);
 *   - 60 — fa dark hero (the RTL + dark composition).
 */

import { test } from '@playwright/test';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'docs',
  'audits',
  '2026-11-21-gold-intelligence-s1',
  'baseline-screenshots',
);

/** The per-page console/page-error census (the S1 honesty rule). */
const consoleErrors: string[] = [];
const pageErrors: string[] = [];
/** The network audit: every request the audited full load makes. */
const requests: string[] = [];
/** The live-state record. */
const liveState: Record<string, unknown> = {};

test.beforeAll(() => {
  mkdirSync(SHOT_DIR, { recursive: true });
});

test.afterAll(() => {
  writeFileSync(
    path.join(SHOT_DIR, 'fetch-audit.json'),
    JSON.stringify(
      {
        origin: 'https://currena.ir',
        route: '/gold',
        capturedAt: new Date().toISOString(),
        requests,
        liveState,
        consoleErrors,
        pageErrors,
      },
      null,
      2,
    ),
  );
});

type Pair = { locale: 'en' | 'fa'; theme: 'light' | 'dark' };

/** The boot (the S8 real-key discipline) + the S9 wait contract. */
async function boot(
  page: import('@playwright/test').Page,
  opts: Pair & { width: number; height: number },
  audit = false,
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      // THE REAL KEY (S8-D3).
      window.localStorage.setItem('theme', theme);
    },
    [opts.locale, opts.theme],
  );
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[console] ${msg.text()}`);
  });
  page.on('pageerror', (err) => pageErrors.push(`[pageerror] ${String(err)}`));
  if (audit) {
    page.on('request', (req) => {
      if (req.resourceType() === 'document' || req.resourceType() === 'xhr' || req.resourceType() === 'fetch') {
        requests.push(req.url());
      }
    });
  }
  await page.goto('/gold', { waitUntil: 'load', timeout: 60_000 });
  await page.waitForSelector('[data-briefing-card]', { timeout: 45_000 });
  await page.waitForSelector('[data-gold-signals]', { timeout: 45_000 });
  await page.waitForTimeout(600);
}

/** Scroll a section into view and let it settle. */
async function section(page: import('@playwright/test').Page, selector: string): Promise<void> {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
}

/** Walk the whole page so near-viewport lazy boundaries mount. */
async function walk(page: import('@playwright/test').Page): Promise<void> {
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
}

/** One capture: name + viewport + locale/theme + the settle step. */
async function shot(
  page: import('@playwright/test').Page,
  name: string,
  opts: Pair & { width: number; height: number },
  settle: (page: import('@playwright/test').Page) => Promise<void>,
  fullPage = false,
): Promise<void> {
  await boot(page, opts);
  await settle(page);
  await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`), fullPage });
}

const DESKTOP = { width: 1440, height: 1000 };
const MOBILE = { width: 390, height: 844 };

test.describe('GIE-S1 — the audit load (en desktop)', () => {
  test('00 the network audit + the live-state record', async ({ page }) => {
    await boot(page, { locale: 'en', theme: 'light', ...DESKTOP }, true);
    await walk(page);

    // The live-state record: the briefing headline + the five-state word +
    // the stack verdict + the lane sides + the hero's price + the as-of.
    const headline = (await page.locator('[data-briefing-headline]').first().textContent()) ?? null;
    const outlook = await page.locator('[data-briefing-outlook]').first().getAttribute('data-briefing-outlook');
    const fiveState = await page.locator('[data-briefing-five-state]').first().getAttribute('data-briefing-five-state');
    const verdict = await page.locator('[data-stack-verdict]').first().getAttribute('data-stack-verdict');
    const laneSides = await page.locator('[data-lanebar]').evaluateAll((bars) =>
      bars.map((b) => `${b.getAttribute('data-lanebar')}:${b.getAttribute('data-lanebar-side')}`),
    );
    const heroText = (await page.locator('[data-gold-hero]').first().textContent()) ?? '';
    const asOf = (await page.locator('[data-asof-chip]').first().textContent()) ?? null;
    // The comprehension audit's own census: how many seat chips, context
    // cards, position cards, and collapsibles the visitor faces.
    const census = await page.evaluate(() => ({
      seats: document.querySelectorAll('[data-seat]').length,
      laneSections: document.querySelectorAll('[data-lane]').length,
      contextCards: document.querySelectorAll('[data-context-card]').length,
      positionCards: document.querySelectorAll('[data-gold-position-card]').length,
      collapsed: document.querySelectorAll('button[aria-expanded="false"]').length,
      navChips: document.querySelectorAll('[data-nav-chip]').length,
      h2s: Array.from(document.querySelectorAll('h2')).map((h) => h.textContent?.trim()).filter(Boolean),
    }));
    liveState.headline = headline;
    liveState.outlook = outlook;
    liveState.outlookFiveState = fiveState;
    liveState.stackVerdict = verdict;
    liveState.laneBars = laneSides;
    liveState.heroPriceSnippet = heroText.slice(0, 400);
    liveState.heroAsOf = asOf;
    liveState.census = census;
    liveState.title = await page.title();
    liveState.pageHeightPx = await page.evaluate(() => document.documentElement.scrollHeight);
    // The 15-second probe: what a first-time visitor sees in the first
    // viewport (the comprehension gap's primary evidence).
    liveState.firstViewport = await page.evaluate(() => {
      const hero = document.querySelector('[data-gold-hero]');
      return hero !== null ? (hero.textContent ?? '').slice(0, 600) : null;
    });
  });
});

test.describe('GIE-S1 — en desktop 1440 light', () => {
  test('01 the full page', async ({ page }) => {
    await shot(page, '01-en-desktop-1440-full', { locale: 'en', theme: 'light', ...DESKTOP }, walk, true);
  });

  test('02 the hero (price + BriefingCard + CompositionStack)', async ({ page }) => {
    await shot(page, '02-en-desktop-hero', { locale: 'en', theme: 'light', ...DESKTOP }, async () => {});
  });

  test('03 the explanation band (Zone D)', async ({ page }) => {
    await shot(page, '03-en-desktop-zoneD', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-zone-d');
    });
  });

  test('04 the Iran bridge band (Zone F)', async ({ page }) => {
    await shot(page, '04-en-desktop-zoneF', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '[data-gold-zone-f-band]');
    });
  });

  test('05 the Signals section', async ({ page }) => {
    await shot(page, '05-en-desktop-signals', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#insights-signals');
    });
  });

  test('06 the seats (the five lanes)', async ({ page }) => {
    await shot(page, '06-en-desktop-seats', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-seats');
    });
  });

  test('07 the TA reference band', async ({ page }) => {
    await shot(page, '07-en-desktop-ta', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-ta');
    });
  });

  test('08 the context cards + Zone K demand', async ({ page }) => {
    await shot(page, '08-en-desktop-context-zoneK', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-context');
      await p.waitForTimeout(700);
    });
  });

  test('09 the positions + the relationship explorer', async ({ page }) => {
    await shot(page, '09-en-desktop-positions-relationships', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-positions');
      await p.waitForTimeout(1200);
    });
  });

  test('10 the page tail (Zone O + publication notes)', async ({ page }) => {
    await shot(page, '10-en-desktop-tail', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-positions');
      await p.evaluate(() => window.scrollBy(0, 900));
      await p.waitForTimeout(1200);
    });
  });
});

test.describe('GIE-S1 — en desktop expanded states', () => {
  test('11 the education on-ramp expanded', async ({ page }) => {
    await shot(page, '11-en-desktop-onramp-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-onramp');
      await p.locator('[data-onramp-toggle]').click();
      await p.waitForTimeout(700);
      await p.locator('#gold-onramp').scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
    });
  });

  test('12 the expectations strip expanded', async ({ page }) => {
    await shot(page, '12-en-desktop-expectations-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '[data-gold-expectations]');
      await p.locator('[data-gold-expectations] button[aria-expanded]').click();
      await p.waitForTimeout(700);
    });
  });

  test('13 a seat-lane record (the drill-in link)', async ({ page }) => {
    await shot(page, '13-en-desktop-seat-drill', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-onramp');
      // The on-ramp's lane closes are the live drill links (#lane-<lane>).
      const drill = p.locator('a[href^="#lane-"]').first();
      if ((await drill.count()) > 0) {
        await drill.click();
        await p.waitForTimeout(900);
      }
    });
  });

  test('14 a context card record sheet (the details panel)', async ({ page }) => {
    await shot(page, '14-en-desktop-context-details', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-context');
      const opener = p.locator('[data-context-card] button, [data-context-card] a').first();
      if ((await opener.count()) > 0) {
        await opener.click();
        await p.waitForTimeout(900);
      }
    });
  });
});

test.describe('GIE-S1 — fa desktop RTL 1440 light', () => {
  test('20 the full page (fa)', async ({ page }) => {
    await shot(page, '20-fa-desktop-1440-full', { locale: 'fa', theme: 'light', ...DESKTOP }, walk, true);
  });

  test('21 the hero (fa RTL)', async ({ page }) => {
    await shot(page, '21-fa-desktop-hero', { locale: 'fa', theme: 'light', ...DESKTOP }, async () => {});
  });

  test('22 the seats (fa RTL)', async ({ page }) => {
    await shot(page, '22-fa-desktop-seats', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-seats');
    });
  });

  test('23 the tail (fa RTL)', async ({ page }) => {
    await shot(page, '23-fa-desktop-tail', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-positions');
      await p.evaluate(() => window.scrollBy(0, 900));
      await p.waitForTimeout(1200);
    });
  });
});

test.describe('GIE-S1 — en mobile 390', () => {
  test('30 the full page (mobile)', async ({ page }) => {
    await shot(page, '30-en-mobile-390-full', { locale: 'en', theme: 'light', ...MOBILE }, walk, true);
  });

  test('31 the hero (mobile)', async ({ page }) => {
    await shot(page, '31-en-mobile-hero', { locale: 'en', theme: 'light', ...MOBILE }, async () => {});
  });

  test('32 the seats (mobile)', async ({ page }) => {
    await shot(page, '32-en-mobile-seats', { locale: 'en', theme: 'light', ...MOBILE }, async (p) => {
      await section(p, '#gold-seats');
    });
  });

  test('33 the section nav (mobile)', async ({ page }) => {
    await shot(page, '33-en-mobile-nav', { locale: 'en', theme: 'light', ...MOBILE }, async (p) => {
      await p.evaluate(() => window.scrollTo(0, 600));
      await p.waitForTimeout(900);
    });
  });
});

test.describe('GIE-S1 — fa mobile RTL 390', () => {
  test('40 the full page (fa mobile)', async ({ page }) => {
    await shot(page, '40-fa-mobile-390-full', { locale: 'fa', theme: 'light', ...MOBILE }, walk, true);
  });

  test('41 the hero (fa mobile)', async ({ page }) => {
    await shot(page, '41-fa-mobile-hero', { locale: 'fa', theme: 'light', ...MOBILE }, async () => {});
  });
});

test.describe('GIE-S1 — the dark-theme pairs', () => {
  test('50 the full page (en dark)', async ({ page }) => {
    await shot(page, '50-en-desktop-dark-full', { locale: 'en', theme: 'dark', ...DESKTOP }, walk, true);
  });

  test('51 the hero (en dark)', async ({ page }) => {
    await shot(page, '51-en-desktop-dark-hero', { locale: 'en', theme: 'dark', ...DESKTOP }, async () => {});
  });

  test('60 the hero (fa dark RTL)', async ({ page }) => {
    await shot(page, '60-fa-desktop-dark-hero', { locale: 'fa', theme: 'dark', ...DESKTOP }, async () => {});
  });
});
