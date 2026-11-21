/**
 * gux-s9-screenshots.plw.ts — GUX Session 9 (the FINAL session): the S1
 * screenshot matrix REPEATED over LIVE production (the deployed S8 close
 * — currena-api 2f101b25's tree), at the same sizes (1440 desktop / 390
 * mobile), locales (en / fa) and themes (light / dark) the S1 baseline
 * used. The file names mirror the S1 set one-for-one so the before/after
 * comparison pairs them directly:
 * `baseline-screenshots/01-en-desktop-1440-full.png` (S1) vs
 * `baseline-screenshots/s9/01-en-desktop-1440-full.png` (S9).
 *
 * THE S8 HARNESS DISCIPLINE (S8-D3) carries over: the boot writes the
 * app's REAL theme key — the LEGACY 'theme' (lib/theme.ts + the
 * index.html pre-paint script) — never the inert 'currena:theme' that
 * made the S5-S7 "dark" pairs light renders. The s9 dark pairs are
 * genuinely dark (the s8 set's measured-RGB≈30 lineage).
 *
 * READ-ONLY: every capture is a visitor's plain GET of the live page.
 * No interaction with providers, no admin surface, no POST anywhere.
 * Live data is what it is at capture time — the run records the live
 * state (verdict / lanes / price) inside fetch-audit.json, exactly as
 * the S1 baseline recorded its live state in the README.
 *
 * The set:
 *   - 00 — the network audit + the live-state record (fetch-audit.json:
 *     every request one full load makes — the S9 "no unapproved fetch"
 *     evidence — plus the console/page-error census for the whole run);
 *   - 01-31 — the S1 matrix, the same names, the same sections (the
 *     sections' PRESENTATIONS are the program's redesigns; the ids and
 *     anchors are the R10 contract, stable since S1);
 *   - 32-35 — the program's own post-S5 surfaces live (the docked nav,
 *     the relationship explorer, the record sheet, the chart inspector
 *     with its spoken readout parked on a point).
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SHOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..',
  'docs',
  'gold-redesign',
  'baseline-screenshots',
  's9',
);

/** The per-page console/page-error census (the S1 honesty rule). */
const consoleErrors: string[] = [];
const pageErrors: string[] = [];
/** The network audit: every request the audited full load makes. */
const requests: string[] = [];
/** The live-state record (the S1 README's "live state at capture time"). */
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

/**
 * The boot (the S8 real-key discipline): set the locale + the REAL theme
 * key, then load the live page and wait for the redesigned hero's
 * BriefingCard (the S8 wait contract) plus the Signals block (the second
 * fetch landed — the section shot below never races the cold skeleton).
 * The request tap only attaches on the audited load.
 */
async function boot(
  page: import('@playwright/test').Page,
  opts: Pair & { width: number; height: number },
  audit = false,
): Promise<void> {
  await page.setViewportSize({ width: opts.width, height: opts.height });
  await page.addInitScript(
    ([locale, theme]) => {
      window.localStorage.setItem('currena:locale', locale);
      // THE REAL KEY (S8-D3 — see the file header).
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

/** Scroll a section into view and let it settle (mounts lazy boundaries
 * — GoldTail and GoldRelationships mount near-viewport; charts settle). */
async function section(page: import('@playwright/test').Page, selector: string): Promise<void> {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
}

/** One capture: name + viewport + locale/theme + the settle scroll. */
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

test.describe('the S9 final matrix — the audit load (en desktop)', () => {
  test('00 the network audit + the live-state record', async ({ page }) => {
    await boot(page, { locale: 'en', theme: 'light', ...DESKTOP }, true);
    // Walk the whole page: mounts every near-viewport lazy boundary so
    // the audit sees the requests a complete read makes.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(1600);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);

    // The live-state record (the S1 README's discipline): the briefing
    // headline + the five-state outlook + the stack verdict + the lane
    // sides + the hero's price block + the data-as-of line.
    const headline = (await page.locator('[data-briefing-headline]').first().textContent()) ?? null;
    const outlook = await page.locator('[data-briefing-outlook]').first().getAttribute('data-briefing-outlook');
    const fiveState = await page.locator('[data-briefing-five-state]').first().getAttribute('data-briefing-five-state');
    const verdict = await page.locator('[data-stack-verdict]').first().getAttribute('data-stack-verdict');
    const laneSides = await page.locator('[data-lanebar]').evaluateAll((bars) =>
      bars.map((b) => `${b.getAttribute('data-lanebar')}:${b.getAttribute('data-lanebar-side')}`),
    );
    const heroText = (await page.locator('[data-gold-hero]').first().textContent()) ?? '';
    const asOf = (await page.locator('[data-asof-chip]').first().textContent()) ?? null;
    liveState.headline = headline;
    liveState.outlook = outlook;
    liveState.outlookFiveState = fiveState;
    liveState.stackVerdict = verdict;
    liveState.laneBars = laneSides;
    liveState.heroPriceSnippet = heroText.slice(0, 400);
    liveState.heroAsOf = asOf;
    liveState.title = await page.title();
  });
});

test.describe('the S9 final matrix — the S1 list repeated live (en desktop 1440 light)', () => {
  test('01 the full page', async ({ page }) => {
    await shot(page, '01-en-desktop-1440-full', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      // Walk the whole page first: the near-viewport lazy boundaries
      // (GoldTail + GoldRelationships) must mount BEFORE the fullPage
      // capture — a fullPage screenshot photographs the mounted DOM only.
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1600);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(600);
    }, true);
  });

  test('02 the hero', async ({ page }) => {
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

  test('08 the context cards (RATIOS + FLOWS)', async ({ page }) => {
    await shot(page, '08-en-desktop-context', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-context');
    });
  });

  test('09 the Zone K demand plumbing', async ({ page }) => {
    await shot(page, '09-en-desktop-zoneK', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '[data-cb-chart]');
      await p.waitForTimeout(700);
    });
  });

  test('10 the page tail (positions + Zone O + publication notes)', async ({ page }) => {
    await shot(page, '10-en-desktop-tail-positions-zoneO-pubnotes', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-positions');
    });
  });

  test('13 the education on-ramp expanded', async ({ page }) => {
    await shot(page, '13-en-desktop-onramp-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-onramp');
      await p.locator('[data-onramp-toggle]').click();
      await p.waitForTimeout(700);
      await p.locator('#gold-onramp').scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
    });
  });

  test('14 the expectations strip expanded', async ({ page }) => {
    await shot(page, '14-en-desktop-expectations-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '[data-gold-expectations]');
      await p.locator('[data-gold-expectations] button[aria-expanded]').click();
      await p.waitForTimeout(700);
    });
  });

  test('15 the hero time machine open', async ({ page }) => {
    await shot(page, '15-en-desktop-hero-timemachine-open', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await p.locator('[data-gold-time-machine] button[aria-expanded]').click();
      await p.waitForTimeout(900);
    });
  });

  test('16 the Episode Explorer band expanded', async ({ page }) => {
    await shot(page, '16-en-desktop-episodes-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      // The tail is near-viewport lazy — the zone-o ids do not exist until
      // the boundary mounts; scroll the page's foot first (the S8-states
      // pattern), then interact.
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1500);
      const toggle = p.locator('[data-gold-zone-o-band] button[aria-expanded]').first();
      await toggle.click();
      await p.waitForTimeout(700);
      await p.locator('[data-gold-zone-o-band]').first().scrollIntoViewIfNeeded();
      await p.waitForTimeout(500);
    });
  });

  test('17 the if-you-would-bought calculator expanded', async ({ page }) => {
    await shot(page, '17-en-desktop-ifbought-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      // Same lazy-tail discipline as 16.
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1500);
      await p.locator('[data-gold-ifbought] button[aria-expanded]').click();
      await p.waitForTimeout(700);
      await p.locator('[data-gold-ifbought]').first().scrollIntoViewIfNeeded();
      await p.waitForTimeout(500);
    });
  });

  test('18 the publication notes expanded (the licence wall)', async ({ page }) => {
    await shot(page, '18-en-desktop-pubnotes-expanded', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      // Same lazy-tail discipline as 16.
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1500);
      await p.locator('[data-pubnotes-toggle]').click();
      await p.waitForTimeout(700);
      await p.locator('[data-gold-blocked]').first().scrollIntoViewIfNeeded();
      await p.waitForTimeout(500);
    });
  });
});

test.describe('the S9 final matrix — fa desktop 1440 light (RTL)', () => {
  test('19 the full page', async ({ page }) => {
    await shot(page, '19-fa-desktop-1440-full', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1600);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(600);
    }, true);
  });

  test('20 the hero', async ({ page }) => {
    await shot(page, '20-fa-desktop-hero', { locale: 'fa', theme: 'light', ...DESKTOP }, async () => {});
  });

  test('21 the Iran bridge (fa copy, Tehran board)', async ({ page }) => {
    await shot(page, '21-fa-desktop-zoneF-bridge', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '[data-gold-zone-f-band]');
    });
  });

  test('22 the seats (fa)', async ({ page }) => {
    await shot(page, '22-fa-desktop-seats', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-seats');
    });
  });

  test('23 the context cards (fa)', async ({ page }) => {
    await shot(page, '23-fa-desktop-context', { locale: 'fa', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-context');
    });
  });
});

test.describe('the S9 final matrix — en mobile 390 light', () => {
  test('24 the full page', async ({ page }) => {
    await shot(page, '24-en-mobile-390-full', { locale: 'en', theme: 'light', ...MOBILE }, async (p) => {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1600);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(600);
    }, true);
  });

  test('25 the mobile hero', async ({ page }) => {
    await shot(page, '25-en-mobile-hero', { locale: 'en', theme: 'light', ...MOBILE }, async () => {});
  });

  test('26 the mobile seats', async ({ page }) => {
    await shot(page, '26-en-mobile-seats', { locale: 'en', theme: 'light', ...MOBILE }, async (p) => {
      await section(p, '#gold-seats');
    });
  });

  test('27 the mobile context', async ({ page }) => {
    await shot(page, '27-en-mobile-context', { locale: 'en', theme: 'light', ...MOBILE }, async (p) => {
      await section(p, '#gold-context');
    });
  });
});

test.describe('the S9 final matrix — fa mobile 390 light (RTL)', () => {
  test('28 the full page', async ({ page }) => {
    await shot(page, '28-fa-mobile-390-full', { locale: 'fa', theme: 'light', ...MOBILE }, async (p) => {
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(1600);
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.waitForTimeout(600);
    }, true);
  });

  test('29 the mobile hero (fa)', async ({ page }) => {
    await shot(page, '29-fa-mobile-hero', { locale: 'fa', theme: 'light', ...MOBILE }, async () => {});
  });
});

test.describe('the S9 final matrix — en desktop 1440 DARK (the S8 real-key discipline)', () => {
  test('30 the hero', async ({ page }) => {
    await shot(page, '30-en-desktop-dark-hero', { locale: 'en', theme: 'dark', ...DESKTOP }, async () => {});
  });

  test('31 the seats', async ({ page }) => {
    await shot(page, '31-en-desktop-dark-seats', { locale: 'en', theme: 'dark', ...DESKTOP }, async (p) => {
      await section(p, '#gold-seats');
    });
  });
});

test.describe('the program surfaces live (the post-S5 shapes, live evidence)', () => {
  test('32 the docked section nav (stuck under the global header)', async ({ page }) => {
    await shot(page, '32-en-desktop-nav-docked', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await p.evaluate(() => window.scrollTo(0, 3200));
      await p.waitForTimeout(800);
      const nav = p.locator('[data-gold-section-nav]');
      await expect(nav).toBeVisible();
      await expect(p.locator('[data-nav-chip][data-nav-active]').first()).toBeVisible();
    });
  });

  test('33 the relationship explorer', async ({ page }) => {
    await shot(page, '33-en-desktop-explorer', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      // The explorer rides its own near-viewport boundary — scroll to the
      // boundary's probe first (it exists pre-mount), wait for the section
      // to mount, then settle (the S6 openExplorer pattern).
      await p.locator('#gold-relationships, [data-gold-relationships-probe]').first().scrollIntoViewIfNeeded();
      await p.waitForSelector('#gold-relationships [data-rel-row]', { timeout: 20_000 });
      await p.waitForTimeout(700);
    });
  });

  test('34 the record sheet (the desktop inline-end sheet)', async ({ page }) => {
    await shot(page, '34-en-desktop-sheet', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      await section(p, '#gold-seats');
      const opener = p.locator('[data-seat-open]').first();
      await opener.scrollIntoViewIfNeeded();
      await opener.click();
      await expect(p.locator('[data-gold-record-sheet]')).toBeVisible();
      await p.waitForTimeout(700);
    });
  });

  test('35 the chart inspector (the crosshair parked on a point)', async ({ page }) => {
    await shot(page, '35-en-desktop-inspector', { locale: 'en', theme: 'light', ...DESKTOP }, async (p) => {
      const plot = p.locator('[data-chart-plot]').first();
      await plot.scrollIntoViewIfNeeded();
      await plot.focus();
      await p.keyboard.press('ArrowLeft');
      await p.keyboard.press('ArrowLeft');
      await expect(p.locator('[data-chart-inspector-readout]')).not.toBeEmpty();
      await p.waitForTimeout(400);
    });
  });
});
