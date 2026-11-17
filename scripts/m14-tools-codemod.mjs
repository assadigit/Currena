#!/usr/bin/env node
/**
 * M14 codemod — modularization Phase 5: the founding tools domain.
 *
 * Moves 49 LIVE web files (the 9 tool routes + the converter/settle/receipt
 * children + the tool components + the tool libs) from their founding homes
 * (routes/, routes/<sub>/, components/, components/led/, lib/) into
 * apps/web/src/features-tools/<9 tool domains>/ — PRESERVED subfolder
 * structure (the led/ subfolder kept within live-rates per the M13
 * currencies-fx-presentation/gold-signals/australia-au-markets convention;
 * the routes/converter, routes/settle, routes/receipt subfolders map 1:1
 * onto their same-named domains and flatten into the domain root —
 * path.relative computes every spec, never hand-counted ../).
 *
 * NO engine move — all 49 are web files (the audit's Deliverable 1
 * features-tools rows: 49, verified against the tree). NO renames (R5 —
 * the tool chunks are basename-keyed: Converter-*.js, LiveRates-*.js, …;
 * gate 8 doubles as the rename detector). ZERO co-located __snapshots__
 * (R6 — verified: none of the 7 tool .test files carry a __snapshots__
 * sibling). NO pd-s script (R9 — the tools are user-facing routes, not
 * §20 toolkit destinations; grep apps/web/scripts/ for importers of the
 * candidate moved files = NONE). NO exports-map entry (the 16 existing
 * entries all point at engine paths — all 49 moved files are web files).
 *
 * The move table → bidirectional re-anchoring via path.relative (the
 * M2→M13 method): every relative edge of a moved importer AND every edge
 * whose target moved is re-anchored against final locations. The
 * import/export-from regex catches static edges automatically. The MANUAL
 * EDITS catch the dynamic import() CALLS the regex cannot see (the BD-M4
 * D4 regex gap) + the Persian-copy manifest re-keys (BD-M5 D5).
 *
 * Same-commit manual edits the import regex CANNOT see (grepped before
 * the move — the BD-M7 sharpened three-variant dynamic-import discipline):
 *
 *   1. App.tsx lazy tool routes (variant #1 — the consumer-side lazy
 *      call; the regex gap). EIGHT sites:
 *        Calculator:34, History:35, BatchConverter:37, Splitter:39,
 *        Settle:40, Receipt:41, About:42, Converter:48.
 *      LiveRates:25 is EAGER (a static `import { LiveRates } from
 *      './routes/LiveRates'` — the regex catches it automatically, NOT
 *      a manual edit). Each lazy site is a unique spec, single replace.
 *
 *   2. Converter.tsx:79 dynamic `import('../components/AlertsDialog')`
 *      (variant #3 — the regex gap inside a MOVED file pointing at
 *      ANOTHER moved file). Converter MOVES to features-tools/converter/,
 *      AlertsDialog MOVES to features-tools/converter/ (same folder) →
 *      re-anchor to `./AlertsDialog`. THIS is the chunk-merger watch
 *      site: the dynamic import() spec string SURVIVES bundling → the
 *      Converter page chunk re-hashes (the M13 THIRD outcome shape, NOT
 *      the M10/M11 byte-identical shape).
 *
 *   3. Receipt.tsx:319 dynamic `import('../shared/lib/xlsx-writer')`
 *      (variant #3; xlsx-writer does NOT move, but Receipt MOVES +1
 *      depth routes/ → features-tools/receipt/ → LENGTHEN to
 *      `../../shared/lib/xlsx-writer`). ALSO a chunk-merger site — the
 *      Receipt chunk re-hashes (spec string survives bundling).
 *
 *   4-6. LiveRates.test.tsx, Receipt.test.tsx, Converter.test.tsx — the
 *      `import('../shared/lib/snapshot-store')` dynamic call (variant
 *      #3; snapshot-store does NOT move; each test MOVES +1 depth →
 *      LENGTHEN to `../../shared/lib/snapshot-store`). global replace,
 *      expectCount=2 per file (the typeof type-position occurrence +
 *      the await value-position occurrence — both carry the same spec
 *      substring `import('../shared/lib/snapshot-store')`). The
 *      `import('./LiveRates'|'./Receipt'|'./Converter')` same-dir
 *      occurrences are NO-OPs (both endpoints move into the SAME domain
 *      folder → `./X` stays `./X`). NO static `from '../shared/lib/
 *      snapshot-store'` exists in these tests (pre-verified — the global
 *      replace cannot double-apply).
 *
 *   NO Persian-copy manifest re-key this phase (the M11 two-re-key +
 *   M12 one-re-key + M13 one-re-key pattern BREAKS for M14 — ZERO).
 *   collectState().sweep = 206 hardcoded-Persian hits across 20 source
 *   files — ZERO tool-file hits (the fa chars in the LED boards
 *   (LedGoldBoard/LedRateBoard/LedParts) + AmountInput + the 3 tool
 *   test files are ALL in COMMENTS, which the AST sweep never visits;
 *   tests excluded by the /.test./ filter; the manifest's 8006 entries
 *   source the fa.ts + insights-copy-fa.ts dictionaries, NEVER the tool
 *   route/component files). copy:audit stays clean — NO edit.
 *
 * Verified NO-OPs (the reanchor function computes these; recorded so the
 * outcome is auditable):
 *   - intra-domain './' edges (Converter↔ConvertForm, ConvertForm↔shared,
 *     Settle↔GroupCard, Receipt↔SummaryPanel, …): BOTH endpoints move
 *     into the SAME domain folder → same-dir NO-OP.
 *   - components/led/LedParts ← LedGoldBoard/LedRateBoard: the led/
 *     subfolder is PRESERVED within live-rates, so `./led/LedParts` from
 *     the boards stays `./led/LedParts` (depth + relative structure
 *     invariant).
 *   - package specifiers (html2canvas, jspdf, @currena/*, lucide-react,
 *     vitest, …) — untouched by design.
 *
 * Chunk-merger watch (baseline dist topology recorded from the M13-close
 * gates build, 93 assets): EXPECT the entry chunk (index-*.js) + the
 * Converter chunk + the Receipt chunk to re-hash (the 8 App.tsx lazy
 * specs + Converter.tsx:79 AlertsDialog + Receipt.tsx:319 xlsx-writer
 * are dynamic import() strings that survive bundling and re-anchor).
 * The other 6 tool route chunks (About, BatchConverter, Calculator,
 * History, Settle, Splitter) + the history lib chunk have NO dynamic
 * import() re-anchoring → byte-identical → NO re-hash (the M10/M11
 * deep-route shape for those). LiveRates is EAGER (no chunk of its own —
 * it rides the entry; its static import re-anchor does NOT change entry
 * bytes). Close with the full-substitution rebasing test + the
 * name-agnostic token-multiset proof; the build is deterministic
 * (M13-verified).
 *
 * Usage:
 *   node scripts/m14-tools-codemod.mjs --dry    # print the plan only
 *   node scripts/m14-tools-codemod.mjs          # apply (git mv + rewrites)
 */

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DRY = process.argv.includes('--dry');

// ---------------------------------------------------------------------------
// 1. THE MOVE TABLE — old path → new path (repo-relative, no renames).
//    49 LIVE web files into features-tools/<9 domains>/ (PRESERVED led/
//    subfolder within live-rates; the routes/converter|settle|receipt
//    subfolders map 1:1 onto their same-named domains and flatten).
// ---------------------------------------------------------------------------
const WEB = 'apps/web/src';

const moves = [
  // --- about (1) ---
  [`${WEB}/routes/About.tsx`, `${WEB}/features-tools/about/About.tsx`],
  // --- batch (1) ---
  [`${WEB}/routes/BatchConverter.tsx`, `${WEB}/features-tools/batch/BatchConverter.tsx`],
  // --- calculator (1) ---
  [`${WEB}/routes/Calculator.tsx`, `${WEB}/features-tools/calculator/Calculator.tsx`],
  // --- splitter (1) ---
  [`${WEB}/routes/Splitter.tsx`, `${WEB}/features-tools/splitter/Splitter.tsx`],
  // --- history (3): lib/{history,history.test}.ts + routes/History.tsx ---
  [`${WEB}/lib/history.ts`, `${WEB}/features-tools/history/history.ts`],
  [`${WEB}/lib/history.test.ts`, `${WEB}/features-tools/history/history.test.ts`],
  [`${WEB}/routes/History.tsx`, `${WEB}/features-tools/history/History.tsx`],
  // --- converter (17): 6 components + 2 lib + 2 routes + 7 routes/converter ---
  [`${WEB}/components/AlertsDialog.tsx`, `${WEB}/features-tools/converter/AlertsDialog.tsx`],
  [`${WEB}/components/AmountInput.tsx`, `${WEB}/features-tools/converter/AmountInput.tsx`],
  [`${WEB}/components/LiveRateLine.tsx`, `${WEB}/features-tools/converter/LiveRateLine.tsx`],
  [`${WEB}/components/Odometer.tsx`, `${WEB}/features-tools/converter/Odometer.tsx`],
  [`${WEB}/components/RateDeltaChip.tsx`, `${WEB}/features-tools/converter/RateDeltaChip.tsx`],
  [`${WEB}/components/ResultPopup.tsx`, `${WEB}/features-tools/converter/ResultPopup.tsx`],
  [`${WEB}/lib/recent-pairs.ts`, `${WEB}/features-tools/converter/recent-pairs.ts`],
  [`${WEB}/lib/recent-pairs.test.ts`, `${WEB}/features-tools/converter/recent-pairs.test.ts`],
  [`${WEB}/routes/Converter.tsx`, `${WEB}/features-tools/converter/Converter.tsx`],
  [`${WEB}/routes/Converter.test.tsx`, `${WEB}/features-tools/converter/Converter.test.tsx`],
  [`${WEB}/routes/converter/AlertsSectionRow.tsx`, `${WEB}/features-tools/converter/AlertsSectionRow.tsx`],
  [`${WEB}/routes/converter/ConvertForm.tsx`, `${WEB}/features-tools/converter/ConvertForm.tsx`],
  [`${WEB}/routes/converter/FailureCard.tsx`, `${WEB}/features-tools/converter/FailureCard.tsx`],
  [`${WEB}/routes/converter/PairChips.tsx`, `${WEB}/features-tools/converter/PairChips.tsx`],
  [`${WEB}/routes/converter/QuickTools.tsx`, `${WEB}/features-tools/converter/QuickTools.tsx`],
  [`${WEB}/routes/converter/RetryCountdown.tsx`, `${WEB}/features-tools/converter/RetryCountdown.tsx`],
  [`${WEB}/routes/converter/shared.ts`, `${WEB}/features-tools/converter/shared.ts`],
  // --- live-rates (5): 2 components top-level + 1 components/led/ (PRESERVED led/) + 2 routes ---
  [`${WEB}/components/LedGoldBoard.tsx`, `${WEB}/features-tools/live-rates/LedGoldBoard.tsx`],
  [`${WEB}/components/LedRateBoard.tsx`, `${WEB}/features-tools/live-rates/LedRateBoard.tsx`],
  [`${WEB}/components/led/LedParts.tsx`, `${WEB}/features-tools/live-rates/led/LedParts.tsx`],
  [`${WEB}/routes/LiveRates.tsx`, `${WEB}/features-tools/live-rates/LiveRates.tsx`],
  [`${WEB}/routes/LiveRates.test.tsx`, `${WEB}/features-tools/live-rates/LiveRates.test.tsx`],
  // --- receipt (7): 2 routes + 5 routes/receipt (flatten into receipt domain) ---
  [`${WEB}/routes/Receipt.tsx`, `${WEB}/features-tools/receipt/Receipt.tsx`],
  [`${WEB}/routes/Receipt.test.tsx`, `${WEB}/features-tools/receipt/Receipt.test.tsx`],
  [`${WEB}/routes/receipt/ExpenseItemRow.tsx`, `${WEB}/features-tools/receipt/ExpenseItemRow.tsx`],
  [`${WEB}/routes/receipt/OptionsPanel.tsx`, `${WEB}/features-tools/receipt/OptionsPanel.tsx`],
  [`${WEB}/routes/receipt/ReceiptModal.tsx`, `${WEB}/features-tools/receipt/ReceiptModal.tsx`],
  [`${WEB}/routes/receipt/SummaryPanel.tsx`, `${WEB}/features-tools/receipt/SummaryPanel.tsx`],
  [`${WEB}/routes/receipt/shared.ts`, `${WEB}/features-tools/receipt/shared.ts`],
  // --- settle (13): 3 lib + 2 routes + 8 routes/settle (flatten into settle domain) ---
  [`${WEB}/lib/photo-store.ts`, `${WEB}/features-tools/settle/photo-store.ts`],
  [`${WEB}/lib/settle-storage.ts`, `${WEB}/features-tools/settle/settle-storage.ts`],
  [`${WEB}/lib/settle-storage.test.ts`, `${WEB}/features-tools/settle/settle-storage.test.ts`],
  [`${WEB}/routes/Settle.tsx`, `${WEB}/features-tools/settle/Settle.tsx`],
  [`${WEB}/routes/Settle.test.tsx`, `${WEB}/features-tools/settle/Settle.test.tsx`],
  [`${WEB}/routes/settle/AddExpenseModal.tsx`, `${WEB}/features-tools/settle/AddExpenseModal.tsx`],
  [`${WEB}/routes/settle/CreateGroupModal.tsx`, `${WEB}/features-tools/settle/CreateGroupModal.tsx`],
  [`${WEB}/routes/settle/ExpensePhoto.tsx`, `${WEB}/features-tools/settle/ExpensePhoto.tsx`],
  [`${WEB}/routes/settle/GroupCard.tsx`, `${WEB}/features-tools/settle/GroupCard.tsx`],
  [`${WEB}/routes/settle/GroupDetail.tsx`, `${WEB}/features-tools/settle/GroupDetail.tsx`],
  [`${WEB}/routes/settle/GroupTabs.tsx`, `${WEB}/features-tools/settle/GroupTabs.tsx`],
  [`${WEB}/routes/settle/Modal.tsx`, `${WEB}/features-tools/settle/Modal.tsx`],
  [`${WEB}/routes/settle/shared.ts`, `${WEB}/features-tools/settle/shared.ts`],
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
//    from any importer (moved or not). (Identical to the M3–M13 codemod.)
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
 *  (The M2→M13 method: re-anchor EVERY relative edge of a moved importer,
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
//    M14 has THIRTEEN: App.tsx 8 lazy tool routes (variant #1) +
//    Converter.tsx:79 AlertsDialog (variant #3, chunk-merger site) +
//    Receipt.tsx:319 xlsx-writer (variant #3, chunk-merger site) +
//    3 test files × snapshot-store global×2 (variant #3). ZERO Persian-
//    copy manifest re-keys (the M11+M12+M13 NON-zero pattern BREAKS for
//    M14 — the fa chars in tool files are all comments; the manifest
//    sources the dictionaries, never the tool files; copy:audit stays
//    clean — verified by collectState().sweep = 0 tool-file hits).
// ---------------------------------------------------------------------------
const manualEdits = [
  // --- manual edits 1–8: App.tsx lazy tool routes (variant #1 — the
  //     consumer-side dynamic import() CALL; the regex gap, BD-M4 D4).
  //     LiveRates (:25) is EAGER (static import — regex-caught, NOT here). ---
  { file: `${WEB}/App.tsx`, from: "import('./routes/Calculator')", to: "import('./features-tools/calculator/Calculator')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/History')", to: "import('./features-tools/history/History')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/BatchConverter')", to: "import('./features-tools/batch/BatchConverter')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/Splitter')", to: "import('./features-tools/splitter/Splitter')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/Settle')", to: "import('./features-tools/settle/Settle')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/Receipt')", to: "import('./features-tools/receipt/Receipt')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/About')", to: "import('./features-tools/about/About')" },
  { file: `${WEB}/App.tsx`, from: "import('./routes/Converter')", to: "import('./features-tools/converter/Converter')" },
  // --- manual edit 9: Converter.tsx:79 dynamic AlertsDialog (variant #3;
  //     AlertsDialog MOVES to features-tools/converter/ (same folder as
  //     Converter) → re-anchor '../components/AlertsDialog' → './AlertsDialog'.
  //     THE chunk-merger site — the spec string survives bundling → the
  //     Converter page chunk re-hashes (M13 THIRD outcome shape). ---
  {
    file: `${WEB}/features-tools/converter/Converter.tsx`,
    from: "import('../components/AlertsDialog')",
    to: "import('./AlertsDialog')",
  },
  // --- manual edit 10: Receipt.tsx:319 dynamic xlsx-writer (variant #3;
  //     xlsx-writer does NOT move; Receipt MOVES +1 depth routes/ →
  //     features-tools/receipt/ → LENGTHEN to ../../shared/lib/xlsx-writer.
  //     Chunk-merger site — Receipt chunk re-hashes. ---
  {
    file: `${WEB}/features-tools/receipt/Receipt.tsx`,
    from: "import('../shared/lib/xlsx-writer')",
    to: "import('../../shared/lib/xlsx-writer')",
  },
  // --- manual edit 11: LiveRates.test.tsx dynamic snapshot-store (variant
  //     #3; ×2 occurrences — the typeof type-position :108 + the await
  //     value-position :110; snapshot-store does NOT move; test MOVES +1
  //     depth → ../../shared/lib/snapshot-store). global replace,
  //     expectCount=2. NO static `from` exists (pre-verified). The
  //     `import('./LiveRates')` same-dir occurrences (:107,:111) are
  //     NO-OPs — not in this edit. ---
  {
    file: `${WEB}/features-tools/live-rates/LiveRates.test.tsx`,
    from: "import('../shared/lib/snapshot-store')",
    to: "import('../../shared/lib/snapshot-store')",
    global: true,
    expectCount: 2,
  },
  // --- manual edit 12: Receipt.test.tsx dynamic snapshot-store (variant
  //     #3; ×2 — typeof :110 + await :112; same +1-depth lengthen). ---
  {
    file: `${WEB}/features-tools/receipt/Receipt.test.tsx`,
    from: "import('../shared/lib/snapshot-store')",
    to: "import('../../shared/lib/snapshot-store')",
    global: true,
    expectCount: 2,
  },
  // --- manual edit 13: Converter.test.tsx dynamic snapshot-store (variant
  //     #3; ×2 — typeof :114 + await :116; same +1-depth lengthen). ---
  {
    file: `${WEB}/features-tools/converter/Converter.test.tsx`,
    from: "import('../shared/lib/snapshot-store')",
    to: "import('../../shared/lib/snapshot-store')",
    global: true,
    expectCount: 2,
  },
];

// ---------------------------------------------------------------------------
// 6. Print the plan (always) and apply unless --dry.
// ---------------------------------------------------------------------------
console.log(`Moves: ${moves.length} files (49 web — about 1 + batch 1 + calculator 1 + splitter 1 + history 3 + converter 17 + live-rates 5 + receipt 7 + settle 13; ZERO co-located snapshots; NO engine move — all 49 are web files; PRESERVED led/ subfolder within live-rates)`);
console.log(`Import edges to rewrite (regex-caught static): ${edgeCount}`);
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
  const tag = me.global ? ` (global×${me.expectCount})` : '';
  console.log(`   ${me.file}:${tag}  ${me.from.slice(0, 70)}…  →  ${me.to.slice(0, 70)}…`);
}

if (DRY) {
  console.log('\n(dry run — nothing applied)');
  console.log('Verified NO-OPs (untouched, depth-invariant / same-dir):');
  console.log("   intra-domain './' edges (Converter↔ConvertForm, ConvertForm↔shared, Settle↔GroupCard, Receipt↔SummaryPanel, …): BOTH endpoints move into the SAME domain folder — same-dir NO-OP.");
  console.log("   components/led/LedParts ← LedGoldBoard/LedRateBoard: the led/ subfolder PRESERVED within live-rates → './led/LedParts' from the boards stays './led/LedParts' (relative structure invariant).");
  console.log("   App.tsx:25 LiveRates EAGER static import — regex-caught (NOT a manual edit); re-anchors './routes/LiveRates' → './features-tools/live-rates/LiveRates' automatically.");
  console.log("   test-file './LiveRates'|'./Receipt'|'./Converter'|'./Settle' dynamic same-dir occurrences — NO-OP (both endpoints in the SAME domain folder).");
  console.log("   Settle.test.tsx — ONLY './Settle' same-dir dynamic imports (NO snapshot-store edge) — zero manual edits.");
  console.log("   ResultPopup.tsx:190 import('html2canvas') + Receipt.tsx:218/286 html2canvas/jspdf — PACKAGE specifiers, untouched by design.");
  console.log('Verified ABSENT (pre-gates grep, all three variants + R8 forms + ?raw over the moved set):');
  console.log("   ?raw ON any moved file (ZERO across all 49); new URL(spec, import.meta.url) / __dirname / readFileSync(join()) / fileURLToPath ON any moved file (ZERO — the earlier 'here/there' hits were comment prose).");
  console.log("   variant #2 inline TYPE import('...').X pointing at moved files from NON-moved consumers (NONE outside App.tsx's 8 lazy sites); pd-s scripts importing tool files (NONE — tools are user-facing routes).");
  console.log('Exports map: NO tools entries exist (verified — the 16 entries all point at engine paths; all 49 moved files are web files) — NO edit this phase.');
  console.log('Persian-copy manifest: ZERO entries reference the moved paths (collectState().sweep = 206 hits across 20 source files — ZERO tool-file hits; the fa chars in LED boards/AmountInput/tests are ALL comments; the manifest sources fa.ts + insights-copy-fa.ts, never the tool files) — NO re-key this phase (the M11+M12+M13 NON-zero pattern BREAKS for M14; matches the M9-asia ZERO precedent — every phase re-verifies).');
  console.log('Chunk-merger watch (baseline recorded from the M13-close gates build, 93 assets): EXPECT the entry chunk (index-*.js) + the Converter chunk + the Receipt chunk to re-hash (the 8 App.tsx lazy specs + Converter.tsx:79 AlertsDialog + Receipt.tsx:319 xlsx-writer are dynamic import() strings that survive bundling and re-anchor — the M13 THIRD outcome shape). The other 6 tool route chunks (About, BatchConverter, Calculator, History, Settle, Splitter) + the history lib chunk have NO dynamic import() re-anchoring → byte-identical → NO re-hash (the M10/M11 deep-route shape for those). LiveRates is EAGER (rides the entry; its static import re-anchor does NOT change entry bytes). Close with the full-substitution rebasing test + the name-agnostic token-multiset proof; sw.js by entry-multiset.');
  process.exit(0);
}

// --- apply the moves with git mv (history preserved) ---
for (const [from, to] of moves) {
  const toAbs = path.join(ROOT, to);
  fs.mkdirSync(path.dirname(toAbs), { recursive: true });
  execSync(`git mv -- "${from}" "${to}"`, { cwd: ROOT, stdio: 'pipe' });
}

// --- apply the import rewrites (static, regex-caught) ---
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

// --- apply the manual edits (dynamic import() calls; ZERO manifest re-keys) ---
for (const me of manualEdits) {
  const abs = path.join(ROOT, me.file);
  let text = fs.readFileSync(abs, 'utf8');
  if (!text.includes(me.from)) {
    console.error(`  MANUAL MISS in ${me.file}: ${me.from.slice(0, 100)}…`);
    process.exit(1);
  }
  if (me.global) {
    // count occurrences to guard against an unexpected extra site
    const occurrences = text.split(me.from).length - 1;
    if (occurrences !== me.expectCount) {
      console.error(`  MANUAL COUNT MISMATCH in ${me.file}: expected ${me.expectCount} of ${me.from.slice(0, 60)}…, found ${occurrences}`);
      process.exit(1);
    }
    text = text.split(me.from).join(me.to);
  } else {
    text = text.replace(me.from, me.to);
  }
  fs.writeFileSync(abs, text);
}

console.log('\nDONE — 49 moves applied + import edges re-anchored + 13 manual edits (App.tsx 8 lazy + Converter.tsx:79 AlertsDialog + Receipt.tsx:319 xlsx-writer + 3 tests × snapshot-store×2) fixed.');
console.log('Next: broken-path grep, copy:audit (expect clean — ZERO re-keys this phase), then gates.');
