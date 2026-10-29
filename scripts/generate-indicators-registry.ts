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
// @ts-expect-error — same (Step 3 §8 v3 source-risk block, 2026-10-20).
import { riskSummaryForLegs, upstreamLegsFor, riskRowForLeg, UPSTREAM_LEGS } from '../packages/insights/src/sources';
// @ts-expect-error — the EN copy is the §8 what-it-is text source of record (2026-10-20).
import { insightsCopyEn } from '../apps/web/src/i18n/insights-copy-en';

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
 * live point) comes partly from another provider, with the full leg list.
 * THE SHARED MAP now lives in packages/insights/src/sources.ts (moved there
 * 2026-10-20 so the engine's kill switch + level walk and this generator
 * cannot drift). UPSTREAM_LEGS is re-exported here for the local walk below.
 */

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

/* ---------------- Step 3 §8 (v3, 2026-10-20): what-it-is texts + L2 definitions ---------------- */

/**
 * The Layer 2 plain-arithmetic definitions (Step 3 §4). Each line states
 * the inputs and the SAME-DATE rule — these are the definitions the cards'
 * "How is this calculated?" shows; they mirror the composition already
 * implemented in packages/insights/src/adapters/derived.ts.
 */
const LAYER2_DEFINITIONS: Readonly<Record<string, string>> = {
  'yield-curve-10y2y': 'The published T10Y2Y series: the US 10-year Treasury yield minus the 2-year Treasury yield, same date.',
  'gold-silver': 'The gold price divided by the silver price, same date and the same price basis.',
  'copper-gold': 'The copper price divided by the gold price (monthly, World Bank Pink Sheet basis), same period.',
  'gold-btc': 'The gold price divided by the Bitcoin price: ounces of gold per one bitcoin, same date.',
  'silver-btc': 'The silver price divided by the Bitcoin price: ounces of silver per one bitcoin, same date.',
  'fed-expectations':
    'The US 2-year Treasury yield (DGS2) minus the Fed target-range midpoint ((DFEDTARL + DFEDTARU) / 2), same date. A rough read of what markets price for the policy rate — not a probability.',
  'rba-expectations':
    'The Australian 3-year government bond yield (RBA F2) minus the RBA cash rate (F1), same date. A rough read — the ASX RBA Rate Tracker carries the market-priced path.',
  'au-us-10y-gap':
    'The Australian 10-year yield (RBA F2) minus the US 10-year yield (DGS10). When the two data dates differ, both dates are shown and the gap is marked "dates differ".',
  'dollar-basket':
    'Currena\'s DXY-style basket: a weighted geometric mean of six USD exchange rates (ECB reference rates via Frankfurter), scaled with the published DXY base constant 50.14348112.',
  'gold-aud': 'The gold price in US dollars divided by AUD/USD, same date: the gold price in Australian dollars.',
  'govt-interest-revenue':
    'US federal interest payments (BEA series A091RC1Q027SBEA) as a share of federal government receipts (W006RC1Q027SBEA), quarterly, in percent.',
};

/** The §8 `fail_closed_conditions` sentence, generated per indicator from its own cadence + max age (no hand-typed conclusions). */
function failClosedConditionsFor(cadence: string, maxAgeDays: number | null): string {
  const age = maxAgeDays !== null ? `older than ${maxAgeDays} days` : 'older than its allowed age';
  return `No value, data ${age}, an exact repeat beyond its ${cadence} cadence, a value outside its allowed range, or a failed validation test → the card shows Stale or Can't tell right now, never a verdict (fail closed).`;
}

/** The §8 `publisher`: the register label of the governing (worst-level) leg. */
function riskRowLabelFor(legs: readonly string[]): string {
  const rank = (lvl: string): number => ({ L0: 0, L1: 1, L2: 2, L3: 3 })[lvl] ?? 1;
  const rows = legs.map((leg) => riskRowForLeg(leg, fredRecords));
  const worst = Math.max(...rows.map((r) => rank(r.level)));
  return rows.find((r) => rank(r.level) === worst)!.label;
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

/**
 * OWNER DIRECTIVE (2026-10-19e, credentials chat session): the four prices
 * board tiles (gold, silver, bitcoin, brent) displayed publicly on
 * currena.ir BEFORE the insights rebuild, from these same sources. The owner
 * explicitly directs their restoration in public mode and accepts the
 * display risk on their own site. This lifts ONLY the public-display
 * disposition of the worst-leg walk — the underlying licence facts stay
 * verbatim, the Yahoo legs stay in the ENGINE (private view unchanged), and
 * the world boards (markets/fx) stay hidden. NOT a terms re-verification:
 * the quarterly licence review re-confirms this decision.
 */
const OWNER_PUBLIC_DISPLAY_OVERRIDE: Readonly<Record<string, string>> = {
  brent:
    'FRED leg is public-domain (T-16: DCOILBRENTEU #copyright-public-domain); the Yahoo BZ=F gap-fill leg stays in the engine — the owner directive lifts its worst-leg display bar.',
  'gold-usd':
    'gold-api leg is public-display-ok (their §9 permits commercial use in web applications, read first-hand 2026-10-16); the Yahoo GC=F history leg stays in the engine — the owner directive lifts its worst-leg display bar.',
  'silver-usd':
    'gold-api leg is public-display-ok (their §9 permits commercial use, read first-hand 2026-10-16); the Yahoo SI=F history leg stays in the engine — the owner directive lifts its worst-leg display bar.',
  'btc-usd':
    'gold-api leg is public-display-ok (their §9 permits commercial use, read first-hand 2026-10-16); the Yahoo BTC-USD history leg stays in the engine — the owner directive lifts its worst-leg display bar.',
  // 2026-10-26 gap-audit build, A-4: the gold/oil ratio's legs are exactly
  // gold-usd's and brent's — both tiles' display bars are already lifted
  // by the standing 2026-10-19e directives; the derived ratio inherits the
  // same legs, so the same directives govern it.
  'gold-oil-ratio':
    'The ratio derives from the gold-usd and brent series whose display bars the standing owner directives (2026-10-19e) already lifted; the Yahoo history legs stay in the engine — the directives cover the ratio’s worst leg exactly as they cover its parents’.',
  // 2026-10-29 owner round (credentials chat session): the usdaed card —
  // the owner's own ask: "Add dollar against UAE currency". The ECB
  // publishes no AED reference rate, so the card's single leg is Yahoo's
  // USD/AED daily closes — the same unofficial-but-accepted provider the
  // Brent gap-fill and the metals history legs already ride (register row
  // yahoo: L2, ownerAccepts, recorded 2026-10-16). The owner explicitly
  // requested this card knowing its source, accepting that leg on their
  // own site — the same display-bar lift the four prices tiles carry.
  usdaed:
    'Owner-requested card (2026-10-29: "add dollar against UAE currency"); the ECB publishes no AED reference rate, so the single leg is Yahoo USD/AED daily closes — the register row the owner already accepts (L2, ownerAccepts, 2026-10-16, the same provider the Brent gap-fill and metals history legs ride). The owner directive lifts its worst-leg display bar.',
};

/**
 * OWNER DIRECTIVE (2026-10-18b, credentials chat session): the WORLD STOCK
 * MARKETS board — the 16 world exchanges — displayed publicly on currena.ir
 * from 2026-10-13 until the page went public (2026-10-19b hid every
 * EODHD/Yahoo-backed board). The owner explicitly directs its restoration
 * and supplies their own EODHD API key (already the currena-markets
 * EODHD_API_TOKEN secret — the board is EODHD-first, the standing snapshot
 * carries 15/16 EODHD-sourced rows). This lifts ONLY the board's
 * public-display disposition — the underlying licence facts stay verbatim,
 * the Yahoo fallback leg stays in the ENGINE (a missing EODHD answer still
 * degrades to it; the owner accepts that leg on their own site). NOT a
 * terms re-verification: the quarterly licence review re-confirms this
 * decision.
 *
 * OWNER DIRECTIVE (2026-10-21c, credentials chat session): the WORLD
 * CURRENCIES board is restored too — the owner's ask: "insight used to have
 * a full currency and pairs section, dedicated and detailed… restore that
 * section." The board's data is ECB euro reference rates served through the
 * Frankfurter project — the SAME rates the public converter already
 * displays on the site's home page. The ECB's display terms (read verbatim
 * in a browser 2026-10-21 — see licences.ts FRANKFURTER) permit free use
 * when the data appears accurately, the ECB is cited as the source, and
 * modifications are stated — the pairs table shows the reference rates
 * verbatim with ECB attribution, and every derived number (the dollar
 * basket, gold-AUD) carries its own stated definition. The pattern rules
 * score only movements of those published rates.
 */
const OWNER_PUBLIC_BOARD_OVERRIDE: Readonly<Record<string, string>> = {
  markets:
    'The board is EODHD-first on the owner\u2019s own API key (the currena-markets secret); the Yahoo fallback leg stays in the engine \u2014 the owner directive (2026-10-18b) lifts the board\u2019s display bar, exactly the 2026-10-19e pattern the four prices tiles set.',
  fx: 'ECB euro reference rates via the Frankfurter project (MIT code) — the same rates the public converter displays; the owner directive (2026-10-21c) restores the currencies board, with the ECB display terms verified 2026-10-21 (accurate reproduction + ECB cited as source + stated derivations), exactly the 2026-10-18b markets-board pattern.',
};

const indicators = DEFINITIONS.map((def) => {
  const source = READING_SOURCES[def.id] ?? { name: def.sourceRef };
  const display = DISPLAY[def.id as keyof typeof DISPLAY];
  const scored = def.rule.kind !== 'info';
  const legs = upstreamLegsFor(def);
  const risk = riskSummaryForLegs(legs, fredRecords);
  const copyEntry = (insightsCopyEn.indicators as Record<string, { whatItIs: string; cantTell: string; tendedToMean: string }>)[def.id];
  const layer = LAYER2_IDS.has(def.id) ? 2 : 1;
  const maxAgeDays = staleAfterDaysFor(def) ?? null;
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
    /* -------- Step 3 §8 (v3, 2026-10-20): publisher + what-it-is + fail-closed -------- */
    publisher: riskRowLabelFor(legs),
    publisherUrl: source.url ?? null,
    methodUrl: source.url ?? null,
    whatItIs: copyEntry?.whatItIs ?? null,
    whatItIsnt: copyEntry?.cantTell ?? null,
    trackRecordNote: copyEntry?.tendedToMean ?? null,
    definition: layer === 2 ? (LAYER2_DEFINITIONS[def.id] ?? null) : null,
    failClosedConditions: failClosedConditionsFor(def.cadence, maxAgeDays),
    sourceRisk: {
      level: risk.level,
      ownerAccepts: risk.ownerAccepts,
      enabled: risk.enabled,
      method: risk.method,
      runtime: risk.runtime,
      termsLines: risk.governingTermsLines,
      termsReadOn: risk.termsReadOn,
      attributionText: risk.attribution,
      legs: risk.legs,
    },
    unit: display?.unit ?? 'ratio',
    changeUnit: def.changeKind === 'points' ? 'percentage points' : 'percent',
    cadence: def.cadence,
    maxAgeDays,
    maxAgeBasis: def.staleAfterDays !== undefined ? 'per-series override' : `cadence default (${String(def.cadence)})`,
    scored,
    historyWindow: '10 years of stored history (downsampled to ≤2700 points; ≥2 years of daily data)',
    rule: def.rule,
    ruleVersion: RULE_VERSION,
    layer,
    licence: (() => {
      const l = licenceBlockFor(def);
      const ownerOverride = OWNER_PUBLIC_DISPLAY_OVERRIDE[def.id];
      const resolved =
        ownerOverride !== undefined
          ? {
              ...l,
              publicDisplayOk: 'yes' as const,
              termsEvidence: `${l.termsEvidence} · OWNER DIRECTIVE (2026-10-19e): ${ownerOverride}`,
            }
          : l;
      return {
        licenceName: resolved.licenceName,
        attributionText: resolved.attributionText,
        attributionRequired: resolved.attributionRequired,
        privateOk: resolved.privateOk,
        publicDisplayOk: resolved.publicDisplayOk,
        termsCheckedOn: resolved.termsCheckedOn,
        termsEvidence: resolved.termsEvidence,
        termsUrl: resolved.termsUrl ?? null,
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
    /* E-23 v3 additions (2026-10-20): the risk-register columns the
     * full export's audit trail needs (level, owner_accepts, enabled). */
    level: i.sourceRisk.level,
    ownerAccepts: i.sourceRisk.ownerAccepts,
    enabled: i.sourceRisk.enabled,
    method: i.sourceRisk.method,
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
 * plus the EODHD/Yahoo-backed world boards that carry no owner
 * directive (2026-10-18b lifted the markets board; 2026-10-21c lifted
 * the fx board — both now carry directives). Consumers:
 *   - scripts/check-site-mode.mjs   (the T-15 build gate)
 *   - apps/api/src/public-mode.ts   (the Worker's serve-time hidden set)
 *   - packages/insights             (projectSnapshotToPublic — the
 *                                     public projection's subset)
 * Changing ANY licence verdict means re-running this generator — the
 * pinning test cross-checks this file against the audit sidecar.
 * ------------------------------------------------------------------ */

const hiddenIndicatorIds = indicators
  // v3 (2026-10-20): the public projection hides BOTH the licence-hidden
  // set (publicDisplayOk ≠ 'yes', fail-closed unknowns included) AND every
  // reading whose source legs carry a disabled register row (the M-6 kill
  // switch) — one generated list, cross-checked by T-15.
  .filter((i) => i.licence.publicDisplayOk !== 'yes' || !i.sourceRisk.enabled)
  .map((i) => i.id)
  .sort();
// 2026-10-18b + 2026-10-21c: a board named by the OWNER_PUBLIC_BOARD_OVERRIDE
// is NOT hidden (the owner-directive lift, the 2026-10-19e pattern applied to a
// whole board). Everything else EODHD/Yahoo-backed stays hidden — today that
// is nothing: markets rides the 2026-10-18b directive and fx the 2026-10-21c
// restoration directive.
const hiddenBoards = ['markets', 'fx'].filter((b) => OWNER_PUBLIC_BOARD_OVERRIDE[b] === undefined);
const overridesPath = join(here, '..', 'data', 'site-mode-overrides.json');
writeFileSync(
  overridesPath,
  `${JSON.stringify(
    {
      $schema:
        'what SITE_MODE=public must hide (Step 3 §2.2 AC-08/T-15) — generated by scripts/generate-indicators-registry.ts; committed and cross-checked against data/indicator-audit.json by tests',
      version: 1,
      hiddenIndicatorIds,
      hiddenBoards,
      ownerBoardDirectives: OWNER_PUBLIC_BOARD_OVERRIDE,
    },
    null,
    2,
  )}\n`,
);
console.log(
  `[registry] wrote ${hiddenIndicatorIds.length} hidden ids + hiddenBoards [${hiddenBoards.join(', ')}] to ${overridesPath}`,
);
