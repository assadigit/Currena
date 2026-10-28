#!/usr/bin/env node
/**
 * secret-scan.mjs — M2 of the Layer-2 narrator build (spec §10 + D-33):
 * the secret scan that guards the repo against ever committing a model
 * key (or any other credential). Runs as GATE 0 of `pnpm gates`, before
 * typecheck — a leaked key fails the build before anything else runs.
 *
 * What it scans: every GIT-TRACKED file that looks like text (source,
 * config, docs, env-style files). What it looks for:
 *   - the Google API key shape (AIza…) — the Gemini key's form
 *   - GitHub PATs (ghp_…, github_pat_…)
 *   - OpenAI-style keys (sk-…), AWS access keys (AKIA…), Slack tokens
 *   - the EODHD key shape (hex.hex — this repo's other live credential)
 *   - generic `api_key|secret|token|password = "…long…"` assignments
 *
 * It also verifies `.dev.vars` (and variants) + `.env` files are
 * git-ignored and none are tracked.
 *
 * Never printed: a matched value beyond its first characters + length
 * (the scan reports WHERE, never WHAT in full).
 *
 * Usage:  node scripts/secret-scan.mjs [--self-test]
 * Exit 0 = clean · 1 = a finding or an ignore-gap. `--self-test` runs the
 * pattern self-check (known positives + negatives) IN MEMORY — no fixture
 * file with fake keys exists in the repo by design.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

/* ------------------------------------------------------------------ *
 * The patterns
 * ------------------------------------------------------------------ */

const PATTERNS = [
  { name: 'google-api-key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'github-pat', re: /ghp_[A-Za-z0-9]{36}/g },
  { name: 'github-fine-grained-pat', re: /github_pat_[A-Za-z0-9_]{40,}/g },
  { name: 'openai-style-key', re: /\bsk-[A-Za-z0-9]{32,}\b/g },
  { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'slack-token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g },
  { name: 'eodhd-key', re: /\b[0-9a-f]{12,}\.[0-9a-f]{6,}\b/g },
  {
    // no leading \b on purpose: GEMINI_API_KEY must match too (the _ before
    // API kills a word boundary); the quoted-24+-char-value requirement is
    // what keeps this precise.
    name: 'credential-assignment',
    re: /(?:api[_-]?key|apikey|secret|token|password|passwd)[\s"']*[:=][\s"']*["']([A-Za-z0-9+/_.-]{24,})["']/gi,
  },
];

/**
 * Known-safe literal matches — deliberate TEST fixtures and documented
 * pattern shapes, never real values. Each entry names its file so the
 * allowlist stays auditable: a value lands here only because its source
 * line is visibly a test constant.
 */
const ALLOWED_VALUES = new Set([
  // The spec's own documented pattern shape, quoted as documentation:
  'AIza[0-9A-Za-z_-]{35}',
  // apps/api/src/contract.test.ts — the contract suite's fake password:
  'the-contract-test-password',
  // apps/api/src/insights-auth.test.ts — the auth suite's fake password
  // (the classic passphrase) + its fake session-token shape:
  'correct-horse-battery-staple',
  '9999999999999.deadbeef',
  // apps/api/src/routes/insights-mitigations.test.ts — fake fixtures:
  'mitigations-test-password',
  'mitigations-test-owner-token',
  // packages/insights/src/narrator/gemini-client.test.ts — the mocked
  // client's fake key (34 chars after AIza: deliberately NOT the real
  // 35-char shape, so only the assignment pattern sees it):
  'AIzaTestKeyNotReal00000000000000000000',
]);

/** Files never scanned (with the reason — kept honest and short). */
const SKIPPED_FILES = new Set([
  // integrity hashes are 100% base64 noise; no credential lives here
  'pnpm-lock.yaml',
  // the scanner itself: its pattern sources and its in-memory self-test
  // samples are fake by construction (a real key pasted into the scanner
  // would be caught by every OTHER run of the scan in review diffs)
  'scripts/secret-scan.mjs',
]);

/** Text-ish extensions worth scanning (everything else is skipped as binary). */
const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.mjs', '.cjs', '.jsx', '.json', '.jsonc', '.md', '.mdx',
  '.yml', '.yaml', '.toml', '.html', '.htm', '.css', '.scss', '.txt', '.sh',
  '.bash', '.zsh', '.env', '.vars', '.conf', '.ini', '.cfg', '.xml', '.svg',
  '.gitignore', '.dockerfile', '.prisma', '.sql', '.py', '.rb', '.go', '.rs',
]);
const TEXT_NAMES = new Set(['.dev.vars', '.dev.vars.local', '.env', '.env.local', 'dockerfile', 'caddyfile']);

function isTextFile(path) {
  const base = path.split('/').pop() ?? '';
  const lower = path.toLowerCase();
  if (lower.includes('.dev.vars') || lower.endsWith('.env') || lower.includes('.env.')) return true;
  if (TEXT_NAMES.has(base.toLowerCase())) return true;
  return TEXT_EXTENSIONS.has(extname(lower));
}

/* ------------------------------------------------------------------ *
 * The scan
 * ------------------------------------------------------------------ */

function trackedFiles() {
  const out = execFileSync('git', ['ls-files'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return out.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

/** Redact a finding: the first 6 characters + the length, nothing more. */
function redact(value) {
  return `${value.slice(0, 6)}…(${value.length} chars)`;
}

function scanAll() {
  const findings = [];
  for (const file of trackedFiles()) {
    if (SKIPPED_FILES.has(file) || !isTextFile(file)) continue;
    let content;
    try {
      content = readFileSync(file, 'utf8');
    } catch {
      continue; // unreadable (removed between ls-files and read) — skip
    }
    for (const { name, re } of PATTERNS) {
      for (const match of content.matchAll(re)) {
        // the allowlist matches the VALUE (the captured group when there is
        // one — the credential-assignment pattern captures it) or the whole
        // match for the shape patterns.
        if (ALLOWED_VALUES.has(match[0]) || (match[1] !== undefined && ALLOWED_VALUES.has(match[1]))) continue;
        const upto = content.slice(0, match.index);
        const line = upto.split('\n').length;
        findings.push({ file, line, name, value: redact(match[0]) });
      }
    }
  }
  return findings;
}

/** .dev.vars / .env must be git-ignored and never tracked. */
function ignoreGaps(tracked) {
  const gaps = [];
  const mustBeIgnored = ['.dev.vars', '.dev.vars.local', '.env', '.env.local'];
  for (const candidate of mustBeIgnored) {
    if (tracked.some((f) => f === candidate || f.endsWith(`/${candidate}`))) {
      gaps.push(`TRACKED env-style file: ${candidate}`);
    }
    let ignored = false;
    try {
      execFileSync('git', ['check-ignore', '--quiet', candidate]);
      ignored = true;
    } catch {
      // not ignored at the root — the nested check below decides
    }
    if (!ignored) {
      // the root patterns cover nested use via `.dev.vars*`; double-check an
      // apps/api path before reporting the gap
      try {
        execFileSync('git', ['check-ignore', '--quiet', `apps/api/${candidate}`]);
        ignored = true;
      } catch {
        // not ignored at either level — the gap stands
      }
    }
    if (!ignored) gaps.push(`NOT git-ignored: ${candidate} (apps/api/${candidate})`);
  }
  return gaps;
}

/* ------------------------------------------------------------------ *
 * The self-test (in memory — no fake-key fixture file exists, by design)
 * ------------------------------------------------------------------ */

function selfTest() {
  const positives = [ /* [expectedPatternName, sampleThatMustMatchIt] */
    ['google-api-key', 'AIzaSyA1234567890abcdefghijklmnopqrstuv'], // 35 chars after AIza
    ['github-pat', `ghp_${'a'.repeat(36)}`],
    ['github-fine-grained-pat', `github_pat_${'A'.repeat(41)}`],
    ['openai-style-key', `sk-${'b'.repeat(33)}`],
    ['aws-access-key', `AKIA${'1'.repeat(16)}`],
    ['slack-token', `xoxb-${'c1d2e3f4g5'.repeat(3)}`],
    ['eodhd-key', '1234567890ab.cdef1234'],
    ['credential-assignment', `api_key = "${'z'.repeat(30)}"`],
    ['credential-assignment', `GEMINI_API_KEY: "${'y'.repeat(35)}"`],
  ];
  const negatives = [
    'AIzaTOOSHORT',
    'the word skittles contains sk- but no key',
    'AKIA123',
    'api_key = ""',
    'token = "short"',
    'const apiKey = process.env.GEMINI_API_KEY;',
    'version 1.2.3 build 12345',
    'sha256: 90e43d226a7a724025c62071232a0a00a4eadf27ed68f80c2b801e21fe2c8554',
  ];
  const failures = [];
  const counts = { positives: positives.length, negatives: negatives.length };
  for (const [expectedName, sample] of positives) {
    const hit = PATTERNS.find(({ re }) => new RegExp(re.source, re.flags).test(sample));
    if (hit === undefined || hit.name !== expectedName) {
      failures.push(`positive not detected as ${expectedName}: ${redact(sample)}`);
    }
  }
  for (const sample of negatives) {
    const hit = PATTERNS.find(({ re }) => new RegExp(re.source, re.flags).test(sample));
    if (hit !== undefined) failures.push(`false positive (${hit.name}) on: ${sample.slice(0, 40)}`);
  }
  return { failures, counts };
}

/* ------------------------------------------------------------------ *
 * main
 * ------------------------------------------------------------------ */

const selfTestOnly = process.argv.includes('--self-test');

const { failures: selfFailures, counts: selfCounts } = selfTest();
if (selfFailures.length > 0) {
  console.error('✗ secret-scan self-test failed:');
  for (const f of selfFailures) console.error(`  - ${f}`);
  process.exit(1);
}
if (selfTestOnly) {
  console.log(`✓ secret-scan self-test passed (${PATTERNS.length} patterns, ${selfCounts.positives} positives + ${selfCounts.negatives} negatives)`);
  process.exit(0);
}

const tracked = trackedFiles();
const findings = scanAll();
const gaps = ignoreGaps(tracked);

if (findings.length === 0 && gaps.length === 0) {
  console.log(`✓ secret scan clean — ${PATTERNS.length} patterns over ${tracked.filter((f) => !SKIPPED_FILES.has(f) && isTextFile(f)).length} tracked text files; .dev.vars/.env ignored and untracked`);
  process.exit(0);
}

console.error(`✗ secret scan FAILED — ${findings.length} finding(s), ${gaps.length} ignore-gap(s)`);
for (const f of findings) {
  console.error(`  - ${f.file}:${f.line} [${f.name}] ${f.value}`);
}
for (const g of gaps) {
  console.error(`  - ${g}`);
}
console.error('Rotate the credential immediately if any finding is real, then remove it from the source.');
process.exit(1);
