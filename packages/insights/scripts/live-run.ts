/**
 * Phase I2 "manual one-off live run" (roadmap exit criterion) — fetches every
 * source live, assembles all indicator series exactly as the ingestion
 * runner will, computes readings with the Phase I1 scoring engine and prints
 * a sanity table for every indicator (P1 rows marked).
 *
 * This is a MANUAL script (like the backtest): it hits live sites by design,
 * is never part of the test suite, and writes NOTHING — no KV, no files.
 * A source that fails prints its failure and the affected indicators go
 * `unavailable`/`stale` in the table — never wrong data.
 *
 * Since Phase I3 the fetch phase lives in src/adapters/collect.ts (shared
 * with the ingestion runner — the two cannot drift apart); this script keeps
 * only the human-readable report.
 *
 * Run: pnpm --filter @currena/insights live-run
 * RBA note: rba.gov.au is Akamai-blocked from the build sandbox
 * (docs/insights/03-data-sources.md) — the RBA rows fail loudly here and
 * go unavailable; from the GitHub Actions ingestion venue they are live
 * (verified 2026-10-06, probe run 37492764171 on branch probe/i2-rba-venue).
 */

import type { IndicatorId, IndicatorReading } from '@currena/core';

import { DEFINITIONS, computeReading, summarize } from '../src/index';
import {
  buildIndicatorSeries,
  collectAllSources,
  READING_SOURCES,
  type SeriesInputs,
} from '../src/adapters/index';

const now = new Date();
const nowIso = now.toISOString();
const today = nowIso.slice(0, 10);

/* ------------------------------------------------------------------ *
 * Fetch phase — collect.ts (shared with the ingestion runner)
 * ------------------------------------------------------------------ */

const { inputs, reports } = await collectAllSources();

/* ------------------------------------------------------------------ *
 * Assemble + score
 * ------------------------------------------------------------------ */

const seriesInputs: SeriesInputs = { ...inputs, chinaPmi: undefined };
const series = buildIndicatorSeries(seriesInputs);

const readings: IndicatorReading[] = [];
for (const def of DEFINITIONS) {
  const s = series[def.id];
  const src = READING_SOURCES[def.id] ?? { name: def.sourceRef };
  if (!s) {
    // Mirror computeReading's unavailable shape for absent series.
    const unavailable: IndicatorReading = {
      id: def.id,
      value: null,
      asOf: null,
      status: 'unavailable',
      sourceName: src.name,
      sourceUrl: src.url,
      updatedAt: nowIso,
    };
    readings.push(unavailable);
    continue;
  }
  readings.push(computeReading(def, s, nowIso, src));
}

const summary = summarize(readings);

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined) return '—';
  const abs = Math.abs(n);
  return n.toFixed(abs >= 1000 ? 0 : abs >= 100 ? 1 : digits);
}

const defById = new Map(DEFINITIONS.map((d) => [d.id as string, d]));

console.log(`# Insights live run — ${nowIso}`);
console.log();

console.log('## Source fetch report');
console.log();
console.log('| Source | OK | Detail |');
console.log('|---|---|---|');
for (const r of reports) {
  console.log(`| ${r.source} | ${r.ok ? '✅' : '❌'} | ${r.detail.replace(/\|/g, '\\|')} |`);
}
console.log();

console.log('## Indicator readings (the sanity table)');
console.log();
console.log('| Phase | Indicator | Value | As of | 10y pct | 7d | 30d | Status |');
console.log('|---|---|---|---|---|---|---|---|');
for (const r of readings) {
  const def = defById.get(r.id)!;
  const name = def.name;
  console.log(
    `| ${def.phase} | ${name} | ${r.value === null ? '—' : fmt(r.value)} | ${r.asOf ?? '—'} | ${
      r.percentile10y === undefined ? '—' : `${(r.percentile10y * 100).toFixed(0)}%`
    } | ${fmt(r.change7d, 1)} | ${fmt(r.change30d, 1)} | ${r.status} |`,
  );
}
console.log();

console.log('## Summary lines');
console.log();
console.log(
  `- **Global:** ${summary.global.label ?? 'no label'} — ${summary.global.warningCount}/${summary.global.votingCount} voting in warning (${summary.global.excludedCount} excluded).`,
);
console.log(
  `- **Australia:** ${summary.australia.label ?? 'no label'} — ${summary.australia.warningCount}/${summary.australia.votingCount} voting in warning (${summary.australia.excludedCount} excluded).`,
);
console.log();

const p1Ids: IndicatorId[] = DEFINITIONS.filter((d) => d.phase === 'P1').map((d) => d.id);
const p1Missing: IndicatorId[] = p1Ids.filter((id) => {
  const r = readings.find((x) => x.id === id);
  return !r || r.status === 'unavailable';
});
const rbaBlocked: IndicatorId[] = p1Missing.filter((id) => id === 'rba-cash-rate' || id === 'au-us-10y-gap');
const otherMissing: IndicatorId[] = p1Missing.filter((id) => !rbaBlocked.includes(id));

console.log('## Exit-criterion verdict (P1)');
console.log();
if (otherMissing.length === 0 && rbaBlocked.length === 0) {
  console.log('**P1 COMPLETE** — every P1 indicator printed a sane live value.');
} else {
  if (rbaBlocked.length > 0) {
    console.log(
      `**P1 pending venue** — ${rbaBlocked.join(', ')} await the RBA venue probe (expected outside the sandbox).`,
    );
  }
  if (otherMissing.length > 0) {
    console.log(`**P1 INCOMPLETE** — no value for: ${otherMissing.join(', ')}.`);
  }
}
console.log();
