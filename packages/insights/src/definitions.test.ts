import { describe, expect, it } from 'vitest';

import { IndicatorDefinitionSchema, IndicatorIdSchema } from '@currena/core';

import { DEFINITIONS } from './definitions';
import { GAUGES, isShadowGauge } from './gauges';

describe('DEFINITIONS (the v2 indicator table, I15)', () => {
  it('every row parses against the shared zod contract (loud, never garbage)', () => {
    for (const def of DEFINITIONS) {
      const parsed = IndicatorDefinitionSchema.safeParse(def);
      expect(parsed.success, `definition ${def.id} failed validation`).toBe(true);
    }
  });

  it('covers every indicator id exactly once (41, retired ids absent)', () => {
    const ids = DEFINITIONS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(IndicatorIdSchema.options.length);
    expect([...ids].sort()).toEqual([...IndicatorIdSchema.options].sort());
    // The retired slug must NOT come back (replaced by the Currena basket).
    expect(ids).not.toContain('dollar-broad');
  });

  it('splits 96 P1 / 43 P2 (the 2026-10-25 M6 Wave-3 round adds twelve P1 cards — the leading-edge batch; the 2026-10-26 M7 round adds china-cpi as a P1 card on the NBS press-release automation; the 2026-10-26 gap-audit build adds yield-curve-10y3m, rba-fed-gap, us-japan-10y-gap, cftc-gold-positioning (voters, A-1/A-5/A-3/A-7), gold-oil-ratio, eia-crude-stocks (context, A-4/A-6) and the monthly trio oecd-cli-us/cn/de, gpr-index, epu-us (A-8/A-9/A-10) as P1 cards; the 2026-10-29 owner round adds usdaed — the UAE dirham context card, P2; the 2026-10-31 gap-closure S2-M2.4 round adds nyfed-custody — the weekly custody card, P1; the 2026-11-01 gap-closure S3-M3.2 round adds the liquidity/funding six — all P1 context cards; the 2026-11-01 gap-closure S3-M3.3 round adds the credit pair — both P1 context cards; the 2026-11-01 gap-closure S3-M3.4 round adds the growth-nowcast/survey six — all P1 context cards; the 2026-11-01 gap-closure S3-M3.5 round adds the fiscal and Treasury-supply six — all P1 context cards; the 2026-11-01 gap-closure S4-M4.2 round adds the geopolitics eleven — the GPR threat/act/country family, the daily 7-day average and the TPU, all P1 context cards; the 2026-11-01 gap-closure S4-M4.3 round adds the chokepoint five — the IMF PortWatch transit cards, all P1 context cards; the 2026-11-01 gap-closure S4-M4.4 round adds the supply-chain/energy six — the GSCPI + the EIA SPR/production pair as P1 context cards, the Pink Sheet energy trio as P2 context cards)', () => {
    expect(DEFINITIONS.filter((d) => d.phase === 'P1')).toHaveLength(99);
    // Session 3 (G2): +breakeven-tilt (P2, the breakeven-10y sibling).
    expect(DEFINITIONS.filter((d) => d.phase === 'P2')).toHaveLength(46);
  });

  it('groups are the question groups (global 6 + prices-board, australia 3)', () => {
    const groups = new Set(DEFINITIONS.map((d) => d.group));
    expect([...groups].sort()).toEqual(
      [
        'borrowing-costs',
        'prices-heat',
        'market-stress',
        'dollar-strength',
        'growth-health',
        'prices-board',
        'au-inflation-rates',
        'au-households',
        'au-trade-currency',
        // gap-closure S4-M4.3 (2026-11-01): the geopolitics/supply lane —
        // a shadow gauge until S6 (all context members).
        'geo-fragmentation',
      ].sort(),
    );
    // Section/group coherence: a group belongs to exactly one section.
    const sectionOfGroup = new Map<string, Set<string>>();
    for (const d of DEFINITIONS) {
      const set = sectionOfGroup.get(d.group) ?? new Set<string>();
      set.add(d.section);
      sectionOfGroup.set(d.group, set);
    }
    for (const [group, sections] of sectionOfGroup) {
      expect(sections.size, `group ${group} spans multiple sections`).toBe(1);
    }
  });

  it('info-only cards never vote: the ninety-seven info rules (2026-10-24 M4 Wave 1: +sofr, +us-2y, +breakeven-10y, +michigan-1y-expectations; M5 Wave 2: +euro-aaa-10y, +food-index, +wheat, +maize, +usdtry as context; 2026-10-25 M6 Wave 3: +mortgage-30y, +walcl, +retail-sales, +housing-permits, +cfnai, +job-openings, +t5yie, +us-wages, +au-saving-ratio, +au-job-vacancies as context — euro-hicp and au-housing-finance are the scored pair; 2026-10-26 gap-audit: +gold-oil-ratio, +eia-crude-stocks (A-4/A-6), +oecd-cli-cn, +oecd-cli-de, +gpr-index, +epu-us (the A-8 companions and the A-9/A-10 context pair — the CLI US leg is the trio’s voter); 2026-10-29 owner round: +usdaed — the UAE dirham context card; 2026-10-31 Session-3 round: +breakeven-tilt — the G2 interplay context card, D-5 keeps it out of the voter table; 2026-10-31 gap-closure S2-M2.4 round: +nyfed-custody — the weekly custody card, context-only by spec (G-5); 2026-11-01 gap-closure S3-M3.2 round: the liquidity/funding six; 2026-11-01 gap-closure S3-M3.3 round: +ebp and +ofr-fsi — the credit pair, context-only by spec (G-5); 2026-11-01 gap-closure S3-M3.4 round: the growth-nowcast/survey six, context-only by spec (G-5); the S4-M4.2/M4.3/M4.4 rounds: the geopolitics eleven + the chokepoint five + the supply-chain/energy six, context-only by spec (G-5))', () => {
    const info = DEFINITIONS.filter((d) => d.rule.kind === 'info').map((d) => d.id).sort();
    expect(info).toEqual([
      'au-deposit-rate',
      'au-job-vacancies',
      'au-petrol-yoy',
      'au-saving-ratio',
      'bank-reserves',
      'boe-rate',
      'boj-rate',
      'breakeven-10y',
      'breakeven-tilt',
      'btc-usd',
      'bund-10y',
      'cfnai',
      'chokepoint-bab-el-mandeb',
      'chokepoint-malacca',
      'chokepoint-panama',
      'chokepoint-suez',
      'chokepoint-taiwan',
      'coal-aus',
      'continuing-claims',
      'copper-usd',
      'crypto-fng',
      'ebp',
      'eia-crude-stocks',
      'empire-state',
      'epu-us',
      'eur-usd',
      'euro-aaa-10y',
      'food-index',
      'gas-europe',
      'gdpnow',
      'gilt-10y',
      'gold-aud',
      'gold-btc',
      'gold-oil-ratio',
      'gold-usd',
      'gpr-acts',
      'gpr-australia',
      'gpr-china',
      'gpr-daily',
      'gpr-index',
      'gpr-israel',
      'gpr-russia',
      'gpr-saudi',
      'gpr-taiwan',
      'gpr-threats',
      'gpr-ukraine',
      'gscpi',
      'housing-permits',
      'iron-ore',
      'jgb-10y',
      'job-openings',
      'lng-japan',
      'm2-us',
      'maize',
      'median-cpi',
      'michigan-1y-expectations',
      'mortgage-30y',
      'natgas',
      'net-liquidity',
      'nyfed-custody',
      'oecd-cli-cn',
      'oecd-cli-de',
      'ofr-fsi',
      'platinum',
      'rba-cash-rate',
      'repo-stress',
      'retail-sales',
      'reverse-repo',
      'shiller-cape',
      'shiller-ecy',
      'silver-usd',
      'sloos-ci-tightening',
      'sofr',
      'sticky-cpi',
      't5yie',
      'term-premium-10y',
      'tga',
      'tpu-us',
      'treasury-auction-10y',
      'treasury-auction-10y-indirect',
      'treasury-auction-30y',
      'treasury-auction-30y-indirect',
      'us-2y',
      'us-cpi-core-yoy',
      'us-crude-production',
      'us-deficit-12m',
      'us-deficit-monthly',
      'us-gdp-growth',
      'us-nfp',
      'us-spr',
      'us-wages',
      'usdaed',
      'usdcny',
      'usdtry',
      'walcl',
      'wheat',
      'wti',
    ]);
  });

  it('GAUGE membership is the scored list (48 voters; fix B-14: +brent counts in prices-heat; 2026-10-23 OD-7: m2-us demoted out of growth-health; 2026-10-24 M4 Wave 1: +claims, +recession-probability, +michigan-sentiment in growth-health, +us-pce-core-yoy in prices-heat; 2026-10-25 M6 Wave 3: +euro-hicp in prices-heat, +au-housing-finance in au-households; 2026-10-26 M7: +china-cpi in growth-health; gap-closure S4-M4.3 (2026-11-01): the geo-fragmentation SHADOW gauge carries context-only members — the deliberate G-5 exception, pinned here)', () => {
    const gaugedGroups = new Set(GAUGES.map((g) => g.id));
    const memberIds = new Set(GAUGES.flatMap((g) => g.members));
    expect(memberIds.size).toBe(53); // the 48 voters +yield-curve-10y3m (A-1) +rba-fed-gap (A-5) +us-japan-10y-gap (A-3) +cftc-gold-positioning (A-7) +oecd-cli-us (A-8) — PLUS the S4-M4.3 shadow gauge's five context-only chokepoint members (48 + 5 = 53; only the 48 vote)
    // Every gauge member is a scored (non-info) definition. TWO deliberate
    // exceptions: B-14's brent (the card renders on the Prices strip; only
    // the count membership moved) and the S4-M4.3 SHADOW gauge's members
    // (all context-only per G-5 — isShadowGauge pins that separately).
    const shadowGauges = GAUGES.filter((g) => isShadowGauge(g)).map((g) => g.id);
    expect(shadowGauges).toEqual(['geo-fragmentation']);
    for (const g of GAUGES) {
      for (const id of g.members) {
        const def = DEFINITIONS.find((d) => d.id === id)!;
        if (!shadowGauges.includes(g.id)) {
          expect(def.rule.kind, `${id} in gauge ${g.id} must be a voting rule`).not.toBe('info');
        }
        if (id !== 'brent') {
          expect(def.group, `${id} must live in its gauge's group`).toBe(g.id);
        }
        expect(gaugedGroups.has(def.group) || def.group === 'prices-board', `${id} must live in a gauged group`).toBe(true);
      }
    }
    // And the inverse: every scored definition in a gauged group is a member.
    for (const def of DEFINITIONS) {
      if (gaugedGroups.has(def.group) && def.rule.kind !== 'info') {
        const g = GAUGES.find((gg) => gg.id === def.group)!;
        expect(g.members, `${def.id} missing from gauge ${def.group}`).toContain(def.id);
      }
    }
  });

  it('I15 freshness overrides: the spec §3 "stale after" column, verbatim', () => {
    const byId = new Map(DEFINITIONS.map((d) => [d.id, d]));
    const expectStale = (id: string, days: number | undefined) =>
      expect(byId.get(id as never)?.staleAfterDays, `${id} staleAfterDays`).toBe(days);
    expectStale('us-cpi-yoy', 75);
    expectStale('fed-target', 5);
    expectStale('ecb-dfr', 7);
    expectStale('dollar-basket', 4);
    expectStale('nfci', 14);
    // R10-2 (2026-10-28): STLFSI4 rides the same 14-day weekly window as
    // NFCI — the St. Louis Fed occasionally misses a Thursday publication
    // (verified live 2026-10-27: FRED's latest obs is 2026-10-16; the
    // 2026-10-23 release never landed). The 10-day weekly default would
    // false-flag the missed release stale at 11 days; 14 absorbs one miss.
    expectStale('stress-stlfsi', 14);
    expectStale('au-home-loan', 70);
    expectStale('au-wage-growth', 230);
    expectStale('au-rent-yoy', 95);
    expectStale('au-petrol-yoy', 95);
    expectStale('brent', 12);
    // M6 calibration fix (2026-10-25): the quarterly obs-to-next-release
    // arithmetic — WPI 224d, RPPI 219d, LEND_HOUSING 220d, JV 232d,
    // ANA 245d. The old 200/215 values false-staled the cards between
    // the quarter boundaries (au-wage-growth went live-stale 2026-10-17).
    expectStale('au-home-values', 225);
    expectStale('au-housing-finance', 230);
    expectStale('au-saving-ratio', 250);
    expectStale('au-job-vacancies', 240);
    // Fix B-09 (2026-10-14): the release-cycle overrides that keep the
    // tightened cadence defaults (4/10/45/120) honest.
    expectStale('m2-us', 90);
    expectStale('copper-gold', 60);
    expectStale('au-unemployment', 60);
    expectStale('au-household-debt-arrears', 190);
    expectStale('iron-ore', 60);
    expectStale('gold-usd', 2);
    expectStale('silver-usd', 2);
    expectStale('btc-usd', 2);
    expectStale('copper-usd', 2);
    expectStale('eur-usd', 4);
    expectStale('us10y', undefined); // cadence grace applies
    // Step-2 add-list cards (§B): the new series' freshness limits.
    expectStale('vix', 4); // daily card spec (VIXCLS prints every US trading day)
    expectStale('us-unemployment', 75); // monthly BLS obs (M-01) ages up to ~73d
    expectStale('sahm-rule', 75);
    expectStale('au-deposit-rate', 70); // RBA F4.1 month-end obs, same as F6
    // Obs-date-reality adjustments (the spec's numbers assumed release-date
    // aging — see definitions.ts notes): ABS quarter-start items get 215.
    // Step-1 (2026-10-13): au-cpi/au-trimmed-mean moved to the MONTHLY CPI —
    // monthly cadence, 95 days.
    expectStale('au-cpi', 95);
    expectStale('au-trimmed-mean', 95);
    expectStale('terms-of-trade', 215);
    expectStale('au-home-values', 225);
    // I19: the BEA NIPA ratio shares the quarter-start dating — 215, not the
    // 190d quarterly grace (which false-alarmed Oct 8–30 in the live I18
    // snapshot while FRED confirmed the Q2 obs was the freshest that exists).
    expectStale('govt-interest-revenue', 215);
  });

  it('key thresholds are spec-verbatim (backtest may propose changes, never silently)', () => {
    const byId = new Map(DEFINITIONS.map((d) => [d.id, d]));
    expect(byId.get('yield-curve-10y2y')!.rule).toEqual({ kind: 'threshold', direction: 'below', value: 0 });
    expect(byId.get('stress-stlfsi')!.rule).toEqual({
      kind: 'threshold',
      direction: 'above',
      value: 0,
      sustainedWeeks: 4,
    });
    expect(byId.get('au-cpi')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 3 });
    expect(byId.get('us-cpi-yoy')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 3 });
    expect(byId.get('nfci')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 0 });
    expect(byId.get('china-pmi')!.rule).toEqual({ kind: 'threshold', direction: 'below', value: 50 });
    expect(byId.get('fed-target')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('ecb-dfr')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    // Fix spec B-03 (2026-10-14): the dollar's level rule is JOINED by the
    // speed rule — a 30-day move at or above the world-currencies alarm
    // threshold (3% against six majors) counts as needs-attention here too.
    expect(byId.get('dollar-basket')!.rule).toEqual({
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'pct', direction: 'rise', magnitude: 3, windowWeeks: 4 },
      ],
    });
    expect(byId.get('au-home-loan')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('au-rent-yoy')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('au-wage-growth')!.rule).toEqual({ kind: 'below-aux' });
    expect(byId.get('usdjpy')!.rule).toEqual({
      kind: 'change',
      mode: 'pct',
      direction: 'fall',
      magnitude: 5,
      windowWeeks: 4,
    });
    expect(byId.get('brent')!.rule).toEqual({
      kind: 'change',
      mode: 'pct',
      direction: 'rise',
      magnitude: 25,
      windowWeeks: 13,
    });
    expect(byId.get('au-unemployment')!.rule).toEqual({ kind: 'above-low', rise: 0.5 });
    // Step-2 add-list §B4: the Sahm rule's standard signal, verbatim.
    expect(byId.get('sahm-rule')!.rule).toEqual({ kind: 'threshold', direction: 'above', value: 0.5 });
    // §B3/§B5: the US unemployment level and the VIX read their own 10-year
    // position (the card spec's "10-year position" — the standard percentile
    // machinery, no invented word thresholds before Step 3).
    expect(byId.get('us-unemployment')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.2 });
    expect(byId.get('vix')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.2 });
    // §B2: the AU 10-year yield scores its 10-year position like us10y's
    // percentile arm.
    expect(byId.get('au-10y')!.rule).toEqual({ kind: 'percentile', tail: 'high', cutoff: 0.1 });
    expect(byId.get('terms-of-trade')!.rule).toEqual({ kind: 'consecutive-decline', periods: 2 });
    expect(byId.get('au-home-values')!.rule).toEqual({ kind: 'consecutive-decline', periods: 3 });
    // OD-7 demotion (2026-10-23, D-42): m2-us keeps the series, loses the
    // vote — context now (the regression fixture's expectation moved with it).
    expect(byId.get('m2-us')!.rule).toEqual({ kind: 'info' });
    expect(byId.get('us10y')!.rule).toEqual({
      kind: 'any-of',
      of: [
        { kind: 'percentile', tail: 'high', cutoff: 0.1 },
        { kind: 'change', mode: 'points', direction: 'rise', magnitude: 0.5, windowWeeks: 4 },
      ],
    });
  });
});
