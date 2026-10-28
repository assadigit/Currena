#!/usr/bin/env node
/**
 * gates.mjs — P5 of the Layer-2 prep (docs/insights/layer2/
 * INSIGHTS-L2-PREP-SPEC.md §7): ONE command that runs every gate, in
 * order, and prints a one-screen summary. Exit 0 = all green; exit 1 =
 * any failure (CI-red equivalence while GitHub Actions is down — see
 * docs/DEPLOY.md's "Repairing CI" note for the owner-side fix).
 *
 * The gates, in order (spec §7.1 + the Layer-1 discipline):
 *   1. typecheck        — pnpm -r run typecheck
 *   2. lint             — pnpm lint (0 errors, 0 warnings)
 *   3. copy:audit       — the Persian copy manifest audit (✓ clean)
 *   4. narrator vocab   — the generated Worker vocabulary drift check (P3)
 *   5. layer1 strict    — LAYER1_STRICT=1 vitest on layer1.test.ts
 *                         (the 7,809-assertion validator — its count must
 *                         not change silently)
 *   6. full suite       — pnpm -r run test (every package, never live)
 *   7. build + budget   — pnpm -r run build + check-bundle-budget.mjs
 *
 * Every step runs even when an earlier one fails (the summary shows the
 * complete picture; the exit code is non-zero on ANY failure).
 *
 * Usage: pnpm gates          (from the repo root)
 */

import { spawnSync } from 'node:child_process';

const START = Date.now();

/** One gate: id, label, command, env additions, and a key-number parser. */
const GATES = [
  {
    id: 'typecheck',
    label: 'typecheck',
    cmd: 'pnpm -r run typecheck',
    parse: (out) => {
      const done = (out.match(/typecheck: Done/g) || []).length;
      return done > 0 ? `${done} packages` : null;
    },
  },
  {
    id: 'lint',
    label: 'lint',
    cmd: 'pnpm lint',
    parse: () => '0 errors, 0 warnings',
  },
  {
    id: 'copy-audit',
    label: 'copy:audit',
    cmd: 'pnpm copy:audit',
    parse: (out) => {
      const clean = out.includes('✓ clean');
      if (!clean) return null;
      const entries = out.match(/manifest (\d[\d,]*) entr/);
      return entries !== null ? `clean (${entries[1]} fingerprints)` : 'clean';
    },
  },
  {
    id: 'narrator-vocabulary',
    label: 'narrator vocabulary',
    cmd: 'pnpm narrator:vocabulary:check',
    parse: (out) => {
      const m = out.match(/(\d+) indicators \+ (\d+) glossary terms × 2 languages/);
      return m !== null ? `in sync (${m[1]}×2 + ${m[2]}×2)` : null;
    },
  },
  {
    id: 'layer1-strict',
    label: 'layer1 strict validator',
    cmd: 'pnpm --filter @currena/web exec vitest run src/components/insights/layer1/layer1.test.ts',
    env: { LAYER1_STRICT: '1' },
    parse: (out) => {
      const m = out.match(/Tests\s+(\d[\d,]*) passed \((\d[\d,]*)\)/);
      return m !== null ? `${m[2]}/${m[2]} assertions` : null;
    },
  },
  {
    id: 'tests',
    label: 'full test suite',
    cmd: 'pnpm -r run test',
    parse: (out) => {
      // pnpm -r prefixes each suite's vitest footer with its own marker:
      // "packages/core test:       Tests  191 passed (191)".
      const suites = [];
      for (const line of out.split('\n')) {
        const m = line.match(/^(\S+) test:\s+Tests\s+(\d[\d,]*) passed/);
        if (m !== null) {
          suites.push([m[1].replace(/^packages\//, '').replace(/^apps\//, ''), m[2]]);
        }
      }
      if (suites.length === 0) return null;
      const total = suites.reduce((a, [, n]) => a + Number(n.replace(/,/g, '')), 0);
      return `${total.toLocaleString('en-US')} tests (${suites.map(([p, n]) => `${p} ${n}`).join(' · ')})`;
    },
  },
  {
    id: 'build-budget',
    label: 'build + bundle budget',
    cmd: 'pnpm -r run build && node scripts/check-bundle-budget.mjs',
    parse: (out) => {
      const lines = [...out.matchAll(/^✓ (.+?): \S+ — ([\d.]+) kB \/ ([\d.]+) kB gz/gm)].map(
        (m) => `${m[1].includes('entry') ? 'entry' : 'Insights lazy'} ${m[2]}/${m[3]}`,
      );
      if (lines.length === 0 || !out.includes('All bundle budgets held.')) return null;
      return lines.join(' · ');
    },
  },
];

function runGate(gate) {
  const began = Date.now();
  const res = spawnSync(gate.cmd, {
    shell: true,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    env: { ...process.env, ...(gate.env ?? {}) },
  });
  const out = `${res.stdout ?? ''}\n${res.stderr ?? ''}`;
  const keyNumber = gate.parse !== undefined ? gate.parse(out) : 'ok';
  const passed = res.status === 0 && keyNumber !== null;
  return {
    gate,
    passed,
    keyNumber,
    seconds: Math.round((Date.now() - began) / 1000),
    output: out,
  };
}

const results = [];
for (const gate of GATES) {
  process.stdout.write(`→ ${gate.label} ...\n`);
  const result = runGate(gate);
  results.push(result);
  process.stdout.write(
    result.passed ? `  ✓ ${gate.label} (${result.seconds}s)\n` : `  ✗ ${gate.label} FAILED (${result.seconds}s)\n`,
  );
}

/* ---- the one-screen summary ---- */
const totalSeconds = Math.round((Date.now() - START) / 1000);
const width = Math.max(...GATES.map((g) => g.label.length)) + 3;
const line = '─'.repeat(64);
console.log(`\n${line}`);
console.log(` CURRENA GATES — ${new Date().toISOString().slice(0, 19).replace('T', ' ')}`);
console.log(line);
results.forEach((r, i) => {
  const label = `${i + 1}. ${r.gate.label}`.padEnd(width, ' ');
  const mark = r.passed ? 'PASS' : 'FAIL';
  const detail = r.keyNumber ?? (r.passed ? 'ok' : 'see output below');
  console.log(` ${label} ${mark}  ${detail}`);
});
console.log(line);
const failed = results.filter((r) => !r.passed);
if (failed.length === 0) {
  console.log(` ALL GATES GREEN — ${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`);
  process.exit(0);
}
console.log(` ${failed.length} GATE(S) RED — ${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`);
for (const f of failed) {
  const tail = f.output.trimEnd().split('\n').slice(-30).join('\n');
  console.log(`\n── ${f.gate.label} — last 30 lines ──\n${tail}`);
}
process.exit(1);
