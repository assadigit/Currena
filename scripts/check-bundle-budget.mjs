#!/usr/bin/env node
/**
 * Bundle-budget gate (BACKLOG #47, I7 hardening).
 *
 * Fails CI when a protected chunk grows past its budget. The budgets are the
 * documented numbers (docs/insights/05-ux-audit-I6.md, NEXT_SESSION_PROMPT
 * §Phase B): the entry chunk is the money page (converter) and must not
 * regress; the Insights route is lazy and its growth must be conscious —
 * bump the budget HERE, with a changelog justification, never silently.
 *
 * Sizes are decimal kB (matching vite's own reporting): 289 kB = 289,000
 * bytes. Gzip via node zlib (same class as the CDN's gzip).
 *
 * Usage: node scripts/check-bundle-budget.mjs            (from repo root)
 *        pnpm --filter @currena/web build must run first.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'apps/web/dist');
const kB = (n) => `${(n / 1000).toFixed(2)} kB`;

/** [file pattern, raw budget bytes, gzip budget bytes, label] */
const BUDGETS = [
  { entry: true, raw: 289_000, gz: 88_000, label: 'entry chunk (converter — the money page)' },
  // I8 bump (109.36/32.91 → 117.27/34.83): the card-grid filter toolbar
  // (FilterBar + section/jumpnav visibility + WhatChanged focus-card rows +
  // 26 copy strings × 2 locales). Justified in CHANGELOG §2026-10-08.
  // I9 bump (117.27/34.83 → 121.12/35.81): the range segmented control +
  // slicing in HistoryChart, live chip counts, summary jump buttons, the
  // "/" search shortcut and 12 more copy strings × 2 locales. Justified in
  // CHANGELOG §2026-10-08 (I9). The entry chunk is untouched — Insights
  // stays lazy. Headroom stays tight so the NEXT growth bumps consciously.
  { pattern: /^Insights-[\w-]+\.js$/, raw: 125_000, gz: 37_000, label: 'Insights lazy chunk' },
];

function main() {
  const assetsDir = resolve(DIST, 'assets');
  let files;
  try {
    files = readdirSync(assetsDir);
  } catch {
    console.error(`✗ ${assetsDir} not found — run \`pnpm --filter @currena/web build\` first.`);
    process.exit(1);
  }

  // The entry chunk is whatever dist/index.html loads first — robust against
  // multiple index-*.js files (workbox chunks etc.).
  let entryName;
  try {
    const html = readFileSync(resolve(DIST, 'index.html'), 'utf8');
    entryName = (html.match(/src="\/assets\/(index-[\w-]+\.js)"/) || [])[1];
  } catch {
    console.error('✗ could not read dist/index.html to identify the entry chunk.');
    process.exit(1);
  }
  if (!entryName) {
    console.error('✗ no entry script found in dist/index.html.');
    process.exit(1);
  }

  let failed = false;
  console.log('Bundle budget check (budgets are the documented numbers — bump with a changelog note, never silently):');
  for (const budget of BUDGETS) {
    const name = budget.entry ? entryName : files.find((f) => budget.pattern.test(f));
    if (!name) {
      console.error(`✗ ${budget.label}: no matching chunk found.`);
      failed = true;
      continue;
    }
    const raw = statSync(resolve(assetsDir, name)).size;
    const gz = gzipSync(readFileSync(resolve(assetsDir, name))).length;
    const okRaw = raw <= budget.raw;
    const okGz = gz <= budget.gz;
    const mark = okRaw && okGz ? '✓' : '✗';
    console.log(
      `${mark} ${budget.label}: ${name} — ${kB(raw)} / ${kB(gz)} gz ` +
        `(budgets ${kB(budget.raw)} / ${kB(budget.gz)} gz)` +
        (!okRaw || !okGz
          ? ` — OVER by ${kB(Math.max(raw - budget.raw, 0))} raw, ${kB(Math.max(gz - budget.gz, 0))} gz`
          : ''),
    );
    if (!okRaw || !okGz) failed = true;
  }
  if (failed) {
    console.error(
      '\nBundle budget exceeded. If the growth is intended: justify it in the changelog and bump the number in scripts/check-bundle-budget.mjs.',
    );
    process.exit(1);
  }
  console.log('All bundle budgets held.');
}

main();
