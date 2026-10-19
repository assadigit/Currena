/**
 * registry-sync.test.ts — fix spec A-01 (2026-10-14): data/indicators.json is
 * the SINGLE indicator registry, and this test pins that it stays in sync
 * with the code's sources of truth (the definitions table, the reading-source
 * attribution, the gauge membership and the web display configuration).
 *
 * Every card on the page is produced from a registry entry: the definitions
 * table drives the card, and the registry is its generated, inspectable
 * projection. If the two drift, this test fails and names the field.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFINITIONS, GAUGES, RULE_VERSION, staleAfterDaysFor } from '@currena/insights';
import { DISPLAY } from '../components/insights/config/display';

interface RegistryEntry {
  id: string;
  title: string;
  area: { section: string; group: string; gauge: string | null };
  source: { provider: string; name: string; url: string | null; seriesIdOrTable: string };
  unit: string;
  changeUnit: string;
  cadence: string;
  maxAgeDays: number | null;
  scored: boolean;
  historyWindow: string;
  rule: unknown;
  ruleVersion: number;
  layer: number;
  publisher: string;
  publisherUrl: string | null;
  methodUrl: string | null;
  whatItIs: string | null;
  whatItIsnt: string | null;
  trackRecordNote: string | null;
  definition: string | null;
  failClosedConditions: string;
  sourceRisk: {
    level: 'L0' | 'L1' | 'L2' | 'L3';
    ownerAccepts: boolean | null;
    enabled: boolean;
    method: string | null;
    runtime: string | null;
    termsLines: string;
    termsReadOn: string;
    attributionText: string;
    legs: string[];
  };
  licence: { publicDisplayOk: string; attributionText: string; termsCheckedOn: string };
}

const here = dirname(fileURLToPath(import.meta.url));
const registryPath = join(here, '..', '..', '..', '..', 'data', 'indicators.json');
const registry = JSON.parse(readFileSync(registryPath, 'utf8')) as { version: number; indicators: RegistryEntry[] };

describe('data/indicators.json — the single indicator registry (A-01)', () => {
  it('exists, carries the current rule version, and covers every indicator exactly once', () => {
    expect(registry.version).toBe(RULE_VERSION);
    const ids = registry.indicators.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(DEFINITIONS.length);
    expect([...ids].sort()).toEqual([...DEFINITIONS.map((d) => d.id as string)].sort());
  });

  it('every entry matches its definition: title, area, source, units, cadence, max age, scored flag, rule', () => {
    for (const entry of registry.indicators) {
      const def = DEFINITIONS.find((d) => d.id === entry.id);
      expect(def, `registry entry ${entry.id} has no definition`).toBeDefined();
      if (!def) continue;
      expect(entry.title, `${entry.id} title`).toBe(def.name);
      expect(entry.area.section, `${entry.id} section`).toBe(def.section);
      expect(entry.area.group, `${entry.id} group`).toBe(def.group);
      expect(entry.source.seriesIdOrTable, `${entry.id} series`).toBe(def.sourceRef);
      expect(entry.cadence, `${entry.id} cadence`).toBe(def.cadence);
      expect(entry.changeUnit, `${entry.id} change unit`).toBe(def.changeKind === 'points' ? 'percentage points' : 'percent');
      expect(entry.maxAgeDays, `${entry.id} max age`).toBe(staleAfterDaysFor(def));
      expect(entry.scored, `${entry.id} scored`).toBe(def.rule.kind !== 'info');
      expect(entry.rule, `${entry.id} rule`).toEqual(def.rule);
      expect(entry.ruleVersion, `${entry.id} rule version`).toBe(RULE_VERSION);
      // The gauge membership matches the gauges table.
      const gauge = GAUGES.filter((g) => g.members.includes(def.id)).map((g) => g.id)[0] ?? null;
      expect(entry.area.gauge, `${entry.id} gauge`).toBe(gauge);
      // The display unit matches the web configuration.
      const display = DISPLAY[def.id];
      if (display) expect(entry.unit, `${entry.id} unit`).toBe(display.unit);
    }
  });

  it('every entry carries a source name and a link (B-11/T-13 discipline)', () => {
    for (const entry of registry.indicators) {
      expect(entry.source.name.length, `${entry.id} source name`).toBeGreaterThan(0);
      expect(entry.source.url, `${entry.id} source url`).toMatch(/^https:\/\//);
    }
  });

  it('rates, inflation, yields and unemployment speak in percentage points; prices and indexes in percent (T-10)', () => {
    const byId = new Map(registry.indicators.map((i) => [i.id, i]));
    for (const id of ['us10y', 'real-yield-10y', 'fed-target', 'ecb-dfr', 'us-cpi-yoy', 'breakeven-5y5y', 'au-cpi', 'au-10y', 'rba-cash-rate', 'au-home-loan', 'au-unemployment', 'us-unemployment', 'au-wage-growth']) {
      expect(byId.get(id)!.changeUnit, `${id} must speak in percentage points`).toBe('percentage points');
    }
    for (const id of ['brent', 'gold-usd', 'silver-usd', 'btc-usd', 'usdjpy', 'audusd', 'gold-btc', 'm2-us', 'iron-ore', 'au-home-values']) {
      expect(byId.get(id)!.changeUnit, `${id} must speak in percent`).toBe('percent');
    }
  });

  it('Step 3 §8 (v3): every entry carries the source-risk block, the publisher, what-it-is texts and the fail-closed sentence', () => {
    for (const entry of registry.indicators) {
      const sr = entry.sourceRisk;
      expect(['L0', 'L1', 'L2', 'L3'], `${entry.id} level`).toContain(sr.level);
      expect(sr.enabled, `${entry.id} enabled`).toBeTypeOf('boolean');
      expect(sr.termsLines.length, `${entry.id} termsLines`).toBeGreaterThan(0);
      expect(sr.legs.length, `${entry.id} legs`).toBeGreaterThan(0);
      expect(entry.publisher.length, `${entry.id} publisher`).toBeGreaterThan(0);
      expect(entry.whatItIs, `${entry.id} whatItIs`).toBeTruthy();
      expect(entry.whatItIsnt, `${entry.id} whatItIsnt`).toBeTruthy();
      expect(entry.failClosedConditions, `${entry.id} failClosedConditions`).toContain('fail closed');
    }
  });

  it('Step 3 §8 + T-15 (v3): no displayed card is L3, and every L2 card carries owner acceptance', () => {
    for (const entry of registry.indicators) {
      if (entry.licence.publicDisplayOk !== 'yes') continue; // hidden in public mode anyway
      expect(entry.sourceRisk.level, `${entry.id} must not be L3 while displayed`).not.toBe('L3');
      if (entry.sourceRisk.level === 'L2') {
        expect(entry.sourceRisk.ownerAccepts, `${entry.id} is L2 and displayed — the owner must have accepted it`).toBe(true);
      }
    }
  });

  it('Layer 2 entries carry their plain-arithmetic definition; Layer 1 entries leave it null', () => {
    const byId = new Map(registry.indicators.map((i) => [i.id, i]));
    for (const id of ['yield-curve-10y2y', 'gold-silver', 'copper-gold', 'gold-btc', 'silver-btc', 'fed-expectations', 'rba-expectations', 'au-us-10y-gap', 'dollar-basket', 'gold-aud', 'govt-interest-revenue']) {
      expect(byId.get(id)!.definition, `${id} is Layer 2 — it needs its definition`).toBeTruthy();
      expect(byId.get(id)!.layer).toBe(2);
    }
    expect(byId.get('us10y')!.definition).toBeNull();
    expect(byId.get('us10y')!.layer).toBe(1);
  });
});
