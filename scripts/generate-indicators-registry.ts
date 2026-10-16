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
const auditPath = join(here, '..', 'data', 'indicator-audit.json');

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

/**
 * Defect E-01 / LR-02 (2026-10-16): the card ids whose VALUE (history or
 * live point) comes partly from Yahoo Finance's unofficial endpoints, with
 * the full leg list. The licence is the WORST of the legs — a Yahoo leg
 * (publicDisplayOk 'no') makes the whole card private-only, so no
 * Yahoo-sourced value can ever reach a future public mode (T-15).
 * Legs not listed here resolve from the definition's own source.
 */
const UPSTREAM_LEGS: Readonly<Record<string, readonly string[]>> = {
  brent: ['fred:DCOILBRENTEU', 'yahoo:BZ=F'], // EIA spot extended by the BZ=F gap-fill
  'gold-usd': ['gold-api:XAU', 'yahoo:GC=F'], // Yahoo 10y history + gold-api live spot
  'silver-usd': ['gold-api:XAG', 'yahoo:SI=F'],
  'btc-usd': ['gold-api:BTC', 'yahoo:BTC-USD'],
  'gold-silver': ['world-bank', 'gold-api'],
  'copper-gold': ['world-bank'],
  'copper-usd': ['gold-api:HG', 'world-bank'],
  'gold-aud': ['gold-api:XAU', 'frankfurter'],
  'gold-btc': ['gold-api:XAU', 'gold-api:BTC'],
  'silver-btc': ['gold-api:XAG', 'gold-api:BTC'],
  'dollar-basket': ['frankfurter'],
  'fed-expectations': ['fred:DGS2', 'fred:DFEDTARL', 'fred:DFEDTARU'],
  'rba-expectations': ['rba:F2', 'rba:F1'],
  'au-us-10y-gap': ['rba:F2', 'fred:DGS10'],
  'govt-interest-revenue': ['fred:A091RC1Q027SBEA', 'fred:W006RC1Q027SBEA'],
  'yield-curve-10y2y': ['fred:T10Y2Y'],
};

/** The worse of two public-display verdicts (fail-closed order). */
function worstDisplay(a: string, b: string): string {
  const rank = (v: string): number => (v === 'yes' ? 0 : v === 'unknown' ? 1 : 2);
  return rank(a) >= rank(b) ? a : b;
}

/** The licence of one leg token ('provider' or 'provider:SERIES'). */
function licenceOfLeg(leg: string): SourceLicence {
  const [provider, series] = leg.split(':');
  if (provider === 'fred' && series !== undefined) {
    const rec = fredRecords.find((r) => r.seriesId === series);
    if (rec !== undefined) return fredLicenceForSeries(rec.seriesId, fredRecords).licence;
    return { ...licenceForProvider('fred'), publicDisplayOk: 'no' }; // unscanned series fail closed
  }
  return licenceForProvider(provider ?? leg);
}

function licenceBlockFor(def: { id: string; source: string; sourceRef: string }): SourceLicence {
  // E-01/LR-02: walk the card's full upstream legs when the map has them.
  const legs = UPSTREAM_LEGS[def.id];
  if (legs !== undefined) {
    const licences = legs.map(licenceOfLeg);
    const worst = licences.reduce((acc, l) => ({ ...l, publicDisplayOk: worstDisplay(acc.publicDisplayOk, l.publicDisplayOk) }));
    return {
      ...worst,
      termsEvidence: `${worst.termsEvidence} · Legs (${legs.join(', ')}): the WORST leg decides — derived per defect E-01/LR-02 (T-15 walks the inputs).`,
    };
  }
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

/* ------------------------------------------------------------------ *
 * Defect E-23 (2026-10-16): the compact AUDIT sidecar — one entry per
 * indicator with the licence and rule facts the full-page export needs
 * (licence name, public-display verdict, max age, the rule JSON verbatim,
 * the rule version). The export's lazy chunk imports THIS file (a few KB),
 * never the whole registry — the full registry stays a build-time pin
 * (registry-sync.test.ts), the audit sidecar is the runtime licence truth.
 * ------------------------------------------------------------------ */

const audit = {
  $schema: 'per-indicator licence + rule facts for the full export (defect E-23) — generated by scripts/generate-indicators-registry.ts',
  version: RULE_VERSION,
  indicators: indicators.map((i) => ({
    id: i.id,
    licenceName: i.licence.licenceName,
    publicDisplayOk: i.licence.publicDisplayOk,
    privateOk: i.licence.privateOk,
    maxAgeDays: i.maxAgeDays,
    ruleVersion: i.ruleVersion,
    /** The rule JSON VERBATIM (never a paraphrase — no invented semantics). */
    rule: JSON.stringify(i.rule),
  })),
};
writeFileSync(auditPath, `${JSON.stringify(audit, null, 2)}\n`);
console.log(`[registry] wrote ${audit.indicators.length} audit entries to ${auditPath}`);

/* ------------------------------------------------------------------ *
 * Public mode (2026-10-19 owner decree; Step 3 §2.2 AC-08 + T-15):
 * the SINGLE generated source for what a SITE_MODE=public deployment
 * must hide — the fail-closed set of indicators whose licence verdict
 * is anything other than 'yes' ('no' and fail-closed 'unknown' alike),
 * plus the two world boards (EODHD/Yahoo-backed end to end). Consumers:
 *   - scripts/check-site-mode.mjs   (the T-15 build gate)
 *   - apps/api/src/public-mode.ts   (the Worker's serve-time hidden set)
 *   - packages/insights             (projectSnapshotToPublic — the
 *                                     public projection's subset)
 * Changing ANY licence verdict means re-running this generator — the
 * pinning test cross-checks this file against the audit sidecar.
 * ------------------------------------------------------------------ */

const hiddenIndicatorIds = indicators
  .filter((i) => i.licence.publicDisplayOk !== 'yes')
  .map((i) => i.id)
  .sort();
const overridesPath = join(here, '..', 'data', 'site-mode-overrides.json');
writeFileSync(
  overridesPath,
  `${JSON.stringify(
    {
      $schema:
        'what SITE_MODE=public must hide (Step 3 §2.2 AC-08/T-15) — generated by scripts/generate-indicators-registry.ts; committed and cross-checked against data/indicator-audit.json by tests',
      version: 1,
      hiddenIndicatorIds,
      hiddenBoards: ['markets', 'fx'],
    },
    null,
    2,
  )}\n`,
);
console.log(`[registry] wrote ${hiddenIndicatorIds.length} hidden ids to ${overridesPath}`);
