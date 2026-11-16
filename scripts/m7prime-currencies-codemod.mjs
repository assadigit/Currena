#!/usr/bin/env node
/**
 * M7′ codemod — modularization Phase 3.5 (the currencies domain, the RE-DO).
 *
 * WHY M7′: the original M7 session delivered this move (41 files, gates 9/9,
 * suite 15,298) but its GitHub push FAILED (invalid token, HTTP 401) — the
 * M7 commits existed only on that sandbox's local disk, which is gone.
 * origin/main stayed at the M6 close (fdcdbe54) while production ran the
 * stranded M7 surface (c2ff9bf4 @ 100%). This codemod RE-DOES the identical
 * move from the M6 baseline so origin/main catches up to the deployed
 * surface and the deploy-lock is restored. Deterministic: pure file
 * reorganization, zero runtime delta.
 *
 * Moves the 20 web currencies files + 21 engine files (the 16-file fx/ board
 * job + basket.ts/basket.test.ts + the frankfurter/cofer/cofer.test adapter
 * trio), then re-anchors every import edge against the FINAL locations (the
 * M2→M6 method, HANDOFF "Operational notes"): never hand-count ../, use
 * path.relative.
 *
 * Landing shapes (verified against the audit's Deliverable 1 rows + the
 * skeleton §"domains/" + the M3–M6 precedents):
 *   - web → apps/web/src/features/currencies/ — the page files FLAT (the
 *     M3 usa + M4 world-markets + M5 australia + M6 commodities convention,
 *     BD-M4 D1); the fx-presentation/ NAMED CLUSTER preserved as a subfolder
 *     (BD-M5 D1 — the audit lists it with a trailing slash, like au-markets/);
 *     lib/fx-presentation.ts + its 2 tests flatten (they are plain lib files
 *     at lib/ root, not part of the named subfolder cluster); display.ts
 *     flattens (the ONLY world-currencies/ file that moves — rows 164-171
 *     route the rest to features/insights-legacy, NOT currencies).
 *   - engine → packages/insights/src/domains/currencies/ — fx/ PRESERVED as
 *     the board-job subfolder (BD-M4 D2, the M4 domains/world-markets/
 *     markets/ precedent; the exports-map ./fx entry points at its barrel);
 *     basket.ts + basket.test.ts at the domain ROOT (the engine-root module;
 *     the M7 pattern: a domain with a board job + an engine-root module
 *     lands the job at domains/<domain>/<job>/ and the engine-root module
 *     at domains/<domain>/ root); adapters flat under adapters/ (NO subfolder,
 *     NO barrel — the M6 commodities convention).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set):
 *   1. App.tsx:114 lazy `import('./routes/page-division/CurrenciesPage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4)
 *   2. s6-nz.test.ts:114 `await import('../../adapters/frankfurter')` — a
 *      CONSUMER dynamic await import() of a MOVED file (variant #3, BD-M7 —
 *      THE M7 LESSON: this exact shape cost the original M7 one mid-phase
 *      red gates run)
 *   3. cofer.test.ts:23 R8 fixture-depth `join(here, '..', '..', 'fixtures')`
 *      (the join(here, ...) form — BD-M5 D4; the importer moves from
 *      src/adapters/ (2 up-levels to packages/insights/fixtures) to
 *      src/domains/currencies/adapters/ (4 up-levels); COMPUTED via
 *      path.relative, never hand-counted)
 *   4. packages/insights/package.json exports map:
 *      "./fx": "./src/fx/index.ts"                    → "./src/domains/currencies/fx/index.ts"
 *      "./fx/definitions": "./src/fx/definitions.ts"  → "./src/domains/currencies/fx/definitions.ts"
 *      (entry NAMES frozen — R4; apps/api + apps/markets + web import via
 *      the frozen names, ZERO consumer edits, proven by typecheck)
 *
 * Verified NO-OP dynamic imports (grepped per moved file, the BD-M4 D4
 * lesson — left untouched because depth-invariant):
 *   - CurrenciesPage.test.tsx two `await import('../../shared/lib/locale')`
 *     (lines 456 + 501; the test moves from routes/page-division/ to
 *      features/currencies/, both at apps/web/src depth 2, so
 *      `../../shared/lib/locale` resolves identically from BOTH — the SAME
 *      depth-invariant NO-OP pattern as M5's AustraliaPage.test.tsx + M6's
 *      CommoditiesPage.test.tsx).
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO `new URL(spec, import.meta.url)` fs-path fixtures in the moved set
 *   - NO inline TYPE `import('...').X` refs pointing at moved files (the
 *     only `import('` matches in the moved set are the 2 depth-invariant
 *     `await import()` NO-OPs above; the api's `import('@currena/insights/fx')`
 *     type refs ride the FROZEN exports-map name — untouched by design)
 *   - NO Vite `?raw` query imports on the moved files
 *   - NO readFileSync/join(__dirname) fixture paths other than cofer.test.ts
 *     (fx.test.ts + the web tests import nothing from disk)
 *
 * CHUNK-MERGER WATCH (BD-M5 D3 + the M6 LOWER-risk note): the baseline has
 * `rules-CeObO6So.js` = lib/fx-presentation/rules.ts ALREADY split as a
 * shared chunk (3 importers: CurrenciesPage + global-tiles + index entry —
 * the N8 currencies→global mirror is ALREADY a cross-route shared chunk, so
 * co-locating rules.ts under features/currencies/fx-presentation/ does NOT
 * change its sharing topology: Rollup keeps multi-importer modules split.
 * The fx-presentation-BGeEOVEb.js chunk (fxTrendOf, 3 importers: Insights +
 * full-export + fx-csv — all LEGACY, not moving this phase) and
 * fx-BGab1_e7.js (shared/lib/fx client, Phase 2 shared, NOT moving) are
 * likewise unaffected. Expected: ZERO chunk topology delta; the ONLY
 * expected hash change is the entry chunk (App.tsx lazy-path string change,
 * the M6 index-CgbcFzAJ → index-WR9bNacU precedent).
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - N1 universal-backtest: currencies-backtest-core imports
 *     features/usa/usa-backtest-core (M3's) — `../../features/usa/
 *     usa-backtest-core` → `../usa/usa-backtest-core` (the M6 N1 lesson:
 *     path STRUCTURE differs, the spec shortens).
 *   - N8 currencies→global mirror: global-tiles.ts + global-backtest-core.ts
 *     (routes/page-division/, NOT yet moved) import
 *     `../../lib/fx-presentation/rules` → `../../features/currencies/
 *     fx-presentation/rules` (target moved, importer did not).
 *   - N17 engine shared→currencies: shared/adapters/derived.ts imports
 *     `../../basket` → `../../domains/currencies/basket`.
 *   - N7 (lib/fx.ts — shared since Phase 2, NOT moving): CurrenciesPage's
 *     `../../shared/lib/fx` — depth-invariant NO-OP (both old + new importer
 *     at src depth 2; target in shared/, a direct child of src/).
 *   - Legacy borrowers (WorldCurrencies.tsx, full-export.ts, fx-csv.ts, the
 *     world-currencies/ subtree — insights-legacy per the audit rows, NOT
 *     moving this phase): re-anchored to features/currencies/{fx-presentation,
 *     display} — the "domain owns, legacy borrows" pattern (R13).
 *
 * Usage:
 *   node scripts/m7prime-currencies-codemod.mjs          # apply (default)
 *   node scripts/m7prime-currencies-codemod.mjs --dry    # print the plan only
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
//    Web half: FLAT into features/currencies/ EXCEPT the fx-presentation/
//    named cluster (preserved as a subfolder per BD-M5 D1) and the display.ts
//    helper (flattens — it is a single file, not a cluster). Engine half:
//    fx/ preserved as domains/currencies/fx/ (BD-M4 D2 board-job precedent),
//    basket pair at the domain root, adapter trio flat under adapters/.
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: lib fx files → features/currencies/ (flat) + the named subfolder ---
  [`${WEB}/lib/fx-presentation.ts`, `${WEB}/features/currencies/fx-presentation.ts`],
  [`${WEB}/lib/fx-presentation.test.ts`, `${WEB}/features/currencies/fx-presentation.test.ts`],
  [`${WEB}/lib/fx-v13.test.ts`, `${WEB}/features/currencies/fx-v13.test.ts`],
  [`${WEB}/lib/fx-presentation/format.ts`, `${WEB}/features/currencies/fx-presentation/format.ts`],
  [`${WEB}/lib/fx-presentation/headline.ts`, `${WEB}/features/currencies/fx-presentation/headline.ts`],
  [`${WEB}/lib/fx-presentation/pairs.ts`, `${WEB}/features/currencies/fx-presentation/pairs.ts`],
  [`${WEB}/lib/fx-presentation/plain.ts`, `${WEB}/features/currencies/fx-presentation/plain.ts`],
  [`${WEB}/lib/fx-presentation/rules.ts`, `${WEB}/features/currencies/fx-presentation/rules.ts`],
  [`${WEB}/lib/fx-presentation/sentences.ts`, `${WEB}/features/currencies/fx-presentation/sentences.ts`],
  // --- web: world-currencies/display.ts (ONLY this file moves; the rest of
  //     world-currencies/ is insights-legacy per audit rows 164-171) ---
  [`${WEB}/components/insights/world-currencies/display.ts`, `${WEB}/features/currencies/display.ts`],
  // --- web: routes/page-division/Currencies* + currencies-* → features/currencies/ (flat) ---
  [`${WEB}/routes/page-division/CurrenciesPage.test.tsx`, `${WEB}/features/currencies/CurrenciesPage.test.tsx`],
  [`${WEB}/routes/page-division/CurrenciesPage.tsx`, `${WEB}/features/currencies/CurrenciesPage.tsx`],
  [`${WEB}/routes/page-division/CurrenciesPairBoard.tsx`, `${WEB}/features/currencies/CurrenciesPairBoard.tsx`],
  [`${WEB}/routes/page-division/CurrenciesRuleLights.tsx`, `${WEB}/features/currencies/CurrenciesRuleLights.tsx`],
  [`${WEB}/routes/page-division/CurrenciesTierCards.tsx`, `${WEB}/features/currencies/CurrenciesTierCards.tsx`],
  [`${WEB}/routes/page-division/currencies-backtest-core.ts`, `${WEB}/features/currencies/currencies-backtest-core.ts`],
  [`${WEB}/routes/page-division/currencies-backtest.test.ts`, `${WEB}/features/currencies/currencies-backtest.test.ts`],
  [`${WEB}/routes/page-division/currencies-copy-pin.test.ts`, `${WEB}/features/currencies/currencies-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/currencies-tiles.test.ts`, `${WEB}/features/currencies/currencies-tiles.test.ts`],
  [`${WEB}/routes/page-division/currencies-tiles.ts`, `${WEB}/features/currencies/currencies-tiles.ts`],
  // --- engine: fx/ board job (16 files) → domains/currencies/fx/ (subfolder preserved) ---
  [`${ENG}/fx/compute.ts`, `${ENG}/domains/currencies/fx/compute.ts`],
  [`${ENG}/fx/content.ts`, `${ENG}/domains/currencies/fx/content.ts`],
  [`${ENG}/fx/cross-inputs.ts`, `${ENG}/domains/currencies/fx/cross-inputs.ts`],
  [`${ENG}/fx/definitions.ts`, `${ENG}/domains/currencies/fx/definitions.ts`],
  [`${ENG}/fx/entries.ts`, `${ENG}/domains/currencies/fx/entries.ts`],
  [`${ENG}/fx/fx.test.ts`, `${ENG}/domains/currencies/fx/fx.test.ts`],
  [`${ENG}/fx/index.ts`, `${ENG}/domains/currencies/fx/index.ts`],
  [`${ENG}/fx/job.ts`, `${ENG}/domains/currencies/fx/job.ts`],
  [`${ENG}/fx/maths.ts`, `${ENG}/domains/currencies/fx/maths.ts`],
  [`${ENG}/fx/pairs.ts`, `${ENG}/domains/currencies/fx/pairs.ts`],
  [`${ENG}/fx/providers.ts`, `${ENG}/domains/currencies/fx/providers.ts`],
  [`${ENG}/fx/rules.ts`, `${ENG}/domains/currencies/fx/rules.ts`],
  [`${ENG}/fx/run.ts`, `${ENG}/domains/currencies/fx/run.ts`],
  [`${ENG}/fx/store.ts`, `${ENG}/domains/currencies/fx/store.ts`],
  [`${ENG}/fx/summary.ts`, `${ENG}/domains/currencies/fx/summary.ts`],
  [`${ENG}/fx/weekly.ts`, `${ENG}/domains/currencies/fx/weekly.ts`],
  // --- engine: basket pair (engine-root module) → domains/currencies/ root ---
  [`${ENG}/basket.test.ts`, `${ENG}/domains/currencies/basket.test.ts`],
  [`${ENG}/basket.ts`, `${ENG}/domains/currencies/basket.ts`],
  // --- engine: adapter trio → domains/currencies/adapters/ (flat, no barrel) ---
  [`${ENG}/adapters/cofer.test.ts`, `${ENG}/domains/currencies/adapters/cofer.test.ts`],
  [`${ENG}/adapters/cofer.ts`, `${ENG}/domains/currencies/adapters/cofer.ts`],
  [`${ENG}/adapters/frankfurter.ts`, `${ENG}/domains/currencies/adapters/frankfurter.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M6 codemod.)
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
 *  (The M2→M6 method: re-anchor EVERY relative edge of a moved importer,
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
//    (dynamic import() CALL + CONSUMER await import() of a moved file + the
//    JSON exports map + the R8 join(here, ...) fixture depth). Keyed by
//    FINAL file path; applied as exact substring replacements.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/CurrenciesPage')",
    to: "import('./features/currencies/CurrenciesPage')",
  },
  // --- manual edit 2: s6-nz.test.ts CONSUMER dynamic await import() of a
  //     MOVED file (BD-M7 variant #3 — THE M7 LESSON: this shape cost the
  //     original M7 one mid-phase red gates run; the consumer does NOT move,
  //     the TARGET does: ../../adapters/frankfurter from shared/adapters/
  //     resolves OLD to src/adapters/frankfurter.ts → NEW
  //     ../../domains/currencies/adapters/frankfurter — COMPUTED via
  //     path.relative, never hand-counted) ---
  {
    file: `${ENG}/shared/adapters/s6-nz.test.ts`,
    from: "await import('../../adapters/frankfurter')",
    to: "await import('../../domains/currencies/adapters/frankfurter')",
  },
  // --- manual edit 3: cofer.test.ts R8 fixture-depth (the join(here, ...)
  //     form — BD-M5 D4; the importer moves from src/adapters/ (2 up-levels
  //     to packages/insights/fixtures) to src/domains/currencies/adapters/
  //     (4 up-levels); the s6 subfolder + the dependent
  //     readFileSync(join(fixtures, 's6', ...)) call ride the `fixtures`
  //     variable, no separate fix needed). ---
  {
    file: `${ENG}/domains/currencies/adapters/cofer.test.ts`,
    from: "join(here, '..', '..', 'fixtures')",
    to: "join(here, '..', '..', '..', '..', 'fixtures')",
  },
  // --- manual edits 4+5: the exports map (R4 — entry NAMES frozen; only
  //     the target paths change, in the SAME commit as the move). ---
  {
    file: 'packages/insights/package.json',
    from: '"./fx": "./src/fx/index.ts"',
    to: '"./fx": "./src/domains/currencies/fx/index.ts"',
  },
  {
    file: 'packages/insights/package.json',
    from: '"./fx/definitions": "./src/fx/definitions.ts"',
    to: '"./fx/definitions": "./src/domains/currencies/fx/definitions.ts"',
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
  console.log(`   ${me.file}:  ${me.from}  →  ${me.to}`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OP dynamic imports (untouched, depth-invariant):');
  console.log("   apps/web/src/features/currencies/CurrenciesPage.test.tsx:  await import('../../shared/lib/locale')  (×2; both old routes/page-division/ + new features/currencies/ at apps/web/src depth 2 → ../../shared/lib/locale resolves identically; target shared/lib/locale does NOT move)");
  console.log('Verified ABSENT: no new URL(spec, import.meta.url) fixture paths; no ?raw Vite queries; no inline TYPE import(\'...\') refs pointing at moved files (the api\'s import(\'@currena/insights/fx\') type refs ride the FROZEN exports-map name).');
  console.log('Cross-domain edges: N1 (currencies-backtest-core → features/usa/usa-backtest-core) re-anchored (spec shortens, the M6 N1 lesson); N8 (global-tiles + global-backtest-core → lib/fx-presentation/rules) re-anchored to features/currencies/fx-presentation/rules; N17 (shared/adapters/derived.ts → basket) re-anchored to domains/currencies/basket; N7 (../../shared/lib/fx) depth-invariant NO-OP.');
  console.log('Exports map: ./fx + ./fx/definitions repointed (entry names frozen, R4).');
  console.log('Chunk-merger watch: rules-CeObO6So (fx-presentation/rules) is ALREADY a multi-importer shared chunk (CurrenciesPage + global-tiles + index) — co-location does not change its topology; expected ZERO chunk topology delta except the entry lazy-path hash.');
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
console.log('Next: run copy:audit + re-key any manifest REMOVED+NEW pair, then gates.');
