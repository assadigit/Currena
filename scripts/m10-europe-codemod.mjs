#!/usr/bin/env node
/**
 * M10 codemod — modularization Phase 3.8 (the europe domain, the
 * eighth Phase 3 move, biggest-first per the audit).
 *
 * Moves the 8 web europe files + 3 engine europe files (11 source files,
 * ONE commit for web+engine per the audit's Phase 3 rule, BD-M3 D1), then
 * re-anchors every import edge against the FINAL locations (the M2→M9
 * method, HANDOFF "Operational notes"): never hand-count ../, use
 * path.relative.
 *
 * Landing shapes (verified against the audit's Deliverable 1 europe rows +
 * the skeleton §"features/" + §"domains/" + the M3→M9 precedents):
 *   - web → apps/web/src/features/europe/ — the 8 page-tier files FLAT
 *     (the M3 usa + M4 world-markets + M5 australia + M6 commodities +
 *     M7′ currencies + M8 gold + M9 asia-pacific convention, BD-M4 D1):
 *     EuropePage + test, EuropeTierCards, europe-tiles + test,
 *     europe-backtest-core + europe-backtest.test + europe-copy-pin.test.
 *     NO named cluster in the europe web set — all 8 files are page-tier.
 *     NO co-located vitest snapshot rides the set (verified: no
 *     __snapshots__/ under routes/page-division/ or src/adapters/ touching
 *     the moved tests — R6).
 *   - engine → packages/insights/src/domains/europe/adapters/ — the 2
 *     adapters + boe's co-located test FLAT (NO subfolder, NO barrel —
 *     the M6/M7′/M8/M9 convention): boe + boe.test, ecb. ecb has NO
 *     co-located test; its test consumer is the CROSS-ADAPTER
 *     shared/adapters/adapters.test.ts:12 (the frankfurter lesson shape).
 *     These are the LAST remaining src/adapters/ files — the folder
 *     EMPTIES COMPLETELY this phase.
 *
 * INVENTORY VERIFICATION (the M7′/M8/M9 lesson — the audit's counts are
 * approximate; the tree is the truth): the audit's Phase 3 item 8 row says
 * "8 web files + 2 adapters (3 with test)" and its Deliverable 6 table says
 * "8 web + 3 engine = 11". Verified against the tree at M10 session start:
 * exactly 8 web files under routes/page-division/ (EuropePage.tsx +
 * EuropePage.test.tsx + EuropeTierCards.tsx + europe-backtest-core.ts +
 * europe-backtest.test.ts + europe-copy-pin.test.ts + europe-tiles.ts +
 * europe-tiles.test.ts) + exactly 3 engine files in src/adapters/ (boe.ts +
 * boe.test.ts + ecb.ts — and NOTHING else remains in that folder) = 11
 * source files, ZERO co-located snapshots. The Deliverable 6 row is the
 * correct count.
 *
 * pd-s12 is the europe backtest script (VERIFIED FIRST per the pd-s18/
 * pd-s5/pd-s14 lesson: pd-s12-backtest.ts:46 imports
 * '../src/routes/page-division/europe-backtest-core' — in the move set,
 * re-anchored by this codemod. The audit's P3.8 row notation says pd-s15 —
 * that is WRONG: NO pd-s15 exists in apps/web/scripts/ at all; trust only
 * verified imports).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms checked over the moved
 * set):
 *   1. App.tsx:77 lazy `import('./routes/page-division/EuropePage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4). Verified the ONLY
 *      variant-#1 site pointing at a moved europe file (App.tsx:86
 *      AsiaPage already points at features/asia-pacific — M9's, done;
 *      App.tsx:118 EconomicLinkagesPage still points at page-division —
 *      M11's, untouched).
 *
 * R8 fs-path forms: ZERO in the whole M10 moved set (verified: no new URL/
 * join(__dirname/HERE/here)/readFileSync(join())/fileURLToPath in the 8 web
 * files or the 3 engine files — boe.test.ts uses inline fixtures, no fs
 * reads; the SIMPLEST R8 situation since the phases began). The two
 * `await import('../../shared/lib/locale')` sites in EuropePage.test.tsx
 * (lines 386 + 422) are variant-#3 dynamic imports pointing at NON-moved
 * shared files — same folder depth (routes/page-division/ → features/
 * europe/, BOTH at src depth 2) — NO-OPs, untouched.
 *
 * Verified NO-OPs (grepped per moved file, the BD-M4 D4 lesson — left
 * untouched because depth-invariant / same-dir):
 *   - ALL '../../shared/…', '../../router', '../../components/…' imports
 *     of the moved web files: the importer moves routes/page-division/ →
 *     features/europe/ (BOTH at src depth 2) — every src-rooted ../../
 *     spec resolves identically from BOTH (the M6→M9 depth-invariant
 *     pattern).
 *   - intra-set './' edges (EuropePage → './EuropeTierCards',
 *     EuropePage.test → './EuropePage' + './europe-tiles',
 *     europe-backtest-core → './europe-tiles', europe-backtest.test →
 *     './europe-backtest-core', europe-copy-pin.test → './europe-tiles',
 *     boe.test → './boe'): BOTH endpoints move into the SAME new
 *     directory — same-dir NO-OPs.
 *   - package specifiers ('@currena/core', '@currena/insights/page-division',
 *     …) — untouched by design.
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at moved
 *     files.
 *   - NO variant #3 CONSUMER dynamic `await import('...')` of a MOVED
 *     europe file (the two locale sites above point at shared, not moved).
 *   - NO Vite `?raw` queries ON moved files (the existing ?raw set is M8's
 *     gold files, already re-anchored).
 *   - NO fs-path forms anywhere in the 11-file moved set.
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - N1 (europe-backtest-core → features/usa/usa-backtest-core, the
 *     universal backtest harness): the spec SHORTENS
 *     '../../features/usa/usa-backtest-core' → '../usa/usa-backtest-core'
 *     (both endpoints now siblings under features/ — the M6/M7′/M8/M9 N1
 *     lesson: the spec shortens, no rename).
 *   - R9 cross-tree script imports re-anchored: apps/web/scripts/
 *     pd-s12-backtest.ts (the europe backtest script, VERIFIED FIRST —
 *     the audit's pd-s15 notation is WRONG) + packages/insights/scripts/
 *     gf-s11-verify.ts (the ecb borrower, verified at M9).
 *   - Engine barrel edges re-anchored (importers not moving, targets
 *     moving): shared/adapters/collect.ts (boe + ecb) +
 *     shared/adapters/derived.ts (boe) + shared/adapters/rung2.ts (ecb) +
 *     shared/adapters/index.ts (the ecb re-export) + the CROSS-ADAPTER
 *     shared/adapters/adapters.test.ts:12 (ecb — the frankfurter lesson
 *     shape, M10's only cross-adapter test consumer).
 *
 * NO exports-map edit this phase (verified: packages/insights/package.json
 * has NO ./boe, ./ecb or any other europe entry — the M10 prompt's "europe
 * has NO entries expected" resolves NO; the 16 existing entries all point
 * elsewhere).
 *
 * Persian-copy manifest (BD-M5 D5): pre-verified ZERO manifest entries
 * reference the moved paths (no id/source key carries page-division/
 * Europe*, page-division/europe*, adapters/boe or adapters/ecb) — expect
 * ZERO re-keys; copy:audit (gate 4) confirms.
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the baseline
 * gates build — 80 chunks, entry index-CYK8tYdh, EuropePage-bVsigf6t):
 *   - EuropePage-bVsigf6t.js (the europe route chunk) — the
 *     europe-relevant chunk; the M9 honest-record precedent says it MAY
 *     re-hash (the asia modules' path change re-hashed AsiaPage-DUt0NhOL →
 *     AsiaPage-BJ00I44V via import-statement order perturbation) — record
 *     the honest outcome, never silently absorb it.
 *   - Expected: the entry chunk re-hash (the App.tsx lazy-path string
 *     change, the M6→M9 index-* precedent — 'features/europe' is one char
 *     SHORTER than 'routes/page-division', within ceiling) with the pure
 *     filename ripple on entry-importing chunks; close with the
 *     full-substitution rebasing test + the name-agnostic token-multiset
 *     proof (the M9 sharpening).
 *
 * Usage:
 *   node scripts/m10-europe-codemod.mjs          # apply (default)
 *   node scripts/m10-europe-codemod.mjs --dry    # print the plan only
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
//    Web half: all 8 files FLAT into features/europe/ (page-tier, no named
//    cluster in the set). Engine half: the adapter trio FLAT into
//    domains/europe/adapters/ (no subfolder, no barrel — the M6→M9
//    convention) — the LAST src/adapters/ files; the folder empties.
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: routes/page-division/Europe* + europe-* → features/europe/ (flat) ---
  [`${WEB}/routes/page-division/EuropePage.tsx`, `${WEB}/features/europe/EuropePage.tsx`],
  [`${WEB}/routes/page-division/EuropePage.test.tsx`, `${WEB}/features/europe/EuropePage.test.tsx`],
  [`${WEB}/routes/page-division/EuropeTierCards.tsx`, `${WEB}/features/europe/EuropeTierCards.tsx`],
  [`${WEB}/routes/page-division/europe-tiles.ts`, `${WEB}/features/europe/europe-tiles.ts`],
  [`${WEB}/routes/page-division/europe-tiles.test.ts`, `${WEB}/features/europe/europe-tiles.test.ts`],
  [`${WEB}/routes/page-division/europe-backtest-core.ts`, `${WEB}/features/europe/europe-backtest-core.ts`],
  [`${WEB}/routes/page-division/europe-backtest.test.ts`, `${WEB}/features/europe/europe-backtest.test.ts`],
  [`${WEB}/routes/page-division/europe-copy-pin.test.ts`, `${WEB}/features/europe/europe-copy-pin.test.ts`],
  // --- engine: the adapter trio → domains/europe/adapters/ (flat, no
  //     subfolder, no barrel; boe + its co-located test + ecb — the
  //     tree-verified inventory; these are the LAST src/adapters/ files,
  //     the folder EMPTIES this phase) ---
  [`${ENG}/adapters/boe.ts`, `${ENG}/domains/europe/adapters/boe.ts`],
  [`${ENG}/adapters/boe.test.ts`, `${ENG}/domains/europe/adapters/boe.test.ts`],
  [`${ENG}/adapters/ecb.ts`, `${ENG}/domains/europe/adapters/ecb.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M9 codemod.)
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
 *  (The M2→M9 method: re-anchor EVERY relative edge of a moved importer,
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
//    (the dynamic import() CALL). Keyed by FINAL file path; applied as
//    exact substring replacements. M10 has exactly ONE (App.tsx lazy
//    route) — ZERO R8 fixture traps this phase.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY europe variant-#1 site,
  //     verified by the pre-gates grep) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/EuropePage')",
    to: "import('./features/europe/EuropePage')",
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (8 web + 3 engine — boe + boe.test + ecb; ZERO co-located snapshots; the engine trio EMPTIES src/adapters/)`);
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
  console.log(`   ${me.file}:  ${me.from}  →  ${me.to}`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OPs (untouched, depth-invariant / same-dir):');
  console.log("   ALL '../../shared/…' + '../../router' + '../../components/…' imports of the moved web files (importer routes/page-division/ → features/europe/, BOTH at src depth 2 — the specs resolve identically from BOTH, the M6→M9 pattern)");
  console.log("   intra-set './' edges (EuropePage→EuropeTierCards, EuropePage.test→EuropePage/europe-tiles, europe-backtest-core→europe-tiles, europe-backtest.test→europe-backtest-core, europe-copy-pin.test→europe-tiles, boe.test→boe — BOTH endpoints move into the SAME dir)");
  console.log("   the two await import('../../shared/lib/locale') variant-#3 sites in EuropePage.test.tsx (386 + 422) — pointing at NON-moved shared files, same depth — NO-OPs");
  console.log("   package specifiers (@currena/core, @currena/insights/page-division, …) — untouched by design");
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files; variant #3 CONSUMER dynamic await import() of a MOVED europe file; ?raw ON moved files (the existing ?raw set is M8's gold, already re-anchored); fs-path forms ANYWHERE in the 11-file moved set (boe.test.ts uses inline fixtures — the simplest R8 situation since the phases began)");
  console.log("Cross-domain edges: N1 (europe-backtest-core → usa-backtest-core) SHORTENS ../../features/usa/… → ../usa/… (the M6→M9 N1 lesson); R9 cross-tree scripts re-anchored (pd-s12-backtest.ts — VERIFIED FIRST as the europe script per the pd-s18/pd-s5/pd-s14 lesson, the audit's pd-s15 notation is WRONG (no pd-s15 exists); gf-s11-verify.ts (the ecb borrower, verified at M9)); engine barrel edges re-anchored (shared/adapters/{collect(boe+ecb), derived(boe), rung2(ecb), index(ecb re-export)} + the CROSS-ADAPTER adapters.test.ts:12 (ecb — the frankfurter lesson shape)).");
  console.log('Exports map: NO europe entries exist (verified — the 16 entries all point elsewhere) — NO edit this phase.');
  console.log('Persian-copy manifest: ZERO entries reference the moved paths (pre-verified) — expect ZERO re-keys.');
  console.log('Chunk-merger watch (baseline recorded, 80 chunks, entry index-CYK8tYdh, EuropePage-bVsigf6t): the entry re-hashes (the App.tsx lazy-path string — the M6→M9 precedent; features/europe is one char SHORTER than routes/page-division); EuropePage may re-hash per the M9 honest-record precedent — record the honest outcome; close with the full-substitution rebasing test + the name-agnostic token-multiset proof (the M9 sharpening).');
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
    console.error(`  MANUAL MISS in ${me.file}: ${me.from}`);
    process.exit(1);
  }
  text = text.replace(me.from, me.to);
  fs.writeFileSync(abs, text);
}

console.log('\nDONE — moves applied + import edges re-anchored + manual path refs fixed.');
console.log('Next: broken-path grep, copy:audit (expect ZERO re-keys), then gates.');
