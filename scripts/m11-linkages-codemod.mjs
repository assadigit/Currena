#!/usr/bin/env node
/**
 * M11 codemod — modularization Phase 3.9 (the economic-linkages domain,
 * the ninth Phase 3 move, biggest-first per the audit).
 *
 * Moves the 5 web economic-linkages files (ONE commit for the whole set
 * per the audit's Phase 3 rule, BD-M3 D1; NO engine move — engine
 * shared/connections.ts STAYS shared, the D1/R2 constraint), then
 * re-anchors every import edge against the FINAL locations (the M2→M10
 * method, HANDOFF "Operational notes"): never hand-count ../, use
 * path.relative.
 *
 * Landing shape (verified against the audit's Deliverable 1 rows + the
 * skeleton §"features/" + the M3→M10 precedents): all five FLAT into
 * apps/web/src/features/economic-linkages/ — the move spans TWO source
 * folders for the first time since M5: ONE file from routes/page-division/
 * (EconomicLinkagesPage.tsx) + FOUR from components/insights/ (Together.tsx,
 * ConnectionCard.tsx, connection-groups.ts, together-signals.test.ts).
 * NO named cluster in the set (page + strip + card + groups + test, all
 * top-tier). NO co-located vitest snapshot rides the set (verified: no
 * __snapshots__/ references together-signals.test — R6).
 *
 * INVENTORY VERIFICATION (the M7′/M8/M9/M10 lesson — the audit's counts
 * are approximate; the tree is the truth): the audit's Phase 3 item 9 row
 * says "5 web files" and its Deliverable 6 table says "5 web"; verified
 * against the tree at M11 session start: exactly 5 source files (the
 * M10-recorded set), ZERO co-located snapshots, and features/economic-
 * linkages/ holds only the M1 skeleton README.
 *
 * pd-s script: NONE exists for economic-linkages (the page carries 0
 * registry cards + 10 connection cards — the §20 toolkit never got a
 * linkages leg). Verified: apps/web/scripts/ has pd-s4/5/7/8/9/10/12/14/
 * 16/17/18/20 + build-world-map + generate-icons; NOTHING imports the
 * five moved files (scripts/check-bundle-budget.mjs mentions
 * Together/ConnectionCard in COMMENTS only — Phase 7's light header pass).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * gates — the BD-M4 D4 + BD-M5 D4 + BD-M7 sharpened set; all three
 * dynamic-import variants + the R8 fs-path forms checked over the moved
 * set):
 *   1. App.tsx:118 lazy `import('./routes/page-division/EconomicLinkagesPage')`
 *      (dynamic import() CALL — variant #1, BD-M4 D4). Verified the ONLY
 *      variant-#1 site pointing at a moved economic-linkages file (the
 *      M10 record: "App.tsx:118, the ONLY economic-linkages lazy site").
 *   2. + 3. The TWO Persian-copy manifest re-keys (BD-M5 D5, the M8
 *      BalanceScale entry-642 re-key-note pattern — this phase is NOT
 *      zero-re-key, unlike M9/M10: TWO manifest entries DO reference the
 *      moved paths, pre-verified BEFORE the move):
 *        - hardcoded.apps.web.src.components.insights.ConnectionCard.11735aab
 *          (id + source re-key — the "، " fa list-joiner glyph; the very
 *          entry the M8 BalanceScale re-key cited as its precedent)
 *        - technical.together.faListSeparator (source-only re-key — the
 *          semantic technical.* id stays; the "، " fa list separator)
 *      Both: text + sha256 UNCHANGED (the review basis preserved), note
 *      appended with the re-key record.
 *
 * R8 fs-path forms: ZERO in the whole M11 moved set (verified: no new URL/
 * join(__dirname/HERE/here)/readFileSync(join())/fileURLToPath and no
 * root-data/ *.json imports in any of the five files — the M10-simple
 * situation again, the second fully-R8-clean move in a row).
 *
 * Verified NO-OPs (grepped per moved file, the BD-M4 D4 lesson — left
 * untouched because depth-invariant / same-dir):
 *   - ALL '../../shared/…', '../../router', '../../components/…' imports
 *     of the moved web files: every importer moves BETWEEN two src-depth-2
 *     folders (routes/page-division/ → features/economic-linkages/ AND
 *     components/insights/ → features/economic-linkages/ — both pairs sit
 *     at src depth 2) — every src-rooted ../../ spec resolves identically
 *     from BOTH old and new locations (the M6→M10 depth-invariant
 *     pattern).
 *   - intra-set './' edge (Together → './ConnectionCard'): BOTH endpoints
 *     move into the SAME new directory — same-dir NO-OP.
 *   - package specifiers ('@currena/core', '@currena/insights',
 *     '@currena/insights/page-division', 'lucide-react', …) — untouched
 *     by design.
 *
 * Verified ABSENT on the moved set (grepped before gates):
 *   - NO variant #2 inline TYPE `import('...').X` refs pointing at moved
 *     files.
 *   - NO variant #3 CONSUMER dynamic `await import('...')` of a MOVED
 *     economic-linkages file (the full apps/web/src import( census: every
 *     other dynamic site points at non-moved files — markets-csv, fx-csv,
 *     insights-csv, ics, full-export, download, xlsx-writer, html2canvas,
 *     jspdf, AlertsDialog, DataExportPanel, PagePlaceholder, the route
 *     pages).
 *   - NO Vite `?raw` queries ON moved files — EXCEPT the ONE pre-gates
 *     finding: shared/config/round2.test.ts:71
 *     `import connectionCardSrc from '../../components/insights/
 *     ConnectionCard.tsx?raw'` — an edge the audit's Deliverable 1 rows
 *     did NOT list (they named Together.tsx as ConnectionCard's only
 *     importer). The BD-M7 pre-gates discipline caught it; the codemod
 *     re-anchors it like any other edge (the ?raw query rides along
 *     verbatim, the M10 query-split handling).
 *   - NO fs-path forms anywhere in the 5-file moved set.
 *
 * Cross-domain edges (documented, allowed — re-anchored by the codemod):
 *   - Together + connection-groups consumers (importers not moving,
 *     targets moving): features/australia/AustraliaPage.tsx (Together +
 *     AU_CONNECTION_IDS) + features/usa/UsaPage.tsx (Together +
 *     USA_CONNECTION_IDS) — both re-anchor
 *     '../../components/insights/…' → '../economic-linkages/…' (the
 *     documented mirror pattern: AU/USA render their onlyIds subsets, the
 *     connection-cards feature home is features/economic-linkages/).
 *   - DRIFT vs the audit's Deliverable 1 rows (recorded, never silently
 *     absorbed): routes/Insights.tsx — the N18 legacy super-consumer —
 *     does NOT import Together in the current tree (TM20 moved the
 *     together cards off /insights; the page renders none). The verified
 *     Together importer set is exactly: EconomicLinkagesPage (moving) +
 *     AustraliaPage + UsaPage. connection-groups: the same three.
 *   - The ?raw edge (round2.test.ts — shared/config, not moving).
 *   - N-pattern shortening (together-signals.test.ts → the gold
 *     BalanceScale borrower): '../../features/gold/signals/BalanceScale'
 *     SHORTENS to '../gold/signals/BalanceScale' (both endpoints now
 *     siblings under features/ — the M6→M10 N1/N11 lesson: the spec
 *     shortens, no rename; path.relative computes it, never hand-counted).
 *
 * NO exports-map edit this phase (verified: packages/insights/package.json
 * has NO entry touching any of the five files — they are all web files;
 * the 16 existing entries all point at engine paths).
 *
 * Persian-copy manifest (BD-M5 D5): TWO entries reference the moved paths
 * (pre-verified — see manual edits 2 + 3 above; the M11 prompt's "expect
 * ZERO re-keys" was written before this check and is DRIFT, recorded in
 * the session record; the M8 precedent applies: re-key, keep text+sha256,
 * append the note). copy:audit (gate 4) must be clean after.
 *
 * CHUNK-MERGER WATCH (BD-M5 D3, recorded BEFORE the move from the baseline
 * gates build — 80 chunks, entry index-CYK8tYdh, the M10 FULLY-FROZEN
 * surface): the linkages-relevant topology —
 *   - EconomicLinkagesPage-CifJGZO3.js (the route chunk; sha ed9dfe89…)
 *   - connection-groups-ihMctSM7.js — the MERGED chunk holding
 *     connection-groups + Together + ConnectionCard (the three modules
 *     Rollup merged into ONE shared chunk, keyed by the connection-groups
 *     basename; sha c359eb70…) — the chunk-merger watch's very subject:
 *     all three modules move TOGETHER into the same folder with NO
 *     renames, so the merged chunk's module set is unchanged.
 *   - connections-D3H0mH0r.js (the ENGINE shared/connections.ts — NOT
 *     moving, the constraint; sha 8998ca97…)
 *   - entry index-CYK8tYdh.js (sha deca57ff…)
 *   Expected per the M10 mechanism correction: the entry re-hashes ONLY
 *   if the moved page chunk's FILENAME changes; a byte-identical
 *   EconomicLinkagesPage chunk (the spec changes resolve to the same
 *   modules and spec text never survives bundling) means ZERO ripple.
 *   Record the honest outcome either way; close with the full-substitution
 *   rebasing test + the name-agnostic token-multiset proof (the M9
 *   sharpening); compare sw.js by entry-multiset, not raw sha (the M10
 *   precache-tail rotation finding).
 *
 * Usage:
 *   node scripts/m11-linkages-codemod.mjs          # apply (default)
 *   node scripts/m11-linkages-codemod.mjs --dry    # print the plan only
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
//    All 5 web files FLAT into features/economic-linkages/ — ONE from
//    routes/page-division/ + FOUR from components/insights/ (the first
//    two-source-folder move since M5). NO engine move (connections.ts
//    stays engine shared — the D1/R2 constraint).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';

const moves = [
  // --- the page (from routes/page-division/) ---
  [`${WEB}/routes/page-division/EconomicLinkagesPage.tsx`, `${WEB}/features/economic-linkages/EconomicLinkagesPage.tsx`],
  // --- the strip + card + groups + test (from components/insights/) ---
  [`${WEB}/components/insights/Together.tsx`, `${WEB}/features/economic-linkages/Together.tsx`],
  [`${WEB}/components/insights/ConnectionCard.tsx`, `${WEB}/features/economic-linkages/ConnectionCard.tsx`],
  [`${WEB}/components/insights/connection-groups.ts`, `${WEB}/features/economic-linkages/connection-groups.ts`],
  [`${WEB}/components/insights/together-signals.test.ts`, `${WEB}/features/economic-linkages/together-signals.test.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M10 codemod.)
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
 *  (The M2→M10 method: re-anchor EVERY relative edge of a moved importer,
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
//    (the dynamic import() CALL + the Persian-copy manifest re-keys).
//    Keyed by FINAL file path; applied as exact substring replacements.
//    M11 has THREE: App.tsx lazy route (variant #1) + the TWO manifest
//    re-keys (BD-M5 D5, the M8 entry-642 re-key-note pattern). ZERO R8
//    fixture traps this phase.
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edit 1: App.tsx lazy route (dynamic import() CALL — the
  //     regex gap, BD-M4 D4, variant #1; the ONLY economic-linkages
  //     variant-#1 site, verified by the pre-gates grep + the M10 record) ---
  {
    file: `${WEB}/App.tsx`,
    from: "import('./routes/page-division/EconomicLinkagesPage')",
    to: "import('./features/economic-linkages/EconomicLinkagesPage')",
  },
  // --- manual edit 2: Persian-copy manifest re-key #1 — the
  //     ConnectionCard "، " fa list-joiner (id + source re-key; text +
  //     sha256 unchanged; the M8 BalanceScale entry-642 re-key-note
  //     pattern — this very entry was that re-key's cited precedent) ---
  {
    file: 'docs/localization/persian-copy-manifest.json',
    from: '{"id":"hardcoded.apps.web.src.components.insights.ConnectionCard.11735aab","source":"apps/web/src/components/insights/ConnectionCard.tsx","status":"needs-review","kind":"copy","text":"، ","sha256":"11735aabd336e4357ca0bd0cbe5c3d26c1c721ca646bc33a5d99af46f3594d82","note":"v3 UI_SPEC 9/8 - owner should glance in the real UI"}',
    to: '{"id":"hardcoded.apps.web.src.features.economic-linkages.ConnectionCard.11735aab","source":"apps/web/src/features/economic-linkages/ConnectionCard.tsx","status":"needs-review","kind":"copy","text":"، ","sha256":"11735aabd336e4357ca0bd0cbe5c3d26c1c721ca646bc33a5d99af46f3594d82","note":"v3 UI_SPEC 9/8 - owner should glance in the real UI; re-keyed at features/economic-linkages after the M11 economic-linkages domain move (pure path move, text+hash unchanged)"}',
  },
  // --- manual edit 3: Persian-copy manifest re-key #2 — the Together fa
  //     list separator (source-only re-key; the semantic technical.* id
  //     stays; text + sha256 unchanged) ---
  {
    file: 'docs/localization/persian-copy-manifest.json',
    from: '{"id":"technical.together.faListSeparator","source":"apps/web/src/components/insights/Together.tsx","status":"processed","kind":"technical","text":"، ","sha256":"11735aabd336e4357ca0bd0cbe5c3d26c1c721ca646bc33a5d99af46f3594d82","reference":"persian_site_copy_round2.md (appendix: deliberate exclusions)","note":"fa list separator when joining summary counts, not copy"}',
    to: '{"id":"technical.together.faListSeparator","source":"apps/web/src/features/economic-linkages/Together.tsx","status":"processed","kind":"technical","text":"، ","sha256":"11735aabd336e4357ca0bd0cbe5c3d26c1c721ca646bc33a5d99af46f3594d82","reference":"persian_site_copy_round2.md (appendix: deliberate exclusions)","note":"fa list separator when joining summary counts, not copy; re-keyed at features/economic-linkages after the M11 economic-linkages domain move (pure path move, text+hash unchanged)"}',
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (5 web — 1 from routes/page-division/ + 4 from components/insights/; ZERO co-located snapshots; NO engine move — connections.ts stays shared)`);
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
  console.log("   ALL '../../shared/…' + '../../router' + '../../components/PageBreadcrumbs' imports of EconomicLinkagesPage (importer routes/page-division/ → features/economic-linkages/, BOTH at src depth 2)");
  console.log("   ALL '../../shared/…' imports of Together + ConnectionCard + together-signals.test (importer components/insights/ → features/economic-linkages/, BOTH at src depth 2)");
  console.log("   intra-set './' edge (Together → './ConnectionCard' — BOTH endpoints move into the SAME dir)");
  console.log("   package specifiers (@currena/core, @currena/insights, @currena/insights/page-division, lucide-react, …) — untouched by design");
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms over the moved set):');
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files; variant #3 CONSUMER dynamic await import() of a MOVED linkages file; fs-path forms ANYWHERE in the 5-file moved set (the M10-simple situation again)");
  console.log("   ?raw ON moved files: ONE pre-gates FINDING — shared/config/round2.test.ts:71 reads ConnectionCard.tsx?raw (an edge the audit's Deliverable 1 rows did NOT list; the BD-M7 discipline caught it) — re-anchored as a normal edge by this codemod");
  console.log('Cross-domain edges: Together + connection-groups consumers re-anchored (features/australia/AustraliaPage + features/usa/UsaPage → ../economic-linkages/…); DRIFT recorded — routes/Insights.tsx (N18) does NOT import Together in the current tree (TM20 moved the cards off /insights); the ?raw edge (round2.test.ts); N-pattern shortening together-signals.test → ../gold/signals/BalanceScale (the M6→M10 N1/N11 lesson).');
  console.log('Exports map: NO economic-linkages entries exist (verified — the 16 entries all point at engine paths; the five are web files) — NO edit this phase.');
  console.log('Persian-copy manifest: TWO entries reference the moved paths (ConnectionCard hardcoded.* id+source + Together technical.* source — the M8 BalanceScale precedent; the prompt\'s "expect ZERO re-keys" is DRIFT, recorded) — re-keyed by manual edits 2 + 3.');
  console.log('Chunk-merger watch (baseline recorded, 80 chunks, entry index-CYK8tYdh, the M10 FULLY-FROZEN surface): EconomicLinkagesPage-CifJGZO3 + connection-groups-ihMctSM7 (the MERGED Together+ConnectionCard+connection-groups chunk) + connections-D3H0mH0r (engine, NOT moving) + entry deca57ff…; per the M10 mechanism correction the entry re-hashes ONLY if the page chunk filename changes — record the honest outcome; close with the full-substitution rebasing test + the name-agnostic token-multiset proof; sw.js by entry-multiset.');
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

console.log('\nDONE — moves applied + import edges re-anchored + manual edits (App.tsx lazy + the 2 manifest re-keys) fixed.');
console.log('Next: broken-path grep, copy:audit (expect clean — the 2 re-keys land in this same commit), then gates.');
