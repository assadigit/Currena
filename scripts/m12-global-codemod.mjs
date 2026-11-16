#!/usr/bin/env node
/**
 * M12 codemod — modularization Phase 3.10 (the global domain, the tenth
 * and LAST Phase 3 move, biggest-first per the audit).
 *
 * Moves the 16 web global files (ONE commit for the whole set per the
 * audit's Phase 3 rule, BD-M3 D1; NO engine move per the audit's
 * Deliverable 1 global rows — all 16 are web files), then re-anchors
 * every import edge against the FINAL locations (the M2→M11 method,
 * HANDOFF "Operational notes"): never hand-count ../, use path.relative.
 *
 * Landing shape (verified against the audit's Deliverable 1 global rows
 * + the M11 handoff's TREE-VERIFIED set + the M3→M11 precedents): all
 * sixteen FLAT into apps/web/src/features/global/ — the move spans TWO
 * source folders (the M11 shape): TEN files from routes/page-division/
 * (GlobalPage.tsx + GlobalPage.test.tsx, GlobalBoard, WorldRiskCards,
 * global-tiles + global-tiles.test, global-backtest-core +
 * global-backtest.test + global-copy-pin.test, global-page-states) +
 * SIX from components/insights/ (HeroBlock.tsx, TopMoversStrip.tsx,
 * NextUpStrip.tsx, ics.ts + ics.test.ts, hero-editorial.test.tsx). NO
 * named cluster in the set. NO co-located vitest snapshot rides the set
 * (verified: no __snapshots__/ references — R6, the M11-simple shape).
 *
 * INVENTORY VERIFICATION (the M7′/M8/M9/M10/M11 lesson — the audit's
 * counts are approximate; the tree is the truth): the audit's Phase 3
 * item 10 row says "16 web files (incl. HeroBlock, TopMoversStrip,
 * NextUpStrip, ics)" and its Deliverable 1 has exactly 16 rows with
 * target = features/global; verified against the tree at M12 session
 * start: exactly 16 source files, ZERO co-located snapshots, and
 * features/global/ holds only the M1 skeleton README.
 *
 * pd-s script: pd-s4-backtest.ts:53 imports
 * `../src/routes/page-division/global-backtest-core` — the global
 * script (the audit's Deliverable 6 P3.10 row says pd-s5 — WRONG for
 * the FIFTH time per the M11 handoff; pd-s5 is gold's, M8-verified).
 * Re-anchored by this codemod.
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms checked over the moved
 * set):
 *   1. App.tsx:55 lazy `import('./routes/page-division/GlobalPage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4). Verified the
 *      ONLY variant-#1 site pointing at a moved global file.
 *   2. InsightsHeader.tsx:298 dynamic
 *      `import('../../components/insights/ics')` inside a Promise.all
 *      (variant #3, BD-M4 D4 — the M11 handoff flagged this site: "a
 *      variant-#3 site pointing at a MOVED file, re-anchor it by hand,
 *      the regex cannot see it"). Verified the ONLY variant-#3 site
 *      pointing at a moved global file.
 *   3. The ONE Persian-copy manifest re-key (BD-M5 D5, the M8
 *      BalanceScale entry-642 re-key-note pattern — this phase is NOT
 *      zero-re-key, ONE manifest entry DOES reference the moved paths,
 *      pre-verified BEFORE the move):
 *        - inline.ics-calendar-name (source-only re-key — the semantic
 *          inline.* id stays; the "رویدادهای اقتصادی کورنا" fa ICS
 *          calendar name; source apps/web/src/components/insights/ics.ts
 *          → apps/web/src/features/global/ics.ts)
 *      Text + sha256 UNCHANGED (the review basis preserved), note
 *      appended with the re-key record.
 *
 * R8 fs-path forms: TWO sites in global-backtest.test.ts (lines 40 +
 * 45): `readFileSync(new URL('../../../../../data/indicators.json',
 * import.meta.url), 'utf8')` + the site-mode-overrides.json twin.
 * Verified ZERO re-anchor needed: path.relative confirms the depth from
 * `routes/page-division/` to root-`data/` (5 ../) is IDENTICAL to the
 * depth from `features/global/` to root-`data/` (5 ../) — the M6→M11
 * depth-invariant pattern. The codemod leaves them untouched.
 *
 * Verified NO-OPs (grepped per moved file, the BD-M4 D4 lesson — left
 * untouched because depth-invariant / same-dir):
 *   - ALL '../../shared/…', '../../router', '../../features/world-
 *     markets/…', '../../features/currencies/…' imports of the moved
 *     files: every importer moves BETWEEN two src-depth-2 folders
 *     (routes/page-division/ → features/global/ AND components/insights/
 *     → features/global/ — both pairs sit at src depth 2) — every
 *     src-rooted ../../ spec resolves identically from BOTH old and
 *     new locations (the M6→M11 depth-invariant pattern).
 *   - intra-set './' edges (GlobalPage → ./GlobalBoard, GlobalPage →
 *     ./global-page-states, GlobalPage → ./global-tiles, GlobalBoard →
 *     ./global-tiles, GlobalBoard → ./global-page-states,
 *     global-tiles.test → ./global-tiles, global-backtest-core →
 *     ./global-tiles, global-backtest.test → ./global-backtest-core,
 *     global-backtest.test → ./global-tiles, GlobalPage.test →
 *     ./GlobalPage, NextUpStrip → ./ics, ics.test → ./ics,
 *     hero-editorial.test → ./HeroBlock): BOTH endpoints move into the
 *     SAME new directory — same-dir NO-OP.
 *   - package specifiers ('@currena/core', '@currena/insights',
 *     '@currena/insights/page-division', 'lucide-react', '@testing-
 *     library/react', 'vitest', 'node:fs', …) — untouched by design.
 *
 * Cross-folder intra-set re-anchors (A→B within the moved set, both
 * endpoints move but the relative spec changes because the source
 * folders differ):
 *   - GlobalPage.tsx (A: routes/page-division/) imports HeroBlock +
 *     TopMoversStrip + NextUpStrip (B: components/insights/): the OLD
 *     `../../components/insights/X` SHORTENS to `./X` (both endpoints
 *     now siblings under features/global/ — path.relative computes it).
 *
 * Cross-folder non-moved-target re-anchor (B → sibling non-moved
 * folder):
 *   - HeroBlock.tsx (B: components/insights/) imports FlowChevron from
 *     `../icons/FlowChevron` (sibling under components/): after the
 *     move to features/global/, the spec LENGTHENS to
 *     `../../components/icons/FlowChevron` (path.relative computes it).
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at
 *     moved files.
 *   - NO Vite `?raw` queries on moved files (the M11 ConnectionCard?raw
 *     finding was unique to that file — M12 is the M10-simple shape).
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - WorldRiskCards consumer: features/world-markets/WorldMarketsPage
 *     (ONE real static importer — the M11 handoff's "FOUR cross-domain
 *     consumers" claim was DRIFT: AsiaTierCards/EuropeTierCards/
 *     UsaTierCards only MENTION WorldRiskCards in COMMENTS as the
 *     "GoldContext / WorldRiskCards pattern", they do NOT import it;
 *     the audit's single-row importer list was right, the M11 handoff
 *     miscounted comment references as imports).
 *   - global-tiles consumers (the N2 edge — re-anchors to
 *     ../global/global-tiles): features/usa/usa-backtest-core +
 *     features/usa/usa-tiles + features/usa/usa-tiles.test (the
 *     documented usa→global mirror pattern, USA tiles render their
 *     globalGaugeTiles subset).
 *   - NextUpStrip consumer: routes/insights-sections/data-health.test
 *     (TZ_LABEL import — the M11 handoff MISSED this consumer; the
 *     audit's "(+1 tests)" parenthetical is the only reference to it).
 *     Re-anchors ../../components/insights/NextUpStrip →
 *     ../../features/global/NextUpStrip.
 *   - ics consumer (DYNAMIC — variant #3 manual edit): routes/
 *     insights-sections/InsightsHeader.tsx:298.
 *
 * NO exports-map edit this phase (verified: packages/insights/package.json
 * has NO entry touching any of the 16 files — they are all web files;
 * the 16 existing entries all point at engine paths).
 *
 * Persian-copy manifest (BD-M5 D5): ONE entry references the moved
 * paths (pre-verified — see manual edit 3 above; the M11 handoff's
 * "expect NON-zero" was correct: HeroBlock/TopMoversStrip/NextUpStrip
 * route their fa strings through the i18n dictionary, so they have ZERO
 * direct manifest entries; ics.ts carries ONE inline calendar-name
 * fa literal). copy:audit (gate 4) must be clean after.
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the
 * baseline gates build — expect the M11 post-move surface: 80 chunks,
 * entry index-CYK8tYdh, FULLY-FROZEN baseline): the global-relevant
 * topology —
 *   - GlobalPage-<hash>.js (the LANDING route chunk — the M11 handoff's
 *     CAUTION: GlobalPage is the / LANDING route, its chunk + the entry
 *     interact differently than deep routes; record the honest outcome)
 *   - the merged global-tiles/global-backtest-core/global-page-states/
 *     GlobalBoard chunk (whatever Rollup assigns, if any — record)
 *   - entry index-CYK8tYdh.js
 *   Expected per the M10/M11 mechanism correction: the entry re-hashes
 *   ONLY if the moved page chunk's FILENAME changes; a byte-identical
 *   GlobalPage chunk (the spec changes resolve to the same modules and
 *   spec text never survives bundling) means ZERO ripple. CAUTION:
 *   GlobalPage is / — the landing route's chunk may interact with the
 *   entry differently than deep routes (the entry's assets-list may
 *   reference it as the default route module). Record the honest
 *   outcome either way; close with the full-substitution rebasing test
 *   + the name-agnostic token-multiset proof (the M9 sharpening);
 *   compare sw.js by entry-multiset, not raw sha (the M10 precache-tail
 *   rotation finding).
 *
 * Usage:
 *   node scripts/m12-global-codemod.mjs          # apply (default)
 *   node scripts/m12-global-codemod.mjs --dry    # print the plan only
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
//    All 16 web files FLAT into features/global/ — TEN from
//    routes/page-division/ + SIX from components/insights/ (the second
//    two-source-folder move in a row, the M11 shape). NO engine move.
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';

const moves = [
  // --- the TEN routes/page-division/ files ---
  [`${WEB}/routes/page-division/GlobalPage.tsx`,          `${WEB}/features/global/GlobalPage.tsx`],
  [`${WEB}/routes/page-division/GlobalPage.test.tsx`,     `${WEB}/features/global/GlobalPage.test.tsx`],
  [`${WEB}/routes/page-division/GlobalBoard.tsx`,         `${WEB}/features/global/GlobalBoard.tsx`],
  [`${WEB}/routes/page-division/WorldRiskCards.tsx`,      `${WEB}/features/global/WorldRiskCards.tsx`],
  [`${WEB}/routes/page-division/global-tiles.ts`,         `${WEB}/features/global/global-tiles.ts`],
  [`${WEB}/routes/page-division/global-tiles.test.ts`,    `${WEB}/features/global/global-tiles.test.ts`],
  [`${WEB}/routes/page-division/global-backtest-core.ts`, `${WEB}/features/global/global-backtest-core.ts`],
  [`${WEB}/routes/page-division/global-backtest.test.ts`, `${WEB}/features/global/global-backtest.test.ts`],
  [`${WEB}/routes/page-division/global-copy-pin.test.ts`, `${WEB}/features/global/global-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/global-page-states.ts`,   `${WEB}/features/global/global-page-states.ts`],
  // --- the SIX components/insights/ files ---
  [`${WEB}/components/insights/HeroBlock.tsx`,            `${WEB}/features/global/HeroBlock.tsx`],
  [`${WEB}/components/insights/TopMoversStrip.tsx`,       `${WEB}/features/global/TopMoversStrip.tsx`],
  [`${WEB}/components/insights/NextUpStrip.tsx`,          `${WEB}/features/global/NextUpStrip.tsx`],
  [`${WEB}/components/insights/ics.ts`,                   `${WEB}/features/global/ics.ts`],
  [`${WEB}/components/insights/ics.test.ts`,              `${WEB}/features/global/ics.test.ts`],
  [`${WEB}/components/insights/hero-editorial.test.tsx`,  `${WEB}/features/global/hero-editorial.test.tsx`],
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
//    from any importer (moved or not). (Identical to the M3–M11 codemod.)
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
 *  (The M2→M11 method: re-anchor EVERY relative edge of a moved importer,
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
//    M12 has THREE: App.tsx lazy route (variant #1) + InsightsHeader.tsx
//    dynamic ics (variant #3) + the ONE Persian-copy manifest re-key
//    (BD-M5 D5, the M8 entry-642 re-key-note pattern; the M11 handoff's
//    "expect NON-zero" was correct — ics.ts carries ONE inline fa literal;
//    HeroBlock/TopMoversStrip/NextUpStrip route their fa strings through
//    the i18n dictionary, ZERO direct manifest entries). ZERO R8 fixture
//    traps this phase (the two R8 sites in global-backtest.test.ts are
//    depth-invariant: routes/page-division/ → features/global/ preserves
//    the 5-../ depth to root-data/, path.relative confirms — UNTOUCHED).
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY global variant-#1 site,
  //     verified by the pre-gates grep) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/GlobalPage')",
    to: "import('./features/global/GlobalPage')",
  },
  // --- manual edit 2: InsightsHeader.tsx:298 dynamic ics import inside
  //     Promise.all (variant #3 — the M11 handoff flagged this exact
  //     site: "InsightsHeader.tsx:298 has a dynamic
  //     import('../../components/insights/ics') — a variant-#3 site
  //     pointing at a MOVED file, re-anchor it by hand, the regex cannot
  //     see it"; the ONLY global variant-#3 site, verified by the
  //     pre-gates grep) ---
  {
    file: `${WEB}/routes/insights-sections/InsightsHeader.tsx`,
    from: "import('../../components/insights/ics')",
    to: "import('../../features/global/ics')",
  },
  // --- manual edit 3: Persian-copy manifest re-key — the ics.ts inline
  //     fa calendar name (source-only re-key; the semantic inline.* id
  //     stays; text + sha256 unchanged; the M8 BalanceScale entry-642
  //     re-key-note pattern) ---
  {
    file: 'docs/localization/persian-copy-manifest.json',
    from: '{"id":"inline.ics-calendar-name","source":"apps/web/src/components/insights/ics.ts","status":"processed","kind":"copy","round":"round-2","reference":"persian_site_copy_round2_part3_panels_calendar_polished-translated.md","text":"رویدادهای اقتصادی کورنا","sha256":"2b63b8a1252ea7b1b4bfb6dfb78dc341f25e072cc87b8884596fef5b69dda9c6","note":"ICS calendar name (X-WR-CALNAME) users import into their own calendar app"}',
    to: '{"id":"inline.ics-calendar-name","source":"apps/web/src/features/global/ics.ts","status":"processed","kind":"copy","round":"round-2","reference":"persian_site_copy_round2_part3_panels_calendar_polished-translated.md","text":"رویدادهای اقتصادی کورنا","sha256":"2b63b8a1252ea7b1b4bfb6dfb78dc341f25e072cc87b8884596fef5b69dda9c6","note":"ICS calendar name (X-WR-CALNAME) users import into their own calendar app; re-keyed at features/global after the M12 global domain move (pure path move, text+hash unchanged)"}',
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (16 web — 10 from routes/page-division/ + 6 from components/insights/; ZERO co-located snapshots; NO engine move — all 16 are web files)`);
console.log(`Import edges to rewrite: ${edgeCount}`);
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
  console.log(`   ${me.file}:  ${me.from.slice(0, 80)}…  →  ${me.to.slice(0, 80)}…`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OPs (untouched, depth-invariant / same-dir):');
  console.log("   ALL '../../shared/…' + '../../router' + '../../features/world-markets/…' + '../../features/currencies/…' imports of the moved files (importer routes/page-division/ OR components/insights/ → features/global/, BOTH at src depth 2)");
  console.log("   intra-set './' edges (GlobalPage→GlobalBoard/global-page-states/global-tiles, GlobalBoard→global-tiles/global-page-states, global-tiles.test→global-tiles, global-backtest-core→global-tiles, global-backtest.test→global-backtest-core/global-tiles, GlobalPage.test→GlobalPage, NextUpStrip→ics, ics.test→ics, hero-editorial.test→HeroBlock): BOTH endpoints move into the SAME dir");
  console.log("   package specifiers (@currena/core, @currena/insights, @currena/insights/page-division, lucide-react, @testing-library/react, vitest, node:fs, …) — untouched by design");
  console.log('   R8 sites in global-backtest.test.ts:40,45 (readFileSync new URL(../../../../../data/…)) — DEPTH-INVARIANT (routes/page-division/ and features/global/ both 5 ../ to root-data/, path.relative confirms)');
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms + ?raw over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files; ?raw ON any moved file (the M10/M11-simple situation; the M11 ConnectionCard?raw finding was unique to that file)");
  console.log('Cross-folder intra-set re-anchors (A→B, both endpoints move): GlobalPage.tsx:41,42,43 → HeroBlock/TopMoversStrip/NextUpStrip (../../components/insights/X SHORTENS to ./X).');
  console.log('Cross-folder non-moved-target re-anchor: HeroBlock.tsx:48 → ../icons/FlowChevron LENGTHENS to ../../components/icons/FlowChevron.');
  console.log('Cross-domain edges re-anchored: WorldMarketsPage (the ONE real WorldRiskCards importer — the M11 handoff\'s FOUR-consumer claim was DRIFT, the other three are comment-only pattern mentions); features/usa/{usa-backtest-core,usa-tiles,usa-tiles.test} (the N2 edge → ../global/global-tiles); data-health.test.ts:21 (TZ_LABEL — the M11 handoff MISSED this NextUpStrip consumer); pd-s4-backtest.ts:53 (the global script, NOT pd-s5 — the audit\'s P3.10 notation WRONG for the FIFTH time).');
  console.log('Exports map: NO global entries exist (verified — the 16 entries all point at engine paths; all 16 moved files are web files) — NO edit this phase.');
  console.log('Persian-copy manifest: ONE entry references the moved paths (inline.ics-calendar-name for ics.ts — the M8 BalanceScale precedent; HeroBlock/TopMoversStrip/NextUpStrip route their fa through the i18n dictionary, ZERO direct manifest entries) — re-keyed by manual edit 3.');
  console.log('Chunk-merger watch (baseline recorded from the M11 post-move surface: 80 chunks, entry index-CYK8tYdh, FULLY-FROZEN): GlobalPage-<hash>.js (the LANDING route chunk — CAUTION per the M11 handoff, / interacts with the entry differently than deep routes; record the honest outcome) + any merged global-tiles/global-backtest-core/global-page-states/GlobalBoard chunk + entry; per the M10/M11 mechanism correction the entry re-hashes ONLY if the page chunk filename changes — record the honest outcome; close with the full-substitution rebasing test + the name-agnostic token-multiset proof; sw.js by entry-multiset.');
  process.exit(0);
}

// --- apply the moves with git mv (history preserved) ---
for (const [from, to] of moves) {
  const toAbs = path.join(ROOT, to);
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  execSync(`git mv -- "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' });
}

// --- apply the import rewrites ---
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

// --- apply the manual edits ---
for (const me of manualEdits) {
  const abs = path.join(ROOT, me.file);
  let text = fs.readFileSync(abs, 'utf8');
  if (!text.includes(me.from)) {
    console.error(`  MANUAL MISS in ${me.file}: ${me.from.slice(0, 100)}…`);
    process.exit(1);
  }
  text = text.replace(me.from, me.to);
  fs.writeFileSync(abs, text);
}

console.log('\nDONE — moves applied + import edges re-anchored + manual edits (App.tsx:55 lazy + InsightsHeader.tsx:298 dynamic ics + the 1 manifest re-key) fixed.');
console.log('Next: broken-path grep, copy:audit (expect clean — the 1 re-key lands in this same commit), then gates.');
