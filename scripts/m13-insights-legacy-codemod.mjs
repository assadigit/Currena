#!/usr/bin/env node
/**
 * M13 codemod — modularization Phase 4 (the insights-legacy domain — the
 * retirement container, the FIRST non-Phase-3 move).
 *
 * Moves the 46 LIVE legacy web files (ONE commit for the whole set per the
 * audit's Phase 4 rule, BD-M3 D1; NO engine move per the audit's
 * Deliverable 1 insights-legacy rows — all 46 are web files), then
 * re-anchors every import edge against the FINAL locations (the M2→M12
 * method, HANDOFF "Operational notes"): never hand-count ../, use
 * path.relative.
 *
 * Gate 0 (the §19.6 retirement question, OWNER DECISION FIRST per the
 * audit's R15 + the Phase 4 row) was resolved BEFORE this codemod runs:
 * Option A — the 4 dead/dangling files (MovesNextStrip.tsx +
 * UsGlobalReachGroup.tsx + config/us-global-reach.ts + its co-located
 * config/us-global-reach.test.ts) were deleted in a standalone
 * `chore(M0-pre)` commit (d6d143df, pushed + gates green, suite
 * 15,298 → 15,284, the −14 R9-07 us-global-reach tests). This codemod
 * moves the remaining 46 LIVE files. The dead files are GONE — they do
 * not appear in the move table.
 *
 * Landing shape (verified against the audit's Deliverable 1
 * insights-legacy rows (50, minus the 4 deleted = 46 live) + the M12
 * handoff's tree-verified set + the M1 skeleton README + the
 * M3→M12 precedents): PRESERVED subfolder structure (the currencies
 * fx-presentation/ + gold signals/ + australia au-markets/ convention —
 * subfolders are kept when the source had them; the M1 README names
 * insights-sections/, world-currencies/, config/ as subfolders within
 * features/insights-legacy/), so:
 *   - routes/Insights.tsx                        → features/insights-legacy/Insights.tsx
 *   - routes/insights-sections/{9 files}        → features/insights-legacy/insights-sections/{9}
 *   - components/insights/{27 top-level files}  → features/insights-legacy/{27}
 *   - components/insights/world-currencies/{7}  → features/insights-legacy/world-currencies/{7}
 *   - components/insights/config/companies.ts   → features/insights-legacy/config/companies.ts
 *   - lib/clamp-panel.ts                        → features/insights-legacy/clamp-panel.ts
 * (1 + 9 + 27 + 7 + 1 + 1 = 46; the M12 handoff's "../global/X"
 * shortening prediction assumed flatten — the codemod's path.relative
 * computes the actual spec for the preserved-subfolder shape, so the
 * prediction's exact form doesn't bind; the M10/M11 deep-route shape
 * still holds for the chunk-merger watch.)
 *
 * INVENTORY VERIFICATION (the M7′→M12 lesson — the audit's counts are
 * approximate; the tree is the truth): the audit's Phase 4 row says
 * "~50 files" and its Deliverable 1 has exactly 50 features/insights-
 * legacy rows; verified against the tree at M13 session start: exactly
 * 50 source files (all present), then the 4 dead/dangling deleted in
 * chore(M0-pre) (d6d143df), leaving 46 LIVE files. ZERO co-located
 * __snapshots__ ride the set (verified: no __snapshots__/ in
 * components/insights/, components/insights/config/,
 * components/insights/world-currencies/, or routes/insights-sections/
 * reference any moved file — R6, the M11/M12-simple shape).
 *
 * pd-s script: NONE — verified (apps/web/scripts/pd-s{4,5,7,10,12,14,
 * 16,17,18,20}-backtest.ts import NONE of the candidate-moved files;
 * the legacy page carries no §20 toolkit leg, same as M11 + M12).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * the move — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms + the ?raw sweep,
 * executed over the moved set BEFORE the move):
 *   1. App.tsx:43 lazy `import('./routes/Insights')` (dynamic import()
 *      CALL — variant #1, BD-M4 D4). Verified the ONLY variant-#1 site
 *      pointing at a moved legacy file (M11=:118, M12=:55, M13=:43 —
 *      differs as predicted; App.tsx lazy routes drift per phase).
 *   2. InsightsHeader.tsx:288 dynamic `import('../../components/insights/
 *      insights-csv')` (variant #3 — the regex gap; insights-csv MOVES
 *      to features/insights-legacy/insights-csv, InsightsHeader MOVES
 *      to features/insights-legacy/insights-sections/ → re-anchor to
 *      `../insights-csv`).
 *   3. InsightsHeader.tsx:298 dynamic `import('../../features/global/ics')`
 *      inside Promise.all (variant #3 — the M12-handoff-flagged site:
 *      ics is ALREADY in features/global/ from M12; InsightsHeader
 *      MOVES to features/insights-legacy/insights-sections/ → re-anchor
 *      to `../../global/ics`, dropping the `features/` segment since
 *      the new location is INSIDE features/). The M12 handoff predicted
 *      `../global/ics` (flatten assumption); the preserved-subfolder
 *      shape gives `../../global/ics` (path.relative is the truth).
 *   4. InsightsHeader.tsx:314 dynamic `import('../../components/insights/
 *      full-export')` (variant #3; full-export MOVES → re-anchor to
 *      `../full-export`).
 *   5. InsightsHeader.tsx:290 + :298(second) + :326 dynamic
 *      `import('../../shared/lib/download')` (variant #3, ×3
 *      occurrences; shared/lib/download does NOT move, but InsightsHeader
 *      MOVES +1 depth (routes/insights-sections/ 2-below-src →
 *      features/insights-legacy/insights-sections/ 3-below-src) →
 *      LENGTHEN to `../../../shared/lib/download`). global replace
 *      (expectCount=3).
 *   6. world-feeds.ts:99 dynamic `import('../../components/insights/
 *      markets-csv')` (variant #3; markets-csv MOVES → `../markets-csv`).
 *   7. world-feeds.ts:163 dynamic `import('../../components/insights/
 *      fx-csv')` (variant #3; fx-csv MOVES → `../fx-csv`).
 *   8. world-feeds.ts:101 + :165 dynamic `import('../../shared/lib/
 *      download')` (variant #3, ×2; same +1-depth lengthen as
 *      InsightsHeader → `../../../shared/lib/download`). global replace
 *      (expectCount=2).
 *
 * Verified NO-OP variant-#3 sites (dynamic import() the regex cannot
 * see, but NO re-anchor needed — depth-invariant or same-dir; left
 * untouched, documented for the record):
 *   - DataExportMenu.tsx:29 `import('./DataExportPanel')` — both
 *     endpoints move siblings (components/insights/ → features/
 *     insights-legacy/), same-dir NO-OP.
 *   - DataExportPanel.tsx:72 `import('../../shared/lib/download')` —
 *     importer moves components/insights/ → features/insights-legacy/
 *     (BOTH 2-below-src, depth-invariant), target shared doesn't move →
 *     spec UNCHANGED.
 *   - full-export.test.ts:412 `import('./full-export')` — both siblings
 *     (components/insights/ → features/insights-legacy/), same-dir NO-OP.
 *   - markets-verdict.test.ts:256 + :266
 *     `import('../../features/world-markets/{MarketsVerdict,briefing}')`
 *     — importer moves components/insights/ → features/insights-legacy/
 *     (depth-invariant), target features/world-markets/ doesn't move →
 *     spec UNCHANGED.
 *   - AboutTheData.tsx:226 `import('../../../../../data/indicator-audit.json')`
 *     — R8 fs-path DYNAMIC form; importer moves components/insights/ →
 *     features/insights-legacy/ (BOTH 5-below-root, depth-invariant to
 *     root-data/) → spec UNCHANGED (the M6→M12 depth-invariant pattern).
 *   - full-export.ts:899 `import('../../shared/lib/xlsx-writer')` —
 *     importer moves components/insights/ → features/insights-legacy/
 *     (depth-invariant), target shared doesn't move → spec UNCHANGED.
 *
 * R8 fs-path forms (static, the regex + the dynamic NO-OP above): ONE
 * site — about-sources.test.ts:167
 * `new URL('../../../../../packages/insights/src/shared/sources.ts',
 * import.meta.url)` — targets an ENGINE file (sources.ts, moved in
 * Phase 2, NOT M13). about-sources.test.ts moves components/insights/ →
 * features/insights-legacy/ (BOTH 2-below-src / 5-below-root, the 5-../
 * depth to root-packages/ IDENTICAL) → DEPTH-INVARIANT, UNTOUCHED (the
 * M6→M12 depth-invariant pattern; path.relative confirms). The codemod
 * leaves it alone.
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO Vite `?raw` queries on any moved file (the M10/M11/M12-simple
 *     situation; ZERO ?raw across all 46 candidate files).
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at
 *     moved files.
 *   - NO `__dirname` / `HERE` / `here` join, NO `readFileSync(join())`,
 *     NO `fileURLToPath` on any moved file (the fs-path machinery is
 *     the ONE about-sources.test.ts new URL form above, depth-invariant).
 *
 * Cross-tree engine→web edge (the audit's Phase 4 row names it):
 *   - selfcheck.ts:53 (packages/insights/scripts/) STATIC import
 *     `from '../../../apps/web/src/components/insights/full-export'` —
 *     full-export MOVES; selfcheck.ts does NOT move. The codemod regex
 *     CATCHES this (it's a `from` static import, and packages/insights/
 *     scripts is in SCAN_ROOTS) → re-anchors to
 *     `../../../apps/web/src/features/insights-legacy/full-export`.
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - data-health.test.ts:21 (moves to features/insights-legacy/
 *     insights-sections/) imports TZ_LABEL from
 *     `../../features/global/NextUpStrip` (NextUpStrip already in
 *     features/global/ from M12). Re-anchors to `../../global/NextUpStrip`
 *     (drops the `features/` segment; the M12 handoff predicted
 *     `../global/NextUpStrip` for a flatten — the preserved-subfolder
 *     shape gives `../../global/NextUpStrip`; path.relative is the truth).
 *   - Every domain component that kept a legacy importer until this
 *     phase (R13 by design — the legacy super-consumer pattern): the
 *     legacy importers MOVE into features/insights-legacy/ this phase,
 *     so their imports of domain files (features/usa/, features/gold/,
 *     …) re-anchor mechanically (the depth change for routes/insights-
 *     sections/* + routes/Insights.tsx + lib/clamp-panel.ts gains a ../
 *     toward features/<domain>/; the components/insights/* importers are
 *     depth-invariant → their features/<domain>/ specs are unchanged).
 *
 * NO exports-map edit this phase (verified: packages/insights/package.json
 * has NO entry touching any of the 46 files — they are all web files;
 * the 16 existing entries all point at engine paths; same as M11 + M12).
 *
 * Persian-copy manifest (BD-M5 D5): ONE entry references a moved path
 * (pre-verified — the M11 two-re-key + M12 one-re-key pattern holds:
 * NON-zero). The legacy components route their fa strings through the
 * i18n dictionary (ZERO direct manifest entries for them); the ONE
 * entry is the QuietArea.tsx Persian percent-sign glyph `٪` (a
 * `hardcoded.*` technical entry, path-derived id):
 *   - id: `hardcoded.apps.web.src.components.insights.world-currencies.
 *     QuietArea.a489ae36` → `hardcoded.apps.web.src.features.insights-
 *     legacy.world-currencies.QuietArea.a489ae36` (id derivation per
 *     lib/persian-copy.mjs:239 = `hardcoded.` + dotted-path +
 *     `.` + sha256-8; the audit matches by source-path + sha256, so
 *     the source MUST re-key; the id re-keys for forward-compat so a
 *     future copy:audit:update regenerates the same id).
 *   - source: `apps/web/src/components/insights/world-currencies/
 *     QuietArea.tsx` → `apps/web/src/features/insights-legacy/
 *     world-currencies/QuietArea.tsx`.
 *   - text + sha256 UNCHANGED (the review basis preserved; `٪` =
 *     a489ae36…); note appended with the re-key record (the M8
 *     BalanceScale entry-642 re-key-note pattern).
 * SWEEP_ROOTS (lib/persian-copy.mjs:41) includes `apps/web/src`
 * (recursive) → the moved QuietArea.tsx IS swept at its new path →
 * the re-keyed entry matches → copy:audit (gate 4) clean.
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the
 * chore(M0-pre) baseline gates build — expect the M10/M11 deep-route
 * shape, NOT the M12 landing-cascade): the Insights page chunk is a
 * DEEP route (not the landing — GlobalPage is the / landing, M12
 * already moved it + recorded the landing-cascade). Per the M10/M11
 * mechanism correction: the entry re-hashes ONLY if the moved page
 * chunk's FILENAME changes; a byte-identical Insights chunk (the spec
 * changes resolve to the same modules + spec text never survives
 * bundling) means ZERO ripple. EXPECT: byte-identical Insights page
 * chunk → zero entry re-hash → zero cascade (the M10/M11 shape). Record
 * the honest outcome either way; close with the full-substitution
 * rebasing test + the name-agnostic token-multiset proof (the M9
 * sharpening); compare sw.js by entry-multiset, not raw sha (the M10
 * precache-tail rotation finding).
 *
 * Usage:
 *   node scripts/m13-insights-legacy-codemod.mjs          # apply (default)
 *   node scripts/m13-insights-legacy-codemod.mjs --dry    # print the plan only
 *
 * Run from the repo root. Idempotent-ish: it refuses to run if the
 * target files already exist.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DRY = process.argv.includes('--dry');

// ---------------------------------------------------------------------------
// 1. THE MOVE TABLE — old path → new path (repo-relative, no renames).
//    46 LIVE web files into features/insights-legacy/ (PRESERVED subfolders:
//    insights-sections/, world-currencies/, config/ — the currencies
//    fx-presentation/ + gold signals/ + australia au-markets/ convention).
//    The 4 dead/dangling files were deleted in chore(M0-pre) (d6d143df) —
//    they are NOT in this table.
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';

const moves = [
  // --- routes/Insights.tsx (1) ---
  [`${WEB}/routes/Insights.tsx`, `${WEB}/features/insights-legacy/Insights.tsx`],
  // --- routes/insights-sections/ (9 — UsGlobalReachGroup deleted in M0-pre) ---
  [`${WEB}/routes/insights-sections/DeprecationBanner.tsx`,    `${WEB}/features/insights-legacy/insights-sections/DeprecationBanner.tsx`],
  [`${WEB}/routes/insights-sections/InsightsHeader.tsx`,       `${WEB}/features/insights-legacy/insights-sections/InsightsHeader.tsx`],
  [`${WEB}/routes/insights-sections/InsightsStatusBlocks.tsx`, `${WEB}/features/insights-legacy/insights-sections/InsightsStatusBlocks.tsx`],
  [`${WEB}/routes/insights-sections/QuestionGroup.tsx`,        `${WEB}/features/insights-legacy/insights-sections/QuestionGroup.tsx`],
  [`${WEB}/routes/insights-sections/SectionLane.tsx`,          `${WEB}/features/insights-legacy/insights-sections/SectionLane.tsx`],
  [`${WEB}/routes/insights-sections/data-health.ts`,           `${WEB}/features/insights-legacy/insights-sections/data-health.ts`],
  [`${WEB}/routes/insights-sections/data-health.test.ts`,      `${WEB}/features/insights-legacy/insights-sections/data-health.test.ts`],
  [`${WEB}/routes/insights-sections/useInsightsToolsNav.ts`,   `${WEB}/features/insights-legacy/insights-sections/useInsightsToolsNav.ts`],
  [`${WEB}/routes/insights-sections/world-feeds.ts`,           `${WEB}/features/insights-legacy/insights-sections/world-feeds.ts`],
  // --- components/insights/ top-level (27 — MovesNextStrip deleted in M0-pre) ---
  [`${WEB}/components/insights/AboutTheData.tsx`,        `${WEB}/features/insights-legacy/AboutTheData.tsx`],
  [`${WEB}/components/insights/AlertCard.tsx`,           `${WEB}/features/insights-legacy/AlertCard.tsx`],
  [`${WEB}/components/insights/CardMeta.tsx`,            `${WEB}/features/insights-legacy/CardMeta.tsx`],
  [`${WEB}/components/insights/CompactRow.tsx`,          `${WEB}/features/insights-legacy/CompactRow.tsx`],
  [`${WEB}/components/insights/CompaniesTable.tsx`,      `${WEB}/features/insights-legacy/CompaniesTable.tsx`],
  [`${WEB}/components/insights/DataExportMenu.tsx`,      `${WEB}/features/insights-legacy/DataExportMenu.tsx`],
  [`${WEB}/components/insights/DataExportPanel.tsx`,     `${WEB}/features/insights-legacy/DataExportPanel.tsx`],
  [`${WEB}/components/insights/DetailsPanel.tsx`,        `${WEB}/features/insights-legacy/DetailsPanel.tsx`],
  [`${WEB}/components/insights/InTheNews.tsx`,           `${WEB}/features/insights-legacy/InTheNews.tsx`],
  [`${WEB}/components/insights/JumpNav.tsx`,             `${WEB}/features/insights-legacy/JumpNav.tsx`],
  [`${WEB}/components/insights/NarrativeBlock.tsx`,      `${WEB}/features/insights-legacy/NarrativeBlock.tsx`],
  [`${WEB}/components/insights/PositionBar.tsx`,        `${WEB}/features/insights-legacy/PositionBar.tsx`],
  [`${WEB}/components/insights/TicCustodyCard.tsx`,      `${WEB}/features/insights-legacy/TicCustodyCard.tsx`],
  [`${WEB}/components/insights/ToolsMenu.tsx`,          `${WEB}/features/insights-legacy/ToolsMenu.tsx`],
  [`${WEB}/components/insights/WorldCurrencies.tsx`,     `${WEB}/features/insights-legacy/WorldCurrencies.tsx`],
  [`${WEB}/components/insights/WorldMarkets.tsx`,        `${WEB}/features/insights-legacy/WorldMarkets.tsx`],
  [`${WEB}/components/insights/about-sources.ts`,        `${WEB}/features/insights-legacy/about-sources.ts`],
  [`${WEB}/components/insights/about-sources.test.ts`,   `${WEB}/features/insights-legacy/about-sources.test.ts`],
  [`${WEB}/components/insights/freshness-line.test.tsx`, `${WEB}/features/insights-legacy/freshness-line.test.tsx`],
  [`${WEB}/components/insights/full-export.ts`,          `${WEB}/features/insights-legacy/full-export.ts`],
  [`${WEB}/components/insights/full-export.test.ts`,     `${WEB}/features/insights-legacy/full-export.test.ts`],
  [`${WEB}/components/insights/fx-csv.ts`,               `${WEB}/features/insights-legacy/fx-csv.ts`],
  [`${WEB}/components/insights/fx-csv.test.ts`,          `${WEB}/features/insights-legacy/fx-csv.test.ts`],
  [`${WEB}/components/insights/insights-csv.ts`,         `${WEB}/features/insights-legacy/insights-csv.ts`],
  [`${WEB}/components/insights/insights-csv.test.ts`,    `${WEB}/features/insights-legacy/insights-csv.test.ts`],
  [`${WEB}/components/insights/markets-csv.ts`,          `${WEB}/features/insights-legacy/markets-csv.ts`],
  [`${WEB}/components/insights/markets-verdict.test.ts`, `${WEB}/features/insights-legacy/markets-verdict.test.ts`],
  // --- components/insights/world-currencies/ (7) ---
  [`${WEB}/components/insights/world-currencies/DollarRow.tsx`,       `${WEB}/features/insights-legacy/world-currencies/DollarRow.tsx`],
  [`${WEB}/components/insights/world-currencies/DollarStrength.tsx`,  `${WEB}/features/insights-legacy/world-currencies/DollarStrength.tsx`],
  [`${WEB}/components/insights/world-currencies/PairsTable.tsx`,      `${WEB}/features/insights-legacy/world-currencies/PairsTable.tsx`],
  [`${WEB}/components/insights/world-currencies/PatternCard.tsx`,     `${WEB}/features/insights-legacy/world-currencies/PatternCard.tsx`],
  [`${WEB}/components/insights/world-currencies/PatternVisuals.tsx`,  `${WEB}/features/insights-legacy/world-currencies/PatternVisuals.tsx`],
  [`${WEB}/components/insights/world-currencies/QuietArea.tsx`,       `${WEB}/features/insights-legacy/world-currencies/QuietArea.tsx`],
  [`${WEB}/components/insights/world-currencies/ReadingAids.tsx`,     `${WEB}/features/insights-legacy/world-currencies/ReadingAids.tsx`],
  // --- components/insights/config/ (1 — us-global-reach.ts + .test.ts deleted in M0-pre) ---
  [`${WEB}/components/insights/config/companies.ts`, `${WEB}/features/insights-legacy/config/companies.ts`],
  // --- lib/clamp-panel.ts (1) ---
  [`${WEB}/lib/clamp-panel.ts`, `${WEB}/features/insights-legacy/clamp-panel.ts`],
];

// ---------------------------------------------------------------------------
// 2. Pre-flight: every source must exist, every target must not.
// ---------------------------------------------------------------------------
for (const [from, to] of moves) {
  if (!fs.existsSync(path.join(ROOT, from))) {
    console.error(`PRE-FLIGHT FAIL: source missing ${from}`);
    process.exit(1);
  }
  if (fs.existsSync(path.join(ROOT, to))) {
    console.error(`PRE-FLIGHT FAIL: target already exists ${to}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// 3. Build the resolver: OLD specifier (as written from a given importer)
//    → NEW specifier. The map is keyed by the moved file's OLD abs path so
//    we can resolve any relative specifier that points at a moved file,
//    from any importer (moved or not). (Identical to the M3–M12 codemod.)
// ---------------------------------------------------------------------------
function resolveCandidates(dir, spec) {
  const base = path.resolve(dir, spec);
  const out = [];
  try {
    if (fs.statSync(base).isFile()) out.push({ abs: base, style: 'as-written' });
  } catch { /* not a file (or missing) */ }
  for (const [suffix, style] of [
    ['.ts', 'file'],
    ['.tsx', 'file'],
    ['/index.ts', 'folder'],
    ['/index.tsx', 'folder'],
  ]) {
    if (fs.existsSync(base + suffix)) out.push({ abs: base + suffix, style });
  }
  return out;
}

/** Resolve a relative specifier `spec` written in `importerFile` against
 *  the OLD tree; return the NEW specifier anchored to the importer's
 *  FINAL location — or null when neither endpoint moved (nothing to do).
 *  (The M2→M12 method: re-anchor EVERY relative edge of a moved importer,
 *  and every edge whose target moved, against final locations; never
 *  hand-count ../ — path.relative does the arithmetic.) */
function reanchor(importerOldAbs, importerNewAbs, spec) {
  if (!spec.startsWith('.')) return null; // package specifier — untouched
  const importerMoved = importerOldAbs !== importerNewAbs;

  // split a Vite query suffix (?raw etc.) off and re-append verbatim
  const qIdx = spec.indexOf('?');
  const query = qIdx >= 0 ? spec.slice(qIdx) : '';
  const specPath = qIdx >= 0 ? spec.slice(0, qIdx) : spec;

  for (const cand of resolveCandidates(path.dirname(importerOldAbs), specPath)) {
    const finalTarget = movedSet.get(cand.abs); // moved file's NEW abs path
    const targetMoved = finalTarget !== undefined;
    if (!importerMoved && !targetMoved) continue; // untouched edge

    const targetFinalAbs = targetMoved ? finalTarget : cand.abs;
    let rel = path.relative(path.dirname(importerNewAbs), targetFinalAbs);
    if (!rel.startsWith('.')) rel = './' + rel;

    // preserve the specifier STYLE: extensionless file imports stay
    // extensionless; folder-style imports stay folder-style; explicit
    // extensions (.json, .tsx?raw) stay as-written.
    if (cand.style === 'file') {
      rel = rel.replace(/\.(ts|tsx)$/, '');
    } else if (cand.style === 'folder') {
      rel = rel.replace(/\/index\.(ts|tsx)$/, '');
    }
    return rel + query;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 4. Discover every file that imports any moved file (scan the whole repo
//    for relative specs, resolving against the OLD tree), plus the moved
//    files' own outgoing relative imports.
// ---------------------------------------------------------------------------
const SCAN_ROOTS = ['apps/web/src', 'apps/web/scripts', 'packages/insights/src', 'packages/insights/scripts', 'apps/api/src', 'apps/markets/src', 'scripts'];
const EXT = /\.(ts|tsx|mjs|mts)$/;

function walk(dir, out) {
  for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'dist') continue;
    const p = dir ? `${dir}/${e.name}` : e.name;
    if (e.isDirectory()) walk(p, out);
    else if (EXT.test(e.name)) out.push(p);
  }
  return out;
}

const allFiles = SCAN_ROOTS.flatMap((r) => (fs.existsSync(path.join(ROOT, r)) ? walk(r, []) : []));
const movedSet = new Map(moves.map(([f, t]) => [path.join(ROOT, f), path.join(ROOT, t)]));

// import/export-from specifier regex (single-quote + double-quote forms)
const IMPORT_RE = /((?:import|export)\s+(?:type\s+)?(?:[\s\S]*?from\s+)?['"])([^'"]+)(['"])/g;

const edits = []; // {file(NEW or current abs), from, to, count}
let edgeCount = 0;

for (const relFile of allFiles) {
  const oldAbs = path.join(ROOT, relFile);
  const newAbs = movedSet.get(oldAbs) ?? oldAbs; // importer's FINAL location
  const text = fs.readFileSync(oldAbs, 'utf8');
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(text)) !== null) {
    const spec = m[2];
    const newSpec = reanchor(oldAbs, newAbs, spec);
    if (newSpec && newSpec !== spec) {
      edits.push({ file: newAbs, old: spec, new: newSpec });
      edgeCount++;
    }
  }
}

// ---------------------------------------------------------------------------
// 5. THE MANUAL EDITS — string-path machinery the import regex cannot see
//    (the dynamic import() CALL + the Persian-copy manifest re-key).
//    Keyed by FINAL file path; applied as exact substring replacements.
//    M13 has TEN: App.tsx lazy route (variant #1) + InsightsHeader 4
//    (variant #3: insights-csv, download×3 global, ics, full-export) +
//    world-feeds 3 (variant #3: markets-csv, download×2 global, fx-csv) +
//    the ONE Persian-copy manifest re-key (QuietArea id+source) + its
//    note-append (BD-M5 D5, the M8 entry-642 re-key-note pattern; the
//    M11 two-re-key + M12 one-re-key pattern holds: NON-zero). ZERO R8
//    fixture traps this phase (the ONE R8 site in about-sources.test.ts:167
//    is depth-invariant: components/insights/ → features/insights-legacy/
//    preserves the 5-../ depth to root-packages/, path.relative confirms —
//    UNTOUCHED).
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx:43 lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY legacy variant-#1 site,
  //     verified by the pre-gates grep) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/Insights')",
    to: "import('./features/insights-legacy/Insights')",
  },
  // --- manual edit 2: InsightsHeader.tsx:288 dynamic insights-csv import
  //     (variant #3; insights-csv MOVES to features/insights-legacy/
  //     insights-csv, InsightsHeader MOVES to features/insights-legacy/
  //     insights-sections/ → ../insights-csv) ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/InsightsHeader.tsx`,
    from: "import('../../components/insights/insights-csv')",
    to: "import('../insights-csv')",
  },
  // --- manual edit 3: InsightsHeader.tsx:290 + :298(second) + :326 dynamic
  //     shared/lib/download (variant #3, ×3 occurrences; importer MOVES +1
  //     depth → LENGTHEN to ../../../shared/lib/download). global replace,
  //     expectCount=3 ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/InsightsHeader.tsx`,
    from: "import('../../shared/lib/download')",
    to: "import('../../../shared/lib/download')",
    global: true,
    expectCount: 3,
  },
  // --- manual edit 4: InsightsHeader.tsx:298 dynamic ics inside Promise.all
  //     (variant #3 — the M12-handoff-flagged site; ics ALREADY in
  //     features/global/ from M12; InsightsHeader MOVES to features/
  //     insights-legacy/insights-sections/ → ../../global/ics, dropping the
  //     features/ segment since the new location is INSIDE features/) ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/InsightsHeader.tsx`,
    from: "import('../../features/global/ics')",
    to: "import('../../global/ics')",
  },
  // --- manual edit 5: InsightsHeader.tsx:314 dynamic full-export (variant
  //     #3; full-export MOVES → ../full-export) ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/InsightsHeader.tsx`,
    from: "import('../../components/insights/full-export')",
    to: "import('../full-export')",
  },
  // --- manual edit 6: world-feeds.ts:99 dynamic markets-csv (variant #3;
  //     markets-csv MOVES → ../markets-csv) ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/world-feeds.ts`,
    from: "import('../../components/insights/markets-csv')",
    to: "import('../markets-csv')",
  },
  // --- manual edit 7: world-feeds.ts:101 + :165 dynamic shared/lib/download
  //     (variant #3, ×2; same +1-depth lengthen as InsightsHeader →
  //     ../../../shared/lib/download). global replace, expectCount=2 ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/world-feeds.ts`,
    from: "import('../../shared/lib/download')",
    to: "import('../../../shared/lib/download')",
    global: true,
    expectCount: 2,
  },
  // --- manual edit 8: world-feeds.ts:163 dynamic fx-csv (variant #3;
  //     fx-csv MOVES → ../fx-csv) ---
  {
    file: `${WEB}/features/insights-legacy/insights-sections/world-feeds.ts`,
    from: "import('../../components/insights/fx-csv')",
    to: "import('../fx-csv')",
  },
  // --- manual edit 9: Persian-copy manifest re-key — the QuietArea.tsx
  //     Persian percent-sign glyph `٪` (a hardcoded.* technical entry,
  //     path-derived id per lib/persian-copy.mjs:239). Re-key BOTH the id
  //     (path portion) AND the source (the audit matches by source-path +
  //     sha256, so the source MUST re-key; the id re-keys for forward-
  //     compat so a future copy:audit:update regenerates the same id).
  //     text + sha256 UNCHANGED. The ONE re-key this phase (the M11
  //     two-re-key + M12 one-re-key pattern holds: NON-zero) ---
  {
    file: 'docs/localization/persian-copy-manifest.json',
    from: '"id":"hardcoded.apps.web.src.components.insights.world-currencies.QuietArea.a489ae36","source":"apps/web/src/components/insights/world-currencies/QuietArea.tsx"',
    to: '"id":"hardcoded.apps.web.src.features.insights-legacy.world-currencies.QuietArea.a489ae36","source":"apps/web/src/features/insights-legacy/world-currencies/QuietArea.tsx"',
  },
  // --- manual edit 10: the note-append for the QuietArea re-key (BD-M5 D5,
  //     the M8 BalanceScale entry-642 re-key-note pattern; text+hash
  //     unchanged, note appended with the re-key record) ---
  {
    file: 'docs/localization/persian-copy-manifest.json',
    from: 'into world-currencies/QuietArea.tsx (pure path move, text unchanged)"',
    to: 'into world-currencies/QuietArea.tsx (pure path move, text unchanged); re-keyed at features/insights-legacy after the M13 insights-legacy domain move (pure path move, text+hash unchanged)"',
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (46 web — 1 routes/Insights + 9 insights-sections + 27 components/insights top-level + 7 world-currencies + 1 config/companies + 1 lib/clamp-panel; ZERO co-located snapshots; NO engine move — all 46 are web files; the 4 dead/dangling files were deleted in chore(M0-pre) d6d143df)`);
console.log(`Import edges to rewrite (regex-caught static): ${edgeCount}`);
const byFile = new Map();
for (const e of edits) {
  if (!byFile.has(e.file)) byFile.set(e.file, []);
  byFile.get(e.file).push(`${e.old}  →  ${e.new}`);
}
for (const [file, list] of [...byFile.entries()].sort()) {
  console.log(`\n${path.relative(ROOT, file)}`);
  for (const l of list) console.log(`   ${l}`);
}
console.log(`\nManual edits: ${manualEdits.length}`);
for (const me of manualEdits) {
  const tag = me.global ? ` (global×${me.expectCount})` : '';
  console.log(`   ${me.file}:${tag}  ${me.from.slice(0, 70)}…  →  ${me.to.slice(0, 70)}…`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OPs (untouched, depth-invariant / same-dir):');
  console.log("   components/insights/* importers (27 + 7 world-currencies + 1 config) → features/insights-legacy/ (BOTH 2-below-src for top-level / 3-below-src for subfolders — depth-INVARIANT): every ../../X spec toward shared/, features/<domain>/, router/ UNCHANGED");
  console.log("   intra-set './' edges within insights-sections/ (InsightsHeader→./data-health, ./InsightsStatusBlocks, etc.) + within world-currencies/ (WorldCurrencies→./world-currencies/DollarRow etc.) + within config/ : BOTH endpoints move into the SAME subfolder — same-dir NO-OP");
  console.log("   variant-#3 NO-OPs (dynamic import() regex can't see, but no re-anchor needed): DataExportMenu.tsx:29 (./DataExportPanel same-dir), DataExportPanel.tsx:72 (../../shared/lib/download depth-invariant), full-export.test.ts:412 (./full-export same-dir), markets-verdict.test.ts:256,266 (../../features/world-markets/ depth-invariant), AboutTheData.tsx:226 (../../../../../data/indicator-audit.json R8 dynamic depth-invariant), full-export.ts:899 (../../shared/lib/xlsx-writer depth-invariant)");
  console.log("   package specifiers (@currena/core, @currena/insights, lucide-react, @testing-library/react, vitest, node:fs, …) — untouched by design");
  console.log('   R8 site about-sources.test.ts:167 (new URL(../../../../../packages/insights/src/shared/sources.ts, import.meta.url)) — DEPTH-INVARIANT (components/insights/ and features/insights-legacy/ both 5 ../ to root-packages/, path.relative confirms) — targets an ENGINE file (sources.ts, Phase 2, NOT M13)');
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms + ?raw over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files; ?raw ON any moved file (ZERO across all 46); __dirname/HERE/readFileSync(join())/fileURLToPath ON any moved file (ZERO)");
  console.log('Cross-tree engine→web edge (regex-caught): selfcheck.ts:53 (packages/insights/scripts/) from ../../../apps/web/src/components/insights/full-export → ../../../apps/web/src/features/insights-legacy/full-export.');
  console.log('Cross-domain edges re-anchored: data-health.test.ts:21 (TZ_LABEL ../../features/global/NextUpStrip → ../../global/NextUpStrip, the +1-depth preserved-subfolder shape); every legacy importer of features/<domain>/ files re-anchors mechanically (routes/insights-sections/* + routes/Insights.tsx + lib/clamp-panel.ts gain a ../ toward features/<domain>/; components/insights/* importers depth-invariant → unchanged).');
  console.log('Exports map: NO insights-legacy entries exist (verified — the 16 entries all point at engine paths; all 46 moved files are web files) — NO edit this phase.');
  console.log('Persian-copy manifest: ONE entry references the moved paths (hardcoded.apps.web.src.components.insights.world-currencies.QuietArea.a489ae36 — the `٪` Persian percent-sign glyph in QuietArea.tsx; the M8 BalanceScale precedent; the legacy components route fa through the i18n dictionary, ZERO direct manifest entries) — re-keyed by manual edits 9+10 (id+source+note).');
  console.log('Chunk-merger watch (baseline recorded from the chore(M0-pre) gates build): Insights page chunk is a DEEP route (not the / landing — GlobalPage is the landing, M12 already moved it + recorded the landing-cascade); per the M10/M11 mechanism correction the entry re-hashes ONLY if the page chunk filename changes — a byte-identical Insights chunk means ZERO ripple; EXPECT the M10/M11 deep-route shape (byte-identical → zero cascade), NOT the M12 landing-cascade; record the honest outcome; close with the full-substitution rebasing test + the name-agnostic token-multiset proof; sw.js by entry-multiset.');
  process.exit(0);
}

// --- apply the moves with git mv (history preserved) ---
for (const [from, to] of moves) {
  const toAbs = path.join(ROOT, to);
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  execSync(`git mv -- "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' });
}

// --- apply the import rewrites (static, regex-caught) ---
for (const [file] of byFile) {
  let text = fs.readFileSync(file, 'utf8');
  for (const e of edits.filter((x) => x.file === file)) {
    const needle = `'${e.old}'`;
    const replacement = `'${e.new}'`;
    if (!text.includes(needle)) {
      console.error(`  MISS in ${path.relative(ROOT, file)}: ${needle}`);
      process.exit(1);
    }
    text = text.replace(needle, replacement);
  }
  fs.writeFileSync(file, text);
}

// --- apply the manual edits (dynamic import() calls + manifest re-key) ---
for (const me of manualEdits) {
  const abs = path.join(ROOT, me.file);
  let text = fs.readFileSync(abs, 'utf8');
  if (!text.includes(me.from)) {
    console.error(`  MANUAL MISS in ${me.file}: ${me.from.slice(0, 100)}…`);
    process.exit(1);
  }
  if (me.global) {
    // count occurrences to guard against an unexpected 4th site
    const occurrences = text.split(me.from).length - 1;
    if (occurrences !== me.expectCount) {
      console.error(`  MANUAL COUNT MISMATCH in ${me.file}: expected ${me.expectCount} of ${me.from.slice(0, 60)}…, found ${occurrences}`);
      process.exit(1);
    }
    text = text.split(me.from).join(me.to);
  } else {
    text = text.replace(me.from, me.to);
  }
  fs.writeFileSync(abs, text);
}

console.log('\nDONE — moves applied + import edges re-anchored + manual edits (App.tsx:43 lazy + InsightsHeader 4 variant-#3 + world-feeds 3 variant-#3 + the 1 manifest re-key+note) fixed.');
console.log('Next: broken-path grep, copy:audit (expect clean — the 1 re-key lands in this same commit), then gates.');
