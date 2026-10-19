/**
 * playwright.config.ts — the visual acceptance harness config (PH1-VISUAL).
 *
 * - chromium only (the repo's QA browser; no WebKit/Firefox download weight),
 * - TWO projects, so the main U-suite stays fast:
 *     · `chromium`     — the U-01..U-14 acceptance suite, testMatch pinned
 *                        EXACTLY to `u-tests.plw.ts`,
 *     · `screenshots`  — the §12 screenshot captures (screenshots.plw.ts),
 *                        run on its own via `visual:screenshots`,
 * - webServer: the fixture server (visual/fixture-server.mjs) serving the
 *   BUILT SPA + the synthetic fixtures on :4050 — never a live site. It is
 *   reused when already running (`reuseExistingServer: true`), so manual
 *   runs and the pipeline can share one server,
 * - retries: 0 — the U-xx baseline must be deterministic,
 * - outputDir: visual/.artifacts — Playwright's own run artifacts (traces,
 *   failure shots, .last-run.json) must NEVER land in the deliverable
 *   screenshot directory docs/insights/screenshots (UI_SPEC §12).
 *
 * Naming (vitest isolation): both spec files end in `.plw.ts` on purpose —
 * vitest's default include (every path ending .test or .spec with a JS/TS
 * extension) must never pick a Playwright file up when CI runs `pnpm -r test`.
 *
 * The suite needs the SPA BUILD to exist first: run
 * `pnpm --filter @currena/web build` (or `pnpm --filter @currena/web run
 * visual:screenshots`, which builds when dist is missing).
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [['list']],
  outputDir: './.artifacts',
  use: {
    baseURL: 'http://localhost:4050',
    headless: true,
    colorScheme: 'light',
    serviceWorkers: 'block', // the PWA must not shadow the fixture responses
    screenshot: 'off',
    trace: 'off',
  },
  projects: [
    {
      name: 'chromium',
      testMatch: /u-tests\.plw\.ts$/,
      use: { browserName: 'chromium' },
    },
    {
      name: 'screenshots',
      testMatch: /screenshots\.plw\.ts$/,
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'node fixture-server.mjs',
    url: 'http://localhost:4050/healthz',
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
