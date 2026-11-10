/**
 * The placement table's reconciliation gates (page-division S2, 2026-11-08
 * — the roadmap's S2 gate: "placement table reconciles to zero unplaced /
 * zero duplicate homes, or drift documented with owner-visible notes").
 *
 * These tests pin the CONTRACT between engine and pages against the live
 * registry (data/indicators.json) and the engine's own membership tables —
 * the same discipline as registry-sync.test.ts: if an engine change moves
 * a voter, these fail and force a PLACEMENT.generated.md regeneration +
 * review, never a silent absorb.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { IndicatorIdSchema } from '@currena/core';
import { GAUGES } from '../gauges';
import { GOLD_LANE_VOTERS } from '../gold-score';
import {
  AU_GAUGE_MEMBER_IDS,
  BLOCKED_NOTES,
  GOLD_VOTER_IDS,
  PAGE_PLACEMENTS,
  PLACEMENT_AUDIT_FINDINGS,
  THEMATIC_GAUGE_MEMBER_IDS,
  pageHomeIds,
  pageMirrorIds,
  pageReadingIds,
  reconcilePlacement,
} from './placement';

const registry = JSON.parse(
  readFileSync(new URL('../../../../data/indicators.json', import.meta.url), 'utf8'),
) as { version: number; indicators: { id: string }[] };
const registryIds = registry.indicators.map((i) => i.id);

const hiddenSet = JSON.parse(
  readFileSync(new URL('../../../../data/site-mode-overrides.json', import.meta.url), 'utf8'),
) as { hiddenIndicatorIds: string[] };

describe('reconcilePlacement (the S2 gate)', () => {
  const rec = reconcilePlacement(registryIds);

  it('reconciles the whole registry: 184 placed, zero unplaced, zero duplicate homes', () => {
    expect(registryIds).toHaveLength(184);
    expect(rec.ok).toBe(true);
    expect(rec.placedCount).toBe(184);
    expect(rec.unplaced).toEqual([]);
    expect(rec.duplicateHomes).toEqual([]);
    expect(rec.unknownIds).toEqual([]);
    expect(rec.mirrorOverlaps).toEqual([]);
  });

  it('places the spec §14 card counts (AF-1’s authoritative arithmetic)', () => {
    const cards = Object.fromEntries(rec.perPage.map((p) => [p.page, p.registryCards]));
    expect(cards).toEqual({
      global: 0,
      gold: 14,
      'world-markets': 9,
      usa: 72,
      europe: 8,
      'asia-pacific': 11,
      australia: 28,
      commodities: 24,
      currencies: 14,
    });
    expect(BLOCKED_NOTES).toHaveLength(4);
    expect(BLOCKED_NOTES.every((n) => n.page === 'gold')).toBe(true);
  });

  it('types every placement id as a v1 registry indicator id', () => {
    for (const p of PAGE_PLACEMENTS) {
      for (const id of pageReadingIds(p.page)) {
        expect(() => IndicatorIdSchema.parse(id)).not.toThrow();
      }
    }
    for (const n of BLOCKED_NOTES) {
      expect(() => IndicatorIdSchema.parse(n.id)).not.toThrow();
    }
  });

  it('never lets a mirror be a home on the same page', () => {
    for (const p of PAGE_PLACEMENTS) {
      const homes = new Set<string>(pageHomeIds(p.page));
      for (const id of pageMirrorIds(p.page)) {
        expect(homes.has(id)).toBe(false);
      }
    }
  });
});

describe('engine-derived mirror coverage (the shared-verdict displays)', () => {
  it('derives the mirror sources from the engine tables, not hand copies', () => {
    expect(THEMATIC_GAUGE_MEMBER_IDS).toHaveLength(38);
    expect(new Set(THEMATIC_GAUGE_MEMBER_IDS).size).toBe(38);
    expect(GOLD_VOTER_IDS).toHaveLength(37);
    expect(new Set(GOLD_VOTER_IDS).size).toBe(37);
    expect(AU_GAUGE_MEMBER_IDS).toHaveLength(26);
  });

  it('GOLD: every one of the 37 voters is a home or a mirror (the seat chips can always render)', () => {
    const readings = new Set<string>(pageReadingIds('gold'));
    for (const v of GOLD_LANE_VOTERS) {
      expect(readings.has(v.id)).toBe(true);
    }
  });

  it('GLOBAL: the five thematic gauges’ voters + the 37 gold voters + the ribbon ids all arrive', () => {
    const readings = new Set<string>(pageReadingIds('global'));
    for (const id of THEMATIC_GAUGE_MEMBER_IDS) expect(readings.has(id)).toBe(true);
    for (const id of GOLD_VOTER_IDS) expect(readings.has(id)).toBe(true);
    expect(readings.has('gold-usd')).toBe(true); // D-22 ribbon
    expect(readings.has('btc-usd')).toBe(true); // D-22 ribbon
    expect(readings.has('brent')).toBe(true); // via prices-heat (a voter)
    expect(readings.has('usd-reserve-share')).toBe(true); // D-25 dedollar tile
    expect(readings.has('nyfed-custody')).toBe(true); // D-25 custody direction
  });

  it('USA: the five thematic gauges’ voters all arrive for the D-30 verdict strip', () => {
    const readings = new Set<string>(pageReadingIds('usa'));
    for (const id of THEMATIC_GAUGE_MEMBER_IDS) expect(readings.has(id)).toBe(true);
  });

  it('AUSTRALIA: every AU gauge member arrives (the moved-out seat chips, spec §10)', () => {
    const readings = new Set<string>(pageReadingIds('australia'));
    for (const id of AU_GAUGE_MEMBER_IDS) expect(readings.has(id)).toBe(true);
    // The five moved-out gauge voters are exactly the AU mirrors.
    expect([...pageMirrorIds('australia')].sort()).toEqual(
      ['audjpy', 'audnzd', 'audusd', 'nz-10y', 'nz-short-rate'],
    );
  });

  it('ties the thematic gauge ids to the engine’s non-shadow global gauges', () => {
    const thematic = GAUGES.filter(
      (g) => g.section === 'global' && !['geo-fragmentation', 'dedollar-concentration'].includes(g.id),
    );
    expect(thematic.map((g) => g.id)).toEqual([
      'borrowing-costs',
      'prices-heat',
      'market-stress',
      'dollar-strength',
      'growth-health',
    ]);
  });
});

describe('the blocked notes vs the public-mode hidden set', () => {
  it('the Gold page’s blocked notes are EXACTLY the licence-hidden quartet (public absentIds)', () => {
    expect([...BLOCKED_NOTES.map((n) => n.id)].sort()).toEqual([...hiddenSet.hiddenIndicatorIds].sort());
  });
});

describe('the audit findings (drift — recorded, never silently fixed)', () => {
  it('carries the seven static findings with stable AF ids (AF-6/AF-7 added at the S21 spec audit)', () => {
    expect(PLACEMENT_AUDIT_FINDINGS.map((f) => f.id)).toEqual(['AF-1', 'AF-2', 'AF-3', 'AF-4', 'AF-5', 'AF-6', 'AF-7']);
    for (const f of PLACEMENT_AUDIT_FINDINGS) {
      expect(f.severity === 'red' || f.severity === 'amber' || f.severity === 'info').toBe(true);
      expect(f.text.length).toBeGreaterThan(40);
    }
  });

  it('AF-3 (the 184th id) places michigan-1y-expectations in USA tier-3, pending owner ratification', () => {
    expect(pageHomeIds('usa')).toContain('michigan-1y-expectations');
    expect(PLACEMENT_AUDIT_FINDINGS.find((f) => f.id === 'AF-3')?.text).toContain('OWNER RATIFICATION PENDING');
  });
});
