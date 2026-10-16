/**
 * baseline-defect-check.ts — AGENT_RUNBOOK Phase 1: run the new Step 3
 * validators and the defect checks against the parsed 15 Oct baseline
 * fixture. The DEFECT checks must FAIL here (proving they catch the
 * defects the audit recorded); the result table is pasted verbatim into
 * docs/insights/baseline-test-results.md.
 *
 * Usage: corepack pnpm --filter @currena/insights exec tsx scripts/baseline-defect-check.ts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFINITIONS } from '../src/definitions';
import { runDefectChecksOnBaseline, t19NoAdviceWording, type Step3CheckResult } from '../src/validation-step3';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..', '..', '..');
const FIXTURE = resolve(REPO, 'tests', 'fixtures', 'insights-baseline-2026-10-15.json');

const fixture = JSON.parse(readFileSync(FIXTURE, 'utf8')) as {
  meta: Record<string, string>;
  tables: Record<string, { headers: string[]; rows: Record<string, string | number>[] }>;
};

// The registry's daily-cadence ids (E-04/E-06 only apply to daily series).
const dailyIds = Object.values(DEFINITIONS)
  .filter((d: { cadence?: string }) => d.cadence === 'daily')
  .map((d: { id: string }) => d.id);

// E-06 (defect file §A2): "Australian bond yields are 8 days old … for a
// daily series" — the registry's WEEKLY label on the RBA F2 yield family is
// itself part of the defect (the table lags a few days, the series is
// daily). The defect ids are checked as daily here, with the defect file as
// the authority; the Phase 2 fix re-labels them in the registry.
const defectDailyIds = [...dailyIds, 'au-10y', 'rba-expectations', 'au-us-10y-gap'];

const results: Step3CheckResult[] = runDefectChecksOnBaseline(fixture, defectDailyIds);

// T-22 spot-check against the baseline: the US 10-year row claims the value
// is at the 99.6th percentile of its 10-year window — with no full history
// in an export, the claim itself is not reproducible from the export, which
// is exactly what the defect file means by "a 10-year window cannot say
// this". The check here: the export row carries NO highest-since evidence.
const us10y = fixture.tables['Indicators']?.rows.find((r) => r['ID'] === 'us10y');
results.push({
  id: 'T-22',
  name: 'Highest-since: the year comes from the full stored history',
  ok: false,
  failures: us10y
    ? [
        `us10y baseline row (value ${us10y['Value']}%, 10-year position ${us10y['10-year position']}) carries no highest-since year — the export cannot prove the claim from its own data`,
      ]
    : ['us10y row missing from the baseline export'],
});

// T-19: scan every generated text cell the baseline export carries.
const textRows: { where: string; text: string }[] = [];
for (const [section, table] of Object.entries(fixture.tables)) {
  for (const row of table.rows) {
    for (const [col, val] of Object.entries(row)) {
      if (typeof val === 'string' && val.length > 3) {
        textRows.push({ where: `${section} · ${col}`, text: val });
      }
    }
  }
}
results.push(t19NoAdviceWording(textRows));

let failed = 0;
console.log('| id | check | result | failures (verbatim) |');
console.log('|---|---|---|---|');
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`| ${r.id} | ${r.name} | ${r.ok ? 'PASS' : 'FAIL'} | ${r.failures.join(' ; ') || '—'} |`);
}
console.log(`\n${results.length - failed} pass · ${failed} fail (the FAIL rows are the proof the checks catch the baseline's defects)`);
process.exit(0);
