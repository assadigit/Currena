#!/usr/bin/env node
/**
 * M8 codemod — modularization Phase 3.6 (the gold domain, the sixth
 * Phase 3 move, biggest-first per the audit).
 *
 * Moves the 22 web gold files + 19 engine gold files (41 source files,
 * ONE commit for web+engine per the audit's Phase 3 rule, BD-M3 D1) +
 * the 1 co-located vitest snapshot (the audit's 22-row inventory counts
 * SOURCE files only — the M7′ count-verification lesson: verify the
 * inventory against the actual tree; the snapshot rides its test, R6),
 * then re-anchors every import edge against the FINAL locations (the
 * M2→M7′ method, HANDOFF "Operational notes"): never hand-count ../,
 * use path.relative.
 *
 * Landing shapes (verified against the audit's Deliverable 1 gold rows +
 * the skeleton §"domains/" + the M3→M7′ precedents):
 *   - web → apps/web/src/features/gold/ — the 13 page-tier files FLAT
 *     (the M3 usa + M4 world-markets + M5 australia + M6 commodities +
 *     M7′ currencies convention, BD-M4 D1) + Signals.tsx + outlook.test.ts
 *     FLAT (parent-level files at components/insights/, the M7′
 *     fx-presentation.ts barrel precedent: a parent-level file goes flat
 *     even when its subject cluster is preserved as a subfolder) + the
 *     7-file signals/ NAMED CLUSTER preserved as features/gold/signals/
 *     (BD-M5 D1 — the fx-presentation/ precedent) with the
 *     __snapshots__/gold-balance-lanes.test.tsx.snap riding its test.
 *   - engine → packages/insights/src/domains/gold/ — the domain-root set
 *     FLAT (gold-balance, gold-backtest-core, gold-lane-calibration (test
 *     only), breakeven-tilt, real-yield-fill, gf-p0-proposed, signals —
 *     the M8 prompt's list; gold has NO board job, unlike currencies' fx/)
 *     + the adapters FLAT under adapters/ (NO subfolder, NO barrel — the
 *     M6/M7′ convention; 6 files: cftc, sge, sge-monthly, sge-monthly.test
 *     (co-located — the ONLY gold adapter with one; the audit's "(+1
 *     tests)" counts the shared/adapters cross-adapter tests — the
 *     frankfurter lesson), bazg, gold-equities).
 *   - gold-score.ts STAYS in engine shared/ (the D1 constraint — the 37
 *     voters span 5 domains; NOT moving). outlook-core.ts STAYS in web
 *     shared/components (N5 — cross-domain gold+global, moved in Phase 2;
 *     NOT moving).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms checked over the moved
 * set):
 *   1. App.tsx:59 lazy `import('./routes/page-division/GoldPage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4). Verified the ONLY
 *      variant-#1 site pointing at a moved gold file.
 *   2. gold-balance.test.ts:483 R8 fixture-depth
 *      `new URL('../fixtures/gold-backtest-corpus.json', import.meta.url)`
 *      — the ONLY fs-path form in the moved set (no join(here)/
 *      readFileSync(join())/fileURLToPath in any moved gold file); the
 *      importer moves from src/ (1 up-level to packages/insights/fixtures)
 *      to src/domains/gold/ (3 up-levels) — COMPUTED via path.relative,
 *      never hand-counted.
 *   3. packages/insights/package.json exports map:
 *      "./gf-p0-proposed": "./src/gf-p0-proposed.ts"
 *        → "./src/domains/gold/gf-p0-proposed.ts"
 *      (R4 — entry NAMES frozen; the ONE gold exports-map entry — the
 *      audit's Phase 3 item 6 row didn't list it but the package.json has
 *      it; consumers ride the frozen name, ZERO consumer edits, proven by
 *      typecheck).
 *
 * Verified NO-OPs (grepped per moved file, the BD-M4 D4 lesson — left
 * untouched because depth-invariant / same-dir):
 *   - N5 (verdict.tsx → shared/components/outlook-core): the importer
 *     moves components/insights/signals/ → features/gold/signals/ (both
 *     at src depth 3) and the target stays in shared/ (a direct child of
 *     src/) — the spec resolves identically from BOTH, depth-invariant
 *     NO-OP (the M7′ N7 pattern).
 *   - intra-domain edges (gold-lane-calibration.test →
 *     './gf-p0-proposed', gold-backtest-core.test → './gf-p0-proposed'):
 *     BOTH endpoints move into the SAME new directory — same-dir NO-OPs.
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at moved
 *     files (the only inline-type imports in scope are frozen
 *     '@currena/core' package refs — untouched by design).
 *   - NO variant #3 CONSUMER dynamic `await import('...')` of a MOVED
 *     gold file (the s6-nz shape now points at the already-moved
 *     frankfurter; no gold consumer dynamic imports exist).
 *   - NO Vite `?raw` queries ON moved files; the ?raw CONSUMER
 *     (shared/config/round2.test.ts, 5 static `?raw` imports of moved
 *     files) is regex-covered: the re-anchor preserves the query suffix
 *     and the explicit .tsx extension (as-written style).
 *   - NO join(__dirname/HERE/here) or readFileSync(join()) fixture paths
 *     in the moved set (see manual edit 2 — the new URL form is the only
 *     one).
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - N16 engine shared→gold (THE M8 documented edge): shared/validation.ts
 *     imports signals.ts → '../domains/gold/signals' (validation stays
 *     shared, the M7′ N17 pattern).
 *   - N5 web gold→shared: verdict.tsx → shared/components/outlook-core
 *     (depth-invariant NO-OP, above).
 *   - R13 legacy borrowers (domain owns, legacy borrows — they re-anchor
 *     now and dissolve at §19.6): Insights.tsx (Signals), the
 *     round2.test.ts ?raw set (Signals, icons, verdict, BalanceScale,
 *     MergedCard), together-signals.test.ts if it imports gold targets,
 *     pd-s5-backtest.ts (the GOLD backtest script — verified FIRST per
 *     the pd-s18 lesson: its repo import is
 *     '../src/routes/page-division/gold-backtest-core' → re-anchored),
 *     the engine gf-* and gold-* scripts (cross-tree ../src imports).
 *   - Engine barrel (src/index.ts) + engine:ingest/run.ts +
 *     engine:adapters/{index,rung2}.ts: internal edges to the moved
 *     modules re-anchored (importers not moving, targets moving).
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the
 * baseline gates build — 80 chunks, entry index-Dja1XSz5):
 *   - GoldPage-CMenZk4O.js (the route chunk) + signals-Bu_Nyh5-.js +
 *     signals-BzpTDyje.js (the ENGINE src/signals.ts module chunk + the
 *     shared/config/signals.ts chunk — one moves, one stays; both
 *     content-unchanged → hash-stable) + outlook-core-BSU_HUvM.js (N5,
 *     NOT moving) + fx-presentation-BGeEOVEb.js (legacy, NOT moving).
 *   - Expected: ZERO chunk topology delta in logic; the ONLY expected
 *     hash change is the entry chunk (the App.tsx lazy-path string
 *     change, the M6/M7′ index-* precedent) with the pure filename
 *     ripple on entry-importing chunks.
 *
 * Persian-copy manifest (BD-M5 D5): after the move, copy:audit reports
 * the REMOVED+NEW pairs for moved files with fa literals — re-key (BOTH
 * id + source for hardcoded.* path-encoded entries, source-only for
 * technical.* semantic-key entries), then copy:audit must be clean.
 *
 * Usage:
 *   node scripts/m8-gold-codemod.mjs          # apply (default)
 *   node scripts/m8-gold-codemod.mjs --dry    # print the plan only
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
//    Web half: FLAT into features/gold/ EXCEPT the signals/ named cluster
//    (preserved as a subfolder per BD-M5 D1) + the snapshot riding its
//    test. Engine half: domain-root set FLAT + adapters/ flat (no
//    subfolder, no barrel — the M6/M7′ convention).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: parent-level files → features/gold/ (flat; the M7′
  //     fx-presentation.ts barrel precedent) ---
  [`${WEB}/components/insights/Signals.tsx`, `${WEB}/features/gold/Signals.tsx`],
  [`${WEB}/components/insights/outlook.test.ts`, `${WEB}/features/gold/outlook.test.ts`],
  // --- web: the signals/ named cluster → features/gold/signals/
  //     (preserved as a subfolder per BD-M5 D1) + the co-located vitest
  //     snapshot riding its test (R6) ---
  [`${WEB}/components/insights/signals/BalanceScale.tsx`, `${WEB}/features/gold/signals/BalanceScale.tsx`],
  [`${WEB}/components/insights/signals/BalanceWeight.tsx`, `${WEB}/features/gold/signals/BalanceWeight.tsx`],
  [`${WEB}/components/insights/signals/MergedCard.tsx`, `${WEB}/features/gold/signals/MergedCard.tsx`],
  [`${WEB}/components/insights/signals/balance.test.tsx`, `${WEB}/features/gold/signals/balance.test.tsx`],
  [`${WEB}/components/insights/signals/gold-balance-lanes.test.tsx`, `${WEB}/features/gold/signals/gold-balance-lanes.test.tsx`],
  [`${WEB}/components/insights/signals/icons.tsx`, `${WEB}/features/gold/signals/icons.tsx`],
  [`${WEB}/components/insights/signals/verdict.tsx`, `${WEB}/features/gold/signals/verdict.tsx`],
  [`${WEB}/components/insights/signals/__snapshots__/gold-balance-lanes.test.tsx.snap`, `${WEB}/features/gold/signals/__snapshots__/gold-balance-lanes.test.tsx.snap`],
  // --- web: routes/page-division Gold* + gold-* → features/gold/ (flat) ---
  [`${WEB}/routes/page-division/GoldBalanceClassic.tsx`, `${WEB}/features/gold/GoldBalanceClassic.tsx`],
  [`${WEB}/routes/page-division/GoldContext.tsx`, `${WEB}/features/gold/GoldContext.tsx`],
  [`${WEB}/routes/page-division/GoldHero.tsx`, `${WEB}/features/gold/GoldHero.tsx`],
  [`${WEB}/routes/page-division/GoldPage.test.tsx`, `${WEB}/features/gold/GoldPage.test.tsx`],
  [`${WEB}/routes/page-division/GoldPage.tsx`, `${WEB}/features/gold/GoldPage.tsx`],
  [`${WEB}/routes/page-division/GoldPositions.tsx`, `${WEB}/features/gold/GoldPositions.tsx`],
  [`${WEB}/routes/page-division/GoldSeats.tsx`, `${WEB}/features/gold/GoldSeats.tsx`],
  [`${WEB}/routes/page-division/gold-backtest-core.ts`, `${WEB}/features/gold/gold-backtest-core.ts`],
  [`${WEB}/routes/page-division/gold-backtest.test.ts`, `${WEB}/features/gold/gold-backtest.test.ts`],
  [`${WEB}/routes/page-division/gold-copy-pin.test.ts`, `${WEB}/features/gold/gold-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/gold-frozen-scenarios.test.ts`, `${WEB}/features/gold/gold-frozen-scenarios.test.ts`],
  [`${WEB}/routes/page-division/gold-tiles.test.ts`, `${WEB}/features/gold/gold-tiles.test.ts`],
  [`${WEB}/routes/page-division/gold-tiles.ts`, `${WEB}/features/gold/gold-tiles.ts`],
  // --- engine: the domain-root set → domains/gold/ (flat; gold has NO
  //     board job — unlike currencies' fx/ there is no subfolder to
  //     preserve; the M8 prompt's list) ---
  [`${ENG}/gold-balance.ts`, `${ENG}/domains/gold/gold-balance.ts`],
  [`${ENG}/gold-balance.test.ts`, `${ENG}/domains/gold/gold-balance.test.ts`],
  [`${ENG}/gold-backtest-core.ts`, `${ENG}/domains/gold/gold-backtest-core.ts`],
  [`${ENG}/gold-backtest-core.test.ts`, `${ENG}/domains/gold/gold-backtest-core.test.ts`],
  [`${ENG}/gold-lane-calibration.test.ts`, `${ENG}/domains/gold/gold-lane-calibration.test.ts`],
  [`${ENG}/breakeven-tilt.ts`, `${ENG}/domains/gold/breakeven-tilt.ts`],
  [`${ENG}/breakeven-tilt.test.ts`, `${ENG}/domains/gold/breakeven-tilt.test.ts`],
  [`${ENG}/real-yield-fill.ts`, `${ENG}/domains/gold/real-yield-fill.ts`],
  [`${ENG}/real-yield-fill.test.ts`, `${ENG}/domains/gold/real-yield-fill.test.ts`],
  [`${ENG}/gf-p0-proposed.ts`, `${ENG}/domains/gold/gf-p0-proposed.ts`],
  [`${ENG}/gf-p0-proposed.test.ts`, `${ENG}/domains/gold/gf-p0-proposed.test.ts`],
  [`${ENG}/signals.ts`, `${ENG}/domains/gold/signals.ts`],
  [`${ENG}/signals.test.ts`, `${ENG}/domains/gold/signals.test.ts`],
  // --- engine: adapters → domains/gold/adapters/ (flat, no subfolder,
  //     no barrel; sge-monthly.test.ts is the ONLY co-located adapter
  //     test — the audit's "(+1 tests)" counts cross-adapter tests) ---
  [`${ENG}/adapters/cftc.ts`, `${ENG}/domains/gold/adapters/cftc.ts`],
  [`${ENG}/adapters/sge.ts`, `${ENG}/domains/gold/adapters/sge.ts`],
  [`${ENG}/adapters/sge-monthly.ts`, `${ENG}/domains/gold/adapters/sge-monthly.ts`],
  [`${ENG}/adapters/sge-monthly.test.ts`, `${ENG}/domains/gold/adapters/sge-monthly.test.ts`],
  [`${ENG}/adapters/bazg.ts`, `${ENG}/domains/gold/adapters/bazg.ts`],
  [`${ENG}/adapters/gold-equities.ts`, `${ENG}/domains/gold/adapters/gold-equities.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M7′ codemod.)
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
 *  (The M2→M7′ method: re-anchor EVERY relative edge of a moved importer,
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
//    (dynamic import() CALL + the R8 new URL(...) fixture depth + the
//    JSON exports map). Keyed by FINAL file path; applied as exact
//    substring replacements.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY gold variant-#1 site,
  //     verified by the pre-gates grep) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/GoldPage')",
    to: "import('./features/gold/GoldPage')",
  },
  // --- manual edit 2: gold-balance.test.ts R8 fixture-depth (the
  //     new URL(fs-path) form — the ONLY fs-path form in the moved set;
  //     the importer moves from src/ (1 up-level to
  //     packages/insights/fixtures) to src/domains/gold/ (3 up-levels);
  //     COMPUTED via path.relative, never hand-counted) ---
  {
    file: `${ENG}/domains/gold/gold-balance.test.ts`,
    from: "new URL('../fixtures/gold-backtest-corpus.json', import.meta.url)",
    to: "new URL('../../../fixtures/gold-backtest-corpus.json', import.meta.url)",
  },
  // --- manual edit 3: the exports map (R4 — entry NAMES frozen; only
  //     the target path changes, in the SAME commit as the move; the ONE
  //     gold exports-map entry) ---
  {
    file: 'packages/insights/package.json',
    from: '"./gf-p0-proposed": "./src/gf-p0-proposed.ts"',
    to: '"./gf-p0-proposed": "./src/domains/gold/gf-p0-proposed.ts"',
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (41 source + 1 co-located vitest snapshot)`);
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
  console.log("   N5: verdict.tsx → shared/components/outlook-core (importer components/insights/signals/ → features/gold/signals/, both at src depth 3; target stays in shared/, a direct child of src/ — the spec resolves identically from BOTH; the M7′ N7 pattern)");
  console.log("   intra-domain: gold-lane-calibration.test + gold-backtest-core.test → './gf-p0-proposed' (BOTH endpoints move into the SAME dir — same-dir NO-OPs)");
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files (only frozen '@currena/core' package refs in scope); variant #3 CONSUMER dynamic await import() of a MOVED gold file (none — the s6-nz shape points at the already-moved frankfurter); no join(here)/readFileSync(join()) in the moved set (the new URL form in gold-balance.test.ts is the ONLY fs-path form — manual edit 2); no ?raw ON moved files (the round2.test.ts ?raw CONSUMER set is static-form, regex-covered — query + explicit extension preserved)");
  console.log('Cross-domain edges: N16 (shared/validation.ts → signals.ts) re-anchored to ../domains/gold/signals (the documented shared→gold edge; validation stays shared — the M7′ N17 pattern); R13 legacy borrowers re-anchored (Insights.tsx → Signals; round2.test.ts ?raw ×5; pd-s5-backtest.ts → gold-backtest-core — the pd-s18 lesson applied, pd-s5 verified FIRST as the gold script; the engine gf-*/gold-* scripts; the engine barrel + ingest/run + adapters/{index,rung2}).');
  console.log('Exports map: ./gf-p0-proposed repointed (entry name frozen, R4 — the ONE gold entry).');
  console.log('Chunk-merger watch (baseline recorded, 80 chunks, entry index-Dja1XSz5): GoldPage-CMenZk4O + signals-Bu_Nyh5- + signals-BzpTDyje (engine signals.ts + shared/config/signals.ts) expected hash-UNCHANGED; outlook-core-BSU_HUvM (N5) + fx-presentation-BGeEOVEb (legacy) NOT moving; expected ZERO topology delta except the entry lazy-path hash + its filename ripple.');
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
console.log('Next: run copy:audit (re-key any REMOVED+NEW pair per BD-M5 D5), then gates.');
