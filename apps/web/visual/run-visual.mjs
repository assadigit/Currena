/**
 * run-visual.mjs — the visual-harness pipeline (PH1-VISUAL).
 *
 * Usage (via apps/web package.json scripts):
 *   pnpm --filter @currena/web run visual:test         # fixtures + U-tests (assumes dist)
 *   pnpm --filter @currena/web run visual:screenshots # fixtures + build-if-needed + screenshots
 *   pnpm --filter @currena/web exec node visual/run-visual.mjs all   # everything
 *
 * Pipeline:
 *   1. build the fixtures (visual/build-fixtures.ts via the tsx binary that
 *      ships with @currena/insights — plain node cannot import the
 *      workspace's TypeScript contracts),
 *   2. ensure apps/web/dist exists — `visual:test` refuses to run without a
 *      build (clear message); the screenshot/all modes build it (skipped when
 *      dist is newer than every src file, forced with --force-build),
 *   3. run Playwright, which starts visual/fixture-server.mjs itself
 *      (playwright.config.ts webServer) and tears it down again.
 *
 * Nothing here talks to the network beyond pnpm/playwright themselves: the
 * page under test is served from the local fixture snapshot only.
 */

/* Node globals for `pnpm lint` (no eslint languageOptions block covers this
 * directory; the shared flat config maps globals per-path — this task adds
 * no entries to the shared config). */
/* global console, process */

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, '..');
const REPO_ROOT = path.resolve(WEB_ROOT, '..');
const DIST_INDEX = path.join(WEB_ROOT, 'dist', 'index.html');
const TSX = path.join(REPO_ROOT, 'packages', 'insights', 'node_modules', '.bin', 'tsx');

const mode = process.argv[2] ?? 'all';
const forceBuild = process.argv.includes('--force-build');
if (!['test', 'screenshots', 'all'].includes(mode)) {
  console.error(`run-visual: unknown mode "${mode}" — use test | screenshots | all`);
  process.exit(2);
}

function run(cmd, args, opts = {}) {
  console.log(`$ ${cmd} ${args.join(' ')}`);
  const result = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
  if (result.status !== 0) {
    console.error(`run-visual: "${cmd} ${args.join(' ')}" exited with ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

/* 1. fixtures — the contract-checked snapshot suite. */
function buildFixtures() {
  if (existsSync(TSX)) {
    run(TSX, [path.join(HERE, 'build-fixtures.ts')], { cwd: REPO_ROOT });
    return;
  }
  // Fallback: pnpm's tsx through the insights package's own context.
  run('pnpm', ['--filter', '@currena/insights', 'exec', 'tsx', '../../apps/web/visual/build-fixtures.ts']);
}

/* 2. the SPA build — only when missing or stale. */
function newestMtime(dir, best = 0) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) best = Math.max(best, newestMtime(full, best));
    else if (st.mtimeMs > best) best = st.mtimeMs;
  }
  return best;
}

function ensureDist() {
  const missing = !existsSync(DIST_INDEX);
  const stale = !missing && !forceBuild && newestMtime(path.join(WEB_ROOT, 'src')) > statSync(DIST_INDEX).mtimeMs;
  if (missing || stale) {
    console.log(missing ? 'run-visual: dist missing — building the SPA' : 'run-visual: src changed — rebuilding the SPA');
    run('pnpm', ['--filter', '@currena/web', 'build'], { cwd: REPO_ROOT });
  } else {
    console.log('run-visual: dist is current — skipping the SPA build');
  }
}

/* 3. Playwright — it owns the fixture server via the config's webServer.
 * The two config projects pin each spec file exactly: `--project=chromium`
 * runs the U-suite only, `--project=screenshots` runs the captures. */
function runPlaywright(project) {
  const args = ['exec', 'playwright', 'test', '--config=visual/playwright.config.ts'];
  if (project) args.push('--project', project);
  run('pnpm', args, { cwd: WEB_ROOT });
}

buildFixtures();

if (mode === 'test') {
  if (!existsSync(DIST_INDEX)) {
    console.error(
      [
        'run-visual: apps/web/dist/index.html does not exist.',
        'The visual suite renders the BUILT SPA from the fixture server.',
        'Build it first:  pnpm --filter @currena/web build',
        '(or run:        pnpm --filter @currena/web run visual:screenshots — it builds when dist is missing)',
      ].join('\n'),
    );
    process.exit(1);
  }
  runPlaywright('chromium'); // the U-01..U-14 acceptance suite only
} else if (mode === 'screenshots') {
  ensureDist();
  runPlaywright('screenshots');
} else {
  ensureDist();
  runPlaywright(); // both projects: U-suite + the screenshot captures
}

console.log('run-visual: done.');
