#!/usr/bin/env node
/**
 * M9 codemod — modularization Phase 3.7 (the asia-pacific domain, the
 * seventh Phase 3 move, biggest-first per the audit).
 *
 * Moves the 9 web asia files + 6 engine asia files (15 source files, ONE
 * commit for web+engine per the audit's Phase 3 rule, BD-M3 D1), then
 * re-anchors every import edge against the FINAL locations (the M2→M8
 * method, HANDOFF "Operational notes"): never hand-count ../, use
 * path.relative.
 *
 * Landing shapes (verified against the audit's Deliverable 1 asia rows +
 * the skeleton §"features/" + §"domains/" + the M3→M8 precedents):
 *   - web → apps/web/src/features/asia-pacific/ — the 9 page-tier files
 *     FLAT (the M3 usa + M4 world-markets + M5 australia + M6 commodities +
 *     M7′ currencies + M8 gold convention, BD-M4 D1): AsiaPage + test,
 *     AsiaTierCards, AsiaNzx50Card, asia-tiles + test, asia-backtest-core +
 *     asia-backtest.test + asia-copy-pin.test. NO named cluster in the asia
 *     web set (unlike gold's signals/ or currencies' fx-presentation/) —
 *     all 9 files are page-tier. NO co-located vitest snapshot rides the
 *     set (verified: no __snapshots__/ under routes/page-division/ or
 *     src/adapters/ touching the moved tests — R6).
 *   - engine → packages/insights/src/domains/asia-pacific/adapters/ — the
 *     3 adapters + their 3 co-located tests FLAT (NO subfolder, NO barrel
 *     — the M6/M7′/M8 convention): imf-cpi + imf-cpi.test, mof + mof.test,
 *     nbs + nbs.test. asia-pacific has NO board job and NO domain-root
 *     engine modules — the ONLY engine move set is the adapter sextet.
 *     boe/boe.test + ecb STAY in src/adapters/ (Europe's, M10 — the audit
 *     rows 411-412 route them to domains/europe); the N13 shared adapters
 *     (fred/yahoo/worldbank/goldapi/monthly-indexes/oecd/derived/…) were
 *     already moved to shared/adapters/ in Phase 2 or stay — NOT moving.
 *
 * INVENTORY VERIFICATION (the M7′/M8 lesson — the audit's counts are
 * approximate; the tree is the truth): the audit's Phase 3 item 7 row says
 * "9 web files + 4 adapters (3 + test)" while its Deliverable 1 rows list
 * 6 engine files (imf-cpi.ts + imf-cpi.test.ts + mof.ts + mof.test.ts +
 * nbs.ts + nbs.test.ts) and its Deliverable 6 table says "9 web + 6 engine
 * = 15". Verified against the tree at M9 session start: exactly 9 web
 * files under routes/page-division/ + exactly the 6-file adapter sextet in
 * src/adapters/ = 15 source files, ZERO co-located snapshots. The "(3 +
 * test)" notation undercounts the co-located tests (there are THREE, one
 * per adapter — the frankfurter counting lesson again).
 *
 * pd-s14 is the asia backtest script (VERIFIED FIRST per the pd-s18/pd-s5
 * lesson: pd-s14-backtest.ts:53 imports
 * '../src/routes/page-division/asia-backtest-core' — in the move set,
 * re-anchored by this codemod. The audit's P3.7 row notation says pd-s12 —
 * that is WRONG: pd-s12-backtest.ts imports europe-backtest-core (Europe's,
 * M10's); trust only verified imports).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms checked over the moved
 * set):
 *   1. App.tsx:86 lazy `import('./routes/page-division/AsiaPage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4). Verified the ONLY
 *      variant-#1 site pointing at a moved asia file (App.tsx:77 EuropePage
 *      + :118 EconomicLinkagesPage still point at page-division — M10/M11's,
 *      untouched).
 *   2. imf-cpi.test.ts:34 R8 fixture-depth `join(here, '..', '..',
 *      'fixtures')` → 4 up-levels (the importer moves from src/adapters/
 *      (2 up-levels to packages/insights/fixtures) to
 *      src/domains/asia-pacific/adapters/ (4 up-levels) — COMPUTED via
 *      path.relative, never hand-counted; the cofer/s6 join(here) pattern,
 *      BD-M7′ D5).
 *   3. mof.test.ts:15 R8 fixture-depth `join(harness(), '..', '..',
 *      'fixtures')` → 4 up-levels (same depth arithmetic; the harness()
 *      indirection returns `here`).
 *   4. nbs.test.ts:35 R8 fixture-depth `join(__dirname, '..', '..',
 *      'fixtures')` → 4 up-levels (the join(__dirname, …) form, BD-M5 D4).
 *
 * Verified NO-OPs (grepped per moved file, the BD-M4 D4 lesson — left
 * untouched because depth-invariant / same-dir):
 *   - ALL '../../shared/…', '../../router', '../../components/…' imports
 *     of the moved web files: the importer moves routes/page-division/ →
 *     features/asia-pacific/ (BOTH at src depth 2) — every src-rooted
 *     ../../ spec resolves identically from BOTH (the M6/M7′/M8
 *     depth-invariant pattern).
 *   - intra-set './' edges (AsiaPage → './AsiaTierCards', AsiaTierCards →
 *     './asia-tiles' + './AsiaNzx50Card', asia-backtest-core →
 *     './asia-tiles', the tests' './AsiaPage'/'./asia-tiles'/…): BOTH
 *     endpoints move into the SAME new directory — same-dir NO-OPs.
 *   - package specifiers ('@currena/core', '@currena/insights/page-division',
 *     …) — untouched by design.
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at moved
 *     files.
 *   - NO variant #3 CONSUMER dynamic `await import('...')` of a MOVED asia
 *     file (the s6-nz shape — the trap that cost the original M7 a
 *     mid-phase red gates run).
 *   - NO Vite `?raw` queries ON moved files (the existing ?raw set is M8's
 *     gold files, already re-anchored).
 *   - NO fs-path forms in the 9 web moved files or the 3 adapter SOURCES
 *     (nbs.ts:115 `new URL(href, baseUrl)` is scraped-link URL resolution,
 *     NOT a fs-path form; the Array .join()s are no-ops).
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - N1 (asia-backtest-core → features/usa/usa-backtest-core, the
 *     universal backtest harness): the spec SHORTENS
 *     '../../features/usa/usa-backtest-core' → '../usa/usa-backtest-core'
 *     (both endpoints now siblings under features/ — the M6/M7′/M8 N1
 *     lesson: the spec shortens, no rename).
 *   - N11 (AsiaNzx50Card → features/australia/markets-au +
 *     features/australia/au-markets/shared — the documented asia→australia
 *     edge): the specs shorten to '../australia/markets-au' +
 *     '../australia/au-markets/shared' (the target is a features/ sibling;
 *     the NZX50 board home is /australia per D-17/BD-S21b).
 *   - R9 cross-tree script imports re-anchored: apps/web/scripts/
 *     pd-s14-backtest.ts (the asia backtest script) +
 *     packages/insights/scripts/{nbs-backfill, gf-p1-backfill,
 *     gf-p0-record-candidates}.ts (the engine script borrowers).
 *   - Engine barrel edges re-anchored (importers not moving, targets
 *     moving): shared/adapters/index.ts (the mof re-export) +
 *     shared/adapters/collect.ts (nbs) + shared/adapters/rung2.ts
 *     (mof + nbs + imf-cpi).
 *
 * NO exports-map edit this phase (verified: packages/insights/package.json
 * has NO ./nbs, ./mof, ./imf-cpi or any other asia entry — the M9 prompt's
 * "if asia has entries" resolves NO; the 16 existing entries all point
 * elsewhere).
 *
 * Persian-copy manifest (BD-M5 D5): pre-verified ZERO manifest entries
 * reference the moved paths (no id/source key carries page-division/Asia*,
 * page-division/asia*, adapters/imf-cpi, adapters/mof or adapters/nbs) —
 * expect ZERO re-keys; copy:audit (gate 4) confirms.
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the
 * baseline gates build — 80 chunks, entry index-CkKkl2hB):
 *   - AsiaPage-DUt0NhOL.js (the asia route chunk) — the asia-relevant
 *     chunk; expected hash-UNCHANGED (R5 — no renames; the chunk's module
 *     graph is asia-internal + shared, all depth-invariant).
 *   - Expected: the ONLY hash change is the entry chunk (the App.tsx
 *     lazy-path string change, the M6/M7′/M8 index-* precedent) with the
 *     pure filename ripple on entry-importing chunks; close with the
 *     full-substitution rebasing test (the M8 addition).
 *
 * Usage:
 *   node scripts/m9-asia-codemod.mjs          # apply (default)
 *   node scripts/m9-asia-codemod.mjs --dry    # print the plan only
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
//    Web half: all 9 files FLAT into features/asia-pacific/ (page-tier,
//    no named cluster in the set). Engine half: the adapter sextet FLAT
//    into domains/asia-pacific/adapters/ (no subfolder, no barrel — the
//    M6/M7′/M8 convention).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: routes/page-division/Asia* + asia-* → features/asia-pacific/ (flat) ---
  [`${WEB}/routes/page-division/AsiaPage.tsx`, `${WEB}/features/asia-pacific/AsiaPage.tsx`],
  [`${WEB}/routes/page-division/AsiaPage.test.tsx`, `${WEB}/features/asia-pacific/AsiaPage.test.tsx`],
  [`${WEB}/routes/page-division/AsiaTierCards.tsx`, `${WEB}/features/asia-pacific/AsiaTierCards.tsx`],
  [`${WEB}/routes/page-division/AsiaNzx50Card.tsx`, `${WEB}/features/asia-pacific/AsiaNzx50Card.tsx`],
  [`${WEB}/routes/page-division/asia-tiles.ts`, `${WEB}/features/asia-pacific/asia-tiles.ts`],
  [`${WEB}/routes/page-division/asia-tiles.test.ts`, `${WEB}/features/asia-pacific/asia-tiles.test.ts`],
  [`${WEB}/routes/page-division/asia-backtest-core.ts`, `${WEB}/features/asia-pacific/asia-backtest-core.ts`],
  [`${WEB}/routes/page-division/asia-backtest.test.ts`, `${WEB}/features/asia-pacific/asia-backtest.test.ts`],
  [`${WEB}/routes/page-division/asia-copy-pin.test.ts`, `${WEB}/features/asia-pacific/asia-copy-pin.test.ts`],
  // --- engine: the adapter sextet → domains/asia-pacific/adapters/ (flat,
  //     no subfolder, no barrel; 3 adapters + their 3 co-located tests —
  //     the tree-verified inventory; boe/boe.test + ecb STAY (Europe's,
  //     M10)) ---
  [`${ENG}/adapters/imf-cpi.ts`, `${ENG}/domains/asia-pacific/adapters/imf-cpi.ts`],
  [`${ENG}/adapters/imf-cpi.test.ts`, `${ENG}/domains/asia-pacific/adapters/imf-cpi.test.ts`],
  [`${ENG}/adapters/mof.ts`, `${ENG}/domains/asia-pacific/adapters/mof.ts`],
  [`${ENG}/adapters/mof.test.ts`, `${ENG}/domains/asia-pacific/adapters/mof.test.ts`],
  [`${ENG}/adapters/nbs.ts`, `${ENG}/domains/asia-pacific/adapters/nbs.ts`],
  [`${ENG}/adapters/nbs.test.ts`, `${ENG}/domains/asia-pacific/adapters/nbs.test.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M8 codemod.)
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
 *  (The M2→M8 method: re-anchor EVERY relative edge of a moved importer,
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
//    (the dynamic import() CALL + the three R8 fixture-depth traps). Keyed
//    by FINAL file path; applied as exact substring replacements.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY asia variant-#1 site,
  //     verified by the pre-gates grep) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/AsiaPage')",
    to: "import('./features/asia-pacific/AsiaPage')",
  },
  // --- manual edit 2: imf-cpi.test.ts R8 fixture-depth (the join(here, …)
  //     form; the importer moves src/adapters/ → src/domains/asia-pacific/
  //     adapters/, 2→4 up-levels to packages/insights/fixtures — COMPUTED
  //     via path.relative, the cofer/s6 pattern, BD-M7′ D5) ---
  {
    file: `${ENG}/domains/asia-pacific/adapters/imf-cpi.test.ts`,
    from: "join(here, '..', '..', 'fixtures')",
    to: "join(here, '..', '..', '..', '..', 'fixtures')",
  },
  // --- manual edit 3: mof.test.ts R8 fixture-depth (the join(harness(), …)
  //     form — same depth arithmetic; harness() returns `here`) ---
  {
    file: `${ENG}/domains/asia-pacific/adapters/mof.test.ts`,
    from: "join(harness(), '..', '..', 'fixtures')",
    to: "join(harness(), '..', '..', '..', '..', 'fixtures')",
  },
  // --- manual edit 4: nbs.test.ts R8 fixture-depth (the join(__dirname, …)
  //     form, BD-M5 D4 — same depth arithmetic) ---
  {
    file: `${ENG}/domains/asia-pacific/adapters/nbs.test.ts`,
    from: "join(__dirname, '..', '..', 'fixtures')",
    to: "join(__dirname, '..', '..', '..', '..', 'fixtures')",
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (9 web + 6 engine — 3 adapters + their 3 co-located tests; ZERO co-located snapshots)`);
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
  console.log("   ALL '../../shared/…' + '../../router' + '../../components/…' imports of the moved web files (importer routes/page-division/ → features/asia-pacific/, BOTH at src depth 2 — the specs resolve identically from BOTH, the M6/M7′/M8 pattern)");
  console.log("   intra-set './' edges (AsiaPage→AsiaTierCards, AsiaTierCards→asia-tiles/AsiaNzx50Card, asia-backtest-core→asia-tiles, the tests' subjects — BOTH endpoints move into the SAME dir)");
  console.log("   package specifiers (@currena/core, @currena/insights/page-division, …) — untouched by design");
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files; variant #3 CONSUMER dynamic await import() of a MOVED asia file (the s6-nz shape); ?raw ON moved files (the existing ?raw set is M8's gold, already re-anchored); fs-path forms in the 9 web files + 3 adapter sources (nbs.ts's new URL(href, baseUrl) is scraped-link resolution, NOT fs-path)");
  console.log("Cross-domain edges: N1 (asia-backtest-core → usa-backtest-core) SHORTENS ../../features/usa/… → ../usa/… (the M6/M7′/M8 N1 lesson); N11 (AsiaNzx50Card → markets-au + au-markets/shared) SHORTENS to ../australia/… (the documented asia→australia edge); R9 cross-tree scripts re-anchored (pd-s14-backtest.ts — VERIFIED FIRST as the asia script per the pd-s18/pd-s5 lesson, the audit's pd-s12 notation is WRONG (pd-s12 imports europe-backtest-core); nbs-backfill.ts + gf-p1-backfill.ts + gf-p0-record-candidates.ts); engine barrel edges re-anchored (shared/adapters/{index,collect,rung2}).");
  console.log('Exports map: NO asia entries exist (verified — the 16 entries all point elsewhere) — NO edit this phase.');
  console.log('Persian-copy manifest: ZERO entries reference the moved paths (pre-verified) — expect ZERO re-keys.');
  console.log('Chunk-merger watch (baseline recorded, 80 chunks, entry index-CkKkl2hB): AsiaPage-DUt0NhOL (the asia route chunk) expected hash-UNCHANGED (R5); expected ZERO topology delta except the entry lazy-path hash + its filename ripple; close with the full-substitution rebasing test (the M8 addition).');
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
