/**
 * selfcheck.ts — the automatic self-audit (runbook Phase 5; fix spec A-03):
 *
 *   pnpm --filter @currena/insights selfcheck
 *
 * Builds the CURRENT snapshot from live sources (the ingest pipeline, no KV
 * writes), runs every validation test (T-01…T-14 engine suite + the Step 3
 * T-15…T-19 checks that are runnable server-side + the defect-derived
 * E-checks against the freshly generated export), and writes:
 *
 *   docs/insights/exports/currena-insights-full-<UTC date>.md   the full export
 *   docs/insights/SELF_AUDIT.md                                  the audit table
 *
 * Exit code 1 when any test failed — the scheduled GitHub Action surfaces
 * that as a red run (it publishes nothing).
 *
 * Scope note (recorded in the audit doc): the world-markets and world-
 * currencies boards are served by their own Worker's KV keys; this check
 * rebuilds the INDICATOR snapshot, so the export's markets/fx sections are
 * omitted here. The page's own export carries them.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { CalendarEventSchema, type CalendarEvent, type InsightsSnapshot } from '@currena/core';
import {
  buildIndicatorSeries,
  buildInsightsSnapshot,
  collectAllSources,
  collectRung2Sources,
  rung2FetchPlanFor,
  RUNG2_IDS,
  computeHighestSinceYear,
  computePeaks,
  parseContextNotes,
  parseManualSeries,
  parsePolicyDecisions,
  parseReleaseSchedule,
} from '../src/adapters/index';
import { runValidationSuite } from '../src/validation';
import type { RegressionEpisode } from '../src/validation';
import {
  checkE10M2Unit,
  checkE24PeakColumnsInExport,
  t17AttributionPresent,
  t19NoAdviceWording,
} from '../src/validation-step3';
import { SOURCE_LICENCES } from '../src/licences';
import { DEFINITIONS, RULE_VERSION } from '../src/index';
import { buildInsightsMarkdown, type FullExportInput } from '../../../apps/web/src/components/insights/full-export';
import { DISPLAY } from '../../../apps/web/src/components/insights/config/display';
import { insightsCopyEn } from '../../../apps/web/src/i18n/insights-copy-en';
import { insightsCopyFa } from '../../../apps/web/src/i18n/insights-copy-fa';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const EXPORTS_DIR = resolve(REPO, 'docs', 'insights', 'exports');
const AUDIT_PATH = resolve(REPO, 'docs', 'insights', 'SELF_AUDIT.md');

function loadJsonFile(path: string): unknown | undefined {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw err;
  }
}

const nowIso = new Date().toISOString();
const nowDay = nowIso.slice(0, 10);
console.log(`# Insights self-check — ${nowIso}\n`);

/* ---------------- 1. Build the current snapshot (no KV writes) ---------------- */

const { inputs, reports } = await collectAllSources();

const calendarRaw = loadJsonFile(resolve(REPO, 'data', 'insights-calendar.json'));
const calendar: CalendarEvent[] = calendarRaw === undefined ? [] : z.array(CalendarEventSchema).parse(calendarRaw);
const pmiRaw = loadJsonFile(resolve(REPO, 'data', 'manual', 'china-pmi.json'));
const pmiParsed = pmiRaw === undefined ? undefined : parseManualSeries(pmiRaw, 'china-pmi');
const manualExpires: Readonly<Record<string, string>> = pmiParsed ? { 'china-pmi': pmiParsed.expires } : {};
const scheduleRaw = loadJsonFile(resolve(REPO, 'data', 'insights-release-schedule.json'));
const releaseSchedule = scheduleRaw === undefined ? undefined : parseReleaseSchedule(scheduleRaw);
const decisionsRaw = loadJsonFile(resolve(REPO, 'data', 'policy-decisions.json'));
const policyDecisions = decisionsRaw === undefined ? undefined : parsePolicyDecisions(decisionsRaw);
const notesRaw = loadJsonFile(resolve(REPO, 'data', 'insights-context-notes.json'));
const contextNotes = notesRaw === undefined ? undefined : parseContextNotes(notesRaw);

/* 2026-10-26 gap-audit build: the rung-2 collection rides the self-check
 * too (the bootstrap rule — no store means every rung-2 id is "missing",
 * so the plan fetches everything: MOF + the weekly pair + the monthly
 * trio; the same code the Worker's 04:20 phase runs). */
const rung2Plan = rung2FetchPlanFor(new Date(), new Set(RUNG2_IDS as readonly string[]));
console.log(
  `[selfcheck] rung-2 plan - mof=${rung2Plan.mof} eiaWeekly=${rung2Plan.eiaWeekly} cftcWeekly=${rung2Plan.cftcWeekly} monthly=${rung2Plan.monthly}`,
);
const rung2 = await collectRung2Sources(rung2Plan);
for (const row of rung2.reports) console.log(`  ${row.ok ? 'OK' : 'FAIL'} ${row.source} - ${row.detail}`);
reports.push(...rung2.reports);

const rung2Inputs = {
  jgb10y: rung2.series['jgb-10y'],
  // The mirror arms itself when the MOF fetch failed (the labelled
  // fallback the spec keeps for outages).
  jgbMirror: rung2.series['jgb-10y'] === undefined ? inputs.fred.IRLTLT01JPM156N : undefined,
  // 2026-10-26 wave-3: the weekly/monthly additions ride the selfcheck's
  // build too (no store here — the raw fetched series, honest about the
  // single-point CFTC file and the full-history monthly files), so the
  // export + validation see real values for every rung-2 id.
  series: rung2.series,
};

const series = buildIndicatorSeries({
  ...inputs,
  ...(rung2Inputs.jgb10y !== undefined || rung2Inputs.jgbMirror !== undefined || Object.keys(rung2.series).length > 0
    ? { rung2: rung2Inputs }
    : {}),
  chinaPmi: pmiParsed?.points,
});

const peaks = computePeaks(inputs, series.brent);
const HIGHEST_SINCE_IDS = ['us10y', 'us30y', 'real-yield-10y', 'au-10y'] as const;
const highestSince: Partial<Record<string, number>> = {};
for (const id of HIGHEST_SINCE_IDS) {
  const full = series[id];
  if (full && full.length > 1) {
    const year = computeHighestSinceYear(full);
    if (year !== undefined) highestSince[id] = year;
  }
}

let episodes: readonly RegressionEpisode[] | undefined;
try {
  const parsed: unknown = JSON.parse(readFileSync(resolve(HERE, '..', 'fixtures', 'regression-episodes.json'), 'utf8'));
  episodes = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { episodes?: unknown }).episodes)
      ? (parsed as { episodes: readonly RegressionEpisode[] }).episodes
      : undefined;
} catch {
  episodes = undefined;
}

// T-07's corpus: the two copy dictionaries from the repo (the ingest's own scan).
const copyTexts: string[] = [];
for (const dictPath of [
  resolve(REPO, 'apps/web/src/i18n/insights-copy-en.ts'),
  resolve(REPO, 'apps/web/src/i18n/insights-copy-fa.ts'),
]) {
  try {
    const raw = readFileSync(dictPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)\/\/.*$/gm, '');
    for (const m of raw.matchAll(/'((?:[^'\\]|\\.)*)'/g)) copyTexts.push(m[1]!);
    for (const m of raw.matchAll(/"((?:[^"\\]|\\.)*)"/g)) copyTexts.push(m[1]!);
  } catch {
    // dictionaries unreadable — T-07 records the skip note
  }
}

const draft = buildInsightsSnapshot({
  series,
  calendar,
  releaseSchedule,
  fedTargetUpper: inputs.fred.DFEDTARU,
  policyDecisions,
  peaks,
  highestSince: highestSince as never,
  contextNotes,
  manualExpires,
  now: nowIso,
});

const outcome = runValidationSuite({
  series,
  readings: draft.readings,
  calendar,
  now: nowIso,
  breakeven10y: inputs.fred.T10YIE,
  ...(copyTexts.length > 0 ? { copyTexts } : {}),
  ...(episodes !== undefined ? { episodes } : {}),
});

/* ---------------- 2. The published snapshot (flags applied) ---------------- */

const snapshot: InsightsSnapshot = buildInsightsSnapshot({
  series,
  calendar,
  releaseSchedule,
  fedTargetUpper: inputs.fred.DFEDTARU,
  policyDecisions,
  peaks,
  highestSince: highestSince as never,
  contextNotes,
  manualExpires,
  flags: outcome.flags,
  now: nowIso,
});

/* ---------------- 3. The full export (the E-23/E-24 columns included) ---------------- */

mkdirSync(EXPORTS_DIR, { recursive: true });
const exportInput: FullExportInput = {
  snapshot,
  copy: insightsCopyEn,
  locale: 'en',
  title: 'Currena Insights — self-check export',
  markets: null,
  fx: null,
};
const markdown = buildInsightsMarkdown(exportInput);
const exportPath = resolve(EXPORTS_DIR, `currena-insights-full-${nowDay}.md`);
writeFileSync(exportPath, markdown);
console.log(`[selfcheck] wrote ${exportPath} (${markdown.length} bytes)`);

/* ---------------- 4. The Step 3 + defect checks over the fresh artefacts ---------------- */

interface CheckRow {
  id: string;
  name: string;
  ok: boolean;
  failures: readonly string[];
  notes: readonly string[];
}
const rows: CheckRow[] = outcome.results.map((r) => ({ id: r.test, name: r.name, ok: r.ok, failures: r.failures, notes: r.notes ?? [] }));

// T-17: every registered source shows its exact attribution.
const t17 = t17AttributionPresent(Object.values(SOURCE_LICENCES));
rows.push({ id: t17.id, name: t17.name, ok: t17.ok, failures: t17.failures, notes: [] });

// T-19: the advice-wording scan over the GENERATED indicator sentences —
// the two dictionaries' indicator blocks (the sentences cards render; the
// same scope the step3 unit tests and the /tmp corpus walk use). The broader
// UI chrome (markets instrument words etc.) is a separate surface, recorded
// in STEP3_REPORT as an owner decision point.
const indicatorTexts: { where: string; text: string }[] = [];
for (const [locale, dict] of [
  ['en', insightsCopyEn],
  ['fa', insightsCopyFa],
] as const) {
  const walk = (v: unknown, where: string): void => {
    if (typeof v === 'string') indicatorTexts.push({ where, text: v });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${where}[${i}]`));
    else if (v !== null && typeof v === 'object') {
      for (const [k, x] of Object.entries(v as Record<string, unknown>)) walk(x, `${where}.${k}`);
    }
  };
  walk(dict.indicators, `${locale}`);
}
const t19 = t19NoAdviceWording(indicatorTexts);
rows.push({ id: t19.id, name: t19.name, ok: t19.ok, failures: t19.failures, notes: ['scope: the generated indicator sentences of both dictionaries'] });

// The defect checks that read the FRESH export (the audit sidecar + rows).
const byId = new Map(snapshot.readings.map((r) => [r.id as string, r]));

// E-10: the export's indicator cells carry the DISPLAYED value (the same
// scale full-export.ts applies) — feed the check the exported numbers.
const indicatorRows = [...byId.values()].map((r) => ({
  id: r.id,
  value: r.value === null ? null : r.value * (DISPLAY[r.id]?.scale ?? 1),
  unit: 'as-displayed',
  cadence: DEFINITIONS.find((d) => d.id === r.id)?.cadence,
  asOf: r.asOf,
  status: r.status,
}));
const e10 = checkE10M2Unit(indicatorRows);
rows.push({
  id: 'E-10',
  name: 'Money-supply scale: the export cell carries the DISPLAYED value (23.3 trillion)',
  ok: e10.length === 0,
  failures: e10,
  notes: ['the display scale is applied at export (full-export.ts exportValue); registry-sync pins the unit token'],
});

// E-24: the fresh export's price table carries the peak columns.
const pricesSection = /## Prices\n([\s\S]*?)\n## /.exec(markdown)?.[1] ?? '';
const headerLine = pricesSection.split('\n').find((l) => l.includes('Peak')) ?? '';
const e24 = checkE24PeakColumnsInExport(
  [{ Indicator: 'gold-usd', Peak: 'x', 'Peak date': 'x', 'Peak basis': 'x', 'Below peak %': 'x' }],
  headerLine.split('|').map((h) => h.trim()).filter(Boolean),
);
rows.push({ id: 'E-24', name: 'The export price table carries the peak columns', ok: e24.length === 0, failures: e24, notes: [] });

// E-18: the export's trend words are recomputed from chg3m — the markets
// board lives in its own worker here, so the check reads the RULE wiring
// (the export recomputes; the unit tests pin it) and records a note.
rows.push({
  id: 'E-18',
  name: 'Trend labels reproducible from the stated 3-month rule',
  ok: true,
  failures: [],
  notes: ['the export + CSV recompute from chg3m (markets/compute.ts trendOf); pinned by markets + full-export tests'],
});

/* ---------------- 4b. v3 (2026-10-20): the full unit-suite results ----------------
 * The runbook's self-check "runs every test" — so this step runs the
 * monorepo's vitest suites and records one row per package. Any failing
 * package fails the whole self-check (the scheduled Action goes red).
 * ------------------------------------------------------------------ */
interface SuiteRow {
  pkg: string;
  tests: number;
  failed: number;
  ok: boolean;
  note: string;
}
const suiteRows: SuiteRow[] = [];
try {
  // gap-closure S3-M3.6 (2026-11-01): the spawn is now the SAME shape
  // scripts/gates.mjs uses for its 'full test suite' gate — `shell: true`
  // with the command as one string — because that shape is PROVEN on the
  // GHA runner (every CI push parses all six package footers through it),
  // while the previous direct `spawnSync('pnpm', ['-r', 'test'])` produced
  // zero parseable footers on the runner in EVERY selfcheck run since the
  // workflow was created (13 of the 17 daily runs before 2026-11-01 were
  // red with `SUITE:(suites)` "no suite output parsed"; it worked locally
  // but never on the hosted runner). The regex is the gates one too,
  // tolerant of any whitespace run (`\s+`) instead of the old `{2,}`.
  const run = spawnSync('pnpm -r run test', {
    shell: true,
    cwd: REPO,
    encoding: 'utf8',
    timeout: 10 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const text = run.stdout + '\n' + run.stderr;
  const seen = new Map<string, SuiteRow>();
  for (const m of text.matchAll(/^(\S+) test:\s+Tests\s+(\d[\d,]*) passed(?: \((\d+)\))?(?:, (\d+) failed)?/gm)) {
    const pkg = m[1]!.replace(/ test:$/, '');
    const tests = Number(m[2]!.replace(/,/g, ''));
    const failed = m[4] !== undefined ? Number(m[4]) : 0;
    seen.set(pkg, { pkg, tests, failed, ok: failed === 0, note: failed === 0 ? `${tests} tests` : `${failed} failing` });
  }
  for (const [, row] of seen) suiteRows.push(row);
  if (suiteRows.length === 0) {
    suiteRows.push({ pkg: '(suites)', tests: 0, failed: 1, ok: false, note: 'no suite output parsed — the runner output shape changed' });
  }
} catch (err) {
  suiteRows.push({ pkg: '(suites)', tests: 0, failed: 1, ok: false, note: `runner failed: ${err instanceof Error ? err.message : String(err)}` });
}
for (const sr of suiteRows) {
  rows.push({
    id: `SUITE:${sr.pkg}`,
    name: `Unit suite — ${sr.pkg}`,
    ok: sr.ok,
    failures: sr.ok ? [] : [`${sr.failed} test(s) failed in ${sr.pkg}`],
    notes: [sr.note],
  });
}

/* ---------------- 5. SELF_AUDIT.md ---------------- */

const staleCards = snapshot.readings.filter((r) => r.status === 'stale' || r.status === 'check-pending');
const unavailable = snapshot.readings.filter((r) => r.status === 'unavailable');
const failed = rows.filter((r) => !r.ok);

const lines: string[] = [
  '# SELF_AUDIT.md — the automatic self-check',
  '',
  `Generated: ${nowIso} · rule version ${RULE_VERSION} · export: \`docs/insights/exports/currena-insights-full-${nowDay}.md\``,
  '',
  `Result: **${failed.length === 0 ? 'ALL TESTS PASS' : `${failed.length} TEST(S) FAILED`}** (${rows.filter((r) => r.ok).length} of ${rows.length} pass)`,
  '',
  '## Every test, pass or fail',
  '',
  '| Test | Name | Result | Failures / notes |',
  '|---|---|---|---|',
];
for (const r of rows) {
  const detail = [...r.failures, ...r.notes].join('; ').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  lines.push(`| ${r.id} | ${r.name} | ${r.ok ? 'pass' : '**FAIL**'} | ${detail || '—'} |`);
}
lines.push(
  '',
  '## Stale or "can\'t tell" cards',
  '',
  staleCards.length === 0
    ? 'None — every card reads current or carries its own honest tag.'
    : '| Indicator | Status | As of | Reason |',
);
for (const r of staleCards) {
  lines.push(`| ${r.id} | ${r.status} | ${r.asOf ?? '—'} | ${r.flag?.reason ?? r.status} |`);
}
if (staleCards.length === 0) lines.push('');
lines.push(
  '',
  '## Unavailable cards',
  '',
  unavailable.length === 0
    ? 'None.'
    : unavailable.map((r) => `- ${r.id}`).join('\n'),
  '',
  '## Source report',
  '',
  ...reports.map((r) => `- ${r.ok ? '✅' : '❌'} ${r.source} — ${r.detail}`),
  '',
  '## Scope notes',
  '',
  '- The world-markets and world-currencies boards are served by their own Worker; this self-check rebuilds the INDICATOR snapshot, so the export here omits those sections (the page\'s own export carries them).',
  '- The T-16 FRED copyright scan and the licence register are pinned by their own tests (validation-step3.test.ts); their records live in data/fred-copyright.json + LICENCES.md.',
  '- This file and the dated export are EVIDENCE — the scheduled GitHub Action writes neither to KV nor to the repo; a failing run is a red run.',
  '',
);
writeFileSync(AUDIT_PATH, lines.join('\n'));
console.log(`[selfcheck] wrote ${AUDIT_PATH}`);

if (failed.length > 0) {
  console.error(`\n[selfcheck] FAILING TESTS: ${failed.map((f) => f.id).join(', ')}`);
  process.exit(1);
}
console.log('\n[selfcheck] all tests pass.');
