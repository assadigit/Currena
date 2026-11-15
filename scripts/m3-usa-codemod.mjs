#!/usr/bin/env node
/**
 * M3 codemod — modularization Phase 3.1 (usa domain).
 *
 * Moves the 15 web usa files into apps/web/src/features/usa/ and the
 * 19 engine usa files (tic/ + 7 adapters + tests) into
 * packages/insights/src/domains/usa/, then re-anchors every import
 * edge against the FINAL locations (the M2 method, HANDOFF
 * "Operational notes"): never hand-count ../, use path.relative.
 *
 * Usage:
 *   node scripts/m3-usa-codemod.mjs          # apply (default)
 *   node scripts/m3-usa-codemod.mjs --dry    # print the plan only
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
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';
const ENG = 'packages/insights/src';

const moves = [
  // --- web: components/insights → features/usa ---
  [`${WEB}/components/insights/TicSection.tsx`, `${WEB}/features/usa/TicSection.tsx`],
  [`${WEB}/components/insights/TicSection.test.tsx`, `${WEB}/features/usa/TicSection.test.tsx`],
  // --- web: lib → features/usa ---
  [`${WEB}/lib/tic.ts`, `${WEB}/features/usa/tic.ts`],
  [`${WEB}/lib/tic.test.ts`, `${WEB}/features/usa/tic.test.ts`],
  // --- web: routes/page-division → features/usa ---
  [`${WEB}/routes/page-division/UsaPage.tsx`, `${WEB}/features/usa/UsaPage.tsx`],
  [`${WEB}/routes/page-division/UsaPage.test.tsx`, `${WEB}/features/usa/UsaPage.test.tsx`],
  [`${WEB}/routes/page-division/UsaTierCards.tsx`, `${WEB}/features/usa/UsaTierCards.tsx`],
  [`${WEB}/routes/page-division/UsaTicSection.tsx`, `${WEB}/features/usa/UsaTicSection.tsx`],
  [`${WEB}/routes/page-division/UsaVerdictStrip.tsx`, `${WEB}/features/usa/UsaVerdictStrip.tsx`],
  [`${WEB}/routes/page-division/usa-backtest-core.ts`, `${WEB}/features/usa/usa-backtest-core.ts`],
  [`${WEB}/routes/page-division/usa-backtest.test.ts`, `${WEB}/features/usa/usa-backtest.test.ts`],
  [`${WEB}/routes/page-division/usa-copy-pin.test.ts`, `${WEB}/features/usa/usa-copy-pin.test.ts`],
  [`${WEB}/routes/page-division/usa-tic-copy.ts`, `${WEB}/features/usa/usa-tic-copy.ts`],
  [`${WEB}/routes/page-division/usa-tiles.ts`, `${WEB}/features/usa/usa-tiles.ts`],
  [`${WEB}/routes/page-division/usa-tiles.test.ts`, `${WEB}/features/usa/usa-tiles.test.ts`],
  // --- engine: tic/ → domains/usa/ (whole board job) ---
  [`${ENG}/tic/compute.ts`, `${ENG}/domains/usa/tic/compute.ts`],
  [`${ENG}/tic/index.ts`, `${ENG}/domains/usa/tic/index.ts`],
  [`${ENG}/tic/job.ts`, `${ENG}/domains/usa/tic/job.ts`],
  [`${ENG}/tic/model.ts`, `${ENG}/domains/usa/tic/model.ts`],
  [`${ENG}/tic/parse.ts`, `${ENG}/domains/usa/tic/parse.ts`],
  [`${ENG}/tic/store.ts`, `${ENG}/domains/usa/tic/store.ts`],
  [`${ENG}/tic/tic.test.ts`, `${ENG}/domains/usa/tic/tic.test.ts`],
  // --- engine: 7 usa adapters (+ tests) → domains/usa/adapters/ ---
  [`${ENG}/adapters/treasury.ts`, `${ENG}/domains/usa/adapters/treasury.ts`],
  [`${ENG}/adapters/treasury.test.ts`, `${ENG}/domains/usa/adapters/treasury.test.ts`],
  [`${ENG}/adapters/auctions.ts`, `${ENG}/domains/usa/adapters/auctions.ts`],
  [`${ENG}/adapters/auctions.test.ts`, `${ENG}/domains/usa/adapters/auctions.test.ts`],
  [`${ENG}/adapters/credit.ts`, `${ENG}/domains/usa/adapters/credit.ts`],
  [`${ENG}/adapters/credit.test.ts`, `${ENG}/domains/usa/adapters/credit.test.ts`],
  [`${ENG}/adapters/rstar.ts`, `${ENG}/domains/usa/adapters/rstar.ts`],
  [`${ENG}/adapters/cleveland.ts`, `${ENG}/domains/usa/adapters/cleveland.ts`],
  [`${ENG}/adapters/sp500-breadth.ts`, `${ENG}/domains/usa/adapters/sp500-breadth.ts`],
  [`${ENG}/adapters/sp500-breadth.test.ts`, `${ENG}/domains/usa/adapters/sp500-breadth.test.ts`],
  [`${ENG}/adapters/uom.ts`, `${ENG}/domains/usa/adapters/uom.ts`],
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
//    → NEW specifier. The map is keyed by the moved file's OLD dir +
//    basename so we can resolve any relative specifier that points at a
//    moved file, from any importer (moved or not).
// ---------------------------------------------------------------------------
const oldDirOf = new Map(); // old abs dir → old abs file (for files)
for (const [from] of moves) oldDirOf.set(path.join(ROOT, path.dirname(from)), true);

/** Candidate resolutions of an extensionless relative specifier, in
 *  the order TypeScript resolves them — ONLY paths that exist in the
 *  current (old) tree. A nonexistent "as-written" candidate must never
 *  short-circuit the resolution (the first-draft bug: extensionless
 *  specs resolved to themselves and masked the real .ts target). */
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
 *  This is the M2 method: re-anchor EVERY relative edge of a moved
 *  importer, and every edge whose target moved, against final locations;
 *  never hand-count ../ (path.relative does the arithmetic). */
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
//    (fs/URL fixture joins — the M2 codemod gap, grepped before gates).
//    Keyed by FINAL file path; applied as exact substring replacements.
//    The depth is COMPUTED (path.relative against the package root), never
//    hand-counted — the R8 rule (this session's own near-miss: the first
//    draft wrote 3 up-levels where 4 are needed, caught by the suite).
// ---------------------------------------------------------------------------
const INSIGHTS_ROOT = 'packages/insights';
/** The literal "'..', '..', …" segment list from a file's final dir to the
 *  package root — computed, then rendered as the join() argument text. */
function upLevels(finalFileDir) {
  const rel = path.relative(path.join(ROOT, finalFileDir), path.join(ROOT, INSIGHTS_ROOT));
  const n = rel.split(path.sep).filter((s) => s === '..').length;
  return Array.from({ length: n }, () => "'..'").join(', ');
}
const ticDir = 'packages/insights/src/domains/usa/tic';
const usaAdaptersDir = 'packages/insights/src/domains/usa/adapters';
const manualEdits = [
  // tic.test.ts fixture depth: src/tic → src/domains/usa/tic
  {
    file: `${ticDir}/tic.test.ts`,
    from: "join(HERE, '..', '..', 'fixtures', 'tic')",
    to: `join(HERE, ${upLevels(ticDir)}, 'fixtures', 'tic')`,
  },
  // auctions.test.ts: src/adapters → src/domains/usa/adapters
  {
    file: `${usaAdaptersDir}/auctions.test.ts`,
    from: "join(here, '..', '..', 'fixtures', 's3', 'treasury-auctions-full-2026-11-01.json')",
    to: `join(here, ${upLevels(usaAdaptersDir)}, 'fixtures', 's3', 'treasury-auctions-full-2026-11-01.json')`,
  },
  // credit.test.ts fixtures root
  {
    file: `${usaAdaptersDir}/credit.test.ts`,
    from: "const fixtures = join(here, '..', '..', 'fixtures');",
    to: `const fixtures = join(here, ${upLevels(usaAdaptersDir)}, 'fixtures');`,
  },
  // sp500-breadth.test.ts fixtures root
  {
    file: `${usaAdaptersDir}/sp500-breadth.test.ts`,
    from: "const fixtures = join(here, '..', '..', 'fixtures');",
    to: `const fixtures = join(here, ${upLevels(usaAdaptersDir)}, 'fixtures');`,
  },
  // treasury.test.ts — check its fixture path form at apply time (none found:
  // it builds inline CSV strings; verified in the pre-gates grep).
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
console.log(`\nManual fs/URL edits: ${manualEdits.length}`);

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
  // apply per-edit exact replacements
  for (const e of edits.filter((x) => x.file === file)) {
    // replace the FIRST occurrence of the exact specifier string in an
    // import/export-from statement context; safe because the spec is
    // unique per file (relative paths collide only in comment text —
    // the M2 method's anchoring rule).
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

// --- apply the manual fs/URL edits ---
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

console.log('\nDONE — moves applied + import edges re-anchored + fs/URL paths fixed.');
console.log('Next: hand-verify App.tsx lazy path, exports map ./tic, pd-s4/s9/s10 scripts (separate steps).');
