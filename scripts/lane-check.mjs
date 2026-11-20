#!/usr/bin/env node
/**
 * lane-check.mjs — territorial integrity for parallel lane sessions
 * (AGENTS.md §15 — the parallel lane protocol).
 *
 * The repo is modular by page: every folder under
 * apps/web/src/features/<domain>/ and apps/web/src/features-tools/<tool>/
 * is an independent territory a lane session may build in freely. This
 * script makes that boundary MECHANICAL: it classifies every file the
 * current session has changed (committed, staged, unstaged, untracked)
 * against the lane map and fails the moment the diff leaves the lane.
 *
 * The lane map (mirrors AGENTS.md §15.2 — keep the two in sync):
 *   page/tool lanes  auto-discovered from the features[-tools] folders:
 *                    territory = the features[-tools]/<name>/ tree plus
 *                    the docs/<name>-* program folders (e.g. the gold
 *                    lane owns docs/gold-redesign/)
 *   engine lane      the packages/ tree only
 *   backend lane     apps/api/ + apps/markets/
 *   integration      everything (works on main, not a lane branch)
 *   wiring           App.tsx · router.ts(+test) · lib/route-meta.ts(+test)
 *                    · shared/i18n/en.ts|fa.ts · the Persian copy manifest
 *                    · NEW files under apps/web/visual/ — allowed for any
 *                    lane, MUST be declared in the lane's session record
 *   session records  docs/sessions/ (incl. ACTIVE-LANES.md)
 *   everything else  the shared surface — integration sessions only.
 *
 * Usage:
 *   node scripts/lane-check.mjs                 inside a lane/<lane>-* branch
 *   node scripts/lane-check.mjs --gate          the gates.mjs form (n/a off-lane)
 *   node scripts/lane-check.mjs --lane gold     explicit lane id
 *   node scripts/lane-check.mjs --base main     non-default base (default origin/main)
 *   node scripts/lane-check.mjs --overlap      + intersect with other origin/lane/* branches
 *
 * Exit codes: 0 inside the lane map · 1 violations (or bad setup) ·
 * 2 usage errors. Dependency-free (node + git only) so a fresh worktree
 * can run it before `pnpm install`.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

/* ------------------------------------------------------------------ *
 * helpers
 * ------------------------------------------------------------------ */

function git(args) {
  const res = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (res.status !== 0) return null; // failure = null, whatever the caller does with it
  return (res.stdout ?? '').trim();
}

function fail(msg, code = 1) {
  console.error(`lane-check: ${msg}`);
  process.exit(code);
}

/* ------------------------------------------------------------------ *
 * the lane map (constants; PAGE_LANES is filled once the base ref is
 * known — every classifier below reads it)
 * ------------------------------------------------------------------ */

const SPECIAL_LANES = ['engine', 'backend', 'integration'];

/** The page/tool lane ids — auto-discovered after the base ref resolves. */
let PAGE_LANES = [];

/** The wiring surface — small append-style shared edits any lane may make. */
const WIRING = new Set([
  'apps/web/src/App.tsx',
  'apps/web/src/router.ts',
  'apps/web/src/router.test.ts',
  'apps/web/src/lib/route-meta.ts',
  'apps/web/src/lib/route-meta.test.ts',
  'apps/web/src/shared/i18n/en.ts',
  'apps/web/src/shared/i18n/fa.ts',
  'docs/localization/persian-copy-manifest.json',
]);

/** One classified path. kind: territory | wiring | session | violation. */
function classify(path, lane, existsAtBase) {
  // 1. Session bookkeeping — every lane's own records.
  if (path === 'docs/sessions' || path.startsWith('docs/sessions/')) {
    return { kind: 'session', owner: null };
  }
  // 2. Integration owns everything — no map to violate.
  if (lane === 'integration') return { kind: 'territory', owner: null };

  // 3. Engine / backend special territories.
  if (lane === 'engine' && (path === 'packages' || path.startsWith('packages/'))) {
    return { kind: 'territory', owner: null };
  }
  if (
    lane === 'backend' &&
    (path.startsWith('apps/api/') || path.startsWith('apps/markets/'))
  ) {
    return { kind: 'territory', owner: null };
  }

  // 4. Another lane's territory → the violation that matters most.
  const other = laneOwnerOf(path, lane);
  if (other !== null) {
    return { kind: 'violation', owner: other, reason: `lane ${other} (another lane's territory)` };
  }

  // 5. Wiring — append-style shared files a lane may touch but must declare.
  if (WIRING.has(path)) {
    return { kind: 'wiring', owner: 'wiring', reason: 'wiring — declare it in your session record' };
  }
  if (path.startsWith('apps/web/visual/')) {
    if (!existsAtBase(path)) {
      return { kind: 'wiring', owner: 'wiring', reason: 'new visual spec (append-only — existing harness files are integration)' };
    }
    return { kind: 'violation', owner: 'integration', reason: 'the shared visual harness (integration only — add a NEW spec file instead)' };
  }

  // 6. Page/tool lane territory: the feature folder + the program docs.
  if (isPageLane(lane)) {
    if (
      path === `apps/web/src/features/${lane}` ||
      path.startsWith(`apps/web/src/features/${lane}/`) ||
      path === `apps/web/src/features-tools/${lane}` ||
      path.startsWith(`apps/web/src/features-tools/${lane}/`)
    ) {
      return { kind: 'territory', owner: null };
    }
    if (path.startsWith('docs/')) {
      const seg = path.split('/')[1] ?? '';
      if (seg === lane || seg.startsWith(`${lane}-`) || seg.startsWith(`${lane}_`)) {
        return { kind: 'territory', owner: null };
      }
    }
  }

  // 7. Everything else is the shared surface.
  return { kind: 'violation', owner: 'integration', reason: 'the shared surface (integration sessions only — AGENTS.md §15.2)' };
}

/* ------------------------------------------------------------------ *
 * the lane map — discovery + ownership helpers
 * ------------------------------------------------------------------ */

/** Discover the page/tool lane ids from the feature folders (fs + base tree). */
function discoverPageLanes(baseRef) {
  const lanes = new Set();
  for (const root of ['apps/web/src/features', 'apps/web/src/features-tools']) {
    if (existsSync(root)) {
      for (const entry of readdirSync(root, { withFileTypes: true })) {
        if (entry.isDirectory()) lanes.add(entry.name);
      }
    }
    // Also from the base tree, so a lane that CREATES a new feature folder
    // self-identifies even before the folder exists in the worktree.
    const tree = git(['ls-tree', '--name-only', `${baseRef}:${root}/`]);
    if (tree !== null && tree !== '') {
      for (const line of tree.split('\n')) {
        const name = line.trim().replace(/\/$/, '');
        if (name !== '') lanes.add(name);
      }
    }
  }
  return [...lanes].filter((n) => /^[a-z0-9][a-z0-9-]*$/.test(n));
}

/** Which OTHER page lane owns this path (for violation attribution)? */
function laneOwnerOf(path, self) {
  for (const other of PAGE_LANES) {
    if (other === self) continue;
    if (
      path === `apps/web/src/features/${other}` ||
      path.startsWith(`apps/web/src/features/${other}/`) ||
      path === `apps/web/src/features-tools/${other}` ||
      path.startsWith(`apps/web/src/features-tools/${other}/`)
    ) {
      return other;
    }
    if (path.startsWith('docs/')) {
      const seg = path.split('/')[1] ?? '';
      if (seg === other || seg.startsWith(`${other}-`) || seg.startsWith(`${other}_`)) {
        return other;
      }
    }
  }
  return null;
}

function isPageLane(lane) {
  return PAGE_LANES.includes(lane);
}

/* ------------------------------------------------------------------ *
 * argument parsing
 * ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const opts = { gate: false, overlap: false, lane: null, base: null };
for (let i = 0; i < argv.length; i += 1) {
  const a = argv[i];
  if (a === '--gate') opts.gate = true;
  else if (a === '--overlap') opts.overlap = true;
  else if (a === '--lane') {
    opts.lane = argv[i + 1] ?? fail('--lane needs a value', 2);
    i += 1;
  } else if (a === '--base') {
    opts.base = argv[i + 1] ?? fail('--base needs a value', 2);
    i += 1;
  } else if (a === '-h' || a === '--help') {
    console.log('usage: node scripts/lane-check.mjs [--gate] [--overlap] [--lane <id>] [--base <ref>]');
    process.exit(0);
  } else fail(`unknown argument ${a} (see --help)`, 2);
}

/* ------------------------------------------------------------------ *
 * resolve base + lane
 * ------------------------------------------------------------------ */

const DEFAULT_BASE = 'origin/main';
let baseRef = opts.base ?? DEFAULT_BASE;
if (git(['rev-parse', '--verify', `${baseRef}^{commit}`]) === null) {
  baseRef = 'main'; // a fresh worktree without the origin ref
  if (git(['rev-parse', '--verify', `${baseRef}^{commit}`]) === null) {
    fail('no base ref — run `git fetch origin` first (or pass --base).', 2);
  }
}
const baseSha = git(['rev-parse', '--short', baseRef]);
const baseDate = git(['show', '-s', '--format=%cs', baseRef]) ?? '?';

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
if (branch === null) fail('not inside a git repository.');
if (branch === 'HEAD') fail('detached HEAD — check out a lane branch (AGENTS.md §15.1).', 2);

PAGE_LANES = discoverPageLanes(baseRef);

/** Longest lane-id prefix match: lane/asia-pacific-tiles → asia-pacific. */
function laneFromBranchName(b) {
  if (!b.startsWith('lane/')) return null;
  const slug = b.slice('lane/'.length).replace(/[/_.].*$/, '');
  const candidates = [...PAGE_LANES, ...SPECIAL_LANES]
    .filter((id) => slug === id || slug.startsWith(`${id}-`) || slug.startsWith(`${id}_`))
    .sort((a, c) => c.length - a.length);
  return candidates[0] ?? '?';
}

let lane = opts.lane;
let recognizedViaBranch = false;
if (lane === null) {
  lane = laneFromBranchName(branch);
  recognizedViaBranch = lane !== null;
  if (lane === '?') {
    const msg =
      `lane territory: UNRECOGNIZED lane branch "${branch}" — rename to lane/<page|tool|engine|backend>-<topic> per AGENTS.md §15.2, or pass --lane <id>`;
    if (opts.gate) {
      console.log(msg);
      process.exit(1);
    }
    fail(msg, 1);
  }
  if (lane === null) {
    if (opts.gate) {
      console.log(`lane territory: n/a — not a lane branch (${branch})`);
      process.exit(0);
    }
    fail(`not on a lane branch (you are on "${branch}") — pass --lane <id> or use --gate. Lane ids: ${[...PAGE_LANES, ...SPECIAL_LANES].join(' · ')}`, 2);
  }
}
if (![...PAGE_LANES, ...SPECIAL_LANES].includes(lane)) {
  const msg = `lane territory: unknown lane "${lane}" — the map is: ${[...PAGE_LANES, ...SPECIAL_LANES].join(' · ')}`;
  if (opts.gate) {
    console.log(msg);
    process.exit(1);
  }
  fail(msg, 2);
}

/* ------------------------------------------------------------------ *
 * collect every changed path (committed · staged · unstaged · untracked)
 * ------------------------------------------------------------------ */

const committed = git(['diff', '--name-only', `${baseRef}...HEAD`]) ?? '';
const staged = git(['diff', '--name-only', '--cached']) ?? '';
const unstaged = git(['diff', '--name-only']) ?? '';
const untracked = git(['ls-files', '--others', '--exclude-standard']) ?? '';

/** path → { committed, staged, unstaged, untracked } */
const paths = new Map();
function addPaths(list, state) {
  for (const line of list.split('\n')) {
    const p = line.trim();
    if (p === '') continue;
    if (!paths.has(p)) paths.set(p, {});
    paths.get(p)[state] = true;
  }
}
addPaths(committed, 'committed');
addPaths(staged, 'staged');
addPaths(unstaged, 'unstaged');
addPaths(untracked, 'untracked');

function existsAtBase(p) {
  return git(['cat-file', '-e', `${baseRef}:${p}`]) !== null;
}

/* ------------------------------------------------------------------ *
 * classify + report
 * ------------------------------------------------------------------ */

const results = [];
for (const [p] of paths) {
  results.push({ path: p, states: paths.get(p), ...classify(p, lane, () => existsAtBase(p)) });
}

const by = (kind) => results.filter((r) => r.kind === kind);
const territory = by('territory');
const wiring = by('wiring');
const session = by('session');
const violations = by('violation');

function rel(p) {
  return p
    .replace(/^apps\/web\/src\/features\//, 'features/')
    .replace(/^apps\/web\/src\/features-tools\//, 'features-tools/')
    .replace(/^docs\//, 'docs/');
}

function addCount(state) {
  return results.filter((r) => r.states[state]).length;
}

const report = [];
report.push('lane-check — territorial integrity (AGENTS.md §15)');
report.push(`lane:    ${lane}${recognizedViaBranch ? `  (branch ${branch})` : `  (--lane explicit, branch ${branch})`}`);
report.push(`base:    ${baseRef} @ ${baseSha} (${baseDate})`);
report.push(
  `files:   ${results.length} changed (committed ${addCount('committed')} · staged ${addCount('staged')} · unstaged ${addCount('unstaged')} · untracked ${addCount('untracked')})`,
);
report.push('');

if (results.length === 0) {
  report.push('  (no changes vs base yet — nothing to check)');
} else {
  if (territory.length > 0) {
    report.push(`  ✓ territory (${territory.length}): ${territory.map((r) => rel(r.path)).join(' · ')}`);
  }
  if (session.length > 0) {
    report.push(`  ✓ session records (${session.length}): ${session.map((r) => rel(r.path)).join(' · ')}`);
  }
  if (wiring.length > 0) {
    report.push(`  ⚠ wiring (${wiring.length}) — declare these in your session record:`);
    for (const r of wiring) report.push(`      ${r.path}  (${r.reason})`);
  }
  if (violations.length > 0) {
    report.push(`  ✗ violations (${violations.length}) — outside lane "${lane}":`);
    for (const r of violations) report.push(`      ${r.path}  → ${r.reason}`);
  }
}

/* ---- ACTIVE-LANES registry courtesy warning (fail-soft) ---- */
const activeLanesPath = 'docs/sessions/ACTIVE-LANES.md';
if (existsSync(activeLanesPath)) {
  try {
    const rows = readFileSync(activeLanesPath, 'utf8')
      .split('\n')
      .filter((l) => l.startsWith('| '))
      .map((l) => l.split('|').map((c) => c.trim()))
      .filter((cells) => cells.length >= 3 && !cells[1].startsWith('-') && cells[1] !== 'lane');
    const mine = rows.find((c) => c[1] === lane);
    if (mine === undefined) {
      report.push('');
      report.push(`  ⚠ lane "${lane}" is NOT registered in docs/sessions/ACTIVE-LANES.md — add your row (§15.1).`);
    } else if (mine[2] !== branch) {
      report.push('');
      report.push(`  ⚠ ACTIVE-LANES registers lane "${lane}" on branch ${mine[2]} — this branch is ${branch}. Two agents on one lane is forbidden (§15.5).`);
    }
  } catch {
    /* registry unreadable — courtesy only, never fatal */
  }
}

/* ---- overlap with other origin/lane/* branches (--overlap, fail-soft) ---- */
if (opts.overlap) {
  if (git(['fetch', 'origin', '+refs/heads/lane/*:refs/remotes/origin/lane/*']) !== null) {
    const remoteLanes = (git(['branch', '-r', '--format=%(refname:short)']) ?? '')
      .split('\n')
      .map((b) => b.trim())
      .filter((b) => b.startsWith('origin/lane/') && b !== `origin/${branch}`);
    const myPaths = new Set(results.map((r) => r.path));
    for (const other of remoteLanes) {
      const otherPaths = (git(['diff', '--name-only', `${baseRef}...${other}`]) ?? '')
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p !== '');
      const inter = otherPaths.filter((p) => myPaths.has(p));
      if (inter.length === 0) continue;
      const otherLane = laneFromBranchName(other.replace('origin/', ''));
      if (otherLane === lane) {
        report.push('');
        report.push(`  ✗ ${other} claims the SAME lane "${lane}" — two agents on one lane is forbidden (§15.5). Shared paths: ${inter.join(' · ')}`);
      } else {
        report.push('');
        report.push(`  ⚠ overlap with ${other} (lane ${otherLane ?? '?'}): ${inter.join(' · ')} — territory overlaps are errors; wiring overlaps are resolved at integration (§15.4).`);
      }
    }
  } else {
    report.push('');
    report.push('  (— overlap check skipped: git fetch failed or is offline)');
  }
}

/* ------------------------------------------------------------------ *
 * verdict
 * ------------------------------------------------------------------ */

const summary =
  violations.length === 0
    ? `lane territory: clean (${territory.length} territory · ${wiring.length} wiring · ${session.length} session) — lane ${lane} @ ${branch}`
    : `lane territory: VIOLATION — ${violations.length} path(s) outside lane ${lane} (run: node scripts/lane-check.mjs)`;

console.log(report.join('\n'));
console.log('');
console.log(
  violations.length === 0
    ? 'OK — inside the lane map. Declare the wiring files in your session record (§15.3).'
    : 'VIOLATIONS — fix before committing: move the change inside your lane, or hand it to an integration session (AGENTS.md §15.4).',
);
console.log(summary);

process.exit(violations.length === 0 ? 0 : 1);
