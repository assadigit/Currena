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
  // I11 bump (288.80/86.98 → 292.57/87.88): the always-on LiveRateLine on
  // the converter homepage (rate + source badge + freshness + RateDeltaChip
  // + Sparkline reuse + copy-to-clipboard) and the first-run popular-pairs
  // row. Raw +3.77 kB but gzip-NEUTRAL (87.88 vs 88.00 budget — the new
  // code is highly compressible; users download ~zero extra bytes). The
  // money page answering "what's the dollar?" without a conversion is the
  // highest-value entry growth since launch. Justified in CHANGELOG
  // §2026-10-08 (I11).
  // I12 bump (292.57/87.88 → 295.08/89.37): the self-healing retry ladder
  // in snapshot-store (15/30/60 s backoff + nextRetryAt state) and the
  // honest failure card on the converter (kind-aware copy, Try again,
  // live countdown, error→ready auto-completion) + 11 copy strings × 2
  // locales. Gzip +1.49 kB for first-visit-outage recovery on the money
  // page — a 2026-10-07-incident-driven resilience feature, not bloat.
  // Justified in CHANGELOG §2026-10-08 (I12).
  { entry: true, raw: 296_000, gz: 89_500, label: 'entry chunk (converter — the money page)' },
  // I8 bump (109.36/32.91 → 117.27/34.83): the card-grid filter toolbar
  // (FilterBar + section/jumpnav visibility + WhatChanged focus-card rows +
  // 26 copy strings × 2 locales). Justified in CHANGELOG §2026-10-08.
  // I9 bump (117.27/34.83 → 121.12/35.81): the range segmented control +
  // slicing in HistoryChart, live chip counts, summary jump buttons, the
  // "/" search shortcut and 12 more copy strings × 2 locales. Justified in
  // CHANGELOG §2026-10-08 (I9). The entry chunk is untouched — Insights
  // stays lazy. Headroom stays tight so the NEXT growth bumps consciously.
  // I10 bump (121.12/35.85 → 128.36/37.78): the personal watchlist (pin
  // pills + ★ badges + the Pinned section + localStorage persistence +
  // cross-tab sync), the RFC 5545 .ics calendar export (+ the shared
  // downloadBlob lib, BACKLOG #24), the reading-progress bar, relative
  // freshness timestamps, and the Persian-digit sweep over every prose
  // number (summary/group/count lines + days-away) — 9 new copy strings
  // × 2 locales. Justified in CHANGELOG §2026-10-08 (I10). Entry chunk
  // untouched (288.80/86.98 vs 289/88): Insights stays lazy.
  // I13 bump (128.42/37.90 → 133.82/38.87): the data-portability + power-
  // reader wave — the snapshot CSV export (insights-csv builder + the
  // AboutTheData download button), j/k card-walk keyboard navigation, the
  // remembered chart zoom (chart-range store), the FilterBar shortcut
  // legend, and 17 copy strings × 2 locales. Raw +5.40 kB but gzip +0.97 kB
  // (the export path is mostly localized header words — highly
  // compressible); the raw overage is the CSV column wording, not logic.
  // Justified in CHANGELOG §2026-10-08 (I13). Entry chunk untouched
  // (295.11/88.55 vs 296/89.5): Insights stays lazy.
  // I15 bump (133.85/38.88 → 235.78/61.93, budget 240/64): the 2026-10-08
  // owner restructure grew the chunk in three documented ways — (1) the copy
  // corpus doubled: 41 indicators × (plain name + 6 detail fields + 4-5
  // state-keyed consequence lines + unit notes) × TWO languages; (2) the
  // details side-panel/bottom-sheet architecture (F5) with its focus-trap +
  // lazy chart; (3) the prices board + verdict meters + lane switch + the
  // @currena/insights GAUGES table joining the chunk. The ENTRY chunk (the
  // money page) is untouched at 290.12/87.00 — under its own budget. The
  // gzip cost (+23 kB) is the honest price of the bilingual plain-language
  // corpus the spec demanded. Justified in CHANGELOG §2026-10-08 (I15).
  // I17 bump (235.80/61.92 → 270.01/69.57, budget 240/64 → 280/72): the
  // v2 wave of the same owner spec — the "Together" connection cards (T1)
  // and the "What the signals say" cards (S1–S3) with the owner's full
  // approval. Growth, itemised: (1) the bilingual corpus for six
  // connections (name + relation + 5 state lines + leg labels) and both
  // signals cards (6 conditions + the fixed "before you act" box + three
  // plain checks) × two languages; (2) the ConnectionCard + Signals
  // components (chips, icons, the two-sides checklist, RTL-mirroring
  // arrows); (3) the connections.ts + signals.ts logic from
  // @currena/insights joining the lazy chunk. The ENTRY chunk stays
  // untouched (290.12/87.76 vs 296/89.5) — the v2 surface rides the lazy
  // route exactly as the roadmap demands. Gzip +7.65 kB for the whole v2
  // feature set. Justified in CHANGELOG §2026-10-08 (I17).
  { pattern: /^Insights-[\w-]+\.js$/, raw: 280_000, gz: 72_000, label: 'Insights lazy chunk' },
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
