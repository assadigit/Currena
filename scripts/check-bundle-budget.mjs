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
  // Round-2 bump (270.02/69.50 → 295.80/75.34, budget 280/72 → 300/78): the
  // signal-first density pass (docs/insights/06-ux-round-2-spec.md, R1–R28).
  // Growth, itemised: (1) the R5 two-tier model + R2 fixed reason table +
  // R11 money-panel area map and the R27/R7b summary builders in config.ts
  // (+447 lines of pure logic); (2) the bilingual corpus expansion — money
  // area×state sentences, tier renames (Alert→Needs attention, +Unusual),
  // About rewrite, merged-signals and collapsed-summary strings, ×2
  // locales; (3) the new MoneyPanel + ToolsMenu components and the R25
  // AboutTheData restructure; (4) FilterBar deleted (−188 lines) but the
  // Tools menu absorbs search/filter/shortcuts/.ics/CSV plumbing. The
  // ENTRY chunk stays untouched (290.32/87.05 vs 296/89.5). Gzip +5.84 kB
  // for the whole round — the honest price of the tier model plus its
  // bilingual sentences. Justified in CHANGELOG §2026-10-10 (round-2).
  // Imagery bump (293.77/74.81 → 300.54/77.51, budget 300/78 → 302/78):
  // the owner asked for real iconography on the Insights page. lucide-react
  // (ISC) added, TEN named, tree-shaken icons — Wrench/Search/CalendarDays/
  // Download (Tools menu), Coins (prices strip mark), Activity (signals
  // mark), ChevronDown (3 disclosures, RTL-aware rotation), X + Star
  // (details close/pin), TriangleAlert (2 banners) — replacing 13 text
  // glyphs (🛠 🔍 📅 ⬇ ▾ ▸ ✕ ★ ☆ ⚠️) for a consistent 24px-grid stroke
  // language. Three header marks were consciously SKIPPED (Money rows
  // already carry icons; Together/About are quiet collapsed sections) and
  // the ↗ ↧ ⓘ glyphs kept, to hold the cost to +6.7 kB raw / +2.7 kB gz
  // on the lazy chunk. ENTRY untouched. Justified in CHANGELOG §2026-10-10
  // (imagery).
  // Roast bump (301.21/78.06 → 303.98/78.50, budget 302/78 → 304.2/78.6):
  // the 11 Oct roast fixes — uniform price-tile anatomy with a client-side
  // 7d/30d derivation from the cached 10-year histories (useDerivedChanges),
  // the sentence-versus-number guard on needs-attention cards/rows,
  // friendlySource publisher cleanup, groupShort bilingual corpus (9
  // gauges × 2 locales), seeAllOne plural, and the rewritten money-area
  // lines. ENTRY untouched. Justified in CHANGELOG §2026-10-11 (roast).
  // Owner-alignment bump (302.23/78.33 → 304.45/78.77, budget 304.2/78.6 →
  // 305.0/78.9): the owner's 11 Oct alignment follow-up — the per-leg
  // directional "moves" clauses on connection cards (12 template strings ×
  // 2 locales + the direction→colour logic; green rises / red falls by
  // explicit owner instruction), the biggest-move CARD container with the
  // TrendingUp kicker, the 64×64 money-area icon boxes, and the aligned
  // price-tile change cells. Mostly localized strings (compressible). ENTRY
  // untouched. Justified in CHANGELOG §2026-10-11 (owner alignment).
  // Verdict-strip bump (304.25/78.75 → 306.68/79.19, budget 305.0/78.9 →
  // 307.5/79.6): round 23 (owner) — the merged gold-and-silver card now
  // OPENS with a stated estimation: per-metal direction chips (up / down /
  // no clear direction) derived mechanically from the conditions tally,
  // with 5 new copy strings × 2 locales, the arrow icon set and the chip
  // layout. ENTRY untouched. Justified in CHANGELOG §2026-10-11 (round 23).
  // Roast-round bump (306.68/79.19 → 317.60/81.93, budget 307.5/79.6 →
  // 318.5/82.5): round 24 — the roast's "fix this first" #1, a one-line
  // MEANING for every needs-attention card and hero tile: 30 authored
  // strings × 2 locales (the bulk), plus the hero simplification
  // (mixed-rest enumeration keys), collapsed-signal verdicts, price-tile
  // pictograms and the FRED footer split. Almost all localized strings —
  // compressible. ENTRY untouched. Justified in CHANGELOG §2026-10-11
  // (roast round 24).
  // Money-estimation bump (317.60/81.93 → 319.80/82.74, budget 318.5/82.5
  // → 322.5/84.0): round 25 (owner) — every "What it means for my money"
  // row now carries a stated estimation (arrow + "Will go up / Will go
  // down / No clear direction") computed from the driver readings:
  // moneyDriverVote/moneyAreaDirection/moneyDirectionToneClass in config,
  // a 16px arrow icon set in MoneyPanel and 3 copy strings × 2 locales.
  // ENTRY untouched. Justified in CHANGELOG §2026-10-11 (round 25).
  // Strip-chart bump (322.43/83.03 → 326.09/84.00, budget 322.5/84.0 →
  // 330/85.5): round 33 (owner) — the Estimation chips' white space now
  // carries each metal's price history: a zero-dependency SVG trend chart
  // per metal with clickable Quarter/1y/5y chips and a signed window
  // delta, the dual dedicated Global+Australia sections (switcher
  // retired) with 128px region marks on the mid-page headings, and the
  // hero's "+n more" revealing tiles in place. Mostly logic + JSX; gzip
  // grew ~1 kB. ENTRY untouched. Justified in CHANGELOG §2026-10-11
  // (round 33).
  // Axes-and-minis bump (326.09/84.00 → 331.28/85.08, budget 330/85.5 →
  // 334/86.0): round 34 (owner) — the shared TrendChart module: the
  // metals' charts grew real X/Y axes (gridlines + tick labels from the
  // same scaleY geometry) and a hover/tap/keyboard value-date inspector,
  // and every "What it means for my money" row now wears the SAME
  // structure as a full-width mini chart (its own chips + delta), plus
  // the alignment slots on the Estimation strip and 2 copy strings × 2
  // locales. Gzip +1.08 kB for a chart engine the owner asked for on TWO
  // sections. ENTRY untouched. Justified in CHANGELOG §2026-10-11
  // (round 34).
  // World-markets bump (331.28/85.08 → 377.70/97.20, budget 334/86.0 →
  // 380/98.0): owner round 44 — the World stock markets section's restyle
  // and expansion. Growth, itemised: (1) the mother container with the
  // focal verdict box (MarketsVerdictBox + marketsVerdictStep mapping +
  // VerdictMeter reuse) and the up/down PNG arrows riding tiles and the
  // table; (2) the Dow Jones and CAC 40 joining (16 markets) with their
  // full bilingual what/why/you context copy; (3) the 3-month normal
  // timeframe (chg3m lens + table column + CSV) and the 52-week MarketsChart
  // with the Jalali LTR axis; (4) the view-switch radiogroup + old-data
  // chips + the section/takeaway corpus × 2 locales. The ENTRY chunk stays
  // untouched (290.36/87.06 vs 296/89.5) — the section rides the lazy route.
  // Gzip +11.2 kB for a whole new bilingual section. Justified in CHANGELOG
  // §2026-10-12 (world markets, round 44).
  // World-currencies bump (377.70/97.20 → 450.10/110.38, budget 380/98.0 →
  // 462/113.0): the World currencies section (insights-world-currencies-
  // spec.md, direction B). Growth, itemised: (1) WorldCurrencies.tsx — the
  // full §9 anatomy (verdict line, pattern cards with the two-line rebased
  // chart + the 13-dots strip + Level-3 meaning lines, the quiet area with
  // distance bars, the dollar row, the 10-pair table + pair detail panel
  // with its 1-year chart); (2) the §7 rule corpus — all 7 rules × every
  // outcome's two-part sentences — plus the §8 pair corpus (10 pairs + the
  // dollar measure) × 2 locales; (3) fx-presentation.ts (the status
  // mapping, card ordering, §10.3 headline templates, §7 sentence
  // builder) + lib/fx.ts + fx-csv.ts; (4) the §6.11 hero rebuild (two
  // separate section indicators with measure labels) + the shared
  // SectionVerdictLine on both world sections. The ENTRY chunk stays
  // untouched (290.38/87.07 vs 296/89.5) — the section rides the lazy
  // route. Gzip +13.2 kB for a whole second bilingual section. Justified
  // in CHANGELOG §2026-10-13 (world currencies).
  // Step-1 fix-list bump (450.10/110.38 → 465.61/114.56, budget 462/113.0 →
  // 469/115.5): the 2026-10-13 audit fixes — (1) every card now carries
  // its data-date line ("data for August 2026 · released 11 Sep") + stale
  // tags + the fromPeak distance (config helpers + per-row render);
  // (2) the core-CPI companion (a new bilingual indicator entry + the
  // in-card companion rendering); (3) the policy-rate "Recent move" lines;
  // (4) the stock tiles' fromHigh/delayed/at-high tags + the mobile label
  // header + the local-currency note; (5) the verdict-rule + calm-list
  // lines in both heroes × 2 locales; (6) the gold-high-yields warning;
  // (7) the whole bilingual copy additions (sources body, conditions
  // verdict words, recent-move line, etc.). The ENTRY chunk stays
  // untouched (290.37/87.83 vs 296/89.5). Justified in CHANGELOG
  // §2026-10-13 (Insights Step-1 fix list).
  // Step-2 add-list bump (465.61/114.56 → 491.81/121.04, budget 469/115.5 →
  // 493/121.5): the seven Step-2 additions — (1) FIVE new bilingual
  // indicator entries × full copy (name/lines/whatItIs/whyItMatters/
  // tendedToMean/cantTell/forYou + meaning lines, en+fa): the AU 10-year
  // yield, US unemployment, the Sahm recession alarm, the VIX fear gauge,
  // and the deposit-rate card that finishes the savings row; (2) the
  // companion-comparison wiring (COMPANIONS + per-parent notes, both card
  // and row anatomy); (3) the policy cards' exact lastChange line + the
  // RBA next-decision line; (4) the details panel's card-spec facts block
  // (updates/stale-after/fetched/scored × 2 locales); (5) the VIX
  // always-position presentation. Gzip +6.5 kB for five fully-specified
  // bilingual cards + the card-spec discipline. The ENTRY chunk stays
  // untouched — Insights remains lazy. Justified in CHANGELOG §2026-10-13
  // (Insights Step-2 add list).
  // Bilingual copy-edit bump (491.81/121.04 → 493.99/120.95, budget
  // 493/121.5 → 495/121.5): the 2026-10-13 full Persian+English editorial
  // pass over the whole Insights corpus (~440 strings improved in fa, ~80
  // in en: broken grammar repaired, calques rewritten as natural Persian,
  // em dashes removed, terminology unified — headline CPI → تورم کلی, pts →
  // واحد درصد, safe haven → پناهگاه امن, verdict words aligned with the
  // Round-32 owner decision, and plainer jumping-line phrasings). Natural
  // Persian is a few bytes longer per sentence; gzip actually FELL
  // (120.95 vs 121.04). The ENTRY chunk stays untouched. Justified in
  // CHANGELOG §2026-10-13 (bilingual content audit).
  // Persian-site-copy bump (493.99/120.95 → 501.96/122.69, budget
  // 495/121.5 → 505/123.5): the 2026-10-13 application of the owner's
  // editorially revised Persian reference (persian_site_copy_edited.md) —
  // ~120 strings replaced in fa with longer, fuller sentences (the
  // verdict-rule methodology paragraph, the sources/schedule/disclaimer
  // rewrites, the meaning one-liners as two-sentence paragraphs, the
  // renamed indicator set (real yields/bond yields as بازده اوراق قرضه),
  // the r7 euro-led sentence pair and the unit words به‌صورت شاخص/نسبت).
  // Same class as the previous copy-edit bump: natural, explicit Persian
  // prose is a few bytes longer per sentence (raw +7.97 kB, gzip +1.74 kB);
  // all of it localized strings, none of it logic. The ENTRY chunk stays
  // untouched. Justified in CHANGELOG §2026-10-13e (persian_site_copy_edited).
  // Persian-copy round-2 bump (501.96/122.69 → 543.31/127.75, budget
  // 505/123.5 → 545/128.5): the 2026-10-13 application of the owner's
  // seven polished round-2 reference parts (1,522 entries — the complete
  // remaining fa corpus: dashboard UI, markets/fx, money/signals/together
  // panels, 47 indicator cards, converter core, tools, calendar titles).
  // Same class as every copy-edit bump: 1,087 insights strings replaced
  // with the approved natural-Persian wording (raw +41.35 kB, gzip +5.06 kB),
  // all localized strings, zero logic. The ENTRY chunk stays untouched
  // (290.36/87.07 vs 296/89.5). Justified in CHANGELOG §2026-10-13f
  // (persian copy round 2 + the docs/localization audit system).
  // World-currencies v1.3 bump (543.31/127.75 → 579.62/136.48, budget
  // 545/128.5 → 580/137): the 2026-10-14 change request
  // (docs/specs/insights-world-currencies-v1.3-change-request.md) —
  // (1) the plain-language layer: "In plain words" S1–S5 builders, the
  // four-answer pattern cards (headline verdicts, "What would change this"
  // alarm-in-words, "In everyday terms"), the quiet-area rework, the
  // how-to-read drawer, 10 glossary tooltips and the money line; (2) the
  // corrected R3 (one-month ±3.0 trigger, variant sentences) and R7
  // (dollar-led/euro-led framing); (3) ~150 new/changed copy strings × 2
  // locales, all wording verbatim from the change request. Raw +36.31 kB,
  // gzip +8.73 kB, all of it the requested feature + bilingual strings.
  // The ENTRY chunk stays untouched (290.36/87.08 vs 296/89.5) — the
  // section remains lazy. Justified in CHANGELOG §2026-10-14
  // (world currencies v1.3).
  // Phase 3-e route-split bump (579.62/136.48 → 581.31/136.72, budget
  // 580/137 → 582/137): the /insights route monolith (1,164 lines) was
  // split into section modules (insights-sections/: header, status
  // chrome, question groups, section lane, world feeds, tools nav) with
  // ZERO behavior change — the +1.69 kB raw is purely the prop plumbing
  // of the new component boundaries (repeated prop names at call sites);
  // gzip stays +0.24 kB and INSIDE the unchanged 137 budget. The ENTRY
  // chunk is untouched (290.36/87.08 vs 296/89.5). Maintainability
  // (route halves; every section independently navigable) for a 0.23%
  // raw cost on a lazy chunk. Justified in CHANGELOG §2026-10-15
  // (Phase 3-e) + D-16 in docs/DECISIONS_FOR_ALI.md.
  // Fix-spec bump (599.37/141.52 → budgets 600/142): the four Part-C cards
  // (fed-expectations, us30y, philly-fed, rba-expectations) carry full
  // bilingual copy — 11 fields × 2 locales ≈ +17 kB raw / +4.5 kB gz on the
  // lazy chunk. The ENTRY chunk stays untouched (294.61/88.50 vs 296/89.5).
  // Justified in CHANGELOG §2026-10-15 (insights fix spec Part C).
  { pattern: /^Insights-[\w-]+\.js$/, raw: 600_000, gz: 142_000, label: 'Insights lazy chunk' },
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
