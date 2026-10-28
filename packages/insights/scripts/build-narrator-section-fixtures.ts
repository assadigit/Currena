/**
 * build-narrator-section-fixtures.ts — M1 of the Layer-2 narrator build
 * (docs/insights/layer2/INSIGHTS-L2-NARRATOR-SPEC.md §3): builds the golden
 * SECTION + OVERALL narration fixtures as {input, now, output} records,
 * pinned by src/narrator/section-state.test.ts.
 *
 * One-off data capture + construction (the tests themselves NEVER hit live
 * sites — AGENTS.md rule 7). Inputs:
 *   /tmp/live-insights.json  — GET /api/insights    (captured 2026-10-28)
 *   /tmp/live-fx.json        — GET /api/insights/fx      (the FULL document)
 *   /tmp/live-markets.json   — GET /api/insights/markets (the FULL document)
 * plus the THREE committed prep fixtures (stressed-live / calm /
 * stale-excluded) whose constructed insights inputs are reused verbatim.
 *
 * Writes fixtures/narration/sections/:
 *   global-live.json          — Global from the live stressed day (9 alerts)
 *   australia-live.json       — Australia from the live stressed day (7 alerts)
 *   australia-calm.json       — the calm day's Australia (no alerts)
 *   australia-excluded.json   — the stale-excluded day's Australia (3 excluded)
 *   world-markets-live.json   — live markets: signal attention, 6 corrections
 *                               + 1 bear (kospi), worst group Asia-Pacific
 *   world-currencies-live.json— live fx: signal attention, r6 warning,
 *                               EUR/CHF unusually large move
 *   overall-live.json         — the whole page from all three live documents
 *
 * Run (after capturing the three live documents to /tmp):
 *   pnpm --filter @currena/insights exec tsx scripts/build-narrator-section-fixtures.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { FxSnapshot, InsightsSnapshot, MarketsSnapshot } from '@currena/core';
import {
  buildSectionNarrationState,
  type SectionNarrationSnapshot,
  type SectionNarrationState,
} from '../src/narrator/section-state';
import { buildOverallNarrationState, type OverallNarrationState } from '../src/narrator/overall-state';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../fixtures/narration/sections');
const PREP_DIR = resolve(HERE, '../fixtures/narration');
const LIVE_INSIGHTS = '/tmp/live-insights.json';
const LIVE_FX = '/tmp/live-fx.json';
const LIVE_MARKETS = '/tmp/live-markets.json';

/** The shared live-day clock: after all three documents' generatedAt. */
const LIVE_NOW = '2026-10-28T09:30:00.000Z';

interface PrepFixture {
  scenario: string;
  now: string;
  input: { insights: InsightsSnapshot };
}

function prepFixture(scenario: string): PrepFixture {
  return JSON.parse(readFileSync(resolve(PREP_DIR, `${scenario}.json`), 'utf8')) as PrepFixture;
}

interface SectionFixtureFile {
  scenario: string;
  section: string;
  description: string;
  provenance: string;
  now: string;
  input: SectionNarrationSnapshot;
  output: SectionNarrationState;
}

interface OverallFixtureFile {
  scenario: string;
  section: 'overall';
  description: string;
  provenance: string;
  now: string;
  input: SectionNarrationSnapshot;
  output: OverallNarrationState;
}

function writeSection(fixture: SectionFixtureFile): void {
  const path = resolve(OUT_DIR, `${fixture.scenario}.json`);
  writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(
    `section fixture: ${fixture.scenario} (${fixture.section}) — ${fixture.output.items.length} items · ${fixture.output.alerts.length} alerts · ${fixture.output.excluded.length} excluded → ${path}`,
  );
}

function writeOverall(fixture: OverallFixtureFile): void {
  const path = resolve(OUT_DIR, `${fixture.scenario}.json`);
  writeFileSync(path, `${JSON.stringify(fixture, null, 2)}\n`);
  console.log(
    `overall fixture: ${fixture.scenario} — ${fixture.output.alerts.length} alerts across ${fixture.output.sections.filter((s) => s.present).length} sections · ${fixture.output.excluded.length} excluded → ${path}`,
  );
}

function main(): void {
  const insights = JSON.parse(readFileSync(LIVE_INSIGHTS, 'utf8')) as InsightsSnapshot;
  const fx = JSON.parse(readFileSync(LIVE_FX, 'utf8')) as FxSnapshot;
  const markets = JSON.parse(readFileSync(LIVE_MARKETS, 'utf8')) as MarketsSnapshot;
  const liveSnapshot: SectionNarrationSnapshot = { insights, fx, markets };

  const stressed = prepFixture('stressed-live');
  const calm = prepFixture('calm');
  const stale = prepFixture('stale-excluded');

  const LIVE_PROVENANCE =
    'GET https://currena.ir/api/insights + /api/insights/fx + /api/insights/markets, captured 2026-10-28 (real data, unedited).';

  // ---- global / australia, from the prep fixtures' own inputs ------------
  for (const [scenario, section, description, source] of [
    ['global-live', 'global', 'Global from the live stressed day: verdict stressed, 9 of 32 voting indicators in warning.', stressed],
    ['australia-live', 'australia', 'Australia from the live stressed day: verdict stressed, 7 of 16 voting indicators in warning.', stressed],
    ['australia-calm', 'australia', 'A calm section: the calm day\'s Australia — no alerts, verdict relaxed.', calm],
    ['australia-excluded', 'australia', 'A section with excluded data: the stale-excluded day\'s Australia — the frozen AU trio lands in `excluded`, never in the facts.', stale],
  ] as const) {
    writeSection({
      scenario,
      section,
      description,
      provenance:
        scenario.endsWith('-live')
          ? `${LIVE_PROVENANCE} Insights input reused verbatim from the committed stressed-live prep fixture.`
          : `Constructed inputs reused verbatim from the committed ${source.scenario} prep fixture (${source.scenario === 'calm' ? 'statuses → normal; summaries recomputed' : 'the frozen AU trio + one unavailable reading'}).`,
      now: source.now,
      input: { insights: source.input.insights },
      output: buildSectionNarrationState({ insights: source.input.insights }, section, source.now),
    });
  }

  // ---- world-markets, from the live markets document ---------------------
  writeSection({
    scenario: 'world-markets-live',
    section: 'world-markets',
    description:
      'World markets from the live day: signal attention, 6 of 16 indices in correction and 1 in a bear market (Kospi, 38% below its high), the Asia-Pacific group holding the most.',
    provenance: LIVE_PROVENANCE,
    now: LIVE_NOW,
    input: liveSnapshot,
    output: buildSectionNarrationState(liveSnapshot, 'world-markets', LIVE_NOW),
  });

  // ---- world-currencies, from the live fx document -----------------------
  writeSection({
    scenario: 'world-currencies-live',
    section: 'world-currencies',
    description:
      'World currencies from the live day: signal attention, the r6 Europe-worry pattern a counted warning, EUR/CHF tagged an unusually large move, the dollar near its year high.',
    provenance: LIVE_PROVENANCE,
    now: LIVE_NOW,
    input: liveSnapshot,
    output: buildSectionNarrationState(liveSnapshot, 'world-currencies', LIVE_NOW),
  });

  // ---- the overall, from all three live documents ------------------------
  writeOverall({
    scenario: 'overall-live',
    section: 'overall',
    description:
      'The whole page from the live day: both indicator sections stressed, world markets needing attention, world currencies needing attention, 24 alerts across the four sections.',
    provenance: LIVE_PROVENANCE,
    now: LIVE_NOW,
    input: liveSnapshot,
    output: buildOverallNarrationState(liveSnapshot, LIVE_NOW),
  });
}

mkdirSync(OUT_DIR, { recursive: true });
main();
