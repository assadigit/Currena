/**
 * gf-s13-verify.ts — the GF-S13 round-3 public-flip verification (the
 * D-GF-5 discipline: every number from a run). A MANUAL script, never
 * part of the test suite: the successor session's own machine half —
 *
 *  A. THE FLIP'S REGISTER PINS — the two rows the owner's round-3
 *     answers flipped, re-read from the shipped code: CLEVELAND
 *     publicDisplayOk 'yes' + the round-3 answer (a) acceptance trail in
 *     the termsEvidence (the Bank's attribution + suggested citation) ·
 *     YAHOO publicDisplayOk 'yes' + the round-3 answer (b) trail (the
 *     blanket "dont keep anything private" directive, the licence FACTS
 *     verbatim) · the FOUR that stay hidden honestly re-read (WGC
 *     pre-approval · PBoC venue-404 · fund-pages no-clean-venue — no
 *     data to show, "if you can show them") · the sources.ts
 *     ownerAccepts records for cleveland + the yahoo display directive.
 *  B. THE LICENCE REGISTER AUDIT — every SOURCE_LICENCES row: the
 *     termsEvidence string present + termsCheckedOn dated; the
 *     display-class counts (yes 30 · no 4 · unknown 3 after the flip);
 *     any row failing FAILS THE RUN.
 *  C. THE REGISTRY STATE — data/indicators.json (184 ids · 130
 *     rule:info cards) + data/site-mode-overrides.json (the public-mode
 *     hidden set, EXACTLY 4 ids — the no-data quartet) + the wiring:
 *     every one of the 37 voter ids in the registry, NONE hidden; the
 *     three flipped ids publicDisplayOk 'yes' in the audit sidecar.
 *  D. THE PRODUCTION MATRIX — the LIVE public snapshot walk
 *     (https://currena.ir/api/insights): the engine over the live
 *     readings (the rollup + the five lane states), the THREE FLIPPED
 *     CARDS' OWN LIVE LINES (cpi-nowcast · cpi-surprise ·
 *     gold-equities-ratio — PRESENT + readable PUBLICLY, the flip's own
 *     acceptance check), the (e) line still live, and the four
 *     no-data ids ABSENT (0 leaked).
 *
 * Writes NOTHING (no KV, no repo file). Read-only.
 *
 * NO FORECASTING CLAIM ANYWHERE (D-GF-3): the walk prints conditions and
 * states only; the no-edge record stands untouched.
 *
 * Usage: pnpm --filter @currena/insights exec tsx scripts/gf-s13-verify.ts [snapshotUrl]
 * (default: the production public snapshot on currena.ir)
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { goldBalance, GOLD_LANE_MIN_FIRING, GOLD_LANE_STRONG } from '../src/gold-balance';
import { GOLD_LANES, GOLD_LANE_VOTERS } from '../src/gold-score';
import { SOURCE_LICENCES } from '../src/licences';
import { SOURCE_RISK_REGISTER } from '../src/sources';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = join(HERE, '..', '..', '..', 'data', 'indicators.json');
const AUDIT_PATH = join(HERE, '..', '..', '..', 'data', 'indicator-audit.json');
const OVERRIDES_PATH = join(HERE, '..', '..', '..', 'data', 'site-mode-overrides.json');
const SNAPSHOT_URL = process.argv[2] ?? 'https://currena.ir/api/insights';

/** The expected post-flip shape (the session's own pins — a mismatch FAILS). */
const EXPECTED = {
  voters: 37,
  lanes: { 'borrowing-costs': 7, dollar: 7, stress: 11, inflation: 10, flows: 2 },
  minFiring: 2,
  strong: 4,
  laneCount: 5,
  registryIds: 184,
  infoCards: 130,
  /** The hidden set AFTER the round-3 flip: the no-data quartet only. */
  hiddenIds: ['etf-short-interest', 'official-gold-demand', 'wgc-cb-demand', 'wgc-etf-holdings'] as const,
  /** The three ids the round-3 answers flipped PUBLIC. */
  flippedIds: ['cpi-nowcast', 'cpi-surprise', 'gold-equities-ratio'] as const,
};

let failures = 0;

function check(label: string, ok: boolean, detail: string): void {
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${detail}`);
  if (!ok) failures++;
}

interface Reading {
  id: string;
  value: number | null;
  asOf: string | null;
  status?: string;
  pct10y?: number | null;
  chg30d?: number | null;
}

interface Snapshot {
  generatedAt: string;
  readings: Reading[];
}

async function main(): Promise<void> {
  console.log(`# GF-S13 round-3 public-flip verification — ${new Date().toISOString()}`);
  console.log(`# snapshot: ${SNAPSHOT_URL}\n`);

  /* ---------- A. The flip's register pins (re-read from the code) ---------- */
  console.log('## A. The flip\'s own register pins (the shipped code, re-read)');

  const cleveland = SOURCE_LICENCES.cleveland!;
  check(
    'the CLEVELAND row publicDisplayOk',
    cleveland.publicDisplayOk === 'yes',
    `'${cleveland.publicDisplayOk}' (the round-3 answer (a), 2026-11-07)`,
  );
  check(
    'the CLEVELAND acceptance trail present',
    cleveland.termsEvidence.includes('round-3 answer (a)') && cleveland.termsEvidence.includes('owner ACCEPTED this class'),
    `licenceName "${cleveland.licenceName}"`,
  );
  check(
    'the CLEVELAND attribution + suggested citation ride the row',
    cleveland.attributionRequired && cleveland.attributionText.includes('Federal Reserve Bank of Cleveland'),
    `"${cleveland.attributionText}"`,
  );

  const yahoo = SOURCE_LICENCES.yahoo!;
  check(
    'the YAHOO row publicDisplayOk',
    yahoo.publicDisplayOk === 'yes',
    `'${yahoo.publicDisplayOk}' (the round-3 answer (b) — the blanket directive, 2026-11-07)`,
  );
  check(
    'the YAHOO acceptance trail present, the licence FACTS verbatim',
    yahoo.termsEvidence.includes('round-3 answer (b)') && yahoo.licenceName === 'No reuse licence offered (unofficial endpoints)',
    `licenceName "${yahoo.licenceName}" (unchanged — the facts stay verbatim)`,
  );

  const sge = SOURCE_LICENCES.sge!;
  check('the SGE (e) acceptance still stands', sge.publicDisplayOk === 'yes', `the round-2 answer (e), unchanged`);

  for (const provider of ['wgc', 'pboc', 'fund-pages'] as const) {
    const row = SOURCE_LICENCES[provider]!;
    check(
      `the ${provider} row stays fail-closed (no data to show)`,
      row.publicDisplayOk === 'no',
      `'${row.publicDisplayOk}' — ${row.licenceName.slice(0, 70)}`,
    );
  }
  const wgcRisk = SOURCE_RISK_REGISTER.wgc!;
  check(
    'the WGC kill switch (enabled false — never fetched)',
    wgcRisk.enabled === false && wgcRisk.level === 'L3',
    `level ${wgcRisk.level}, ownerAccepts ${String(wgcRisk.ownerAccepts)} — the pre-approval class`,
  );

  const clevelandRisk = SOURCE_RISK_REGISTER.cleveland!;
  check(
    "the sources.ts cleveland row's ownerAccepts record",
    clevelandRisk.ownerAccepts === true && clevelandRisk.notes.includes('round-3 answer (a)'),
    'the D-GF-1 mechanism mirror (the round-1/(e) precedent)',
  );
  const yahooRisk = SOURCE_RISK_REGISTER.yahoo!;
  check(
    "the sources.ts yahoo row's round-3 display directive",
    yahooRisk.ownerAccepts === true && yahooRisk.notes.includes('round-3 answer (b)'),
    'the class-wide display acceptance recorded in the register notes',
  );

  /* ---------- B. The licence register audit ---------- */
  console.log('\n## B. The licence register audit (every row evidenced + dated)');

  const licenceRows = Object.values(SOURCE_LICENCES);
  let auditFail = 0;
  const displayCounts = { yes: 0, no: 0, unknown: 0 };
  for (const row of licenceRows) {
    if (row.termsEvidence.trim() === '' || !/^\d{4}-\d{2}-\d{2}$/.test(row.termsCheckedOn)) auditFail++;
    displayCounts[row.publicDisplayOk]++;
  }
  check(
    'every provider row carries its evidence string + a dated termsCheckedOn',
    auditFail === 0,
    `${licenceRows.length} rows · display classes: yes ${displayCounts.yes} · no ${displayCounts.no} · unknown ${displayCounts.unknown}`,
  );
  check(
    'the display-class counts after the flip (yes 28 → 30, no 6 → 4)',
    displayCounts.yes === 30 && displayCounts.no === 4 && displayCounts.unknown === 3,
    `yes ${displayCounts.yes} · no ${displayCounts.no} · unknown ${displayCounts.unknown} (unknown fails closed under T-15)`,
  );

  /* ---------- C. The registry state ---------- */
  console.log('\n## C. The registry state (the generated files, re-read)');

  const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')) as {
    indicators: { id: string; rule: { kind: string }; licence: { publicDisplayOk: string } }[];
  };
  const auditSidecar = JSON.parse(readFileSync(AUDIT_PATH, 'utf8')) as {
    indicators: { id: string; publicDisplayOk: string; enabled: boolean; level: string }[];
  };
  const overrides = JSON.parse(readFileSync(OVERRIDES_PATH, 'utf8')) as {
    hiddenIndicatorIds: string[];
    hiddenBoards: string[];
  };

  const infoCards = registry.indicators.filter((i) => i.rule.kind === 'info').length;
  check('the registry ids', registry.indicators.length === EXPECTED.registryIds, `${registry.indicators.length} ids`);
  check('the rule:info context cards', infoCards === EXPECTED.infoCards, `${infoCards} cards`);

  const hiddenSorted = [...overrides.hiddenIndicatorIds].sort();
  const expectedHidden = [...EXPECTED.hiddenIds].sort();
  check(
    'the public-mode hidden set (exactly the no-data quartet)',
    JSON.stringify(hiddenSorted) === JSON.stringify(expectedHidden),
    `${hiddenSorted.length} ids: ${hiddenSorted.join(' · ')}`,
  );
  check('no hidden world board', overrides.hiddenBoards.length === 0, `hiddenBoards [${overrides.hiddenBoards.join(', ')}]`);

  for (const id of EXPECTED.flippedIds) {
    const entry = auditSidecar.indicators.find((i) => i.id === id);
    check(
      `the flipped id ${id} publicDisplayOk yes in the sidecar`,
      entry?.publicDisplayOk === 'yes' && entry?.enabled === true,
      `level ${entry?.level} · enabled ${String(entry?.enabled)} — the M-2 bounded public history follows automatically`,
    );
  }

  const laneCounts: Record<string, number> = {};
  for (const v of GOLD_LANE_VOTERS) laneCounts[v.lane] = (laneCounts[v.lane] ?? 0) + 1;
  check(
    'GOLD_LANE_VOTERS seat count UNTOUCHED',
    GOLD_LANE_VOTERS.length === EXPECTED.voters,
    `${GOLD_LANE_VOTERS.length} seats (7/7/11/10/2) — display classes only, no seat change`,
  );
  check(
    'the lane shape',
    Object.keys(EXPECTED.lanes).every((lane) => laneCounts[lane] === EXPECTED.lanes[lane as keyof typeof EXPECTED.lanes]) &&
      GOLD_LANES.length === EXPECTED.laneCount,
    `${GOLD_LANES.join(' / ')} — MIN${GOLD_LANE_MIN_FIRING}, STRONG ${GOLD_LANE_STRONG}-of-${GOLD_LANES.length}`,
  );
  const hiddenSet = new Set(overrides.hiddenIndicatorIds);
  const hiddenVoters = GOLD_LANE_VOTERS.map((v) => v.id as string).filter((id) => hiddenSet.has(id));
  check(
    'no voter sits in the hidden set',
    hiddenVoters.length === 0,
    hiddenVoters.length === 0 ? '0 of 37 hidden (the meter\'s own seats are public by construction)' : `HIDDEN: ${hiddenVoters.join(' · ')}`,
  );
  const registryIds = new Set(registry.indicators.map((i) => i.id));
  const missingVoters = GOLD_LANE_VOTERS.map((v) => v.id as string).filter((id) => !registryIds.has(id));
  check('every voter id exists in the registry', missingVoters.length === 0, missingVoters.length === 0 ? '37/37 present' : `MISSING: ${missingVoters.join(' · ')}`);

  /* ---------- D. The production matrix (the live public snapshot) ---------- */
  console.log('\n## D. The production matrix (the live public snapshot walk)');

  let snapshot: Snapshot | undefined;
  try {
    const res = await fetch(SNAPSHOT_URL, { headers: { 'user-agent': 'CurrenaDashboard/1.0 (gf-s13-verify)' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    snapshot = (await res.json()) as Snapshot;
  } catch (err) {
    console.log(`  ✗ the live snapshot fetch FAILED: ${err instanceof Error ? err.message : String(err)}`);
    failures++;
  }

  if (snapshot !== undefined) {
    const readings = new Map(snapshot.readings.map((r) => [r.id, r]));
    console.log(`  · generatedAt ${snapshot.generatedAt} · ${snapshot.readings.length} readings on the wire`);

    const balance = goldBalance(snapshot.readings as never[]);
    console.log(
      `  · the engine over the live readings: for ${balance.counts.for} · against ${balance.counts.against} · neutral ${balance.counts.neutral} · unread ${balance.counts.unread} (net ${balance.net}, readable ${balance.readable})`,
    );
    for (const lane of balance.lanes) {
      console.log(
        `    - ${lane.lane}: ${lane.side}${lane.split ? ' (split)' : ''} · readable ${lane.readable} · firing ${lane.firing} · supports ${lane.supports} · pressures ${lane.pressures}`,
      );
    }

    console.log('  · THE THREE FLIPPED CARDS\' OWN LIVE LINES (the round-3 flip\'s acceptance check):');
    for (const id of EXPECTED.flippedIds) {
      const r = readings.get(id);
      check(
        `the flipped card ${id} PRESENT + readable PUBLICLY`,
        r !== undefined,
        r === undefined
          ? 'ABSENT from the projection (the flip not yet live on this snapshot)'
          : `${r.value ?? 'no value'} @ ${r.asOf ?? '—'} [${r.status ?? '—'}]${r.pct10y !== undefined && r.pct10y !== null ? ` pct10y=${Math.round(r.pct10y)}%` : ''}`,
      );
    }

    const sgeLine = readings.get('shanghai-gold-premium');
    check(
      "the (e) line still live (the round-2 flip, unchanged)",
      sgeLine !== undefined,
      sgeLine === undefined ? 'ABSENT (regression!)' : `${sgeLine.value} @ ${sgeLine.asOf} [${sgeLine.status ?? '—'}]`,
    );

    console.log('  · the four no-data ids (the honest absences):');
    for (const id of EXPECTED.hiddenIds) {
      check(`the no-data id ${id} ABSENT (0 leaked)`, !readings.has(id), readings.has(id) ? 'LEAKED onto the public wire!' : 'absent');
    }

    check(
      'the wire count exact (184 − 4 = 180)',
      snapshot.readings.length === EXPECTED.registryIds - EXPECTED.hiddenIds.length,
      `${snapshot.readings.length} readings`,
    );
  }

  console.log(`\n# ${failures === 0 ? 'ALL CHECKS GREEN' : `${failures} FAILURE(S)`}`);
  process.exitCode = failures === 0 ? 0 : 1;
}

await main();
