#!/usr/bin/env node
/**
 * M6 codemod — modularization Phase 3.4 (the commodities domain).
 *
 * Moves the 8 web commodities files (CommoditiesPage + test,
 * CommoditiesTierCards, commodities-tiles + test, commodities-backtest-core
 * + test, commodities-copy-pin test — ALL FLAT into
 * apps/web/src/features/commodities/, the M3 usa + M4 world-markets + M5
 * australia convention) and the 7 engine files (the 5 commodities adapters
 * eia/eia-stocks/portwatch/fng/bitstamp + their 2 co-located tests
 * eia.test/portwatch.test into packages/insights/src/domains/commodities/
 * adapters/), then re-anchors every import edge against the FINAL locations
 * (the M2/M3/M4/M5 method, HANDOFF "Operational notes"): never hand-count
 * ../, use path.relative.
 *
 * Scope notes (the audit's Phase 3 item 4 — commodities):
 *   - prices/ + goldapi are ALREADY in engine shared/ (Phase 2, D2
 *     deviation — the audit skeleton placed prices/ under commodities but
 *     the audit moved it to shared because 3 domains consume it). So
 *     commodities has NO board job to move (unlike usa's tic/, world-markets'
 *     markets/, australia's markets-au/) — ONLY the 5 adapters.
 *   - There is NO exports-map ./commodities entry (verified absent — no
 *     board job, no barrel). R4 N/A this phase: only the engine adapters
 *     move; the exports-map is untouched. (Contrast M3 ./tic, M4 ./markets,
 *     M5 ./markets-au — each had a board job + barrel + exports entry.)
 *
 * Same-commit manual edits the import regex CANNOT see (the M3/M4/M5 codemod
 * gap, grepped before gates — BD-M4 D4 + BD-M5 D4/D6):
 *   - App.tsx lazy `import('./routes/page-division/CommoditiesPage')`
 *     (dynamic import() is not matched by the import/export-from regex —
 *      BD-M4 D4)
 *   - eia.test.ts line 15 R8 fixture-depth `join(__dirname, '../../fixtures/
 *     eia-wti-mini.xls')` (the join(__dirname, ...) form — BD-M5 D4; the
 *     importer moves from src/adapters/ (2 up-levels to
 *     packages/insights/fixtures) to src/domains/commodities/adapters/
 *     (4 up-levels); COMPUTED via path.relative, never hand-counted)
 *   - portwatch.test.ts line 42 R8 fixture-depth `join(here, '..', '..',
 *     'fixtures')` (the join(here, ...) form — BD-M5 D4; same 2→4 up-level
 *     shift as eia.test.ts; the s4 subfolder is preserved via the dependent
 *     readFileSync(join(fixtures, 's4', ...)) calls on lines 45-48 — those
 *     ride the `fixtures` variable, no separate fix needed)
 *
 * Verified NO-OP dynamic imports (grepped per moved file, the BD-M4 D4
 * lesson — left untouched because depth-invariant):
 *   - CommoditiesPage.test.tsx two `await import('../../shared/lib/locale')`
 *     (lines 359 + 408; the test MOVES from routes/page-division/ to
 *      features/commodities/, both at apps/web/src depth 2, so
 *      `../../shared/lib/locale` resolves to apps/web/src/shared/lib/locale
 *      from BOTH — the target shared/lib/locale does NOT move; the relative
 *      spec is byte-identical from the new location, so re-anchoring is a
 *      no-op — the SAME depth-invariant NO-OP pattern as M5's
 *      AustraliaPage.test.tsx).
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO `new URL(spec, import.meta.url)` fixture paths in the moved set
 *     (the two `new URL(url)` occurrences in portwatch.test.ts lines 68 +
 *     577 are URL PARSING of HTTP request URLs for `where` query-param
 *     inspection — NOT fs-path fixtures; no re-anchor needed)
 *   - NO inline TYPE `import('...').X` refs in the moved set (the only
 *     `import('` matches are the 2 depth-invariant `await import()` NO-OPs
 *     in CommoditiesPage.test.tsx noted above — BD-M5 D6's rba.ts inline
 *     TYPE variant does NOT recur here)
 *   - NO Vite `?raw` query imports on the moved files
 *   - NO build-world-map-equivalent string-literal path writes (commodities
 *     has no generated asset)
 *   - NO join(__dirname, ...) fixture paths other than the 2 engine tests
 *     noted above (the bitstamp.ts/fng.ts/portwatch.ts `.join(';')`/
 *     `.join(',')` matches are ARRAY joins, NOT path joins)
 *
 * CHUNK-MERGER WATCH (the M5 lesson, BD-M5 D3): the baseline dist has ONE
 * commodities chunk — `CommoditiesPage-*` (the route chunk; all 8 web
 * commodities files co-locate by source, CommoditiesPage the primary
 * importer) + `PriceDetails-*` (the PricesBoard cluster, Phase 2 shared,
 * NOT moving this phase). commodities has NO separate shared cross-route
 * module that co-locates under features/commodities/ this phase (the
 * PricesBoard cluster is in shared/components/ since Phase 2 — the N10
 * edge stays commodities→shared, relative rewrites only). The chunk-merger
 * risk is LOWER than M5's (which moved the markets-au client +
 * AustralianMarkets + au-markets into one flat folder, triggering the
 * Rollup domain-prefix grouping heuristic that merged them into shared-*).
 * After M6, the 8 commodities files still co-locate under
 * features/commodities/ — Rollup keeps them in the CommoditiesPage-* route
 * chunk (no new cross-route sharing). Expected: ZERO chunk topology delta.
 *
 * Cross-domain edges (documented, allowed):
 *   - N1 universal-backtest: commodities-backtest-core imports
 *     usa-backtest-core (features/usa/, M3's). The importer moves from
 *     routes/page-division/ to features/commodities/ — both at src depth 2,
 *     BUT the path STRUCTURE differs (the target is a sibling under
 *     features/, not under src/ root), so the codemod re-anchors the
 *     relative spec `../../features/usa/usa-backtest-core` →
 *     `../usa/usa-backtest-core` (path.relative arithmetic: from
 *     features/commodities, 1 up to features/, then usa/usa-backtest-core;
 *     the audit's "depth-invariant" intuition is correct ONLY for targets
 *     that are direct children of src/ like shared/). Verified in the
 *     dry-run edge list.
 *   - N10 PricesBoard cluster: CommoditiesTierCards imports PriceTile,
 *     useTileData, PriceLens, PricePeriodSwitch from
 *     `../../shared/components/PricesBoard` (Phase 2 shared). Depth-
 *     invariant NO-OP — the target is in shared/ (a direct child of src/),
 *     both old + new importer locations are at src depth 2, so
 *     `../../shared/components/PricesBoard` resolves identically from
 *     BOTH → the codemod skips it (no edge in the dry-run list). After M6
 *     this stays a commodities→shared edge (already cross-domain since
 *     Phase 2).
 *
 * Usage:
 *   node scripts/m6-commodities-codemod.mjs          # apply (default)
 *   node scripts/m6-commodities-codemod.mjs --dry    # print the plan only
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
//    Web half: FLAT into features/commodities/ (the M3 usa + M4 world-markets
//    + M5 australia convention — NO subfolders, NO renames; the 8 files
//    flatten alongside each other; tests co-located with their subjects).
//    Engine half: the 5 commodities adapters + their 2 co-located tests
//    land in domains/commodities/adapters/ (NO subfolder, NO barrel —
//    commodities has NO board job, unlike usa's tic/, world-markets'
//    markets/, australia's markets-au/; the adapters flatten alongside
//    their tests). prices/ + goldapi are ALREADY in engine shared/ (Phase 2).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: routes/page-division/Commodities* + commodities-* → features/commodities/ (flat) ---
  [`${WEB}/routes/page-division/CommoditiesPage.test.tsx`, `${WEB}/features/commodities/CommoditiesPage.test.tsx`],
  [`${WEB}/routes/page-division/CommoditiesPage.tsx`, `${WEB}/features/commodities/CommoditiesPage.tsx`],
  [`${WEB}/routes/page-division/CommoditiesTierCards.tsx`, `${WEB}/features/commodities/CommoditiesTierCards.tsx`],
  [`${WEB}/routes/page-division/commodities-backtest-core.ts`, `${WEB}/features/commodities/commodities-backtest-core.ts`],
  [`${WEB}/routes/page-division/commodities-backtest.test.ts`, `${WEB}/features/commodities/commodities-backtest.test.ts`],
  [`${WEB}/routes/page-division/commodities-copy-pin.test.ts`, `${WEB}/features/commodities/commodities-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/commodities-tiles.test.ts`, `${WEB}/features/commodities/commodities-tiles.test.ts`],
  [`${WEB}/routes/page-division/commodities-tiles.ts`, `${WEB}/features/commodities/commodities-tiles.ts`],
  // --- engine: adapters/{eia,eia-stocks,portwatch,fng,bitstamp}.ts + eia.test + portwatch.test → domains/commodities/adapters/ ---
  [`${ENG}/adapters/bitstamp.ts`, `${ENG}/domains/commodities/adapters/bitstamp.ts`],
  [`${ENG}/adapters/eia-stocks.ts`, `${ENG}/domains/commodities/adapters/eia-stocks.ts`],
  [`${ENG}/adapters/eia.test.ts`, `${ENG}/domains/commodities/adapters/eia.test.ts`],
  [`${ENG}/adapters/eia.ts`, `${ENG}/domains/commodities/adapters/eia.ts`],
  [`${ENG}/adapters/fng.ts`, `${ENG}/domains/commodities/adapters/fng.ts`],
  [`${ENG}/adapters/portwatch.test.ts`, `${ENG}/domains/commodities/adapters/portwatch.test.ts`],
  [`${ENG}/adapters/portwatch.ts`, `${ENG}/domains/commodities/adapters/portwatch.ts`],
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
//    from any importer (moved or not). (Identical to the M3/M4/M5 codemod.)
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
 *  (The M2/M3/M4/M5 method: re-anchor EVERY relative edge of a moved importer,
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
//    (dynamic import(), inline import('...') type refs, JSON exports map,
//    R8 join(__dirname/here, ...) fixture depths). Keyed by FINAL file
//    path; applied as exact substring replacements.
//    NO exports-map edit this phase (verified absent — no ./commodities
//    entry; R4 N/A — contrast M3 ./tic, M4 ./markets, M5 ./markets-au).
//    NO inline TYPE import('...') in the moved set (only the 2 depth-
//    invariant NO-OP `await import()` in CommoditiesPage.test.tsx).
//    NO new URL(spec, import.meta.url) fixture paths in the moved set
//    (the 2 `new URL(url)` in portwatch.test.ts are URL parsing of HTTP
//    request URLs, NOT fs-path fixtures).
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- App.tsx lazy route (dynamic import() — the regex gap, BD-M4 D4) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/CommoditiesPage')",
    to: "import('./features/commodities/CommoditiesPage')",
  },
  // --- eia.test.ts line 15 R8 fixture-depth (the join(__dirname, ...) form
  //     — BD-M5 D4; the importer moves from src/adapters/ (2 up-levels to
  //     packages/insights/fixtures) to src/domains/commodities/adapters/
  //     (4 up-levels); COMPUTED via path.relative, never hand-counted).
  //     The fixture file name + path below 'fixtures/' is preserved. ---
  {
    file: `${ENG}/domains/commodities/adapters/eia.test.ts`,
    from: "join(__dirname, '../../fixtures/eia-wti-mini.xls')",
    to: "join(__dirname, '../../../../fixtures/eia-wti-mini.xls')",
  },
  // --- portwatch.test.ts line 42 R8 fixture-depth (the join(here, ...)
  //     form — BD-M5 D4; same 2→4 up-level shift as eia.test.ts; the s4
  //     subfolder is preserved via the dependent readFileSync(join(fixtures,
  //     's4', ...)) calls on lines 45-48 — those ride the `fixtures`
  //     variable, no separate fix needed). ---
  {
    file: `${ENG}/domains/commodities/adapters/portwatch.test.ts`,
    from: "join(here, '..', '..', 'fixtures')",
    to: "join(here, '..', '..', '..', '..', 'fixtures')",
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files`);
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
  console.log(`   ${path.relative(ROOT, me.file)}:  ${me.from}  →  ${me.to}`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OP dynamic imports (untouched, depth-invariant):');
  console.log("   apps/web/src/features/commodities/CommoditiesPage.test.tsx:  await import('../../shared/lib/locale')  (×2; both old routes/page-division/ + new features/commodities/ at apps/web/src depth 2 → ../../shared/lib/locale resolves identically; target shared/lib/locale does NOT move)");
  console.log('Verified ABSENT: no exports-map ./commodities entry (R4 N/A this phase); no inline TYPE import(\'...\') refs in the moved set; no new URL(spec, import.meta.url) fixture paths; no ?raw Vite queries.');
  console.log('Cross-domain edges: N1 (commodities-backtest-core → features/usa/usa-backtest-core) RE-ANCHORED by codemod (../../features/usa/usa-backtest-core → ../usa/usa-backtest-core — path structure differs even though src depth is invariant); N10 (CommoditiesTierCards → shared/components/PricesBoard) depth-invariant NO-OP (target in shared/, direct child of src/).');
  console.log('Chunk-merger watch: baseline has ONE commodities chunk CommoditiesPage-* (route) + PriceDetails-* (Phase 2 shared, NOT moving); after M6 the 8 web files still co-locate under features/commodities/ → ZERO chunk topology delta expected.');
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
console.log('Next: hand-verify App.tsx lazy path (done by codemod), the 2 R8 fixture-depth edits (done), '
  + 'pd-s17 script imports (codemod re-anchored — verify), '
  + 'the N1 + N10 cross-domain edges (depth-invariant NO-OPs — verify). '
  + 'Then run copy:audit + re-key any manifest REMOVED+NEW pair, then gates.');
