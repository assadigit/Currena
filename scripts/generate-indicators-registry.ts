/**
 * Fix spec A-01 (2026-10-14): generate data/indicators.json — the SINGLE
 * indicator registry. Every card on the page is produced from a registry
 * entry; the generator walks the three code sources of truth (the
 * definitions table, the reading-source attribution map and the web
 * display/copy configuration) so the file cannot drift from the code, and
 * apps/web/src/lib/registry-sync.test.ts pins the sync in CI.
 *
 * Run: pnpm registry:generate   (repo root — writes data/indicators.json)
 */

import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// @ts-expect-error — outside this package's tsconfig rootDirs; tsx resolves it.
import { DEFINITIONS } from '../packages/insights/src/definitions';
// @ts-expect-error — same.
import { READING_SOURCES } from '../packages/insights/src/adapters/derived';
// @ts-expect-error — same.
import { GAUGES } from '../packages/insights/src/gauges';
// @ts-expect-error — same.
import { RULE_VERSION } from '../packages/insights/src/ruleVersion';
// @ts-expect-error — same.
import { staleAfterDaysFor, GRACE_DAYS } from '../packages/insights/src/scoring';
// @ts-expect-error — same.
import { DISPLAY } from '../apps/web/src/components/insights/config/display';
// @ts-expect-error — same (Step 3 §8 licence block, 2026-10-16).
import { licenceForProvider, fredLicenceForSeries, type FredCopyrightRecord, type SourceLicence } from '../packages/insights/src/licences';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'data', 'indicators.json');

const gaugeOf = new Map<string, string>();
for (const g of GAUGES) for (const id of g.members) gaugeOf.set(id, g.id);

/* ---------------- Step 3 §8: licence block + layer ---------------- */

// The T-16 FRED copyright scan (data/fred-copyright.json) decides the
// per-series public-display eligibility. Fail closed: a FRED series with no
// scan record is public 'no'.
const fredRecords: FredCopyrightRecord[] = (
  JSON.parse(readFileSync(join(here, '..', 'data', 'fred-copyright.json'), 'utf8')) as {
    records: FredCopyrightRecord[];
  }
).records;

/** Derived indicators (plain arithmetic over published inputs) — Step 3 layer 2. */
const LAYER2_IDS = new Set<string>([
  'yield-curve-10y2y',
  'gold-silver',
  'copper-gold',
  'gold-btc',
  'silver-btc',
  'fed-expectations',
  'rba-expectations',
  'au-us-10y-gap',
  'dollar-basket',
  'gold-aud',
  'govt-interest-revenue',
]);

function licenceBlockFor(def: { id: string; source: string; sourceRef: string }): SourceLicence {
  if (def.source === 'fred') {
    // sourceRef strings compose one or more FRED series ids; the licence is
    // the WORST of the legs (a citation-required leg keeps the card private).
    const tokens = def.sourceRef.match(/\b[A-Z][A-Z0-9]{3,}\b/g) ?? [];
    const matched = tokens
      .map((t) => fredRecords.find((r) => r.seriesId === t))
      .filter((r): r is FredCopyrightRecord => Boolean(r));
    if (matched.length === 0) {
      return {
        ...licenceForProvider('fred'),
        licenceName: 'FRED series — copyright not scanned (fail closed)',
        publicDisplayOk: 'no',
        termsEvidence: `No T-16 scan record matched ${def.sourceRef} — fail closed. Run scripts/fred-copyright-scan.ts.`,
      };
    }
    const worst = matched.find((r) => r.copyrightNotice) ?? matched[0]!;
    const resolved = fredLicenceForSeries(worst.seriesId, fredRecords);
    return resolved.licence;
  }
  return licenceForProvider(def.source);
}

const indicators = DEFINITIONS.map((def) => {
  const source = READING_SOURCES[def.id] ?? { name: def.sourceRef };
  const display = DISPLAY[def.id as keyof typeof DISPLAY];
  const scored = def.rule.kind !== 'info';
  return {
    id: def.id,
    title: def.name,
    area: {
      section: def.section,
      group: def.group,
      gauge: gaugeOf.get(def.id) ?? null,
      gaugeMembership: gaugeOf.has(def.id)
        ? 'scored member of the area counts (fix B-14: brent counts in prices-heat while its card renders on the prices strip)'
        : scored
          ? 'scored but outside the area counts (not expected — the sync test fails the run)'
          : 'context only — never counts',
    },
    source: {
      provider: def.source,
      name: source.name,
      url: source.url ?? null,
      seriesIdOrTable: def.sourceRef,
    },
    unit: display?.unit ?? 'ratio',
    changeUnit: def.changeKind === 'points' ? 'percentage points' : 'percent',
    cadence: def.cadence,
    maxAgeDays: staleAfterDaysFor(def) ?? null,
    maxAgeBasis: def.staleAfterDays !== undefined ? 'per-series override' : `cadence default (${String(def.cadence)})`,
    scored,
    historyWindow: '10 years of stored history (downsampled to ≤2700 points; ≥2 years of daily data)',
    rule: def.rule,
    ruleVersion: RULE_VERSION,
    layer: LAYER2_IDS.has(def.id) ? 2 : 1,
    licence: (() => {
      const l = licenceBlockFor(def);
      return {
        licenceName: l.licenceName,
        attributionText: l.attributionText,
        attributionRequired: l.attributionRequired,
        privateOk: l.privateOk,
        publicDisplayOk: l.publicDisplayOk,
        termsCheckedOn: l.termsCheckedOn,
        termsEvidence: l.termsEvidence,
        termsUrl: l.termsUrl ?? null,
      };
    })(),
  };
});

const registry = {
  $schema: 'the single indicator registry (fix spec A-01, 2026-10-14)',
  version: RULE_VERSION,
  graceDayDefaults: GRACE_DAYS,
  generatedFrom:
    'packages/insights/src/definitions.ts + src/adapters/derived.ts (READING_SOURCES) + src/gauges.ts + src/ruleVersion.ts + apps/web/src/components/insights/config/display.ts + src/licences.ts (Step 3 §8 licence block, T-16 scan data/fred-copyright.json)',
  textTemplates:
    'apps/web/src/i18n/insights-copy-en.ts (and insights-copy-fa.ts): every card sentence is produced from a status-keyed template (highRising / highEasing / typical / low / jumping, oneLiner fallback) interpolated with the live value — fix spec A-02.',
  indicators,
};

writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`[registry] wrote ${indicators.length} indicators to ${outPath}`);
