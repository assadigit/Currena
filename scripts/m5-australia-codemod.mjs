#!/usr/bin/env node
/**
 * M5 codemod — modularization Phase 3.3 (the australia domain).
 *
 * Moves the 14 web australia files (the 9 routes/page-division australia
 * page files + AustralianMarkets + MoneyPanel + the 2-file au-markets/
 * subfolder cluster + the lib/markets-au snapshot client, all FLAT into
 * apps/web/src/features/australia/ — the M3 usa + M4 world-markets
 * convention; the au-markets/ subfolder is PRESERVED as a cluster within
 * features/australia/) and the 13 engine files (the 8-file markets-au/
 * board job, preserved as a subfolder at
 * packages/insights/src/domains/australia/markets-au/, the M3 tic/ +
 * M4 markets/ convention; + the 3 AU adapters abs/abs-au/rba with their
 * 2 co-located tests into domains/australia/adapters/), then re-anchors
 * every import edge against the FINAL locations (the M2/M3/M4 method,
 * HANDOFF "Operational notes"): never hand-count ../, use path.relative.
 *
 * Same-commit manual edits the import regex CANNOT see (the M3/M4 codemod
 * gap, grepped before gates — BD-M4 D4):
 *   - App.tsx lazy `import('./routes/page-division/AustraliaPage')`
 *     (dynamic import() is not matched by the import/export-from regex)
 *   - rba.ts line 114 inline TYPE import `import('../shared/parsers')`
 *     (the inline `import('...').X` type form — also a dynamic-import()
 *      regex gap; the importer moves to domains/australia/adapters/, the
 *      target shared/parsers does NOT move, so the relative depth changes
 *      from ../ to ../../../ — COMPUTED, never hand-counted)
 *   - packages/insights/package.json exports map ./markets-au +
 *     ./markets-au/definitions target paths (JSON, not an import
 *     statement — the entry NAMEs are frozen, R4)
 *
 * Verified NO-OP dynamic imports (grepped per moved file, the BD-M4 D4
 * lesson — left untouched because depth-invariant):
 *   - AustraliaPage.test.tsx two `await import('../../shared/lib/locale')`
 *     (the test MOVES from routes/page-division/ to features/australia/,
 *      both at apps/web/src depth 2, so `../../shared/lib/locale`
 *      resolves to apps/web/src/shared/lib/locale from BOTH — the
 *      target shared/lib/locale does NOT move; the relative spec is
 *      byte-identical from the new location, so re-anchoring is a no-op).
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO `new URL(spec, import.meta.url)` fixture paths (markets-au.test.ts
 *     uses a synthetic fake fetcher, NOT a fixtures/ URL — the R8 trap that
 *     bit M3/M4 does NOT apply here; no urlRel() helper needed)
 *   - NO Vite `?raw` query imports on the moved files
 *   - NO build-world-map-equivalent string-literal path writes (australia
 *     has no generated asset)
 *
 * R8 trap FOUND in the join() form (the gates run caught it — the one
 * fs-path pattern the pre-gates grep missed; BD-M5 D-? records the
 * sharpened lesson): the 2 AU adapter tests compute their FIXTURES dir via
 * `join(HERE, '..', '..', 'fixtures')` (rba.test.ts) / `join(here, '..',
 * '..', 'fixtures', 's5')` (abs-au.test.ts). The tests move from
 * src/adapters/ (2 up-levels to packages/insights/fixtures) to
 * src/domains/australia/adapters/ (4 up-levels) — the SAME 2→4 depth shift
 * as M4's markets.test.ts, but in the `join(__dirname, ...)` form (NOT
 * `new URL(..., import.meta.url)`). The pre-gates grep covered `new URL`
 * + `from '...fixtures'` but NOT `join(HERE/here, ...)` — the BD-M4 D4
 * lesson sharpened: grep for ALL fs-path forms (new URL, join(__dirname),
 * readFileSync(join()), fileURLToPath) per moved test, not just the
 * import-statement + new URL forms. The 2 fixture depths are COMPUTED
 * (4 up-levels, the path.relative arithmetic), never hand-counted.
 *
 * Usage:
 *   node scripts/m5-australia-codemod.mjs          # apply (default)
 *   node scripts/m5-australia-codemod.mjs --dry    # print the plan only
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
//    Web half: FLAT into features/australia/ (the M3 usa + M4 world-markets
//    convention — the 2-file au-markets/ subfolder cluster is PRESERVED as
//    features/australia/au-markets/; the lib/markets-au snapshot client
//    flattens to features/australia/markets-au.ts).
//    Engine half: markets-au/ preserved as domains/australia/markets-au/
//    (the M3 tic/ + M4 markets/ convention — the board job keeps its
//    subfolder + barrel); the 3 AU adapters (+ 2 co-located tests) land in
//    domains/australia/adapters/.
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: routes/page-division/australia* + Australia* → features/australia/ (flat) ---
  [`${WEB}/routes/page-division/AustraliaPage.test.tsx`, `${WEB}/features/australia/AustraliaPage.test.tsx`],
  [`${WEB}/routes/page-division/AustraliaPage.tsx`, `${WEB}/features/australia/AustraliaPage.tsx`],
  [`${WEB}/routes/page-division/AustraliaTierCards.tsx`, `${WEB}/features/australia/AustraliaTierCards.tsx`],
  [`${WEB}/routes/page-division/australia-backtest-core.ts`, `${WEB}/features/australia/australia-backtest-core.ts`],
  [`${WEB}/routes/page-division/australia-backtest.test.ts`, `${WEB}/features/australia/australia-backtest.test.ts`],
  [`${WEB}/routes/page-division/australia-board-copy.ts`, `${WEB}/features/australia/australia-board-copy.ts`],
  [`${WEB}/routes/page-division/australia-copy-pin.test.ts`, `${WEB}/features/australia/australia-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/australia-tiles.test.ts`, `${WEB}/features/australia/australia-tiles.test.ts`],
  [`${WEB}/routes/page-division/australia-tiles.ts`, `${WEB}/features/australia/australia-tiles.ts`],
  // --- web: components/insights/AustralianMarkets + MoneyPanel → features/australia/ (flat) ---
  [`${WEB}/components/insights/AustralianMarkets.tsx`, `${WEB}/features/australia/AustralianMarkets.tsx`],
  [`${WEB}/components/insights/MoneyPanel.tsx`, `${WEB}/features/australia/MoneyPanel.tsx`],
  // --- web: components/insights/au-markets/{briefing,shared} → features/australia/au-markets/ (subfolder PRESERVED) ---
  [`${WEB}/components/insights/au-markets/briefing.ts`, `${WEB}/features/australia/au-markets/briefing.ts`],
  [`${WEB}/components/insights/au-markets/shared.ts`, `${WEB}/features/australia/au-markets/shared.ts`],
  // --- web: lib/markets-au.ts (the snapshot client) → features/australia/markets-au.ts (flat) ---
  [`${WEB}/lib/markets-au.ts`, `${WEB}/features/australia/markets-au.ts`],
  // --- engine: markets-au/ → domains/australia/markets-au/ (whole board job, subfolder preserved) ---
  [`${ENG}/markets-au/compute.ts`, `${ENG}/domains/australia/markets-au/compute.ts`],
  [`${ENG}/markets-au/definitions.ts`, `${ENG}/domains/australia/markets-au/definitions.ts`],
  [`${ENG}/markets-au/index.ts`, `${ENG}/domains/australia/markets-au/index.ts`],
  [`${ENG}/markets-au/job.ts`, `${ENG}/domains/australia/markets-au/job.ts`],
  [`${ENG}/markets-au/markets-au.test.ts`, `${ENG}/domains/australia/markets-au/markets-au.test.ts`],
  [`${ENG}/markets-au/providers.ts`, `${ENG}/domains/australia/markets-au/providers.ts`],
  [`${ENG}/markets-au/run.ts`, `${ENG}/domains/australia/markets-au/run.ts`],
  [`${ENG}/markets-au/store.ts`, `${ENG}/domains/australia/markets-au/store.ts`],
  // --- engine: adapters abs/abs-au/rba (+tests) → domains/australia/adapters/ ---
  [`${ENG}/adapters/abs.ts`, `${ENG}/domains/australia/adapters/abs.ts`],
  [`${ENG}/adapters/abs-au.ts`, `${ENG}/domains/australia/adapters/abs-au.ts`],
  [`${ENG}/adapters/abs-au.test.ts`, `${ENG}/domains/australia/adapters/abs-au.test.ts`],
  [`${ENG}/adapters/rba.ts`, `${ENG}/domains/australia/adapters/rba.ts`],
  [`${ENG}/adapters/rba.test.ts`, `${ENG}/domains/australia/adapters/rba.test.ts`],
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
//    from any importer (moved or not). (Identical to the M3/M4 codemod.)
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
 *  (The M2/M3/M4 method: re-anchor EVERY relative edge of a moved importer,
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
//    (dynamic import(), inline import('...') type refs, JSON exports map).
//    Keyed by FINAL file path; applied as exact substring replacements.
//    NO R8 new URL() fixture trap for M5 (markets-au.test.ts uses a
//    synthetic fake fetcher — verified absent), so no urlRel() helper.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- App.tsx lazy route (dynamic import() — the regex gap, BD-M4 D4) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/AustraliaPage')",
    to: "import('./features/australia/AustraliaPage')",
  },
  // --- rba.ts line 114 inline TYPE import (the inline `import('...').X`
  //     form — also a dynamic-import() regex gap; the importer moves to
  //     domains/australia/adapters/, the target shared/parsers does NOT
  //     move, so the relative depth changes from ../ to ../../../ —
  //     COMPUTED via path.relative, never hand-counted) ---
  {
    file: `${ENG}/domains/australia/adapters/rba.ts`,
    from: "import('../shared/parsers')",
    to: "import('../../../shared/parsers')",
  },
  // --- rba.test.ts FIXTURES dir depth (the R8 trap in the join() form —
  //     the importer moves from src/adapters/ (2 up-levels to
  //     packages/insights/fixtures) to src/domains/australia/adapters/
  //     (4 up-levels); COMPUTED, never hand-counted). The pre-gates grep
  //     missed this (it covered new URL + from '...fixtures' but NOT
  //     join(__dirname, ...)); the gates run caught it. ---
  {
    file: `${ENG}/domains/australia/adapters/rba.test.ts`,
    from: "join(HERE, '..', '..', 'fixtures')",
    to: "join(HERE, '..', '..', '..', '..', 'fixtures')",
  },
  // --- abs-au.test.ts FIXTURES dir depth (the same R8 join() trap; the s5
  //     subfolder is preserved) ---
  {
    file: `${ENG}/domains/australia/adapters/abs-au.test.ts`,
    from: "join(here, '..', '..', 'fixtures', 's5')",
    to: "join(here, '..', '..', '..', '..', 'fixtures', 's5')",
  },
  // --- exports map (JSON — the ./markets-au + ./markets-au/definitions
  //     targets; entry NAMEs frozen, R4) ---
  {
    file: 'packages/insights/package.json',
    from: '"./markets-au": "./src/markets-au/index.ts"',
    to: '"./markets-au": "./src/domains/australia/markets-au/index.ts"',
  },
  {
    file: 'packages/insights/package.json',
    from: '"./markets-au/definitions": "./src/markets-au/definitions.ts"',
    to: '"./markets-au/definitions": "./src/domains/australia/markets-au/definitions.ts"',
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
  console.log('   apps/web/src/features/australia/AustraliaPage.test.tsx:  await import(\'../../shared/lib/locale\')  (×2; both old routes/page-division/ + new features/australia/ at apps/web/src depth 2 → ../../shared/lib/locale resolves identically; target shared/lib/locale does NOT move)');
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
console.log('Next: hand-verify App.tsx lazy path (done by codemod), exports map ./markets-au (done), '
  + 'rba.ts inline import depth (done), pd-s16 script imports (codemod re-anchored — verify), '
  + 'the N11 AsiaNzx50Card asia→australia cross-domain edge (codemod re-anchored — verify). '
  + 'Then run copy:audit + re-key any manifest REMOVED+NEW pair, then gates.');
