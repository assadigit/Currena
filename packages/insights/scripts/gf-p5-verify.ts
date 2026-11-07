/**
 * gf-p5-verify.ts — the GF-S12 acceptance verification (P5 — the program's
 * dedicated close; docs/specs/gold-meter-gapfill/01-FILL-SPEC.md §1 GF-P5;
 * D-GF-5: every number from a run). A MANUAL script, never part of the
 * test suite: the acceptance walk's own machine half —
 *
 *  A. THE ENGINE + REGISTER PINS — the meter's final shape, re-read from
 *     the shipped code: GOLD_LANE_VOTERS 37 (7/7/11/10/2), MIN2
 *     (GOLD_LANE_MIN_FIRING 2), STRONG 4-of-5 (GOLD_LANE_STRONG 4 over 5
 *     lanes); the register's own decision rows re-read (the SGE
 *     owner-acceptance trail · the Cleveland no-grant class · the WGC
 *     blocked class) — the classes the open questions ride.
 *  B. THE LICENCE REGISTER AUDIT — every SOURCE_LICENCES row: the
 *     termsEvidence string present (non-empty) + termsCheckedOn dated
 *     (YYYY-MM-DD); the yes/no/unknown display-class counts; any row
 *     failing the audit FAILS THE RUN (the fail-closed discipline).
 *  C. THE REGISTRY STATE — data/indicators.json (184 ids · 130 rule:info
 *     cards) + data/site-mode-overrides.json (the public-mode hidden set,
 *     exactly 7 ids) + the wiring checks: every one of the 37 voter ids
 *     exists in the registry and NONE sits in the hidden set (a voter can
 *     never be hidden — the meter's own seats are public).
 *  D. THE PRODUCTION MATRIX — the LIVE public snapshot walk
 *     (https://currena.ir/api/insights): the production engine
 *     (`goldBalance`) over the live readings — the rollup, the five lane
 *     states, EVERY one of the 37 voters' own live line, EVERY context
 *     card on the wire (the full register walk), the GF-P3/P4 highlight
 *     cards' own lines.
 *  E. THE DISPLAY CLASSES ON THE WIRE — the (e) flip verified live
 *     (shanghai-gold-premium PRESENT + readable); the 7 hidden ids
 *     ABSENT from the projection (the private/fail-closed classes).
 *
 * Writes NOTHING (no KV, no repo file). Read-only: no product edits, no
 * deploy (P5 is docs+evidence only — D-GF-9).
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): the walk prints conditions and
 * states only; the no-edge record stands untouched.
 *
 * Usage: pnpm --filter @currena/insights exec tsx scripts/gf-p5-verify.ts [snapshotUrl]
 * (default: the production public snapshot on currena.ir)
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { goldBalance, GOLD_LANE_MIN_FIRING, GOLD_LANE_STRONG } from '../src/gold-balance';
import { GOLD_LANES, GOLD_LANE_VOTERS } from '../src/gold-score';
import { SOURCE_LICENCES } from '../src/licences';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(HERE, '..', '..', '..', 'data', 'indicators.json');
const OVERRIDES_PATH = join(HERE, '..', '..', '..', 'data', 'site-mode-overrides.json');
const SNAPSHOT_URL = process.argv[2] ?? 'https://currena.ir/api/insights';

/** The expected final shape (the program's own pins — a mismatch FAILS). */
const EXPECTED = {
  voters: 37,
  lanes: { 'borrowing-costs': 7, dollar: 7, stress: 11, inflation: 10, flows: 2 },
  minFiring: 2,
  strong: 4,
  laneCount: 5,
  registryIds: 184,
  infoCards: 130,
  hiddenIds: [
    'cpi-nowcast',
    'cpi-surprise',
    'etf-short-interest',
    'gold-equities-ratio',
    'official-gold-demand',
    'wgc-cb-demand',
    'wgc-etf-holdings',
  ] as const,
};

/** The GF-P3/P4 highlight cards (the acceptance matrix's own rows). */
const HIGHLIGHT_P3 = ['real-yield-5y', 'dollar-broad', 'dollar-eme', 'bank-stress', 'real-curve-10y5y', 'shanghai-gold-premium'] as const;
const HIGHLIGHT_P4 = [
  'real-gold-price',
  'gold-platinum',
  'global-liquidity',
  'debt-to-gdp',
  'swiss-gold-flow',
  'sge-gold-withdrawals',
  'gold-equities-ratio',
  'rstar-us',
  'etf-short-interest',
] as const;

let failures = 0;
function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗ FAIL'} ${label}${detail !== '' ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

interface LiveReading {
  id: string;
  value: number | null;
  asOf: string | null;
  status: string;
  change30d?: number;
  percentile10y?: number;
  sourceName?: string;
}
interface LiveSnapshot {
  generatedAt: string;
  readings: LiveReading[];
}

function liveLine(r: LiveReading | undefined): string {
  if (r === undefined) return 'ABSENT from the public snapshot';
  const pct = r.percentile10y !== undefined ? ` pct10y=${(r.percentile10y * 100).toFixed(0)}%` : '';
  const chg = r.change30d !== undefined ? ` chg30d=${r.change30d.toFixed(3)}` : '';
  return `${r.value ?? '—'} @ ${r.asOf ?? '—'} [${r.status}]${pct}${chg}`;
}

/* ------------------------------------------------------------------ *
 * A. The engine + register pins (the meter's final shape)
 * ------------------------------------------------------------------ */

console.log(`# GF-P5 acceptance verification — ${new Date().toISOString()}`);
console.log(`# the P5 close: the acceptance walk's own machine half (read-only, no deploy)`);

console.log(`\n## A. The engine + register pins (the final shape, re-read from the shipped code)`);

const laneCounts: Record<string, number> = {};
for (const v of GOLD_LANE_VOTERS) laneCounts[v.lane] = (laneCounts[v.lane] ?? 0) + 1;
check(
  'GOLD_LANE_VOTERS seat count',
  GOLD_LANE_VOTERS.length === EXPECTED.voters,
  `${GOLD_LANE_VOTERS.length} seats`,
);
check(
  'the five-lane composition (7/7/11/10/2)',
  GOLD_LANES.length === EXPECTED.laneCount &&
    GOLD_LANES.every((l) => laneCounts[l] === EXPECTED.lanes[l]),
  `${GOLD_LANES.map((l) => `${l} ${laneCounts[l] ?? 0}`).join(' · ')}`,
);
check(
  'the MIN2 lane rule (GOLD_LANE_MIN_FIRING)',
  GOLD_LANE_MIN_FIRING === EXPECTED.minFiring,
  `min-firing ${GOLD_LANE_MIN_FIRING}`,
);
check(
  'the STRONG bar (GOLD_LANE_STRONG-of-5)',
  GOLD_LANE_STRONG === EXPECTED.strong && GOLD_LANES.length === 5,
  `STRONG ${GOLD_LANE_STRONG}-of-${GOLD_LANES.length}`,
);

const sge = SOURCE_LICENCES['sge']!;
const cleveland = SOURCE_LICENCES['cleveland']!;
const wgc = SOURCE_LICENCES['wgc']!;
check(
  'the SGE row carries the owner-acceptance trail (round-2 (e))',
  sge.publicDisplayOk === 'yes' &&
    (/owner-accepted/i.test(sge.licenceName) || /owner ACCEPTED|owner-acceptance/i.test(sge.termsEvidence)) &&
    /2026-11-07/.test(`${sge.licenceName} ${sge.termsEvidence}`),
  `publicDisplayOk ${sge.publicDisplayOk} · checked ${sge.termsCheckedOn} · "${sge.licenceName}"`,
);
check(
  'the Cleveland row stays fail-closed (the GF-S12 question (a) — no affirmative grant)',
  cleveland.publicDisplayOk === 'no',
  `publicDisplayOk ${cleveland.publicDisplayOk} · checked ${cleveland.termsCheckedOn}`,
);
check(
  'the WGC row stays blocked (the authorisation family)',
  wgc.publicDisplayOk === 'no',
  `publicDisplayOk ${wgc.publicDisplayOk} · checked ${wgc.termsCheckedOn}`,
);

/* ------------------------------------------------------------------ *
 * B. The licence register audit (every row's evidence present + dated)
 * ------------------------------------------------------------------ */

console.log(`\n## B. The licence register audit (every row's evidence string present + dated)`);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const providers = Object.keys(SOURCE_LICENCES).sort();
const badRows: string[] = [];
let yes = 0;
let no = 0;
let unknown = 0;
for (const p of providers) {
  const row = SOURCE_LICENCES[p]!;
  if (row.termsEvidence.trim() === '' || !DATE_RE.test(row.termsCheckedOn)) {
    badRows.push(`${p} (evidence ${row.termsEvidence.trim() === '' ? 'EMPTY' : 'present'} · checked ${row.termsCheckedOn})`);
  }
  if (row.publicDisplayOk === 'yes') yes++;
  else if (row.publicDisplayOk === 'no') no++;
  else unknown++;
}
check(
  `every register row carries its evidence + date`,
  badRows.length === 0,
  `${providers.length} rows audited${badRows.length === 0 ? '' : ` — FAILING: ${badRows.join(' · ')}`}`,
);
console.log(
  `  · display classes: yes ${yes} · no ${no} · unknown ${unknown} (unknown fails closed under T-15)`,
);

/* ------------------------------------------------------------------ *
 * C. The registry state (the context register + the hidden set)
 * ------------------------------------------------------------------ */

console.log(`\n## C. The registry state (the context register + the public-mode hidden set)`);

interface RegistryEntry {
  id: string;
  rule: { kind: string } & Record<string, unknown>;
}
interface Overrides {
  version: number;
  hiddenIndicatorIds: string[];
}
const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as { indicators: RegistryEntry[] };
const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8')) as Overrides;

const ids = registry.indicators.map((d) => d.id);
const infoCards = registry.indicators.filter((d) => d.rule?.kind === 'info');
check('the registry id count', ids.length === EXPECTED.registryIds, `${ids.length} ids`);
check('the rule:info card count', infoCards.length === EXPECTED.infoCards, `${infoCards.length} rule:info cards`);
check(
  'the public-mode hidden set (exactly the 7 expected ids)',
  overrides.hiddenIndicatorIds.length === EXPECTED.hiddenIds.length &&
    [...overrides.hiddenIndicatorIds].sort().join() === [...EXPECTED.hiddenIds].sort().join(),
  `${overrides.hiddenIndicatorIds.length} hidden: ${overrides.hiddenIndicatorIds.join(' · ')}`,
);

const registryIds = new Set(ids);
const missingVoters = GOLD_LANE_VOTERS.map((v) => v.id as string).filter((id) => !registryIds.has(id));
check(
  'every one of the 37 voter ids exists in the registry (no dead seat)',
  missingVoters.length === 0,
  missingVoters.length === 0 ? '37/37 present' : `MISSING: ${missingVoters.join(' · ')}`,
);
const hiddenSet = new Set(overrides.hiddenIndicatorIds);
const hiddenVoters = GOLD_LANE_VOTERS.map((v) => v.id as string).filter((id) => hiddenSet.has(id));
check(
  'no voter sits in the hidden set (the meter\'s own seats are public)',
  hiddenVoters.length === 0,
  hiddenVoters.length === 0 ? '0 of 37 hidden' : `HIDDEN: ${hiddenVoters.join(' · ')}`,
);

/* ------------------------------------------------------------------ *
 * D. The production matrix (the live public snapshot walk)
 * ------------------------------------------------------------------ */

console.log(`\n## D. The production matrix (the live public snapshot walk — ${SNAPSHOT_URL})`);

const res = await fetch(SNAPSHOT_URL, { headers: { accept: 'application/json' } });
if (!res.ok) throw new Error(`live snapshot fetch: HTTP ${res.status}`);
const snapshot = (await res.json()) as LiveSnapshot;
console.log(`snapshot: generatedAt ${snapshot.generatedAt} · readings ${snapshot.readings.length}`);

const byId = new Map(snapshot.readings.map((r) => [r.id, r]));
const balance = goldBalance(snapshot.readings as never[]);
console.log(
  `engine over the live readings: for ${balance.counts.for} · against ${balance.counts.against} · neutral ${balance.counts.neutral} · unread ${balance.counts.unread} (net ${balance.net}, readable ${balance.readable})`,
);
for (const lane of balance.lanes) {
  console.log(
    `  ${lane.lane.padEnd(16)} ${lane.side.padEnd(7)} split=${lane.split ? 'yes' : 'no '} readable=${lane.readable} firing=${lane.firing} supports=${lane.supports} pressures=${lane.pressures}`,
  );
}

console.log(`\nthe 37 voters' own live lines:`);
for (const v of GOLD_LANE_VOTERS) {
  console.log(`  ${(v.id as string).padEnd(26)} ${liveLine(byId.get(v.id as string))}`);
}

const voterIds = new Set(GOLD_LANE_VOTERS.map((v) => v.id as string));
const contextOnWire = snapshot.readings.filter((r) => !voterIds.has(r.id));
console.log(`\nthe context register on the public wire (${contextOnWire.length} cards):`);
for (const r of contextOnWire) {
  console.log(`  ${r.id.padEnd(26)} ${liveLine(r)}`);
}

console.log(`\nthe GF-P3 highlight cards (the P3 sources + the two P3 context cards):`);
for (const id of HIGHLIGHT_P3) {
  console.log(`  ${id.padEnd(26)} ${liveLine(byId.get(id))}`);
}
console.log(`the P4 context cards (the nine, severity-ordered):`);
for (const id of HIGHLIGHT_P4) {
  console.log(`  ${id.padEnd(26)} ${liveLine(byId.get(id))}`);
}

/* ------------------------------------------------------------------ *
 * E. The display classes on the wire (the (e) flip + the hidden set)
 * ------------------------------------------------------------------ */

console.log(`\n## E. The display classes on the wire`);

const premium = byId.get('shanghai-gold-premium');
check(
  'THE (e) FLIP LIVE: shanghai-gold-premium PRESENT + readable on the public wire',
  premium !== undefined && premium.status !== 'unavailable' && premium.value !== null,
  premium === undefined ? 'ABSENT — the flip is NOT live' : liveLine(premium),
);
const absentExpected = [...EXPECTED.hiddenIds];
const leaked = absentExpected.filter((id) => byId.has(id));
check(
  'the 7 private/fail-closed ids ABSENT from the public projection',
  leaked.length === 0,
  leaked.length === 0 ? `all 7 absent (${absentExpected.join(' · ')})` : `LEAKED: ${leaked.join(' · ')}`,
);
const expectedOnWire = EXPECTED.registryIds - EXPECTED.hiddenIds.length;
check(
  'the wire carries exactly the expected reading count (184 − 7 hidden)',
  snapshot.readings.length === expectedOnWire,
  `${snapshot.readings.length} readings (expected ${expectedOnWire})`,
);
const absentVoters = GOLD_LANE_VOTERS.map((v) => v.id as string).filter((id) => !byId.has(id));
check(
  'all 37 voters on the live wire',
  absentVoters.length === 0,
  absentVoters.length === 0 ? '37/37 present' : `ABSENT: ${absentVoters.join(' · ')}`,
);

/* ------------------------------------------------------------------ *
 * The summary
 * ------------------------------------------------------------------ */

console.log(`\n# summary — ${failures === 0 ? 'ALL ACCEPTANCE CHECKS GREEN' : `${failures} FAILURE(S)`}`);
console.log(
  `# engine ${GOLD_LANE_VOTERS.length} seats (${GOLD_LANES.map((l) => laneCounts[l] ?? 0).join('/')}) · MIN${GOLD_LANE_MIN_FIRING} · STRONG ${GOLD_LANE_STRONG}-of-${GOLD_LANES.length}`,
);
console.log(`# register ${providers.length} rows audited (yes ${yes} · no ${no} · unknown ${unknown}) · registry ${ids.length} ids / ${infoCards.length} info cards · hidden ${overrides.hiddenIndicatorIds.length}`);
console.log(
  `# live @ ${snapshot.generatedAt}: for ${balance.counts.for} · against ${balance.counts.against} · neutral ${balance.counts.neutral} · unread ${balance.counts.unread} (net ${balance.net}) · lanes readable ${balance.lanes.filter((l) => l.readable).length}/5`,
);
if (failures > 0) {
  process.exitCode = 1;
}
