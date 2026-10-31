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
  // Export-feature bump (599.53/141.53 → budgets 604/142.8): the one-file
  // "download all data" export (owner request 2026-10-16, MD/TXT/CSV/XLSX).
  // The builders (full-export 11.18 kB + xlsx-writer 5.57 kB + the format
  // panel 2.75 kB) are all SEPARATE lazy chunks — the Insights chunk itself
  // grows only by the trigger button + the download handler + 14 copy
  // strings × 2 locales + the shared popover viewport-clamp fix (which also
  // fixed the pre-existing Tools-panel off-screen bug) = 603.71 kB raw /
  // 142.72 kB gz measured. Justified in CHANGELOG §2026-10-16 (insights
  // full export). Entry chunk untouched (294.75/89.36 vs 296/89.5).
  // v3 UI rebuild bump (603.71/142.72 → 606.01/144.54, budgets → 607/145,
  // 2026-10-20): the Phase-6 v3 UI_SPEC pass (task PH6-A) — the rebuilt
  // hero (verdict sentence + reading bar + why-3 rows + what-next +
  // freshness chips), the MovesNextStrip, the one UI-20 card anatomy with
  // its wrapping meta row (CardMeta) + face reasons, the Delayed tier
  // (dailyPeersOf/tradingDaysBehind), the six-word state chips, and ~30
  // copy strings × 2 locales. Note the measured gz baseline at the pass's
  // START was already 143.06 kB (the Phase-5 shiller additions never got a
  // bump); the +1.48 kB gz covers both honestly. The ENTRY chunk is
  // untouched (294.78/89.38 vs 296/89.5) — the v3 surface rides the lazy
  // route. Justified 2026-10-20 (PH6-A, v3 UI_SPEC §3-6).
  // v3 §8+§9 balance bump (606.01/144.08 → 612.75/146.30, budgets → 613/146.5,
  // 2026-10-20): the Phase-6 v3 UI_SPEC pass (task PH6-B) — the relationship
  // cards' neutral summaries + per-leg markers + the windows details
  // (UI-33..38) and the per-metal gold/silver BALANCE beam visual with its
  // readability rule + tally helpers (UI-39..45a: Balance.tsx + balance.ts +
  // readable.ts, the grouped-list machinery it replaces removed) + ~50 copy
  // strings × 2 locales. All rider of the lazy Insights route; the ENTRY
  // chunk is untouched (294.78/88.56 vs 296/89.5). Justified 2026-10-20
  // (PH6-B, v3 UI_SPEC §8-9).
  // v3 §7a/§10 stock-table/calendar/About/owner bump (612.75/146.30 →
  // 633.53/151.34, budgets → 634/152, 2026-10-20): the Phase-6 v3 UI_SPEC
  // pass (task PH6-C) — the stock table's exact UI-27 column set (Trend
  // removed) with the table-anchored local-currency note, the calendar's
  // five-event strip with per-event tz labels (UI-47), the About rework
  // (UI-49: the per-source table + tappable stale/unavailable card lists +
  // the rule-version line + the M-7 contact line), the data-health chip
  // (UI-50) and the owner-only export surface (UI-51 + RULES M-3: the
  // sign-in/sign-out/probe + the server audit-export row) + ~45 copy
  // strings × 2 locales. The AUDIT SIDECAR rides its OWN lazy chunk
  // (indicator-audit-*.js, 13.43 kB raw/1.56 gz, loaded on the About
  // section's first expand — UI-57: the page chunk never carries it).
  // All rider of the lazy Insights route; the ENTRY chunk is untouched
  // (294.78/88.56 vs 296/89.5). Justified 2026-10-20 (PH6-C, v3 UI_SPEC
  // §7a/§10).
  // Gold-balance bump (604/142.8 → 606/144.6): the owner-spec balance
  // visual on the gold signals card (docs/insights/gold-balance-card-spec.md)
  // — the BalanceScale component (beam/pivot/pans/blocks/trays/panel, pure
  // CSS transforms, no new dependency) + 13 copy strings × 2 locales, and
  // the merged card's grouped driver list it replaces. Measured 605.28 kB
  // raw / 144.51 kB gz. Justified in CHANGELOG §2026-10-17e
  // (gold balance card). Entry chunk untouched.
  // Redesign bump (2026-10-17, economic-indicators-ui-spec.md; scope
  // trimmed 2026-10-18 — the grayscale reskin now covers the header/hero
  // ONLY, everything below the overview cards was reverted): the hero
  // region cards restructure stays (region-name titles + severity labels,
  // flagged tile GRID -> indicator ROWS with leading severity symbols +
  // trailing values, the count line moved to the Why position, fixed
  // Global-right/Australia-left ordering, aria-expanded/aria-controls on
  // the expand controls) — measured 606.32 kB raw / 144.86 kB gz, still
  // over the pre-redesign line. Headroom 145.20/607.00 so the next growth
  // bumps consciously, per the gate's own rule. Justified in CHANGELOG
  // §2026-10-17f and §2026-10-18a.
  // Markets-public bump (607.00/145.20 → 608.00/145.60, 2026-10-18b owner
  // directive): the world stock markets board returns to public mode — the
  // Insights route now bundles the GENERATED data/site-mode-overrides.json
  // (the single source of truth the API worker and the T-15 gate already
  // consume; ~1.3 kB raw / ~0.3 kB gz incl. the dated owner-directive note)
  // and drives the per-board feed gating from it (markets fetches/renders,
  // fx stays licence-hidden, the US-shares AUD view rides both). Measured
  // 607.21 kB raw / 145.24 kB gz. Justified in CHANGELOG §2026-10-18b.
  // Entry chunk untouched (295.15/88.76 vs 296/89.5).
  // Round-46 bump (608.00 → 609.00 raw, 2026-10-24b): the market view
  // switch grows the weekly and monthly lenses — two more radiogroup
  // options, the 5-lens viewValue switch (with the honest-dash missing
  // path), the two new columns in the full table + mobile list, the
  // Tools-menu CSV columns and the full-export flat-slot puts, plus six
  // copy strings × two locales. Measured 608.78 kB raw / 145.54 kB gz —
  // gzip-NEUTRAL vs the 145.60 budget (the additions are mostly localized
  // label words, highly compressible); the raw overage is wording, not
  // logic. Justified in CHANGELOG §2026-10-24b.
  // Financial-asset-cards bump (609.00/145.60 → 626.00/150.00,
  // 2026-10-24c — the spec-pack session of 2026-10-22 rebased onto
  // round-46 main): the financial-asset-cards spec pack lands on the
  // prices board — the day-spaced 7-day sparkline (PriceSparkline) + the
  // pure trend/briefing module (price-trend.ts, 16 tests) + the per-card
  // «جزئیات بیشتر» disclosure with the full detail rows + 41 new copy
  // keys × 2 locales. The raw overage is the honest price of the
  // real-data trend story and the bilingual hedged-briefing corpus the
  // spec demands; the entry chunk (the money page) is untouched at
  // 295.15/88.76 vs 296/89.5. Justified in CHANGELOG §2026-10-24c and
  // docs/QA/quirks-2026-10-22-financial-asset-cards.md.
  // Balance v5 bump (626.00 → 627.00 raw, gz HELD at 150.00 — the gz
  // budget is NOT touched, 2026-10-26): the gold balance's wireframe-
  // reference iteration (docs/ui-reference/gold-silver-balance-target-
  // wireframe.png) moves the two factor columns ABOVE the drawing and
  // adds the per-column progressive disclosure ("+{n} more" / "Show
  // fewer" pills — the attention-tile convention, reused copy keys)
  // and the soft centred assessment box. Raw +0.27 kB, gzip-neutral
  // (149.92 vs 150.00 — the pill markup is highly compressible); the
  // entry chunk is untouched at 295.29/88.81 vs 296/89.5. Justified in
  // CHANGELOG §2026-10-26.
  // Asset-cards polish bump (627.00/150.00 → 630.00/151.00,
  // 2026-10-25b, rebased over the v5 round): the prices cards' polish
  // round — the title/measurement-basis header (priceCardTitles +
  // priceCardUnits × 2 locales), the one-line price + currency split
  // (priceValueParts), the expanded panel's six semantic sections (18
  // new copy keys × 2 locales + the sectioned markup) and the
  // instrument-coverage notes (futures/blend/fetch-time, shown only
  // when the served attribution is that instrument). Measured on the
  // combined tree 629.04/150.69 + the v5 round's raw +0.27 — the raw
  // overage is bilingual copy and panel structure, not logic; the
  // entry chunk is untouched (295.29/88.81 vs 296/89.5). Justified in
  // CHANGELOG §2026-10-25b and
  // docs/QA/quirks-2026-10-25b-asset-cards-polish.md.
  // Balance v6 bump (627.00 → 632.00 raw, 150.00 → 151.00 gz,
  // 2026-10-26 — the Iteration-4 pans directive): the factor tiles
  // now REST ON real weighing pans hung from the beam — the drawing
  // gains the pan assemblies (hangers + ring dots + rimmed trays +
  // floor lines), the compact tile anatomy with its contact shadows,
  // the "+{n} more" overflow pills under the pans, the per-side full-
  // list sections below the assessment, and 2 new copy keys × 2
  // locales. Measured 631.01/150.80 — raw +4.01 kB, gz +0.80 kB: the
  // honest price of the directive's mandated markup (a connected
  // weighing machine cannot be smaller than an abstract beam); the
  // entry chunk is untouched at 295.29/88.81 vs 296/89.5. Justified
  // in CHANGELOG §2026-10-26 (v6) and D-32 in
  // docs/DECISIONS_FOR_ALI.md.
  // Merged-tree final (632.00 → 635.00 raw, 151.00 → 152.00 gz,
  // 2026-10-26 — the v6 pans round MERGED with the parallel 2026-10-25b
  // asset-cards-polish round above): the two rounds were measured
  // independently against the v5 base (v6: 631.01/150.80;
  // 2026-10-25b: 629.04/150.69), and the combined tree measures
  // 634.57/151.67 — both features' honest markup together. The entry
  // chunk is untouched at 295.29/88.82 vs 296/89.5.
  // v7 beam-only rotation (635.00 → 636.00 raw, 152.00 → 152.50 gz,
  // 2026-10-26d — the owner's Iteration-5 addendum "Rotate the beam
  // only, and visualize weight"): the CSS-calc stage becomes an
  // SVG mechanical layer (hangers as recomputed joint→rim lines, the
  // needle + three-tick arc gauge) driven by ONE JS-animated θ through
  // the pure balanceStageGeometry()/balanceGaugeGeometry() derivation
  // and the Odometer-pattern rAF settle; the pans lose their rotate/
  // tilt. Measured 635.18/152.06 — raw +0.61 kB, gz +0.39 kB over the
  // v6 merged tree: the per-frame derivation + gauge + one new copy
  // key × 2 locales, minus the retired CSS-var machinery. The entry
  // chunk is untouched at 295.29/88.81 vs 296/89.5. Justified in
  // CHANGELOG §2026-10-26 (v7) and D-33 in docs/DECISIONS_FOR_ALI.md.
  // Merged-tree final (measured 635.91/152.00, 2026-10-26d — the v7
  // beam-only round MERGED with the parallel 2026-10-26c asset-cards
  // sidebar round above): the sidebar's PriceDetails module nets
  // +0.73 kB raw / -0.06 kB gz against v7's 635.18/152.06, staying
  // inside the 636/152.50 bump — no further bump. The entry chunk is
  // untouched at 295.29/88.81.
  // World-indices handoff round (636.00 → 652.00 raw, 152.50 → 156.50 gz,
  // 2026-10-18 (2)): the world stock indices section becomes the editorial
  // market briefing «نبض بازارهای جهان» — the movers cards
  // (world-markets/MarketMovers.tsx), the desktop performance map
  // (world-markets/MarketsHeatmap.tsx + legend), the logo frame with its
  // initials fallback (world-markets/MarketLogo.tsx), the breadth strip
  // inside the summary card, the tile identity row (logo + country line),
  // the pure decision layer (world-markets/briefing.ts) and ~108 new copy
  // strings × 2 locales (38 new fa keys + 16 countries + the en twins).
  // Measured 650.28/155.51 — raw +14.37 kB, gz +3.51 kB over the
  // 2026-10-26d merged tree: an owner-directed feature layer, mostly
  // highly-compressible JSX + dictionary copy. The 16 index wordmark
  // JPEGs ship as public assets (152 kB on disk), NOT in the JS chunk;
  // the entry chunk is untouched at 295.29/88.81 vs 296/89.5. Justified
  // in CHANGELOG §2026-10-18 (world-indices round) and D-35 in
  // docs/DECISIONS_FOR_ALI.md.
  // Editorial economic-indicators handoff round (652.00 → 656.00 raw,
  // 156.50 → 157.00 gz, 2026-10-19): the hero's two overview cards become
  // the editorial financial interface (docs/insights/
  // economic-indicators-editorial-spec.md) — the <768px GLOBAL-FIRST
  // horizontal swipe carousel (HeroBlock: the scroll-snap track + the cue
  // + two aria-current dots + Previous/Next + arrow-key steps), the quiet
  // art band (Sydney Harbour / faint world map behind each card header,
  // .ei-hero-art in index.css), the navy print ink (--ei-navy) on the
  // region titles + key values + page title, the compact tinted severity
  // pill (.ei-state-pill) with the four-step meter kept beside it, and
  // the flagged rows' editorial anatomy (subject-icon container + the
  // shared FlowChevron drill-down glyph + the restrained inline-start
  // tier edge) + 10 new copy strings × 2 locales (carousel cue/positions/
  // controls). Measured 655.04/156.73 — raw +4.74 kB, gz +1.23 kB over
  // the 2026-10-18 (2) build: an owner-directed presentation layer over
  // the existing data, mostly highly-compressible JSX + dictionary copy.
  // The two decorative artwork WebP files (12 KB + 4 KB) ship as public
  // assets (precached), NOT in the JS chunk; the entry chunk is untouched
  // at 295.29/88.81 vs 296/89.5. Justified in CHANGELOG §2026-10-19
  // (editorial hero round) and D-36 in docs/DECISIONS_FOR_ALI.md.
  // UI-fidelity correction round (656.00 → 657.00 raw, 157.00 → 157.50 gz,
  // 2026-10-19, the owner's correction brief): the hero closes the gap to
  // the approved reference — the page container widens to ~95% viewport
  // (Insights.tsx), the art band veils lighten (index.css), the flagged
  // rows' severity accent follows the REGION's own verdict step (article
  // [data-ei-step] → --ei-accent — the brief's named bug: Australia
  // Stressed no longer wears Crisis-red row edges), the gauge groups
  // become the reference's compact CATEGORY ROWS (label + tinted state
  // badge + sm meter), each card closes with the restrained contextual
  // explanation panel (Global: the raised world signals on pale red;
  // Australia / no-feed fallback: the existing word-choice rule on pale
  // amber), and the ContinueStrip names the page's next sections after
  // the hero. Measured 656.80/157.17 — raw +1.76 kB, gz +0.44 kB over
  // the 2026-10-19 build: compressible JSX + 2 copy strings × 2 locales
  // (worldSignalsTitle / continueLabel, manifest round
  // editorial-fidelity-2026-10-19). Entry chunk untouched at
  // 295.29/88.81 vs 296/89.5. Justified in CHANGELOG §2026-10-19
  // (fidelity round) and D-37 in docs/DECISIONS_FOR_ALI.md.
  // Owner round 3 (2026-10-19 (panels)): the closing explanation panels
  // PART WAYS — the rule panel (Australia / Global's no-feed fallback)
  // hides behind a LOW-KEY TOGGLE (the "+n more" muted-pill disclosure
  // language: chevron pill + conditional panel, the aria-expanded/
  // aria-controls mechanics of GlossaryTip) while the Global SIGNALS
  // panel — "probably one of the most important parts of the whole hero"
  // (owner) — steps UP in type: 15px bold heading + bullets (from the
  // 12.5px caption tier), the state mark 18/20, roomier rhythm. No new
  // copy, no data logic, no aria-hook changes; the signals panel keeps
  // data-attention-box/bullets and stays always-open. Measured
  // 658.10/157.49 — raw +1.30 kB, gz +0.32 kB over the fidelity build:
  // the disclosure button + direction-neutral chevron + the branched
  // heading markup. Entry chunk untouched at 295.29/88.81 vs 296/89.5.
  // Justified in CHANGELOG §2026-10-19 (panels) and D-38 in
  // docs/DECISIONS_FOR_ALI.md.
  // Owner round 4 (2026-10-20, australia signals): "just like World
  // Signals, the same box with proper data for Australia" — the
  // Australia card grows the SAME emphasized signals box: one bullet
  // per AUSTRALIAN gauge, worst first (the raised areas carry their
  // n-of-m counts + state word in their own step ink and jump to the
  // section; calm/unreadable areas sit in the quiet rows' ink), with
  // the round-3 rule toggle kept as the shared FALLBACK when a region
  // has nothing to raise. Two new copy keys (australiaSignalsTitle,
  // australiaSignalArea) en+fa + manifest round. Measured 660.14/157.86
  // — raw +2.04 kB, gz +0.37 kB over the panels build: the AU panel
  // branch + the area bullets + the new strings. Entry chunk untouched
  // at 295.29/88.81 vs 296/89.5. Justified in CHANGELOG §2026-10-20
  // (australia signals) and D-39 in docs/DECISIONS_FOR_ALI.md.
  
  // MERGED-TREE FINAL (661.00 → 687.00 raw, 158.50 → 166.00 gz,
  // 2026-10-19 — the v3 rebuild MERGED with the parallel owner rounds on
  // main; both histories above are true): the combined tree carries the
  // v3 UI_SPEC surface (hero verdict card with reading bar/why-3/what-next,
  // the one-card anatomy with meta rows + the Delayed tier, the six-word
  // states, MovesNextStrip, the UI-27 table, relationship cards with
  // neutral summaries, About rework + data-health chip, owner tools with
  // the gated export) AND main's live rounds (BalanceScale v7 rendered
  // PER METAL per UI-45, prices sparkline cards + the PriceDetails
  // sidebar, the world-indices briefing with movers/heatmap/wordmarks,
  // the five-lens view switch). Measured 686.78 kB raw / 165.45 kB gz —
  // +26.64 raw / +7.59 gz over main's 660.14/157.86: the honest price of
  // both owner-directed surfaces on one lazy route. The entry chunk is
  // untouched at 295.28/88.81 vs 296/89.5. Justified in the 2026-10-19
  // v3-merge session record (docs/DEPLOY.md).

  // OWNER UI-RESTORE (687.00 → 700.00 raw, 166.00 → 169.00 gz, 2026-10-20
  // — "I liked the previous UI more… keep the new data… in the PREVIOUS
  // UI"): the editorial hero (main@1e39a24) is restored over the v3 hero
  // card — the art-band region cards, the tinted verdict pill, the
  // needs-attention tiles, the compact gauge rows, the rule/signals
  // panels and the mobile Global-first swipe carousel return, and with
  // them the raised world-section bullets + section indicators; the full
  // five-lens markets table returns (UI-27's column cut retired, its
  // local-currency note kept); ContinueStrip returns in MovesNextStrip's
  // place. The v3 DATA layer stays (sources registry, connections,
  // reliability machinery, state words, delayed tier — all of it feeds
  // the restored surface). Measured 697.38 kB raw / 167.88 kB gz —
  // +10.60 raw / +2.43 gz over the merged tree: the owner's editorial
  // components are bigger markup than the v3 card they replace (highly
  // compressible — the gzip delta is +2.43 kB for the whole restored
  // surface). The entry chunk is untouched at 295.28/88.81 vs 296/89.5.
  // Justified in CHANGELOG §2026-10-20 (owner UI restore).

  // 2026-10-21 DATA-INTEGRITY + 2026-10-21c RESTORATION (700.00 → 765.00
  // raw, 169.00 → 186.00 gz): the deployed-but-unbudgeted data-integrity
  // round (12 new indicator cards + the EODHD crypto adapter + the FRED
  // bulk groups + ~135 new fa copy strings — the live deploy measured
  // 761.20/185.13, already past the 700/169 line) plus the 2026-10-21c
  // owner round that RESTORES the world-currencies section publicly (the
  // FX pattern cards, pairs table with its detail panel, reading aids and
  // dollar row all become load-bearing instead of dead-weighted) and
  // retires the silver balance + the eth-usd card. Measured 757.01 kB
  // raw / 182.41 kB gz — SMALLER than the live deploy (the retirements
  // give back ~4 kB raw) — the raw growth over 700 is the restored
  // currencies section's components and the 12-card copy corpus × two
  // locales, the gzip delta is +13.41 kB over the old budget for the
  // whole restored surface. The entry chunk is untouched at 295.28/88.81
  // vs 296/89.5 (Insights stays lazy). Justified in CHANGELOG
  // §2026-10-21c (owner restoration round).

  // 2026-10-24 M4 WAVE 1 (765.00 → 782.00 raw, 186.00 → 189.00 gz): the
  // early-warning pack (OD-8/D-42) — eight new indicator cards whose FULL
  // copy corpus rides in both locales (~11 fields × 8 ids × en+fa, the
  // michigan-1y-expectations companion included) plus the new 'claims'
  // unit token and the companions wiring. Measured 780.48 kB raw /
  // 188.46 kB gz — +27.22 raw / +6.95 gz over the M2 tree (753.26/181.51);
  // the growth is exactly the bilingual copy corpus (the gzip delta is
  // +2.46 kB over the old budget line for eight new cards of content).
  // The entry chunk is untouched at 295.28/88.80 vs 296/89.5 (Insights
  // stays lazy). Justified in CHANGELOG §2026-10-24 (M4 Wave 1).
  // 2026-10-24b M5 WAVE 2 (782.00 → 800.00 raw, 189.00 → 194.00 gz): five
  // more context cards (euro-aaa-10y, food-index, wheat, maize, usdtry) —
  // the same bilingual-corpus growth as M4, plus the new 'try' unit token.
  // Measured 797.18 kB raw / 192.61 kB gz (+16.70 raw / +4.15 gz over the
  // M4 tree). The entry chunk is untouched at 295.28/88.80. Justified in
  // CHANGELOG §2026-10-24 (M5 Wave 2).
  // 2026-10-25c M6 WAVE 3 (800.00 → 845.00 raw, 194.00 → 205.00 gz): TWELVE
  // new cards — the largest single-wave copy addition (the leading-edge
  // batch: mortgage-30y, walcl, retail-sales, housing-permits, cfnai,
  // job-openings, t5yie, us-wages, euro-hicp, au-housing-finance,
  // au-saving-ratio, au-job-vacancies) — each a full nine-field bilingual
  // entry, plus four new unit tokens (aud-bn, permits, openings,
  // vacancies), the boe-rate own-source relabel and the platinum
  // daily-cadence note. Measured 841.84 kB raw / 203.99 kB gz (+44.66 raw /
  // +11.38 gz over the M5 tree — twelve cards of bilingual content). The
  // entry chunk is untouched at 295.28/88.80. Justified in CHANGELOG
  // §2026-10-25 (M6 Wave 3, the D-16 path).
  // 2026-10-26 M7 (845.00 → 850.00 raw, 205.00 → 206.00 gz): ONE more card —
  // china-cpi, the NBS automation's second card, a full nine-field bilingual
  // entry (13 EN + 13 fa strings + the band + the display row + the ticker),
  // plus the china-pmi source-honesty reword in both locales. Measured
  // 846.29 kB raw / 205.01 kB gz (+4.45 raw / +1.02 gz over the M6 tree).
  // The entry chunk is untouched at 295.28/88.81. Justified in CHANGELOG
  // §2026-10-26 (M7, the D-16 path).
  // 2026-10-26 M8 (850.00 → 890.00 raw, 206.00 → 215.00 gz): the A-1..A-10
  // gap-audit build adds ELEVEN new ids (yield-curve-10y3m, us-japan-10y-gap,
  // rba-fed-gap, gold-oil-ratio, eia-crude-stocks, cftc-gold-positioning,
  // oecd-cli-us/cn/de, gpr-index, epu-us) plus the jgb-10y MOF-daily upgrade,
  // the new sd10y reading enrichment (every reading carries a trailing
  // 10-year z-score field), the new 'barrels' unit token, the new cftc/eia/
  // oecd/gpr/epu/mof providers in the source-risk sidecar and the licences
  // register, and the new 04:20 rung-2 phase in the cron constants. Measured
  // 886.44 kB raw / 214.99 kB gz (+40.15 raw / +8.98 gz over the M7 tree —
  // eleven cards of bilingual content + the new sd10y field on every
  // reading + five new providers in the audit sidecar). The entry chunk
  // stays at 295.28/88.80 (the enum's five new ids add 0.83 kB gz — under
  // the entry's 89.50 kB ceiling). Justified in CHANGELOG §2026-10-26
  // (M8, the D-16 path).
  // 2026-10-27 R9 (890.00 → 896.00 raw, 215.00 → 217.00 gz): the round-9
  // owner round adds the US-global-reach container (two new components +
  // the pure brief generator + nine bilingual copy blocks + the lane
  // presentation config), the dollar-strength card group inside the world
  // currencies section, the markets breadth headline (large numbers + the
  // proportional bar) and the balance's all-chips pans (dynamic stage
  // sizing); the retired UsSharesNotes box and its lib left the chunk with
  // it. Measured 892.44 kB raw / 215.72 kB gz (+2.44 raw / +0.72 gz over
  // the M8 tree — the two new section components and the bilingual brief
  // templates outweigh the removed AUD box). The entry chunk is untouched
  // at 295.28/88.81. Justified in CHANGELOG §2026-10-27 (R9).
  // Layer 1 bump (2026-10-28, batch 1): the plain-language copy module —
  // a new top-level `layer1` object on insights-copy-{en,fa}.ts (8
  // borrowing-costs indicators × 5 new fields + a 16-term seed glossary,
  // both languages) + the typed accessors + the Layer1Block in
  // DetailsPanel + the oneLine line in AlertCard. EN source-of-truth,
  // FA shape-checked. Measured 914.48 kB raw / 221.13 kB gz (+22.04 raw /
  // +5.41 gz over R9). The growth is the bundled bilingual Layer-1 copy
  // (spec §5: bundled, no KV/external calls — D-16 path). The full 134-
  // indicator roll-out will grow this further; each batch re-measures and
  // bumps consciously. The entry chunk is untouched at 295.37/88.84.
  // See docs/insights/layer1/PLAIN-LANGUAGE-SPEC.md + DECISIONS D-01.
  // Layer 1 bump (2026-10-28, session 2 batches 2–4): the M1 copy roll-out
  // — batches 2–4 add 23 more indicator entries × 5 new fields × 2
  // languages + 5 glossary terms (carry-trade, pmi, vix, money-supply,
  // leading-indicator). Measured 947.80 kB raw / 227.90 kB gz after batch
  // 4 (+7.80 raw / +0.47 gz over the batch-1 ceiling — the bilingual copy
  // is highly compressible, so gzip grows ~2 kB per 8 indicators while raw
  // grows ~10). Ceiling set to 975/234 to cover the remaining M1 batches
  // (~17 ids, projected ~+21 raw / +5 gz → ~969/233 at M1 end); the final
  // session re-measures before LAYER1_STRICT=1. Same D-16 path: bundled
  // static copy, zero KV/external calls. Entry chunk untouched at
  // 295.37/88.84.
  // Layer 1 bump (2026-10-28, M1 final): batches 5–8 complete Milestone 1
  // (56/129 unique ids: borrowing-costs, dollar-strength, growth-health and
  // market-stress all done). Measured at the M1 end: 978.09 kB raw /
  // 233.68 kB gz — the batch-4 projection (~969/233) ran ~9 kB light
  // because batches 6–8 carried glossary-term additions and longer
  // connection texts. Ceiling moves to 985/236 (M1 final + margin); M2
  // (prices + AU, ~34 ids) re-measures and bumps again the same way.
  // Entry chunk untouched at 295.37/88.84.
  // Layer 1 bump (2026-10-29, M2 batch 9 — prices-board): batch 9 adds the
  // first 5 M2 ids (brent, gold-usd, silver-usd, btc-usd, gold-btc, with
  // longer connection texts than the average M1 card). Measured 985.55 kB
  // raw / 235.25 kB gz — +7.46 raw / +1.57 gz for 5 ids (~1.5/~0.31 per
  // id). The remaining 39 M2 ids project ~+58 raw / +12 gz → ~1043/247 at
  // the M2 end; ceiling moves to 1045/248 (M2 projected end + margin).
  // Same D-16 path: bundled static copy, zero KV/external calls. Entry
  // chunk untouched at 295.37/88.84.
  // Layer 1 bump (2026-10-29, M2 final — au-trade-currency): Milestone 2
  // complete (100/129 unique ids: prices-board, prices-heat and all three
  // AU gauges done; batches 9–15). M2-final measurement 1047.65 kB raw /
  // 248.08 kB gz — the batch-9 projection (~1043/247) ran ~4 kB raw light
  // because the AU cards carry australiaAngle lines and 2–3 connections
  // each. M3 remains: 16 markets + 6 FX pairs + 7 pattern cards (29 ids,
  // mostly lighter entries — no australiaAngle, several null-direction
  // patterns) projecting ~+40 raw / +9 gz → ~1088/257 at the L1 end;
  // ceiling moves to 1090/258 (projected end + margin). The final
  // strict-mode session re-measures before LAYER1_STRICT=1. Same D-16
  // path. Entry chunk untouched at 295.37/88.84.
  // Layer 1 bump (2026-10-28, M3 batch 19 — the 7 FX pattern cards): the
  // LAST 29 Layer-1 ids are written (batches 16–19: 16 markets, 6 FX
  // pairs, 7 null-direction pattern cards + the shared Layer1Block
  // component + the MarketDetail/PairDetail/PatternCard hooks, D-17).
  // M3-end measurement 1092.56 kB raw / 256.31 kB gz — the M2 projection
  // (~1088/257) ran ~4 kB raw light because every pattern card also
  // carries a skipReason string and 3 connections, and the shared block
  // component rides the chunk. Ceiling moves to 1100/260 (measured end
  // + margin); the final strict-mode session re-measures before
  // LAYER1_STRICT=1. Same D-16 path. Entry chunk untouched at 295.37/88.84.
  //
  // M5 (Layer-2 narrator display, spec §11): the NarrativeBlock + InTheNews
  // components + lib/narrative.ts (the fetch client + the defensive parser)
  // + the useNarrative/useNarrativePreview hooks + the wiring in
  // Insights.tsx/SectionLane/WorldMarkets/WorldCurrencies/world-feeds +
  // 5 new UI strings × 2 locales. M5-end measurement 1100.43 kB raw /
  // 258.37 kB gz — over the 1100 raw ceiling by 0.43 kB, well inside the
  // 260 gz ceiling (1.63 kB headroom). The D-16 path: the additions are
  // unavoidable (the spec's M5 display scope), the gz headroom is healthy,
  // and the entry chunk is untouched at 295.37/88.84. Bump 1100 → 1110
  // raw (10 kB headroom for the next small Layer-2 tweak); gz unchanged.
  // 2026-10-30 V11 value-mention bump (1110.47/261.03 → budget 1120/262):
  // the V11 coverage check now also matches each alert's VALUE (not just
  // its plainName) — added valueRoundings() + alertsById map + the
  // value-token check in langChecks. ~0.5 kB raw / 1 kB gz; the entry
  // chunk is untouched. Justified by the owner's "make sure AI didn't
  // miss anything" fix landing in the validator.
  //
  // 2026-10-31 Gold Program S1+S2 bump (measured 1123.69/264.30 → budget
  // 1126/266): the two prices-board panels (GoldTailwindPanel +
  // ModelVsRealityPanel) and the gold-engine/copy imports they pull from
  // @currena/insights (the pure engine + the EN copy blocks + the schema
  // types — the voter table and both copy dictionaries are the bulk).
  // +3.69 kB raw / +2.30 kB gz; the entry chunk is untouched at
  // 294.45/88.48. The owner-facing gold score on the prices strip is the
  // Gold Program's whole point (GOLD_SCORE_SPEC.md §4.4); the panel code
  // is irreducible without dropping the firing-driver list. Justified in
  // CHANGELOG §2026-10-31. Same D-16 path.
  //
  // 2026-10-31b Gold Program S2.1 bump (measured 1128.26/265.32 → budget
  // 1130/267): the owner's bilingual directive — the fa copy (55+18 keys)
  // joined the EN copy in the dictionaries, both riding this chunk. The
  // package-level EN copy constants left with the same move (net of the
  // EN swap ≈ 0), so the growth IS the reviewed Persian. Panels also
  // moved to the signals card (same chunk). Justified in CHANGELOG
  // §2026-10-31b. Entry chunk untouched at 294.45/88.48.
  //
  // 2026-10-31d Gold Program S3 bump (measured 1134.64/266.84 → budget
  // 1136/267.5): the G2 breakeven-tilt card's audited copy growth — the
  // full EN+fa card copy (12 fields × 2) + the Layer-1 entries (15 × 2)
  // + the gold panel's tiltWords (3 × 2) + the tiltLean wiring, all
  // riding this chunk (round-54, the audited Persian-copy growth the
  // spec's §4 D-16 rule names). gz stays inside 267. Justified in
  // CHANGELOG §2026-10-31d.
  //
  // 2026-10-31j Gold Program S6 bump (measured 1136.01/267.29 → budget
  // 1136.1/267.5): the D-5 promotion — the 21st voter's name in BOTH
  // dictionaries ("Inflation tilt" / «شیب انتظارات تورمی»,
  // round-56) + the one table entry in the engine import riding this
  // chunk. +0.01 kB raw over the old ceiling (10 bytes); gz stays inside
  // 267.5 (measured 267.29). Entry chunk untouched at 294.45/88.48.
  // Justified in CHANGELOG §2026-10-31j.
  //
  // 2026-10-31p gap-closure S1-M1.4 bump (measured 1137.37/267.78 →
  // budget 1138/268): the stale-voter honesty badge — the audited fa
  // badge copy (round-57, «{n} مورد از {total} قرائت قدیمی است») + the
  // EN twin + the badge wiring on VerdictBlock and QuestionGroup + the
  // gauge engine's staleCount arithmetic riding this chunk. gz +0.28 kB
  // over the old ceiling. Entry chunk untouched at 294.45/88.48.
  // Justified in CHANGELOG §2026-10-31p.
  //
  // 2026-10-31q gap-closure S1-M1.5 bump (measured 1138.69/268.19 →
  // budget 1139/268.5): the corrected Layer-1 whatItIs copy for the RBA
  // trio (round-58 — the honest "monthly average, lagged" wording now
  // that the cards ride the F2.1 monthly table; the old copy claimed the
  // blocked daily F2 file) riding this chunk. gz +0.19 kB over the old
  // ceiling. Entry chunk untouched at 294.45/88.48.
  // Justified in CHANGELOG §2026-10-31q.
  //
  // 2026-10-31r gap-closure S1-M1.6 bump (measured 1139.36/268.36 →
  // budget 1140/268.5): the audit fixes riding this chunk — the flat-band
  // note on the markets breadth box (round-59), the attention line's
  // 30-day speed phrase (round-59) and the "3m trend" column headers
  // (round-59, the label now names its measure). gz stays inside 268.5.
  // Entry chunk untouched at 294.45/88.49.
  // Justified in CHANGELOG §2026-10-31r.
  // 2026-10-31v (gap-closure S2-M2.3): 1140/269 — the TIC API client
  // (lib/tic.ts, the markets.ts twin) + the core TicSnapshot zod contract
  // riding the lazy chunk. Measured 1139.82/268.54 (the client is ~1.3 kB
  // raw); raw stays inside 1140, gz bumps 268.5 → 269.0.
  // Justified in CHANGELOG §2026-10-31v.
  { pattern: /^Insights-[\w-]+\.js$/, raw: 1140_000, gz: 269_000, label: 'Insights lazy chunk' },
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
