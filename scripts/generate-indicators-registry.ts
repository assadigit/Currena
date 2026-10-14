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

import { writeFileSync } from 'node:fs';
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

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'data', 'indicators.json');

const gaugeOf = new Map<string, string>();
for (const g of GAUGES) for (const id of g.members) gaugeOf.set(id, g.id);

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
  };
});

const registry = {
  $schema: 'the single indicator registry (fix spec A-01, 2026-10-14)',
  version: RULE_VERSION,
  graceDayDefaults: GRACE_DAYS,
  generatedFrom:
    'packages/insights/src/definitions.ts + src/adapters/derived.ts (READING_SOURCES) + src/gauges.ts + src/ruleVersion.ts + apps/web/src/components/insights/config/display.ts',
  textTemplates:
    'apps/web/src/i18n/insights-copy-en.ts (and insights-copy-fa.ts): every card sentence is produced from a status-keyed template (highRising / highEasing / typical / low / jumping, oneLiner fallback) interpolated with the live value — fix spec A-02.',
  indicators,
};

writeFileSync(outPath, `${JSON.stringify(registry, null, 2)}\n`);
console.log(`[registry] wrote ${indicators.length} indicators to ${outPath}`);
