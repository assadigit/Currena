/**
 * gux-s9-live.config.ts — GUX Session 9 (the FINAL session): the LIVE
 * production screenshot matrix (docs/gold-redesign/
 * 17-final-qa-and-regression-report.md).
 *
 * WHY a config of its own (not another project on the shared
 * playwright.config.ts): the S9 matrix REPEATS the S1 baseline's method —
 * S1 captured the DEPLOYED page at https://currena.ir/gold with a real
 * browser (read-only; the same GETs any visitor makes). The shared config
 * boots the fixture server + the wrangler-dev Worker as its webServers —
 * both wrong for a live capture (and the wrangler one cannot boot in this
 * sandbox at all). This config boots NOTHING: the suite navigates to the
 * live origin directly.
 *
 * - chromium only (the repo's QA browser),
 * - ONE worker, serial — the captures must not race each other and the
 *   live origin gets a gentle, sequential visitor,
 * - serviceWorkers: 'block' — the PWA must never shadow the live
 *   responses (the same guard the fixture config uses),
 * - generous timeouts: a live page rides a real network; the fixture
 *   harness's 20s waits do not apply,
 * - outputDir .artifacts (never the deliverable screenshot directory).
 *
 * The evidence lands in docs/gold-redesign/baseline-screenshots/s9/.
 */

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 30_000 },
  reporter: [['list']],
  outputDir: './.artifacts',
  use: {
    baseURL: 'https://currena.ir',
    headless: true,
    colorScheme: 'light',
    serviceWorkers: 'block',
    screenshot: 'off',
    trace: 'off',
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
  },
  projects: [
    {
      // GUX-S9: the final before/after matrix — the S1 list repeated at
      // the same sizes/locales/themes over the deployed S8 close, plus
      // the program's own post-S5 surfaces (the docked nav, the explorer,
      // the record sheet, the chart inspector) and the network audit
      // (the no-unapproved-fetch check).
      name: 'gux-s9-live',
      testMatch: /gux-s9-screenshots\.plw\.ts$/,
      use: { browserName: 'chromium' },
    },
  ],
});
