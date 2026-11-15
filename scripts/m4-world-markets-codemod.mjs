#!/usr/bin/env node
/**
 * M4 codemod — modularization Phase 3.2 (world-markets domain).
 *
 * Moves the 32 web world-markets files (the 20-file
 * components/insights/world-markets/ subfolder + MarketsChart + the 11
 * routes/page-division world-markets files, all FLAT into
 * apps/web/src/features/world-markets/ — the M3 usa convention) and the
 * 8 engine markets/ files (preserved as a subfolder at
 * packages/insights/src/domains/world-markets/markets/), then re-anchors
 * every import edge against the FINAL locations (the M2/M3 method,
 * HANDOFF "Operational notes"): never hand-count ../, use path.relative.
 *
 * Same-commit manual edits the import regex CANNOT see (the M3 codemod
 * gap, grepped before gates):
 *   - App.tsx lazy `import('./routes/page-division/WorldMarketsPage')`
 *     (dynamic import() is not matched by the import/export-from regex)
 *   - markets-verdict.test.ts two `await import('./world-markets/...')`
 *     (same gap; the test stays in components/insights — it is the legacy
 *      WorldMarkets.tsx verdict test, assigned to insights-legacy per the
 *      audit, NOT a world-markets mover)
 *   - packages/insights/package.json exports map ./markets +
 *     ./markets/definitions target paths (JSON, not an import statement)
 *   - apps/web/scripts/build-world-map.mjs geoOutPath (R11 — a join()
 *     string-literal, not an import) + its doc comment
 *   - markets.test.ts `new URL('./../../fixtures/markets-test/',
 *     import.meta.url)` — the R8 fixture-depth trap (the markets/ folder
 *     moves TWO levels deeper: src/markets → src/domains/world-markets/
 *     markets, so 4 up-levels are needed, not 2). The depth is COMPUTED
 *     from path.relative, never hand-counted (the M3 BD-M3 D2 lesson).
 *
 * Usage:
 *   node scripts/m4-world-markets-codemod.mjs          # apply (default)
 *   node scripts/m4-world-markets-codemod.mjs --dry    # print the plan only
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
//    Web half: FLAT into features/world-markets/ (the M3 usa convention —
//    no nested components/ subfolder; the 20-file world-markets/ cluster
//    flattens alongside the page files + MarketsChart).
//    Engine half: markets/ preserved as domains/world-markets/markets/
//    (the M3 tic/ convention — the board job keeps its subfolder + barrel).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: components/insights/world-markets/* → features/world-markets/ (flat) ---
  [`${WEB}/components/insights/world-markets/MarketLogo.tsx`, `${WEB}/features/world-markets/MarketLogo.tsx`],
  [`${WEB}/components/insights/world-markets/MarketMovers.tsx`, `${WEB}/features/world-markets/MarketMovers.tsx`],
  [`${WEB}/components/insights/world-markets/MarketTile.tsx`, `${WEB}/features/world-markets/MarketTile.tsx`],
  [`${WEB}/components/insights/world-markets/MarketsHeatmap.tsx`, `${WEB}/features/world-markets/MarketsHeatmap.tsx`],
  [`${WEB}/components/insights/world-markets/MarketsTable.tsx`, `${WEB}/features/world-markets/MarketsTable.tsx`],
  [`${WEB}/components/insights/world-markets/MarketsTreemap.test.ts`, `${WEB}/features/world-markets/MarketsTreemap.test.ts`],
  [`${WEB}/components/insights/world-markets/MarketsTreemap.tsx`, `${WEB}/features/world-markets/MarketsTreemap.tsx`],
  [`${WEB}/components/insights/world-markets/MarketsVerdict.tsx`, `${WEB}/features/world-markets/MarketsVerdict.tsx`],
  [`${WEB}/components/insights/world-markets/WorldMap.tsx`, `${WEB}/features/world-markets/WorldMap.tsx`],
  [`${WEB}/components/insights/world-markets/briefing.test.ts`, `${WEB}/features/world-markets/briefing.test.ts`],
  [`${WEB}/components/insights/world-markets/briefing.test.tsx`, `${WEB}/features/world-markets/briefing.test.tsx`],
  [`${WEB}/components/insights/world-markets/briefing.ts`, `${WEB}/features/world-markets/briefing.ts`],
  [`${WEB}/components/insights/world-markets/session.ts`, `${WEB}/features/world-markets/session.ts`],
  [`${WEB}/components/insights/world-markets/shared.tsx`, `${WEB}/features/world-markets/shared.tsx`],
  [`${WEB}/components/insights/world-markets/verdict-core.ts`, `${WEB}/features/world-markets/verdict-core.ts`],
  [`${WEB}/components/insights/world-markets/world-map-config.ts`, `${WEB}/features/world-markets/world-map-config.ts`],
  [`${WEB}/components/insights/world-markets/world-map-geo.json`, `${WEB}/features/world-markets/world-map-geo.json`],
  [`${WEB}/components/insights/world-markets/world-map-rows.ts`, `${WEB}/features/world-markets/world-map-rows.ts`],
  [`${WEB}/components/insights/world-markets/zoom-component.test.tsx`, `${WEB}/features/world-markets/zoom-component.test.tsx`],
  [`${WEB}/components/insights/world-markets/zoom.test.ts`, `${WEB}/features/world-markets/zoom.test.ts`],
  // --- web: components/insights/MarketsChart.tsx → features/world-markets/ (BD-M1-r D3: left for M4) ---
  [`${WEB}/components/insights/MarketsChart.tsx`, `${WEB}/features/world-markets/MarketsChart.tsx`],
  // --- web: routes/page-division/world-markets* + WorldMarkets* → features/world-markets/ (flat) ---
  [`${WEB}/routes/page-division/WorldMarketsBriefing.tsx`, `${WEB}/features/world-markets/WorldMarketsBriefing.tsx`],
  [`${WEB}/routes/page-division/WorldMarketsGrids.tsx`, `${WEB}/features/world-markets/WorldMarketsGrids.tsx`],
  [`${WEB}/routes/page-division/WorldMarketsHero.tsx`, `${WEB}/features/world-markets/WorldMarketsHero.tsx`],
  [`${WEB}/routes/page-division/WorldMarketsPage.test.tsx`, `${WEB}/features/world-markets/WorldMarketsPage.test.tsx`],
  [`${WEB}/routes/page-division/WorldMarketsPage.tsx`, `${WEB}/features/world-markets/WorldMarketsPage.tsx`],
  [`${WEB}/routes/page-division/world-map-copy.ts`, `${WEB}/features/world-markets/world-map-copy.ts`],
  [`${WEB}/routes/page-division/world-markets-backtest-core.ts`, `${WEB}/features/world-markets/world-markets-backtest-core.ts`],
  [`${WEB}/routes/page-division/world-markets-backtest.test.ts`, `${WEB}/features/world-markets/world-markets-backtest.test.ts`],
  [`${WEB}/routes/page-division/world-markets-copy-pin.test.ts`, `${WEB}/features/world-markets/world-markets-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/world-markets-tiles.test.ts`, `${WEB}/features/world-markets/world-markets-tiles.test.ts`],
  [`${WEB}/routes/page-division/world-markets-tiles.ts`, `${WEB}/features/world-markets/world-markets-tiles.ts`],
  // --- engine: markets/ → domains/world-markets/markets/ (whole board job, subfolder preserved) ---
  [`${ENG}/markets/compute.ts`, `${ENG}/domains/world-markets/markets/compute.ts`],
  [`${ENG}/markets/definitions.ts`, `${ENG}/domains/world-markets/markets/definitions.ts`],
  [`${ENG}/markets/index.ts`, `${ENG}/domains/world-markets/markets/index.ts`],
  [`${ENG}/markets/job.ts`, `${ENG}/domains/world-markets/markets/job.ts`],
  [`${ENG}/markets/markets.test.ts`, `${ENG}/domains/world-markets/markets/markets.test.ts`],
  [`${ENG}/markets/providers.ts`, `${ENG}/domains/world-markets/markets/providers.ts`],
  [`${ENG}/markets/run.ts`, `${ENG}/domains/world-markets/markets/run.ts`],
  [`${ENG}/markets/store.ts`, `${ENG}/domains/world-markets/markets/store.ts`],
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
//    from any importer (moved or not). (Identical to the M3 codemod.)
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
 *  (The M2/M3 method: re-anchor EVERY relative edge of a moved importer,
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
//    (dynamic import(), JSON exports map, join() string-literals, the
//    new URL(...,import.meta.url) fixture depth). Keyed by FINAL file
//    path; applied as exact substring replacements. The R8 depth is
//    COMPUTED (path.relative against the package root), never hand-counted.
// ---------------------------------------------------------------------------
/** The URL-style relative path from a file's FINAL dir to a target dir,
 *  in the `./../../…/` form `new URL(spec, import.meta.url)` expects.
 *  The leading `./` is always emitted (matches the original style; URL
 *  resolution is identical with or without it). Computed via
 *  path.relative — the R8 rule (never hand-count ../). */
function urlRel(finalFileDir, targetDir) {
  let rel = path.relative(path.join(ROOT, finalFileDir), path.join(ROOT, targetDir));
  rel = './' + rel; // always emit the './' prefix (matches the original new URL() style)
  return rel.endsWith('/') ? rel : rel + '/';
}

const marketsTestDir = 'packages/insights/src/domains/world-markets/markets';
const manualEdits = [
  // --- App.tsx lazy route (dynamic import() — the regex gap) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/WorldMarketsPage')",
    to: "import('./features/world-markets/WorldMarketsPage')",
  },
  // --- markets-verdict.test.ts two dynamic import() (the regex gap; the
  //     test stays in components/insights — it is the legacy WorldMarkets
  //     verdict test, insights-legacy per the audit, NOT a mover) ---
  {
    file: `${WEB}/components/insights/markets-verdict.test.ts`,
    from: "await import('./world-markets/MarketsVerdict')",
    to: "await import('../../features/world-markets/MarketsVerdict')",
  },
  {
    file: `${WEB}/components/insights/markets-verdict.test.ts`,
    from: "await import('./world-markets/briefing')",
    to: "await import('../../features/world-markets/briefing')",
  },
  // --- exports map (JSON — the ./markets + ./markets/definitions targets) ---
  {
    file: 'packages/insights/package.json',
    from: '"./markets": "./src/markets/index.ts"',
    to: '"./markets": "./src/domains/world-markets/markets/index.ts"',
  },
  {
    file: 'packages/insights/package.json',
    from: '"./markets/definitions": "./src/markets/definitions.ts"',
    to: '"./markets/definitions": "./src/domains/world-markets/markets/definitions.ts"',
  },
  // --- build-world-map.mjs geoOutPath (R11 — a join() string-literal) ---
  {
    file: 'apps/web/scripts/build-world-map.mjs',
    from: "join(webRoot, 'src', 'components', 'insights', 'world-markets', 'world-map-geo.json')",
    to: "join(webRoot, 'src', 'features', 'world-markets', 'world-map-geo.json')",
  },
  // --- build-world-map.mjs doc comment (line 15 — keep the path accurate) ---
  {
    file: 'apps/web/scripts/build-world-map.mjs',
    from: "src/components/insights/world-markets/world-map-geo.json",
    to: "src/features/world-markets/world-map-geo.json",
  },
  // --- markets.test.ts FIXTURES URL depth (R8 trap — COMPUTED, never
  //     hand-counted). src/markets → src/domains/world-markets/markets is
  //     TWO levels deeper, so 4 up-levels reach packages/insights/fixtures,
  //     not 2. urlRel() renders the exact './../../../../fixtures/' form. ---
  {
    file: `${marketsTestDir}/markets.test.ts`,
    from: "new URL('./../../fixtures/markets-test/', import.meta.url)",
    to: `new URL('${urlRel(marketsTestDir, 'packages/insights/fixtures')}markets-test/', import.meta.url)`,
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
console.log('Next: hand-verify App.tsx lazy path (done by codemod), exports map ./markets (done), '
  + 'build-world-map.mjs geoOutPath (done), pd-s7/s8 scripts (codemod re-anchored — verify), '
  + 'markets.test.ts URL depth (done), markets-verdict.test.ts dyn imports (done). Then run gates.');
