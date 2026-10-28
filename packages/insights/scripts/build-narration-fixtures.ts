/**
 * build-narration-fixtures.ts — P4 of the Layer-2 prep
 * (docs/insights/layer2/INSIGHTS-L2-PREP-SPEC.md §6): builds the THREE
 * golden narration fixtures (a stressed day taken from LIVE data, a calm
 * day, a day with excluded stale data) as {input, now, output} records
 * pinned by src/narrator/state.test.ts.
 *
 * One-off data capture + construction (the tests themselves NEVER hit
 * live sites — AGENTS.md rule 7): reads the live documents captured to
 * /tmp/live-insights.json + /tmp/live-fx.json, projects them exactly the
 * way Layer 2 will, and writes:
 *   fixtures/narration/stressed-live.json   — the live stressed day as-is
 *   fixtures/narration/calm.json            — the same day with every
 *                                              warning calmed (statuses →
 *                                              normal; summaries recomputed
 *                                              with the REAL engine)
 *   fixtures/narration/stale-excluded.json  — the same day with the AU
 *                                              trio frozen 75 days stale +
 *                                              one unavailable reading
 *                                              (summaries recomputed)
 *
 * The constructed scenarios edit ONLY reading statuses/dates and let
 * summarizeByGauges (the real summary writer) recompute the summaries —
 * the fixtures stay shape-honest against the engine.
 *
 * Run (after capturing the two live documents to /tmp):
 *   pnpm --filter @currena/insights exec tsx scripts/build-narration-fixtures.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FxRuleState, FxSummary, InsightsSnapshot } from '@currena/core';
import { summarizeByGauges } from '../src/gauges';
import { buildNarrationState, type NarrationFxState, type NarrationSnapshot } from '../src/narrator/state';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../fixtures/narration');
const LIVE_INSIGHTS = '/tmp/live-insights.json';
const LIVE_FX = '/tmp/live-fx.json';

/** The trimmed fx state the narration actually consumes (the full document satisfies it structurally). */
function trimmedFx(): NarrationFxState {
  const fx = JSON.parse(readFileSync(LIVE_FX, 'utf8')) as {
    generatedAt: string;
    rules: Array<Pick<FxRuleState, 'id' | 'outcome' | 'counted'>>;
    summary: FxSummary;
  };
  return {
    generatedAt: fx.generatedAt,
    rules: fx.rules.map((r) => ({ id: r.id, outcome: r.outcome, counted: r.counted })),
    summary: fx.summary,
  };
}

interface FixtureFile {
  scenario: string;
  description: string;
  provenance: string;
  now: string;
  input: NarrationSnapshot;
  output: ReturnType<typeof buildNarrationState>;
}

function writeFixture(fixture: FixtureFile): void {
  const path = resolve(OUT_DIR, `${fixture.scenario}.json`);
  writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(
    `narration fixture: ${fixture.scenario} — ${fixture.output.items.length} items · ${fixture.output.alerts.length} alerts · ${fixture.output.excluded.length} excluded → ${path}`,
  );
}

function main(): void {
  const insights = JSON.parse(readFileSync(LIVE_INSIGHTS, 'utf8')) as InsightsSnapshot;
  const now = insights.generatedAt; // the snapshot's own clock — the honest reference
  const liveFx = trimmedFx();

  // ---- Scenario 1: the live stressed day, exactly as served -------------
  writeFixture({
    scenario: 'stressed-live',
    description:
      'A stressed day, taken verbatim from the live page state (2026-10-28): both sections stressed, 16 alerts firing, the r6 Europe-worry FX pattern active.',
    provenance: 'GET https://currena.ir/api/insights + /api/insights/fx, captured 2026-10-28 (real data, unedited).',
    now,
    input: { insights, fx: liveFx },
    output: buildNarrationState({ insights, fx: liveFx }, now),
  });

  // ---- Scenario 2: a calm day ------------------------------------------
  // The same day with every warning calmed to normal. The summaries are
  // recomputed with the REAL summary writer so the fixture stays honest.
  const calmInsights: InsightsSnapshot = {
    ...insights,
    readings: insights.readings.map((r) => (r.status === 'warning' ? { ...r, status: 'normal' } : r)),
  };
  calmInsights.summary = summarizeByGauges(calmInsights.readings);
  const calmFx: NarrationFxState = {
    generatedAt: liveFx.generatedAt,
    rules: liveFx.rules.map((r) => ({ ...r, outcome: 'quiet' as const, counted: false })),
    summary: { signal: 'normal', countedWarnings: 0, headlineRule: null },
  };
  writeFixture({
    scenario: 'calm',
    description:
      'A calm day: every warning calmed to normal (statuses only — values, dates and changes untouched), the summaries recomputed with the real engine, all FX patterns quiet.',
    provenance: 'Constructed from the captured 2026-10-28 live state (statuses → normal; summaries recomputed with summarizeByGauges).',
    now,
    input: { insights: calmInsights, fx: calmFx },
    output: buildNarrationState({ insights: calmInsights, fx: calmFx }, now),
  });

  // ---- Scenario 3: a day with excluded stale data -----------------------
  // The AU trio frozen at 2026-08-14 (75 days — past every window) and one
  // reading unavailable: the excluded array carries them, never the facts.
  const FROZEN_AS_OF = '2026-08-14';
  const staleInsights: InsightsSnapshot = {
    ...insights,
    readings: insights.readings.map((r) => {
      if (r.id === 'au-10y' || r.id === 'rba-expectations' || r.id === 'au-us-10y-gap') {
        return { ...r, asOf: FROZEN_AS_OF, status: 'stale' as const };
      }
      if (r.id === 'wti') {
        // unavailable: exactly the engine's shape (value/asOf null, no changes)
        return {
          id: r.id,
          sourceName: r.sourceName,
          sourceUrl: r.sourceUrl,
          updatedAt: r.updatedAt,
          value: null,
          asOf: null,
          status: 'unavailable' as const,
        };
      }
      return r;
    }),
  };
  staleInsights.summary = summarizeByGauges(staleInsights.readings);
  writeFixture({
    scenario: 'stale-excluded',
    description:
      'A day with excluded stale data: the three RBA-fed readings frozen 75 days (past every window) and one unavailable reading — all four land in `excluded` with reasons, never in the facts. The live day otherwise (16 → 14 alerts: the two AU warning voters left the electorate).',
    provenance:
      'Constructed from the captured 2026-10-28 live state (asOf/status edits + one unavailable reading; summaries recomputed with summarizeByGauges).',
    now,
    input: { insights: staleInsights, fx: liveFx },
    output: buildNarrationState({ insights: staleInsights, fx: liveFx }, now),
  });
}

mkdirSync(OUT_DIR, { recursive: true });
main();
