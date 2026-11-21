/**
 * gie-s1-live.config.ts — the Gold Intelligence & Visual Explanation
 * programme's Session 1 LIVE baseline config (the gux-s9-live.config.ts
 * pattern, read-only over https://currena.ir).
 *
 * WHY a config of its own: the S1 audit captures the DEPLOYED page at
 * https://currena.ir/gold with a real browser (plain visitor GETs only).
 * The shared config boots the fixture server + a wrangler-dev Worker —
 * both wrong for a live capture. This config boots NOTHING.
 *
 * - chromium only (the repo's QA browser),
 * - ONE worker, serial — a gentle, sequential visitor on the live origin,
 * - serviceWorkers: 'block' — the PWA must never shadow live responses,
 * - generous timeouts (a live page rides a real network),
 * - outputDir .artifacts (never the deliverable screenshot directory).
 *
 * The evidence lands in
 * docs/audits/2026-11-21-gold-intelligence-s1/baseline-screenshots/.
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
      // GIE-S1: the current-state baseline — the audit load + the matrix
      // (en/fa × 1440/390 × light/dark) + the section-by-section pass +
      // the expanded states the comprehension audit walks.
      name: 'gie-s1-live',
      testMatch: /gie-s1-screenshots\.plw\.ts$/,
      use: { browserName: 'chromium' },
    },
  ],
});
