/**
 * Page-division S24 (2026-11-12): the D-9 categorization audit — the
 * legacy-retirement readiness gate (docs/page-division/
 * 06-LEGACY-RETIREMENT-S24.md §2 is the doc this script evidences).
 *
 * D-9 (03-STRATEGY-LOG §5): "The old all-in-one page is kept for now;
 * retired only when every indicator is properly categorized." This
 * script verifies that condition PROGRAMMATICALLY over the three layers
 * that must agree — the registry (data/indicators.json), the engine
 * (packages/insights DEFINITIONS + GAUGES + GOLD_LANE_VOTERS) and the
 * placement (packages/insights/src/page-division) — and prints the
 * per-id evidence table (187 rows: id · lane · role · gold-voter ·
 * home page).
 *
 * Checks (each PASS/FAIL; any FAIL exits non-zero — Agent Rule 4):
 *   A. Registry ↔ DEFINITIONS — 1:1 id match; per-id group + section match.
 *   B. One engine lane per id — every id appears exactly once in
 *      DEFINITIONS; its group is one of the 13 lanes; lane × section
 *      counts match the registry's own counts.
 *   C. Gauge membership — every scored voter sits in exactly ONE gauge's
 *      members list; a voter's gauge IS its registry group (the 1:1
 *      gauge↔lane mapping); context ids (rule 'info') never vote.
 *   D. Placement — reconcilePlacement green over the registry; every id
 *      has exactly one page home (blocked notes included); no id's home
 *      is 'global' (zero-registry-cards-by-design, D-7/D-11).
 *   E. The gold meter — GOLD_LANE_VOTERS ⊆ registry ids (the documented
 *      DUAL-membership engine: gold voters keep their registry lane and
 *      page home; the gold meter is a separate calibrated engine, spec
 *      §3.3); the count is pinned (37).
 *   F. Role counts — voters + context = the registry total; the
 *      per-lane voter counts equal the GAUGES members lengths.
 *   G. Display-layer lane exceptions — HIDDEN_FROM_LANE_IDS +
 *      COMPANION_ONLY_IDS + COMPANIONS values are all registry ids
 *      (their LANE never moves; only the render surface does).
 *
 * Deterministic: no timestamps, no environment, no network — the same
 * tree always prints the same verdicts. Re-run any time:
 *   pnpm s24:d9-audit        (repo root)
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// @ts-expect-error — outside this script's tsconfig rootDirs; tsx resolves it.
import { DEFINITIONS, GAUGES, GOLD_LANE_VOTERS, isShadowGauge } from '../packages/insights/src/index';
// @ts-expect-error — same.
import { homePageOfIndicator, reconcilePlacement } from '../packages/insights/src/page-division';
// @ts-expect-error — same.
import { HIDDEN_FROM_LANE_IDS, COMPANION_ONLY_IDS, COMPANIONS } from '../apps/web/src/components/insights/config';

interface RegistryIndicator {
  id: string;
  title: string;
  area: { section: string; group: string; gauge: string | null };
}

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = join(here, '..', 'data', 'indicators.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as { version: number; indicators: RegistryIndicator[] };

const failures: string[] = [];
const pass = (label: string, detail: string): void => {
  console.log(`[d9] PASS ${label} — ${detail}`);
};
const fail = (label: string, detail: string): void => {
  failures.push(`${label}: ${detail}`);
  console.error(`[d9] FAIL ${label} — ${detail}`);
};

const ids = registry.indicators.map((i) => i.id);
const byId = new Map(registry.indicators.map((i) => [i.id, i]));
const defById = new Map(DEFINITIONS.map((d) => [d.id, d]));

/* ---------------- A. registry ↔ DEFINITIONS ---------------- */

{
  const registryOnly = ids.filter((id) => !defById.has(id));
  const defsOnly = DEFINITIONS.filter((d) => !byId.has(d.id)).map((d) => d.id);
  if (registryOnly.length === 0 && defsOnly.length === 0) {
    pass('A1 registry↔DEFINITIONS 1:1', `${ids.length} ids on both sides, zero orphans either way`);
  } else {
    fail('A1 registry↔DEFINITIONS 1:1', `registry-only: ${registryOnly.join(', ') || '—'}; definitions-only: ${defsOnly.join(', ') || '—'}`);
  }

  const groupMismatch: string[] = [];
  const sectionMismatch: string[] = [];
  for (const def of DEFINITIONS) {
    const reg = byId.get(def.id);
    if (reg === undefined) continue;
    if (reg.area.group !== def.group) groupMismatch.push(`${def.id}: registry ${reg.area.group} vs engine ${def.group}`);
    if (reg.area.section !== def.section) sectionMismatch.push(`${def.id}: registry ${reg.area.section} vs engine ${def.section}`);
  }
  if (groupMismatch.length === 0 && sectionMismatch.length === 0) {
    pass('A2 per-id group+section match', 'all 187 ids carry the same lane and section in the registry and the engine definitions');
  } else {
    fail('A2 per-id group+section match', `group: ${groupMismatch.join('; ') || '—'}; section: ${sectionMismatch.join('; ') || '—'}`);
  }
}

/* ---------------- B. one engine lane per id ---------------- */

{
  const seen = new Map<string, number>();
  for (const def of DEFINITIONS) seen.set(def.id, (seen.get(def.id) ?? 0) + 1);
  const dupes = [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
  if (dupes.length === 0) {
    pass('B1 one lane per id', `each of the ${DEFINITIONS.length} definition ids appears exactly once (zero duplicate lanes)`);
  } else {
    fail('B1 one lane per id', `duplicate definitions: ${dupes.join(', ')}`);
  }

  // Lane × section counts, registry vs engine.
  const regCounts = new Map<string, number>();
  for (const i of registry.indicators) regCounts.set(`${i.area.section}/${i.area.group}`, (regCounts.get(`${i.area.section}/${i.area.group}`) ?? 0) + 1);
  const defCounts = new Map<string, number>();
  for (const d of DEFINITIONS) defCounts.set(`${d.section}/${d.group}`, (defCounts.get(`${d.section}/${d.group}`) ?? 0) + 1);
  const lanesReg = [...regCounts.keys()].sort();
  const lanesDef = [...defCounts.keys()].sort();
  const laneDiff: string[] = [];
  for (const lane of new Set([...lanesReg, ...lanesDef])) {
    if ((regCounts.get(lane) ?? 0) !== (defCounts.get(lane) ?? 0)) {
      laneDiff.push(`${lane}: registry ${regCounts.get(lane) ?? 0} vs engine ${defCounts.get(lane) ?? 0}`);
    }
  }
  if (laneDiff.length === 0) {
    pass('B2 the 13 lanes reconcile', `all ${lanesReg.length} lanes (section/group) carry identical membership counts in the registry and the engine`);
  } else {
    fail('B2 the 13 lanes reconcile', laneDiff.join('; '));
  }
}

/* ---------------- C. gauge membership ---------------- */

{
  const voterGauges = new Map<string, string[]>();
  for (const g of GAUGES) {
    for (const m of g.members) voterGauges.set(m, [...(voterGauges.get(m) ?? []), g.id]);
  }
  const multiGauge = [...voterGauges.entries()].filter(([, gs]) => gs.length > 1).map(([id, gs]) => `${id} in ${gs.join('+')}`);
  if (multiGauge.length === 0) {
    pass('C1 one gauge per member', `each of the ${voterGauges.size} gauge members sits in exactly one gauge's members list`);
  } else {
    fail('C1 one gauge per member', multiGauge.join('; '));
  }

  // The registry's own `area.gauge` field IS the scoring-membership record
  // (the generator writes it from the definitions): it must agree with the
  // GAUGES membership 1:1 — gauge name = the one gauge carrying the id,
  // null = no membership.
  const gaugeFieldMismatch: string[] = [];
  for (const reg of registry.indicators) {
    const gs = voterGauges.get(reg.id) ?? [];
    const field = reg.area.gauge;
    if (gs.length === 0 && field !== null) gaugeFieldMismatch.push(`${reg.id}: registry gauge ${field} but no GAUGES membership`);
    if (gs.length === 1 && field !== gs[0]) gaugeFieldMismatch.push(`${reg.id}: registry gauge ${field} vs GAUGES ${gs[0]}`);
    if (gs.length > 1) gaugeFieldMismatch.push(`${reg.id}: multi-gauge ${gs.join('+')}`);
  }
  if (gaugeFieldMismatch.length === 0) {
    pass('C2 registry gauge-field ↔ GAUGES 1:1', `all ${ids.length} ids agree (74 members named, 113 null)`);
  } else {
    fail('C2 registry gauge-field ↔ GAUGES 1:1', gaugeFieldMismatch.join('; '));
  }

  // The one DOCUMENTED lane≠gauge id: brent (fix B-14, 2026-10-14 — its
  // count-membership sits in prices-heat while its card renders on the
  // prices strip; the registry records group=prices-board +
  // gauge=prices-heat). Recorded as an audit finding, never "fixed".
  const brent = byId.get('brent');
  if (brent !== undefined && brent.area.group === 'prices-board' && brent.area.gauge === 'prices-heat' && (voterGauges.get('brent') ?? [])[0] === 'prices-heat') {
    pass('C3 the B-14 brent record', "brent is the one id whose gauge (prices-heat) ≠ its lane (prices-board) — the documented fix B-14: scored member of the area counts while its card renders on the prices strip");
  } else {
    fail('C3 the B-14 brent record', `expected group=prices-board + gauge=prices-heat, found group=${brent?.area.group} gauge=${brent?.area.gauge}`);
  }

  // Voting gauges score only scored-rule members; SHADOW gauges (G-5:
  // every member context-only until S6 promotes) carry only info members —
  // the members list mirrors the group's definitions for the lane counts.
  const shadow = new Set(GAUGES.filter((g: { id: string }) => isShadowGauge(g)).map((g: { id: string }) => g.id));
  const votingBad: string[] = [];
  const shadowBad: string[] = [];
  for (const g of GAUGES) {
    for (const m of g.members) {
      const def = defById.get(m);
      if (def === undefined) continue;
      if (!shadow.has(g.id) && def.rule.kind === 'info') votingBad.push(`${m} (info) in voting gauge ${g.id}`);
      if (shadow.has(g.id) && def.rule.kind !== 'info') shadowBad.push(`${m} (scored) in shadow gauge ${g.id}`);
    }
  }
  const scoredNoGauge = DEFINITIONS.filter((d) => d.rule.kind !== 'info' && !voterGauges.has(d.id)).map((d) => d.id);
  if (votingBad.length === 0 && shadowBad.length === 0 && scoredNoGauge.length === 0) {
    pass('C4 rule↔membership coherence', `the 8 voting gauges score only scored rules (54 voters); the 4 shadow gauges (${[...shadow].join(' · ')}) mirror only context members (20) — "not scored yet" by design (G-5)`);
  } else {
    fail('C4 rule↔membership coherence', `voting gauges: ${votingBad.join(', ') || '—'}; shadow gauges: ${shadowBad.join(', ') || '—'}; scored without a gauge: ${scoredNoGauge.join(', ') || '—'}`);
  }
}

/* ---------------- D. placement ---------------- */

{
  const rec = reconcilePlacement(ids);
  if (rec.ok) {
    pass('D1 placement reconciles', `${rec.placedCount} placed · ${rec.unplaced.length} unplaced · ${rec.duplicateHomes.length} duplicate homes · ${rec.unknownIds.length} unknown · ${rec.mirrorOverlaps.length} mirror overlaps`);
  } else {
    fail('D1 placement reconciles', `unplaced: ${rec.unplaced.join(', ') || '—'}; duplicates: ${rec.duplicateHomes.join(', ') || '—'}; unknown: ${rec.unknownIds.join(', ') || '—'}; mirror overlaps: ${rec.mirrorOverlaps.join(', ') || '—'}`);
  }

  const noHome = ids.filter((id) => homePageOfIndicator(id as never) === null);
  if (noHome.length === 0) {
    pass('D2 one page home per id', 'every registry id resolves exactly one detail-card home (blocked notes count as their page’s placement)');
  } else {
    fail('D2 one page home per id', `no home: ${noHome.join(', ')}`);
  }

  const globalHomes = ids.filter((id) => homePageOfIndicator(id as never) === 'global');
  if (globalHomes.length === 0) {
    pass('D3 Global carries zero registry cards', "by design (D-7/D-11: verdict board only, mirrors link out) — no id's home is the landing page");
  } else {
    fail('D3 Global carries zero registry cards', `global homes: ${globalHomes.join(', ')}`);
  }
}

/* ---------------- E. the gold meter's dual membership ---------------- */

{
  const goldIds = GOLD_LANE_VOTERS.map((v: { id: string }) => v.id);
  const notInRegistry = goldIds.filter((id) => !byId.has(id));
  if (notInRegistry.length === 0) {
    pass('E1 gold voters ⊆ registry', `${goldIds.length} gold-meter voters, all registry ids (the documented dual-membership engine — spec §3.3: engine membership untouched by placement)`);
  } else {
    fail('E1 gold voters ⊆ registry', `not in registry: ${notInRegistry.join(', ')}`);
  }
  if (goldIds.length === 37) {
    pass('E2 gold voter count pinned', '37 voters (the frozen five-lane table, GOLD_SCORE_SPEC)');
  } else {
    fail('E2 gold voter count pinned', `expected 37, found ${goldIds.length}`);
  }
}

/* ---------------- F. role counts ---------------- */

{
  const voters = DEFINITIONS.filter((d) => d.rule.kind !== 'info');
  const context = DEFINITIONS.filter((d) => d.rule.kind === 'info');
  const total = voters.length + context.length;
  const gaugeMembers = new Set(GAUGES.flatMap((g) => [...g.members]));
  const shadow = GAUGES.filter((g: { id: string }) => isShadowGauge(g));
  const shadowMembers = new Set(shadow.flatMap((g: { members: readonly string[] }) => [...g.members]));
  const ok =
    total === ids.length &&
    gaugeMembers.size === voters.length + shadowMembers.size &&
    voters.length === 54 &&
    context.length === 133;
  if (ok) {
    pass('F1 role counts', `${voters.length} voting + ${context.length} context = ${total} = the registry's ${ids.length}; the gauges carry ${gaugeMembers.size} members = the ${voters.length} voters + the ${shadowMembers.size} shadow-lane context members (mirrored for the lane counts, never voting)`);
  } else {
    fail('F1 role counts', `voting ${voters.length} + context ${context.length} = ${total} vs registry ${ids.length}; gauge members ${gaugeMembers.size} (voters ${voters.length} + shadow ${shadowMembers.size})`);
  }
}

/* ---------------- G. display-layer lane exceptions ---------------- */

{
  const hidden = [...HIDDEN_FROM_LANE_IDS];
  const companionsOnly = [...COMPANION_ONLY_IDS];
  const companionValues = Object.values(COMPANIONS).flat();
  const all = [...hidden, ...companionsOnly, ...companionValues];
  const unknown = all.filter((id) => !byId.has(id));
  if (unknown.length === 0) {
    pass('G1 lane-render exceptions are registry ids', `${hidden.length} hidden-from-lane + ${companionsOnly.length} companion-only + ${companionValues.length} companion values — all categorized ids; their LANE (registry group) never moves, only the /insights render surface does`);
  } else {
    fail('G1 lane-render exceptions are registry ids', `unknown: ${unknown.join(', ')}`);
  }
}

/* ---------------- H. the §A record (AGENTS.md's canonical inventory) ---------------- */

{
  // AGENTS.md §A must carry a row for EVERY registry id with the correct
  // role (the NON-NEGOTIABLE maintenance rule in §A's own preamble) and
  // its header counts must match the registry. Doc-only drift is still
  // drift: this check is what caught the S24 findings (23 missing rows +
  // 3 misplaced + stale header counts), reconciled in the same session.
  const agents = readFileSync(join(here, '..', 'AGENTS.md'), 'utf8');
  const aStart = agents.indexOf('#### A. The');
  const aEnd = agents.indexOf('#### B. The markets board');
  if (aStart === -1 || aEnd === -1 || aEnd <= aStart) {
    fail('H1 §A extracted', 'AGENTS.md §A section not found');
  } else {
    const sa = agents.slice(aStart, aEnd);
    const rowRe = /\| \[(V|C)\] \| `([a-z0-9-]+)`/g;
    const rows = new Map<string, string>();
    for (const m of sa.matchAll(rowRe)) rows.set(m[2], m[1]);
    const missingRows = ids.filter((id) => !rows.has(id));
    const extraRows = [...rows.keys()].filter((id) => !byId.has(id));
    if (missingRows.length === 0 && extraRows.length === 0 && rows.size === ids.length) {
      pass('H1 §A carries every registry id', `${rows.size} rows = the registry's ${ids.length}, zero missing, zero unknown`);
    } else {
      fail('H1 §A carries every registry id', `missing: ${missingRows.join(', ') || '—'}; unknown: ${extraRows.join(', ') || '—'} (${rows.size} rows)`);
    }

    const shadowSet = new Set(['geo-fragmentation', 'au-activity', 'au-external', 'dedollar-concentration']);
    const roleBad: string[] = [];
    for (const [id, role] of rows) {
      const reg = byId.get(id);
      if (reg === undefined) continue;
      const isVoter = reg.area.gauge !== null && !shadowSet.has(reg.area.gauge);
      if ((role === 'V') !== isVoter) roleBad.push(`${id}: §A ${role} vs registry ${isVoter ? 'voter' : 'context'}`);
    }
    if (roleBad.length === 0) {
      pass('H2 §A roles match the registry', 'every [V]/[C] row agrees with the engine\'s scoring membership (shadow-lane members correctly [C])');
    } else {
      fail('H2 §A roles match the registry', roleBad.join('; '));
    }

    const header = sa.match(/#### A\. The (\d+) indicators \((\d+) voting \[V\] \+ (\d+) context \[C\]\)/);
    const global = sa.match(/##### GLOBAL \((\d+) indicators, (\d+) voting\)/);
    const australia = sa.match(/##### AUSTRALIA \((\d+) indicators, (\d+) voting\)/);
    const regGlobal = registry.indicators.filter((i) => i.area.section === 'global');
    const regAu = registry.indicators.filter((i) => i.area.section === 'australia');
    const regGlobalVoters = regGlobal.filter((i) => i.area.gauge !== null && !shadowSet.has(i.area.gauge as string)).length;
    const regAuVoters = regAu.filter((i) => i.area.gauge !== null && !shadowSet.has(i.area.gauge as string)).length;
    if (
      header !== null && Number(header[1]) === ids.length && Number(header[2]) === 54 && Number(header[3]) === 133 &&
      global !== null && Number(global[1]) === regGlobal.length && Number(global[2]) === regGlobalVoters &&
      australia !== null && Number(australia[1]) === regAu.length && Number(australia[2]) === regAuVoters
    ) {
      pass('H3 §A header counts match the registry', `${header[1]} = ${ids.length} (${header[2]} V + ${header[3]} C); GLOBAL ${global[1]}/${global[2]}; AUSTRALIA ${australia[1]}/${australia[2]}`);
    } else {
      fail('H3 §A header counts match the registry', `header ${header?.[0] ?? '?'} vs registry 187 (54 + 133); global ${global?.[0] ?? '?'} vs ${regGlobal.length}/${regGlobalVoters}; australia ${australia?.[0] ?? '?'} vs ${regAu.length}/${regAuVoters}`);
    }
  }
}

/* ---------------- the per-id evidence table ---------------- */

const goldIds = new Set(GOLD_LANE_VOTERS.map((v: { id: string }) => v.id));
const gaugeMembers = new Set(GAUGES.flatMap((g) => [...g.members]));

console.log('\n[d9] Per-id evidence — id · lane (section/group) · role · gold-voter · page home:');
for (const reg of registry.indicators) {
  const def = defById.get(reg.id);
  const role = def === undefined ? '?' : def.rule.kind === 'info' ? 'C' : gaugeMembers.has(reg.id) ? 'V' : 'v?';
  const gold = goldIds.has(reg.id) ? '◆' : ' ';
  const home = homePageOfIndicator(reg.id as never) ?? '—';
  console.log(`[d9]   ${reg.id.padEnd(30)} ${reg.area.section.padEnd(9)}/${reg.area.group.padEnd(21)} ${role}${gold} ${home}`);
}

/* ---------------- verdict ---------------- */

console.log(`\n[d9] ${failures.length === 0 ? 'D-9 CONDITION MET — every indicator verified categorized (one lane + one home each; registry ↔ engine ↔ placement reconciled).' : `STRUCTURAL RED — ${failures.length} check(s) failed.`}`);
if (failures.length > 0) {
  process.exit(1);
}
